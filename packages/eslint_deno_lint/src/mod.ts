import * as eslint from "eslint";
import type { Position } from "@eslint/core";
import * as estree from "estree";
import { fromNode, toNode, toProgram } from "@miyauci/deno-lint-estree";
import { mapValues } from "@std/collections";
import { ScopeManager } from "eslint-scope";

function toRule(rule: eslint.Rule.RuleModule): Deno.lint.Rule {
  return {
    create(context): Deno.lint.LintVisitor {
      const eslintContext = toContext(context);
      const visitor = rule.create(eslintContext);
      const listener = toLisenter(visitor);

      return listener;
    },
  };
}

function toContext(context: Deno.lint.RuleContext): eslint.Rule.RuleContext {
  const { filename, id } = context;
  const sourceCode = toSourceCode(context.sourceCode);

  return {
    filename,
    sourceCode,
    id,
    report(descriptor) {
      const reportData = toReportData(descriptor, context.sourceCode.text);

      context.report(reportData);
    },
    cwd: "", // TODO
    physicalFilename: filename,
    settings: {},
    languageOptions: {},
    options: [],
  };
}

function toReportData(
  descriptor: eslint.Rule.ReportDescriptor,
  source: string,
): Deno.lint.ReportData {
  const message = getMessage(descriptor);
  const range = getRange(descriptor, source);
  const fix = createFix(descriptor);

  return {
    message,
    range: range ?? undefined,
    fix,
    // hint is not defined
    // node is not defined
  };
}

function createFix(
  descriptor: eslint.Rule.ReportDescriptor,
): Deno.lint.ReportData["fix"] {
  const { fix } = descriptor;

  if (!fix) return;

  return (fixer) => {
    const eslintFixer = toFixer(fixer);
    const result = fix(eslintFixer);
    const denoResult = toFixResult(result);

    return denoResult;
  };
}

function toFixer(fixer: Deno.lint.Fixer): eslint.Rule.RuleFixer {
  return {
    insertTextAfter(el, text) {
      if (isToken(el)) {
        return this.insertTextAfterRange(el.range, text);
      }

      const node = fromNode(el);
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

      const node = fromNode(el);
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

      const node = fromNode(el);
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

      const node = fromNode(el);
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

function toFix(fix: Deno.lint.Fix): eslint.Rule.Fix {
  return {
    range: fix.range,
    text: fix.text ?? "",
  };
}

function toFixResult(
  result: ReturnType<eslint.Rule.ReportFixer>,
): Deno.lint.Fix | Iterable<Deno.lint.Fix> {
  if (result === null) return [];

  return result;
}

function getRange(
  descriptor: eslint.Rule.ReportDescriptor,
  source: string,
): Deno.lint.Range | null {
  if ("loc" in descriptor) {
    if ("start" in descriptor.loc) {
      return [
        getOffset(source, descriptor.loc.start),
        getOffset(source, descriptor.loc.end),
      ];
    }

    const offset = getOffset(source, descriptor.loc);

    return [offset, offset];
  }

  if (descriptor.node.loc) {
    return [
      getOffset(source, descriptor.node.loc.start),
      getOffset(source, descriptor.node.loc.end),
    ];
  }

  return null;
}

function getOffset(
  source: string,
  position: Position,
): number {
  let offset = 0;

  for (let line = 1; line < position.line; line++) {
    const index = source.indexOf("\n", offset);

    if (index === -1) {
      throw new RangeError(`Invalid line: ${position.line}`);
    }

    offset = index + 1;
  }

  return offset + position.column;
}

function getMessage(
  descriptor: eslint.Rule.ReportDescriptor,
): string {
  if ("message" in descriptor) {
    return descriptor.message;
  }

  throw new Error("unimplemented");
}

function toLisenter(visitor: eslint.Rule.RuleListener): Deno.lint.LintVisitor {
  const result: Deno.lint.LintVisitor = {};

  for (
    const [selector, listener] of Object.entries(toNodeListener(visitor)) as [
      string,
      Function,
    ][]
  ) {
    result[selector] = (node) => {
      const eslintNode = toEslintNode(node);
      listener?.(eslintNode);
    };
  }

  return result;
}

function toNodeListener(
  listener: eslint.Rule.RuleListener,
): eslint.Rule.NodeListener {
  const {
    onCodePathEnd,
    onCodePathSegmentEnd,
    onCodePathSegmentLoop,
    onCodePathSegmentStart,
    onCodePathStart,
    onUnreachableCodePathSegmentEnd,
    onUnreachableCodePathSegmentStart,
    ...rest
  } = listener;

  return rest;
}

const nodes = new WeakMap<Deno.lint.Node>();

function toEslintNode(node: Deno.lint.Node): eslint.Rule.Node {
  const estreeNode = toNode(node);

  if ("parent" in node && node.parent !== null) {
    const parent = toEslintNode(node.parent);

    return { ...estreeNode, parent } as (
      & Exclude<estree.Node, estree.Program>
      & eslint.Rule.NodeParentExtension
    );
  }

  return {
    ...estreeNode,
    parent: null,
    tokens: [],
    comments: [],
    loc: {} as any,
  } satisfies (eslint.AST.Program & { parent: null });
}

function toSourceCode(source: Deno.lint.SourceCode): eslint.SourceCode {
  const ast = toEslintProgram(source);
  const sourceCode = new eslint.SourceCode({
    ast,
    text: source.text,
    scopeManager: new ScopeManager({}),
  });

  return sourceCode;
}
function toEslintProgram(source: Deno.lint.SourceCode): eslint.AST.Program {
  const { ast } = source;
  const {
    body,
    type,
    sourceType,
    comments,
    leadingComments,
    loc,
    range,
    trailingComments,
  } = toProgram(ast);

  return {
    type,
    body,
    sourceType,
    comments: comments ?? ast.comments,
    leadingComments,
    loc: loc ?? {
      start: getLoc(source.text, 0),
      end: getLoc(source.text, source.text.length),
    },
    tokens: [], // TODO
    range: range ?? ast.range,
    trailingComments,
  };
}

function getLoc(
  source: string,
  offset: number,
): { line: number; column: number } {
  let line = 1;
  let lineStart = 0;

  for (let i = 0; i < offset; i++) {
    if (source[i] === "\n") {
      line++;
      lineStart = i + 1;
    }
  }

  return {
    line,
    column: offset - lineStart,
  };
}

/**
 * Converts an ESLint plugin or rule to a Deno lint plugin.
 *
 * The visitor adapter currently forwards ArrayExpression enter/exit handlers.
 * Reports and fixes are translated; suggestions and other visitor events are
 * not supported by this adapter.
 */
export function convertEslintPluginToDenoPlugin(
  plugin: eslint.ESLint.Plugin,
): Deno.lint.Plugin {
  const name = plugin.meta?.name ?? "eslint";
  const rules = mapValues(plugin.rules ?? {}, toRule);

  return { name, rules };
}
