import type * as eslint from "eslint";
import * as Eslint2Deno from "./eslint.ts";
import { SourceCode } from "@typescript-eslint/utils/ts-eslint";
import { analyze } from "@typescript-eslint/scope-manager";
import type { TSESLint } from "@typescript-eslint/utils";
import type { EstreeDenoMap } from "./store.ts";

export function toRuleContext(
  context: Deno.lint.RuleContext,
  node: SourceCode.Program,
  map: EstreeDenoMap,
): eslint.Rule.RuleContext {
  const { filename, id } = context;
  const text = context.sourceCode.text;

  const sourceCode = toSourceCode(node, text);
  const eslintSourceCode = toEslintSourceCode(sourceCode);

  return {
    filename,
    sourceCode: eslintSourceCode,
    id,
    report(descriptor) {
      const reportData = Eslint2Deno.toReportData(descriptor, text, map);

      context.report(reportData);
    },
    cwd: "", // TODO
    physicalFilename: filename,
    settings: {}, // TODO
    languageOptions: {}, // TODO
    options: [], // TODO
  };
}

function toEslintSourceCode(
  sourceCode: TSESLint.SourceCode,
): eslint.SourceCode {
  // deno-lint-ignore no-explicit-any
  return sourceCode as any as eslint.SourceCode; // TODO
}

export function toSourceCode(
  node: TSESLint.SourceCode.Program,
  text: string,
): TSESLint.SourceCode {
  const sourceCode = new SourceCode({
    ast: node,
    text,
    scopeManager: analyze(node, {
      sourceType: node.sourceType,
    }),
    visitorKeys: null,
    parserServices: null,
  });

  return sourceCode;
}

export function toFixer(
  fixer: Deno.lint.Fixer,
  map: EstreeDenoMap,
): eslint.Rule.RuleFixer {
  return {
    insertTextAfter(el, text) {
      if (isToken(el)) {
        return this.insertTextAfterRange(el.range, text);
      }

      const node = map.get(el);
      const fix = fixer.insertTextAfter(node, text);
      const esFix = toFix(fix);

      return esFix;
    },
    insertTextAfterRange(range, text) {
      const fix = fixer.insertTextAfterRange([...range], text);
      const esFix = toFix(fix);
      return esFix;
    },
    insertTextBefore(el, text) {
      if (isToken(el)) {
        return this.insertTextBeforeRange(el.range, text);
      }

      const node = map.get(el);
      const fix = fixer.insertTextBefore(node, text);
      const esFix = toFix(fix);

      return esFix;
    },
    insertTextBeforeRange(range, text) {
      const fix = fixer.insertTextBeforeRange(range, text);
      const esFix = toFix(fix);
      return esFix;
    },
    remove(el) {
      if (isToken(el)) {
        return this.removeRange(el.range);
      }

      const node = map.get(el);
      const fix = fixer.remove(node);
      const esFix = toFix(fix);

      return esFix;
    },
    removeRange(range) {
      const fix = fixer.removeRange([...range]);
      const esFix = toFix(fix);

      return esFix;
    },
    replaceText(el, text) {
      if (isToken(el)) {
        return this.replaceTextRange(el.range, text);
      }

      const node = map.get(el);
      const fix = fixer.replaceText(node, text);
      const esFix = toFix(fix);

      return esFix;
    },
    replaceTextRange(range, text) {
      const fix = fixer.replaceTextRange([...range], text);
      const esFix = toFix(fix);

      return esFix;
    },
  };
}

export function toFix(fix: Deno.lint.Fix): eslint.Rule.Fix {
  return {
    range: fix.range,
    text: fix.text ?? "",
  };
}

export function isToken(
  el: eslint.JSSyntaxElement,
): el is eslint.AST.Token {
  if ("value" in el) {
    return tokenTypes.has(el.type);
  }

  return false;
}

const tokenTypes = new Set<string>(
  [
    "Boolean",
    "Identifier",
    "JSXIdentifier",
    "JSXText",
    "Keyword",
    "Null",
    "Numeric",
    "PrivateIdentifier",
    "Punctuator",
    "RegularExpression",
    "String",
    "Template",
  ] satisfies eslint.AST.TokenType[],
);
