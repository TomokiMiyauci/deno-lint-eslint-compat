# deno-lint-eslint-compat

ESLint compatibility utilities for Deno Lint.

This package provides adapters for using ESLint plugins with Deno Lint.

## Usage

```ts
import { toDenoPlugin } from "@deno-lint/eslint-compat";
import type { ESLint } from "eslint";

declare const eslintPlugin: ESLint.Plugin;

const plugin = toDenoPlugin(eslintPlugin) satisfies Deno.lint.Plugin;
```

## LICENSE

[MIT](LICENSE)
