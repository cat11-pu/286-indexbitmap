// bitrun.js：按应用预算改位图并留账，收尾不限预算把账应用完
import { paint } from "./bitrange.js";

function fail(code, message) {
  const error = new Error(message);
  error.code = code;
  return error;
}

function isInt(value) {
  return typeof value === "number" && Number.isInteger(value);
}

// 事件结构合法（类型与两端）；不合法报 E_BAD_EVENT。
function inspect(event) {
  if (!event || typeof event !== "object") {
    throw fail("E_BAD_EVENT", "event must be an object");
  }
  if (event.kind !== "set" && event.kind !== "clear") {
    throw fail("E_BAD_EVENT", "event.kind must be set or clear");
  }
  if (!isInt(event.from) || !isInt(event.to)) {
    throw fail("E_BAD_EVENT", "event endpoints must be integers");
  }
}

// 左闭右开、端点落在位图长度之内、左端不大于右端；越界报 E_RANGE。
function checkRange(from, to, size) {
  if (from < 0 || to < 0 || from > to || from > size || to > size) {
    throw fail("E_RANGE", "range out of bitmap bounds");
  }
}

// 已处理集合按 id 记账；无 id 的事件退化为按类型与两端签名记账。
function identity(event) {
  return event.id !== undefined && event.id !== null
    ? "id:" + String(event.id)
    : "op:" + event.kind + ":" + event.from + ":" + event.to;
}

export function step(spec) {
  const incoming = spec.events || [];
  const size = spec.size;
  const budget = isInt(spec.budget) && spec.budget > 0 ? spec.budget : 0;
  const events = incoming || [];

  const before = spec.state || {};
  const bits = (before.bits || []).slice();
  const ledger = (before.ledger || []).map(function (row) { return row.slice(); });
  const applied = (before.applied || []).slice();

  // 先整批验完，非法或越界时不留下半截状态。
  events.forEach(function (event) {
    inspect(event);
    checkRange(event.from, event.to, size);
  });

  let appliedCount = 0;
  let remaining = budget;
  events.forEach(function (event) {
    if (applied.indexOf(identity(event)) !== -1) return;
    if (remaining > 0) {
      const value = event.kind === "set" ? 1 : 0;
      const next = paint(bits, event.from, event.to, value);
      next.forEach(function (bit, index) { bits[index] = bit; });
      applied.push(identity(event));
      appliedCount += 1;
      remaining -= 1;
    } else {
      ledger.push([event.kind, event.from, event.to]);
    }
  });

  const state = { bits: bits, ledger: ledger, applied: applied };
  return {
    state: state,
    applied: appliedCount,
    ledger_before: ledger.length,
    ledger: ledger.map(function (row) { return row.slice(); }),
    judged: appliedCount + (ledger.length - (before.ledger || []).length),
    judged_bound: events.length
  };
}

export function close(spec) {
  const events = spec.events || [];
  const before = spec.state || {};
  const bits = (before.bits || []).slice();
  const applied = (before.applied || []).slice();

  let catchup = 0;
  (before.ledger || []).forEach(function (row) {
    const kind = row[0];
    const from = row[1];
    const to = row[2];
    checkRange(from, to, spec.size);
    const next = paint(bits, from, to, kind === "set" ? 1 : 0);
    next.forEach(function (bit, index) { bits[index] = bit; });
    catchup += 1;
    // 账上只记类型与两端，按签名在本轮事件里找回它的身份再标记已处理。
    const matched = events.find(function (event) {
      return event && event.kind === kind && event.from === from && event.to === to
        && applied.indexOf(identity(event)) === -1;
    });
    if (matched) applied.push(identity(matched));
  });

  return { state: { bits: bits, ledger: [], applied: applied }, catchup: catchup };
}
