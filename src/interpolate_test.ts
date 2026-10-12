import { assertEquals } from "@std/assert";
import { interpolate } from "./interpolate.ts";

Deno.test("interpolates a placeholder", () => {
  assertEquals(
    interpolate("Hello, {{ name }}!", { name: "Alice" }),
    "Hello, Alice!",
  );
});

Deno.test("trims whitespace around placeholder names", () => {
  assertEquals(
    interpolate("{{  name  }}", { name: "Alice" }),
    "Alice",
  );
});

Deno.test("interpolates multiple placeholders", () => {
  assertEquals(
    interpolate("{{ greeting }}, {{ name }}!", {
      greeting: "Hello",
      name: "Alice",
    }),
    "Hello, Alice!",
  );
});

Deno.test("preserves placeholders missing from data", () => {
  assertEquals(
    interpolate("Hello, {{ name }}!", {}),
    "Hello, {{ name }}!",
  );
});

Deno.test("preserves placeholders without replacing available ones", () => {
  assertEquals(
    interpolate("{{ first }} {{ second }}", { first: "A" }),
    "A {{ second }}",
  );
});

Deno.test("returns text unchanged when there are no placeholders", () => {
  assertEquals(
    interpolate("Hello, world!", { name: "Alice" }),
    "Hello, world!",
  );
});

Deno.test("does not replace malformed placeholders", () => {
  assertEquals(
    interpolate("{{ name } and {other}", { name: "Alice", other: "Bob" }),
    "{{ name } and {other}",
  );
});

Deno.test("reuses the shared placeholder matcher across calls", () => {
  assertEquals(interpolate("{{ a }}", { a: "1" }), "1");
  assertEquals(interpolate("{{ b }}", { b: "2" }), "2");
  assertEquals(interpolate("{{ a }} {{ b }}", { a: "1", b: "2" }), "1 2");
});
