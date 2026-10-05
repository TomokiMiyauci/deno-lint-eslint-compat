import * as eslint from "eslint";
import * as deno2estree from "@miyauci/deno-lint-tsestree";
import * as Eslint2Deno from "./eslint.ts";
import * as estree from "estree";
import { SourceCode } from "@typescript-eslint/utils/ts-eslint";
import type { Cache } from "./type.ts";
import { analyze } from "@typescript-eslint/scope-manager";
import { visitorKeys } from "@typescript-eslint/visitor-keys";

export function toRuleContext(
  context: Deno.lint.RuleContext,
  node: SourceCode.Program,
): eslint.Rule.RuleContext {
  const { filename, id } = context;
  const text = context.sourceCode.text;

  const sourceCode = toSourceCode(node, text);

  return {
    filename,
    sourceCode,
    id,
    report(descriptor) {
      const reportData = Eslint2Deno.toReportData(descriptor, text);

      context.report(reportData);
    },
    cwd: "", // TODO
    physicalFilename: filename,
    settings: {}, // TODO
    languageOptions: {}, // TODO
    options: [], // TODO
  };
}

export function toSourceCode(
  node: SourceCode.Program,
  text: string,
): SourceCode {
  const sourceCode = new SourceCode({
    ast: node,
    text,
    scopeManager: analyze(node, {
      sourceType: node.sourceType,
      childVisitorKeys: visitorKeys,
    }),
    visitorKeys: null,
    parserServices: null,
  });

  return sourceCode;
}

export function toFixer(fixer: Deno.lint.Fixer): eslint.Rule.RuleFixer {
  return {
    insertTextAfter(el, text) {
      if (isToken(el)) {
        return this.insertTextAfterRange(el.range, text);
      }

      const node = deno2estree.fromNode(el);
      const fix = fixer.insertTextAfter(node, text);
      const esFix = toFix(fix);

      return esFix;
    },
    insertTextAfterRange(range, text) {
      const fix = fixer.insertTextAfterRange(range, text);
      const esFix = toFix(fix);
      return esFix;
    },
    insertTextBefore(el, text) {
      if (isToken(el)) {
        return this.insertTextBeforeRange(el.range, text);
      }

      const node = deno2estree.fromNode(el);
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

      const node = deno2estree.fromNode(el);
      const fix = fixer.remove(node);
      const esFix = toFix(fix);

      return esFix;
    },
    removeRange(range) {
      const fix = fixer.removeRange(range);
      const esFix = toFix(fix);

      return esFix;
    },
    replaceText(el, text) {
      if (isToken(el)) {
        return this.replaceTextRange(el.range, text);
      }

      const node = deno2estree.fromNode(el);
      const fix = fixer.replaceText(node, text);
      const esFix = toFix(fix);

      return esFix;
    },
    replaceTextRange(range, text) {
      const fix = fixer.replaceTextRange(range, text);
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

function isToken(el: estree.Node | eslint.AST.Token): el is eslint.AST.Token {
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

export function toNode(
  node: Deno.lint.Node,
  cache: Cache,
): eslint.Rule.Node | null {
  const cached = cache.get(node);

  if (!cached) {
    // TODO
    return null;
  }

  return cached;
}
