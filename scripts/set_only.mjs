// Set the Pine editor text from a file (no compile, no save). Usage: node scripts/set_only.mjs <file> <expected indicator title>
import CDP from 'chrome-remote-interface';
import { readFileSync } from 'fs';

const [, , file, expect] = process.argv;
const src = readFileSync(file, 'utf-8');
const targets = await (await fetch('http://localhost:9222/json/list')).json();
const t = targets.find(t => t.url?.includes('tradingview.com/chart'));
const c = await CDP({ host: 'localhost', port: 9222, target: t.id });
await c.Runtime.enable();
const expr = `(function(){var c=Array.prototype.slice.call(document.querySelectorAll(".monaco-editor.pine-editor-monaco")).filter(function(e){return e.getBoundingClientRect().width>0})[0];if(!c)return "no editor";var el=c,fk;for(var i=0;i<20;i++){if(!el)break;fk=Object.keys(el).find(function(k){return k.startsWith("__reactFiber$")});if(fk)break;el=el.parentElement}var cur=el[fk];for(var d=0;d<15;d++){if(!cur)break;var v=cur.memoizedProps&&cur.memoizedProps.value;if(v&&v.monacoEnv){var ed=v.monacoEnv.editor.getEditors()[0];var m=ed.getValue().match(/indicator\\("([^"]+)"/);if(!m||m[1]!==${JSON.stringify(expect)})return "editor holds "+(m&&m[1]);ed.setValue(${JSON.stringify(src)});return "set "+ed.getValue().split("\\n").length}cur=cur.return}return "no env"})()`;
const r = await c.Runtime.evaluate({ expression: expr, returnByValue: true });
console.log(r.result?.value ?? JSON.stringify(r.exceptionDetails));
await c.close();
