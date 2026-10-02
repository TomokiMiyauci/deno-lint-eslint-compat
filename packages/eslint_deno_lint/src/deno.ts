import * as eslint from "eslint";
import * as deno2estree from "@miyauci/deno-lint-estree";
import * as Eslint2Deno from "./eslint.ts";
import * as estree from "estree";
import { ScopeManager } from "eslint-scope";

export function toRuleContext(
  context: Deno.lint.RuleContext,
): eslint.Rule.RuleContext {
  const { filename, id } = context;
  const sourceCode = toSourceCode(context.sourceCode);

  return {
    filename,
    sourceCode,
    id,
    report(descriptor) {
      const reportData = Eslint2Deno.toReportData(
        descriptor,
        context.sourceCode.text,
      );

      context.report(reportData);
    },
    cwd: "", // TODO
    physicalFilename: filename,
    settings: {}, // TODO
    languageOptions: {}, // TODO
    options: [], // TODO
  };
}

export function toSourceCode(source: Deno.lint.SourceCode): eslint.SourceCode {
  const ast = toProgram(source.ast, source.text);
  const sourceCode = new eslint.SourceCode({
    ast,
    text: source.text,
    scopeManager: new ScopeManager({}),
  });

  return sourceCode;
}

export function toProgram(
  ast: Deno.lint.Program,
  text: string,
): eslint.AST.Program {
  const {
    body,
    type,
    sourceType,
    comments,
    leadingComments,
    loc,
    range,
    trailingComments,
  } = deno2estree.toProgram(ast);

  return {
    type,
    body,
    sourceType,
    comments: comments ?? ast.comments,
    leadingComments,
    loc: loc ?? {
      start: getLoc(text, 0),
      end: getLoc(text, text.length),
    },
    tokens: [], // TODO
    range: range ?? ast.range,
    trailingComments,
  };
}

function getLoc(
  source: string,
  offset: number,
): estree.Position {
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

export function toNode(node: Deno.lint.Node): eslint.Rule.Node {
  const estreeNode = deno2estree.toNode(node);

  if ("parent" in node && node.parent !== null) {
    const parent = toNode(node.parent);

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
