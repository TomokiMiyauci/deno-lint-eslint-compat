import { assertEquals, assertThrows } from "@std/assert";
import {
  computeMessageFromDescriptor,
  normalizeMessagePlaceholderData,
  toRule,
  toRules,
} from "./eslint.ts";
import plugin from "eslint-plugin-jsx-a11y";

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

  await t.step("simple rules conversion", () => {
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
      { name: "test", rules: { rule, rule2: rule } },
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
      {
        id: "test/rule2",
        message: MESSAGE,
        range: [4, 5],
        fix: [],
        hint: undefined,
      },
    ]);
  });
});

Deno.test("toRules", async (t) => {
  await t.step("actual plugin testing: eslint-plugin-jsx-a11y", () => {
    const rules = toRules(plugin.rules);

    const diagnostic = Deno.lint.runPlugin(
      { name: "myplugin", rules },
      "test.jsx",
      `<input aria-unknown />`,
    );

    assertEquals(diagnostic, [
      {
        fix: [],
        hint: undefined,
        id: "myplugin/control-has-associated-label",
        message: "A control must be associated with a text label.",
        range: [0, 22],
      },
      {
        fix: [],
        hint: undefined,
        id: "myplugin/aria-props",
        message: "aria-unknown: This attribute is an invalid ARIA attribute.",
        range: [7, 19],
      },
    ]);
  });
});
