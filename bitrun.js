// bitrun.js：按应用预算改位图并留账，收尾时把账应用完
import { paint } from "./bitrange.js";

const SET = "set";
const CLEAR = "clear";

function signature(kind, from, to) {
  return kind + "|" + from + "|" + to;
}

function startState(state, size) {
  const source = state || {};
  let bits;
  if (Array.isArray(source.bits) && source.bits.length === size) {
    bits = source.bits.slice();
  } else if (Array.isArray(source.bits) && typeof size !== "number") {
    bits = source.bits.slice();
  } else {
    const length = Number.isInteger(size) && size >= 0 ? size : 0;
    bits = new Array(length).fill(0);
  }
  const ledger = Array.isArray(source.ledger)
    ? source.ledger.map(function (row) { return [row[0], row[1], row[2]]; })
    : [];
  const applied = Array.isArray(source.applied) ? source.applied.slice() : [];
  return { bits: bits, ledger: ledger, applied: applied };
}

function validateEvent(event, size, spec) {
  const badCode = (spec && spec.event_error_code) || "E_BAD_EVENT";
  const rangeCode = (spec && spec.range_error_code) || "E_RANGE";
  if (!event || typeof event !== "object" || Array.isArray(event)) {
    const error = new Error("event must be an object");
    error.code = badCode;
    throw error;
  }
  if (event.kind !== SET && event.kind !== CLEAR) {
    const error = new Error("event kind must be set or clear");
    error.code = badCode;
    throw error;
  }
  if (!Number.isInteger(event.from) || !Number.isInteger(event.to)) {
    const error = new Error("event endpoints must be integers");
    error.code = badCode;
    throw error;
  }
  if (event.from < 0 || event.to > size || event.from > event.to) {
    const error = new Error("event range out of bounds or reversed");
    error.code = rangeCode;
    throw error;
  }
}

export function step(spec) {
  const size = spec.size;
  const events = Array.isArray(spec.events) ? spec.events : [];
  const state = startState(spec.state, size);
  let budget = Number.isInteger(spec.budget) && spec.budget > 0 ? spec.budget : 0;

  let appliedCount = 0;
  let judged = 0;

  events.forEach(function (event) {
    validateEvent(event, size, spec);
    const sign = signature(event.kind, event.from, event.to);
    if (state.applied.indexOf(sign) !== -1) return;
    judged += 1;
    if (budget > 0) {
      state.bits = paint(state.bits, event.from, event.to,
        event.kind === SET ? 1 : 0);
      state.applied.push(sign);
      budget -= 1;
      appliedCount += 1;
    } else {
      state.ledger.push([event.kind, event.from, event.to]);
    }
  });

  return {
    state: state,
    applied: appliedCount,
    ledger_before: state.ledger.length,
    ledger: state.ledger.map(function (row) { return [row[0], row[1], row[2]]; }),
    judged: judged,
    judged_bound: events.length
  };
}

export function close(spec) {
  const state = startState(spec.state, spec.size);
  const pending = state.ledger;
  state.ledger = [];
  let catchup = 0;

  pending.forEach(function (row) {
    const kind = row[0];
    const from = row[1];
    const to = row[2];
    state.bits = paint(state.bits, from, to, kind === SET ? 1 : 0);
    const sign = signature(kind, from, to);
    if (state.applied.indexOf(sign) === -1) state.applied.push(sign);
    catchup += 1;
  });

  return { state: state, catchup: catchup };
}
