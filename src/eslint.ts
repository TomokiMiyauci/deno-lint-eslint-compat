import type * as eslint from "eslint";
import * as Deno2Eslint from "./deno.ts";
import type * as estree from "estree";
import { mapValues } from "@std/collections";
import * as deno2estree from "@miyauci/deno-lint-tsestree";
import type { TSESLint, TSESTree } from "@typescript-eslint/utils";
import { DenoEstreeMap, EstreeDenoMap } from "./store.ts";

export function toReportData(
  descriptor: eslint.Rule.ReportDescriptor,
  source: string,
  map: EstreeDenoMap,
): Deno.lint.ReportData {
  const message = getMessage(descriptor);
  const range = "loc" in descriptor
    ? getRange(descriptor.loc, source)
    : undefined;
  const fix = toReportFixer(descriptor, map);
  const node = "node" in descriptor && !Deno2Eslint.isToken(descriptor.node)
    ? map.get(descriptor.node)
    : undefined;

  return {
    message,
    range,
    fix,
    node, // hint is not defined
  };
}

function getRange(
  loc: eslint.AST.SourceLocation | estree.Position,
  source: string,
): Deno.lint.Range {
  if ("start" in loc) {
    return [
      getOffset(source, loc.start),
      getOffset(source, loc.end),
    ];
  }

  const offset = getOffset(source, loc);

  return [offset, offset];
}

function getOffset(
  source: string,
  position: estree.Position,
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

export function toRule(rule: eslint.Rule.RuleModule): Deno.lint.Rule {
  return {
    create(context): Deno.lint.LintVisitor {
      const { denoEstreeMap, estreeDenoMap, node } = deno2estree.convert(
        context.sourceCode.ast,
        context.sourceCode.text,
      );
      toBeSourceCode(node);
      const eslintContext = Deno2Eslint.toRuleContext(
        context,
        node,
        new EstreeDenoMap(estreeDenoMap),
      );
      const ruleListener = rule.create(eslintContext);
      const visitor = toLintVisitor(
        ruleListener,
        new DenoEstreeMap(denoEstreeMap),
      );

      return visitor;
    },
  };
}

function toBeSourceCode(
  program: TSESTree.Program,
): asserts program is TSESLint.SourceCode.Program {
  if (!program.comments) {
    program.comments = [];
  }
  if (!program.tokens) {
    program.tokens = [];
  }
}

function toLintVisitor(
  listener: eslint.Rule.NodeListener,
  map: DenoEstreeMap,
): Deno.lint.LintVisitor {
  const result: Deno.lint.LintVisitor = {};

  for (
    const [selector, callback] of Object.entries(listener) as [
      string,
      (node: TSESTree.Node) => void | undefined,
    ][]
  ) {
    if (callback) {
      result[selector] = (node) => {
        const esNode = map.get(node);

        callback(esNode);
      };
    }
  }

  return result;
}

export function toPlugin(
  plugin: eslint.ESLint.Plugin,
): Deno.lint.Plugin {
  const name = plugin.meta?.name ?? "eslint";
  const rules = mapValues(plugin.rules ?? {}, toRule);

  return { name, rules };
}

export function toReportFixer(
  descriptor: eslint.Rule.ReportDescriptor,
  map: EstreeDenoMap,
): Deno.lint.ReportData["fix"] {
  const { fix } = descriptor;

  if (!fix) return;

  return (fixer) => {
    const eslintFixer = Deno2Eslint.toFixer(fixer, map);
    const result = fix(eslintFixer);
    const denoResult = toFixResult(result);

    return denoResult;
  };
}

function toFixResult(
  result: ReturnType<eslint.Rule.ReportFixer>,
): Deno.lint.Fix | Iterable<Deno.lint.Fix> {
  if (result === null) return [];

  return result;
}
