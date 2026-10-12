import { toFix } from "./deno.ts";
import { assertEquals } from "@std/assert";

Deno.test("toFix", async (t) => {
  await t.step("converts range and text", () => {
    assertEquals(
      toFix({ range: [0, 5], text: "hello" }),
      { range: [0, 5], text: "hello" },
    );
  });

  await t.step("defaults missing text to an empty string", () => {
    assertEquals(
      toFix({ range: [0, 5] }),
      { range: [0, 5], text: "" },
    );
  });
});
