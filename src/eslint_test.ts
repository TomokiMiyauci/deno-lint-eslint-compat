import { assertEquals, assertThrows } from "@std/assert";
import {
  computeMessageFromDescriptor,
  normalizeMessagePlaceholderData,
  toRule,
} from "./eslint.ts";

Deno.test("normalizeMessagePlaceholderData", async (t) => {
  await t.step("it shoule normalize", () => {
    assertEquals(
      normalizeMessagePlaceholderData({ a: "", b: 1, c: undefined }),
      { a: "", b: "1", c: "undefined" },
    );
  });
});

Deno.test("computeMessageFromDescriptor", async (t) => {
  await t.step(
    "it should throw error if messageId is provided and message map is not defined",
    () => {
      assertThrows(() => computeMessageFromDescriptor({ messageId: "" }, {}));
    },
  );

  await t.step("it should return message itself", () => {
    assertEquals(computeMessageFromDescriptor({ message: "msg" }, {}), "msg");
  });

  await t.step("it should resolved messageId message", () => {
    assertEquals(
      computeMessageFromDescriptor({ messageId: "id" }, { id: "msg" }),
      "msg",
    );
  });
});

Deno.test("toRule", async (t) => {
  await t.step("simple rule conversion", () => {
    const MESSAGE = "INVALID";
    const rule = toRule({
      create(ctx) {
        return {
          Identifier(node) {
            return ctx.report({ message: MESSAGE, node });
          },
        };
      },
    });

    const diagnostic = Deno.lint.runPlugin(
      { name: "test", rules: { rule } },
      "test.js",
      `var a;`,
    );

    assertEquals(diagnostic, [
      {
        id: "test/rule",
        message: MESSAGE,
        range: [4, 5],
        fix: [],
        hint: undefined,
      },
    ]);
  });
});
