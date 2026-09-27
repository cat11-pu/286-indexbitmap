// app.js：渲染结果
import { paint, runsOf } from "./bitrange.js";
import { step, close } from "./bitrun.js";

export function render(spec) {
  const events = spec.events || [];
  const half = Math.ceil(events.length / 2);
  const first = step(spec);
  const closed = close(Object.assign({}, spec, { state: first.state }));
  const r1 = step(Object.assign({}, spec, { events: events.slice(0, half) }));
  const r2 = step(Object.assign({}, spec, { state: r1.state, events: events.slice(half) }));
  const closedTwo = close(Object.assign({}, spec, { state: r2.state }));
  const replay = step(Object.assign({}, spec, { state: closed.state }));
  const wide = step(Object.assign({}, spec, { budget: spec.budget + 2 }));
  const full = step(Object.assign({}, spec, { events: events, budget: events.length + 2 }));
  const fullClosed = close(Object.assign({}, spec, { state: full.state }));
  const fingerprint = function (state) {
    return JSON.stringify({
      bits: state.bits, ledger: state.ledger, applied: state.applied.length
    });
  };
  const runs = runsOf(closed.state.bits);
  const widest = runs.reduce(function (top, row) {
    if (row[1] - row[0] > top[1] - top[0]) return row;
    return top;
  }, [0, 0]);
  return { bits: closed.state.bits.slice(),
           placed: closed.state.bits.filter(function (value) { return value === 1; }).length,
           runs: runs, run_count: runs.length, widest: widest,
           applied_first: first.applied, applied_wide: wide.applied,
           pair_differs: first.applied !== wide.applied,
           ledger_before: first.ledger_before, ledger: first.ledger,
           catchup: closed.catchup, ledger_after: closed.state.ledger.length,
           mid_differs: fingerprint(r2.state) !== fingerprint(first.state),
           closed_equal: fingerprint(closedTwo.state) === fingerprint(closed.state),
           replay_new: replay.applied, judged: first.judged, judged_bound: first.judged_bound,
           full_diff: fingerprint(closed.state) === fingerprint(fullClosed.state) ? 0 : 1,
           count: events.length,
           tail: paint([0], 0, 0, 1).length + runsOf([]).length };
}
