import type { TSESTree } from "@typescript-eslint/utils";
import type { WeakBiMap } from "bim";

interface ReadonlyWeakMap<T, U> {
  get(key: T): U | undefined;
}

export class EstreeDenoMap implements ReadonlyWeakMap<object, Deno.lint.Node> {
  constructor(private map: WeakBiMap<Deno.lint.Node, TSESTree.Node>) {}
  get(key: object): Deno.lint.Node {
    // deno-lint-ignore no-explicit-any
    const result = this.map.getKey(key as any);

    if (!result) throw new Error("maybe bug");

    return result;
  }
}

export class DenoEstreeMap
  implements ReadonlyWeakMap<Deno.lint.Node, TSESTree.Node> {
  constructor(private map: WeakBiMap<Deno.lint.Node, TSESTree.Node>) {}
  get(key: Deno.lint.Node): TSESTree.Node {
    const result = this.map.get(key);

    if (!result) throw new Error("maybe bug");

    return result;
  }
}
