// bitrun.js：按应用预算改位图并留账（基线：一律给空表）
import { paint, runsOf } from "./bitrange.js";

export function step(spec) {
  return { state: spec.state, applied: 0, ledger_before: 0, ledger: [], judged: 0, judged_bound: 0 };
}

export function close(spec) {
  return { state: spec.state, catchup: 0 };
}
