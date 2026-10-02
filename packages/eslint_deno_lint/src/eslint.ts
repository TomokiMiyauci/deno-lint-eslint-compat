import * as eslint from "eslint";
import * as Deno2Eslint from "./deno.ts";
import * as estree from "estree";
import { mapValues } from "@std/collections";

export function toReportData(
  descriptor: eslint.Rule.ReportDescriptor,
  source: string,
): Deno.lint.ReportData {
  const message = getMessage(descriptor);
  const range = getRange(descriptor, source);
  const fix = toReportFixer(descriptor);

  return {
    message,
    range: range ?? undefined,
    fix,
    // hint is not defined
    // node is not defined
  };
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
      const eslintContext = Deno2Eslint.toRuleContext(context);
      const visitor = rule.create(eslintContext);
      const listener = toLisenter(visitor);

      return listener;
    },
  };
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
      const eslintNode = Deno2Eslint.toNode(node);
      listener?.(eslintNode);
    };
  }

  return result;
}

export function toNodeListener(
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

export function toPlugin(
  plugin: eslint.ESLint.Plugin,
): Deno.lint.Plugin {
  const name = plugin.meta?.name ?? "eslint";
  const rules = mapValues(plugin.rules ?? {}, toRule);

  return { name, rules };
}

export function toReportFixer(
  descriptor: eslint.Rule.ReportDescriptor,
): Deno.lint.ReportData["fix"] {
  const { fix } = descriptor;

  if (!fix) return;

  return (fixer) => {
    const eslintFixer = Deno2Eslint.toFixer(fixer);
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
