import assert from "node:assert";
import { paint, runsOf } from "../bitrange.js";
import { step, close } from "../bitrun.js";
import { render } from "../app.js";

const base = {
  budget: 2, size: 12,
  state: { bits: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], ledger: [], applied: [] },
  events: [],
  range_error_code: "E_RANGE", event_error_code: "E_BAD_EVENT"
};

let failed = 0;
function check(name, fn) {
  try { fn(); console.log("ok " + name); } catch (e) { failed += 1; console.log("FAIL " + name + " :: " + e.message); }
}

check("paint returns a list", () => {
  assert.ok(Array.isArray(paint([0, 0], 0, 1, 1)));
});

check("runsOf returns a list", () => {
  assert.ok(Array.isArray(runsOf([1, 1])));
});

check("step returns a state", () => {
  assert.strictEqual(typeof step(base).state, "object");
});

check("close returns a state", () => {
  assert.strictEqual(typeof close(base).state, "object");
});

check("render counts events", () => {
  assert.strictEqual(typeof render(base).count, "number");
});

console.log("5 cases, " + failed + " failed");
process.exit(failed === 0 ? 0 : 1);
