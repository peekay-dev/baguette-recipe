// Pure-logic tests for the flour-profile cascade. Run: node test/logic.test.js
// Loads the <script> from baguette.html into a stubbed DOM and exercises the
// pure functions (eff, sourceOf, buildFolds). CommonJS on purpose: non-strict
// eval lets the script's top-level function declarations leak into scope.
const assert = require('assert');
const fs = require('fs');
const path = require('path');

const html = fs.readFileSync(path.join(__dirname, '..', 'baguette.html'), 'utf8');
// baguette.html has a small inline theme-preset <script> before the main one;
// pick the largest script block rather than the first match.
const scripts = [...html.matchAll(/<script>([\s\S]*?)<\/script>/g)].map(m => m[1]);
const js = scripts.reduce((a, b) => b.length > a.length ? b : a);

const vals = { count:'4', weight:'250', hydration:'70', ambientTemp:'18', poolishPct:'30',
               flourA:'mb', flourB:'wholemeal', blend:'85', pctA:'85', pctB:'15', foldCount:'2' };
const stub = id => ({ get value(){ return vals[id]; }, set value(v){ vals[id] = String(v); },
  set innerHTML(v){}, classList:{ toggle(){}, add(){}, remove(){}, contains(){ return false; } },
  textContent:'', dataset:{}, max:'6', min:'1', style:{}, querySelector(){ return { textContent:'' }; },
  addEventListener(){}, setAttribute(){}, getAttribute(){ return null; } });
global.document = { getElementById: stub, querySelectorAll: () => [],
  documentElement: { setAttribute(){}, getAttribute(){ return null; }, style: { setProperty(){} } } };
global.localStorage = { getItem: () => null, setItem: () => {} };
global.window = {};
global.location = { hash: '', href: 'file:///baguette.html', pathname: '/baguette.html', origin: 'null' };
global.history = { replaceState() {} };
if (typeof btoa === 'undefined') {
  global.btoa = s => Buffer.from(s, 'binary').toString('base64');
  global.atob = s => Buffer.from(s, 'base64').toString('binary');
}

eval(js); // runs loadPrefs()/URL-hydration + update() once with the stub; leaks pure fns

let passed = 0;
const check = (desc, cond) => { assert.ok(cond, desc); passed++; };
const ctx = (o) => Object.assign({ override:{}, fA:'mb', fB:'mb', blendA:100 }, o);

// precedence: override > flour rx > global
check('override wins',        eff('hydration', ctx({ override:{ hydration:80 } })) === 80);
check('single flour rx',      eff('hydration', ctx()) === 75);                                  // mb.rx.hydration
check('global fallback',      eff('hydration', ctx({ fA:'bread', fB:'bread' })) === 72);        // neither has rx.hydration
// continuous blend: 50/50 mb(75) + pizzeria(65) = 70
check('continuous blend',     eff('hydration', ctx({ fB:'pizzeria', blendA:50 })) === 70);
// blend where B omits key -> B falls back to GLOBAL 72: (75*50 + 72*50)/100 = 73.5
check('blend w/ global side',  eff('hydration', ctx({ fB:'bread', blendA:50 })) === 73.5);
// discrete param takes the dominant flour by %
check('discrete dominant A',  eff('develop', ctx({ fA:'pizzeria', blendA:70 })) === 'intensive');
check('discrete dominant B',  eff('develop', ctx({ fA:'pizzeria', blendA:30 })) === 'gentle');   // fB=mb dominant
check('discrete global',      eff('develop', ctx({ fA:'bread', fB:'nuvola', blendA:50 })) === 'standard');

// sourceOf
check('source custom',        sourceOf('hydration', ctx({ override:{ hydration:80 } })) === 'custom');
check('source single flour',  sourceOf('hydration', ctx()) === 'Miller & Baker Plain Flour');
check('source blend',         sourceOf('hydration', ctx({ fB:'pizzeria', blendA:50 })).startsWith('blend of'));
check('source default',       sourceOf('fermentolyse', ctx({ fA:'bread', fB:'nuvola', blendA:50 })) === 'default');

// buildFolds: fewer -> keep coil-heavy tail; more -> append coils
check('buildFolds trims tail', JSON.stringify(buildFolds(['sf','sf','cf','cf'], 2)) === JSON.stringify(['cf','cf']));
check('buildFolds extends',    JSON.stringify(buildFolds(['cf','cf'], 4)) === JSON.stringify(['cf','cf','cf','cf']));

// Shaped Retard uses its own shorter mix-day calibration. Other methods keep
// the flour-profile fermentolyse and original bulk formula.
check('shaped fermentolyse fixed at 30', fermentolyseDuration('shaped', ctx({ override:{ fermentolyse:90 } })) === 30);
check('cold-retard fermentolyse keeps flour profile', fermentolyseDuration('retard', ctx()) === 60);
check('shaped bulk is about 2h20 at 18C', Math.round(bulkFormulaDuration('shaped', 18, 60)) === 140);
check('cold-retard bulk formula unchanged at 18C', Math.round(bulkFormulaDuration('retard', 18, 60)) === 223);
// Baker's-percentage cascade (docs/Baker Percentages Worked Example.xlsx):
// final-dough yeast is what's left after poolish yeast is carved out of the
// total, not the full total-yeast% added on top of poolish's share.
check('final yeast is total minus poolish', finalDoughYeastWeight(100, 20, 'retard') === 80);
check('shaped final-dough yeast reduced by 40% off the remainder', finalDoughYeastWeight(100, 20, 'shaped') === finalDoughYeastWeight(100, 20, 'retard') * 0.6);
check('cold-retard and same-day final yeast match', finalDoughYeastWeight(100, 20, 'retard') === finalDoughYeastWeight(100, 20, 'sameday'));
check('final yeast never goes negative', finalDoughYeastWeight(10, 20, 'retard') === 0);

// loadPrefs tolerates a legacy `season` key from old baguette.html prefs
global.localStorage.getItem = () => JSON.stringify({ season:'winter', hydration:'68', method:'sameday' });
assert.doesNotThrow(() => loadPrefs(), 'loadPrefs tolerates legacy season key'); passed++;
check('legacy prefs still applied', vals.hydration === '68');

// ── Shareable URL round-trips ──
const sample = { method:'sameday', hydration:'71', flourA:'mb', flourB:'wholemeal', pctA:'80', userOverride:{ hydration:80 } };
const rt = decodeState(encodeState(sample));
check('encode/decode round-trips method',   rt.method === 'sameday');
check('encode/decode round-trips nested',    rt.userOverride.hydration === 80);
check('encodeState stamps version v:1',      rt.v === 1);
check('decodeState rejects garbage',         decodeState('@@not base64@@') === null);
check('decodeState null on empty',           decodeState('') === null);
vals.hydration = '66';
const enc = encodeState(collectState());
vals.hydration = '99';
applyState(decodeState(enc));
check('collect->encode->decode->apply keeps hydration', vals.hydration === '66');

console.log(`logic tests passed (${passed} assertions)`);
