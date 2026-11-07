import { evaluate } from './connection.js';

const DEFAULT_TIMEOUT = 10000;
const POLL_INTERVAL = 50;
// Consecutive ready samples required (guards against sampling before the load starts).
const READY_SAMPLES = 2;

// Strip exchange prefix: "NASDAQ:AAPL" -> "AAPL".
function bareSymbol(s) {
  const str = String(s || '').toUpperCase();
  const i = str.lastIndexOf(':');
  return i >= 0 ? str.slice(i + 1) : str;
}

// Normalize resolution: "1D" -> "D", "1W" -> "W"; minutes stay numeric.
function normTf(tf) {
  return String(tf || '').toUpperCase().replace(/^1(?=[A-Z])/, '');
}

/**
 * Wait until the chart has finished loading.
 *
 * Reads state from the chart API (symbol, resolution, bar count) plus the loading
 * spinner, instead of matching legend text. The legend shows e.g. "AAPL" while
 * callers pass "NASDAQ:AAPL", which made the old text match always time out.
 * Returns true when ready, false on timeout (caller should verify).
 */
export async function waitForChartReady(expectedSymbol = null, expectedTf = null, timeout = DEFAULT_TIMEOUT) {
  const start = Date.now();
  const wantSym = expectedSymbol ? bareSymbol(expectedSymbol) : null;
  const wantTf = expectedTf ? normTf(expectedTf) : null;
  let readyCount = 0;

  while (Date.now() - start < timeout) {
    let state = null;
    try {
      state = await evaluate(`
        (function() {
          var spinner = document.querySelector('[class*="loader"]')
            || document.querySelector('[class*="loading"]')
            || document.querySelector('[data-name="loading"]');
          var isLoading = !!(spinner && spinner.offsetParent !== null);
          var symbol = '', resolution = '', barCount = 0;
          try {
            var chart = window.TradingViewApi._activeChartWidgetWV.value();
            symbol = chart.symbol();
            resolution = chart.resolution();
            barCount = chart._chartWidget.model().mainSeries().bars().size();
          } catch (e) {}
          return { isLoading: isLoading, symbol: symbol, resolution: resolution, barCount: barCount };
        })()
      `);
    } catch {
      state = null;
    }

    const ready = !!state
      && !state.isLoading
      && state.barCount > 0
      && (!wantSym || bareSymbol(state.symbol) === wantSym)
      && (!wantTf || normTf(state.resolution) === wantTf);

    readyCount = ready ? readyCount + 1 : 0;
    if (readyCount >= READY_SAMPLES) return true;

    await new Promise(r => setTimeout(r, POLL_INTERVAL));
  }

  return false;
}
