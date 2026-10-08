import type * as eslint from "eslint";
import * as Deno2Eslint from "./deno.ts";
import type * as estree from "estree";
import type { MessagePlaceholderData } from "@eslint/core";
import { mapValues } from "@std/collections";
import * as deno2estree from "@miyauci/deno-lint-tsestree";
import type { TSESLint, TSESTree } from "@typescript-eslint/utils";
import { DenoEstreeMap, EstreeDenoMap } from "./store.ts";
import { interpolate } from "./interpolate.ts";

export function toReportData(
  descriptor: eslint.Rule.ReportDescriptor,
  source: string,
  map: EstreeDenoMap,
  messages: Record<string, string>,
): Deno.lint.ReportData {
  const message = getMessage(descriptor, messages);
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

function normalizeMessagePlaceholderData(
  data: MessagePlaceholderData,
): Record<string, string> {
  return mapValues(data, String);
}

/**
 * Computes the message from a report descriptor.
 * @param descriptor The report descriptor.
 * @returns The computed message.
 * @throws {TypeError} If `descriptor.messageId` is defined and messages'key is not defined.
 */
function computeMessageFromDescriptor(
  descriptor: eslint.Rule.ReportDescriptor,
  messages: Record<string, string>,
): string {
  if ("messageId" in descriptor) {
    const id = descriptor.messageId;
    const message = messages[id];

    if (typeof message !== "string") {
      throw new TypeError(
        `context.report() called with a messageId of '${id}' which is not present in the 'messages' config: ${
          JSON.stringify(messages, null, 2)
        }`,
      );
    }

    return message;
  } else {
    return descriptor.message;
  }
}

function getMessage(
  descriptor: eslint.Rule.ReportDescriptor,
  messages: Record<string, string>,
): string {
  const data = normalizeMessagePlaceholderData(descriptor.data ?? {});
  const message = computeMessageFromDescriptor(descriptor, messages);
  const interpolatedMessage = interpolate(message, data);

  return interpolatedMessage;
}

export function toRule(rule: eslint.Rule.RuleModule): Deno.lint.Rule {
  const messages = rule.meta?.messages ?? {};

  return {
    create(context): Deno.lint.LintVisitor {
      const { sourceCode: { text, ast }, filename, id } = context;
      const { denoEstreeMap, estreeDenoMap, node } = deno2estree.convert(
        ast,
        text,
      );
      toBeSourceCode(node);
      const report = Deno2Eslint.createReport(
        context,
        new EstreeDenoMap(estreeDenoMap),
        messages,
      );
      const sourceCode = Deno2Eslint.toSourceCode(node, text);
      const ruleContext = {
        filename,
        id,
        sourceCode,
        report,
        cwd: "", // TODO
        physicalFilename: filename,
        settings: {}, // TODO
        languageOptions: {}, // TODO
        options: rule.meta?.defaultOptions ?? [],
      } satisfies eslint.Rule.RuleContext;
      const ruleListener = rule.create(ruleContext);
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
  const rules = toRules(plugin.rules);

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

export function toRules(
  rules: eslint.ESLint.Plugin["rules"],
): Deno.lint.Plugin["rules"] {
  return mapValues(rules ?? {}, toRule);
}
