import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { deleteAlerts, DELETE_ALL_CONFIRM } from '../src/core/alerts.js';

describe('deleteAlerts() delete_all confirmation', () => {
  it('refuses delete_all without confirm, before touching TradingView', async () => {
    const r = await deleteAlerts({ delete_all: true });
    assert.equal(r.success, false);
    assert.equal(r.deleted, 0);
    assert.match(r.error, /DELETE_ALL_ALERTS/);
  });

  it('refuses delete_all with a wrong confirm string', async () => {
    const r = await deleteAlerts({ delete_all: true, confirm: 'yes' });
    assert.equal(r.success, false);
  });

  it('exports the exact confirm string', () => {
    assert.equal(DELETE_ALL_CONFIRM, 'DELETE_ALL_ALERTS');
  });
});
