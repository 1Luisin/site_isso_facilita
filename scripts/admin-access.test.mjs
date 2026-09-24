import test from "node:test";
import assert from "node:assert/strict";
import { isActiveAdmin } from "../src/lib/admin-access.ts";

for (const [role, active, expected] of [
  ["owner", true, true], ["editor", true, true],
  ["owner", false, false], ["editor", false, false],
  ["visitor", true, false], ["OWNER", true, false],
]) {
  test(`Perfil ${role}, active=${active}: autorizado=${expected}`, () => {
    assert.equal(isActiveAdmin({ role, active, display_name: null }), expected);
  });
}
test("Auth sem perfil não é admin", () => assert.equal(isActiveAdmin(null), false));
