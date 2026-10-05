import {
  AST_NODE_TYPES as Type,
  AST_TOKEN_TYPES as Token,
  TSESTree,
} from "@typescript-eslint/types";

interface ConvertResult<T> {
  map: WeakMap<Deno.lint.Node, TSESTree.Node>;
  node: T;
}

type Cache = WeakMap<Deno.lint.Node, TSESTree.Node>;

export function convert<T extends Deno.lint.Node>(
  node: T,
  source: string,
  options?: {
    cache?: Cache;
  },
): ConvertResult<NodeMap[T["type"]]> {
  const result = new Converter(source, options?.cache).convert(node);

  return result;
}

type NodeConverter = {
  [k in keyof NodeMap]: (
    node: Extract<Deno.lint.Node, { type: k }>,
  ) => NodeMap[k];
};

type Position = {
  line: number;
  column: number;
};

type SourceLocation = {
  start: Position;
  end: Position;
};

class Converter implements NodeConverter {
  constructor(source: string, cache?: Cache) {
    cache ??= new WeakMap();

    this.#map = cache;
    this.#lineStarts = this.#getLineStarts(source);
  }
  #map: Cache;

  convert(node: Deno.lint.Node): ConvertResult<TSESTree.Node> {
    const tsNode = this.#Node(node);

    return {
      map: this.#map,
      node: tsNode,
    };
  }

  #position(offset: number): Position {
    const line = this.#findLine(offset);
    const lineStart = this.#lineStarts[line];

    return {
      line: line + 1,
      column: offset - lineStart,
    };
  }

  #lineStarts: number[];

  #getLineStarts(source: string): number[] {
    const starts = [0];

    for (let i = 0; i < source.length; i++) {
      if (source[i] === "\n") {
        starts.push(i + 1);
      }
    }

    return starts;
  }

  #findLine(offset: number): number {
    let low = 0;
    let high = this.#lineStarts.length - 1;

    while (low <= high) {
      const mid = (low + high) >>> 1;

      if (this.#lineStarts[mid] <= offset) {
        low = mid + 1;
      } else {
        high = mid - 1;
      }
    }

    return high;
  }

  #loc(range: readonly [number, number]): SourceLocation {
    return {
      start: this.#position(range[0]),
      end: this.#position(range[1]),
    };
  }

  Program(node: Deno.lint.Program): TSESTree.Program {
    return this.#register(node, () => {
      const body = node.body.map(this.#Statement.bind(this));
      const comments = node.comments.map(this.#Comment.bind(this));

      return {
        type: Type.Program,
        body,
        sourceType: node.sourceType,
        comments,
        range: node.range,
        tokens: undefined,
        loc: this.#loc(node.range),
      };
    });
  }

  ArrayExpression(node: Deno.lint.ArrayExpression): TSESTree.ArrayExpression {
    return this.#register(node, () => {
      const elements = node.elements.map((child) => {
        switch (child.type) {
          case "SpreadElement":
            return this.SpreadElement(child);
          default:
            return this.#Expression(child);
        }
      });

      return this.#createNode({
        type: Type.ArrayExpression,
        elements,
      }, node);
    });
  }

  #createNode<T>(
    property: T,
    node: Deno.lint.Node,
  ): T & Omit<TSESTree.NodeOrTokenData, "type"> & { parent: any } {
    const tsNode = {
      ...property,
      loc: this.#loc(node.range),
      parent: this.#getParent(node),
      range: node.range,
    };

    return tsNode;
  }

  #getParent(node: any) {
    const parent = this.#map.get(node.parent);

    if (!parent) throw new Error();

    return parent;
  }

  AccessorProperty(
    node: Deno.lint.AccessorProperty,
  ): TSESTree.AccessorProperty {
    return this.#register(node, () => {
      const value = node.value && this.#Node(node.value);
      const key = this.#Node(node.key);
      const decorators = node.decorators.map(this.#Node.bind(this));

      return {
        type: Type.AccessorProperty,
        declare: node.declare,
        computed: node.computed,
        optional: node.optional,
        override: node.override,
        readonly: node.readonly,
        static: node.static,
        value,
        key,
        decorators,
      };
    });
  }

  ArrayPattern(node: Deno.lint.ArrayPattern): TSESTree.ArrayPattern {
    return this.#register(node, () => {
      const elements = node.elements.map((node) => {
        if (node === null) return null;
        return this.#Node(node);
      });
      const typeAnnotation = node.typeAnnotation &&
        this.TSTypeAnnotation(node.typeAnnotation);

      return this.#createNode({
        type: Type.ArrayPattern,
        elements,
        optional: node.optional,
        typeAnnotation,
        decorators: [], // TODo
      }, node);
    });
  }
  ArrowFunctionExpression(
    node: Deno.lint.ArrowFunctionExpression,
  ): TSESTree.ArrowFunctionExpression {
    return this.#register(node, () => {
      if (node.generator) {
        throw new Error();
      }

      const params = node.params.map(this.#Parameter.bind(this));
      const returnType = node.returnType &&
        this.TSTypeAnnotation(node.returnType);
      const typeParameters = node.typeParameters &&
        this.TSTypeParameterDeclaration(node.typeParameters);

      if (node.body.type === "BlockStatement") {
        const body = this.BlockStatement(node.body);

        return this.#createNode(
          {
            type: Type.ArrowFunctionExpression,
            async: node.async,
            body,
            id: node.id,
            expression: false,
            generator: node.generator,
            params,
            returnType,
            typeParameters,
          },
          node,
        );
      }

      const body = this.#Expression(node.body);

      return this.#createNode(
        {
          type: Type.ArrowFunctionExpression,
          expression: true,
          generator: node.generator,
          body,
          async: node.async,
          id: node.id,
          params,
          returnType,
          typeParameters,
        },
        node,
      );
    });
  }

  AssignmentExpression(
    node: Deno.lint.AssignmentExpression,
  ): TSESTree.AssignmentExpression {
    return this.#register(node, () => {
      const left = this.#Expression(node.left);
      const right = this.#Expression(node.right);

      return this.#createNode({
        type: Type.AssignmentExpression,
        left,
        operator: node.operator,
        right,
      }, node);
    });
  }
  AwaitExpression(node: Deno.lint.AwaitExpression): TSESTree.AwaitExpression {
    return this.#register(node, () => {
      const argument = this.#Expression(node.argument);

      return this.#createNode({
        type: Type.AwaitExpression,
        argument,
      }, node);
    });
  }
  BinaryExpression(
    node: Deno.lint.BinaryExpression,
  ): TSESTree.BinaryExpression {
    return this.#register(node, () => {
      const right = this.#Expression(node.right);

      if (node.operator === "in" && node.left.type === "PrivateIdentifier") {
        const left = this.PrivateIdentifier(node.left);

        return this.#createNode({
          type: Type.BinaryExpression,
          left,
          right,
          operator: node.operator,
        }, node);
      }

      if (node.left.type === "PrivateIdentifier") {
        throw new Error("semantic error");
      }

      const left = this.#Expression(node.left);

      return this.#createNode({
        type: Type.BinaryExpression,
        left,
        right,
        operator: node.operator,
      }, node);
    });
  }
  BlockStatement(node: Deno.lint.BlockStatement): TSESTree.BlockStatement {
    return this.#register(node, () => {
      const body = node.body.map(this.#Statement.bind(this));

      return this.#createNode({
        type: Type.BlockStatement,
        body,
      }, node);
    });
  }

  BreakStatement(node: Deno.lint.BreakStatement): TSESTree.BreakStatement {
    return this.#register(node, () => {
      const label = node.label && this.Identifier(node.label);

      return this.#createNode({
        type: Type.BreakStatement,
        label,
      }, node);
    });
  }
  CallExpression(node: Deno.lint.CallExpression): TSESTree.CallExpression {
    return this.#register(node, () => {
      const $arguments = node.arguments.map(
        this.#CallExpressionArgument.bind(this),
      );
      const callee = this.#Expression(node.callee);
      const typeArguments = node.typeArguments &&
        this.TSTypeParameterInstantiation(node.typeArguments);

      return this.#createNode({
        type: Type.CallExpression,
        arguments: $arguments,
        callee,
        optional: node.optional,
        typeArguments: typeArguments ?? undefined,
      }, node);
    });
  }

  #CallExpressionArgument(
    node: Deno.lint.Expression | Deno.lint.SpreadElement,
  ): TSESTree.CallExpressionArgument {
    switch (node.type) {
      case "SpreadElement":
        return this.SpreadElement(node);
      default:
        return this.#Expression(node);
    }
  }

  ChainExpression(node: Deno.lint.ChainExpression): TSESTree.ChainExpression {
    return this.#register(node, () => {
      const expression = map(node.expression, (child) => {
        switch (child.type) {
          case "CallExpression":
            return this.CallExpression(child);
          case "MemberExpression":
            return this.MemberExpression(child);
          case "TSNonNullExpression":
            return this.TSNonNullExpression(child);
        }
      });

      return this.#createNode({
        type: Type.ChainExpression,
        expression,
      }, node);
    });
  }
  ClassExpression(node: Deno.lint.ClassExpression): TSESTree.ClassExpression {
    return this.#register(node, () => {
      if (node.abstract) throw new Error();
      if (node.declare) throw new Error();

      const body = this.ClassBody(node.body);
      const id = node.id && this.Identifier(node.id);
      const $implements = node.implements.map(
        this.TSClassImplements.bind(this),
      );
      const superClass = this.#SuperClass(node.superClass);
      const superTypeArguments = node.superTypeArguments &&
        this.TSTypeParameterInstantiation(node.superTypeArguments);
      const typeParameters = node.typeParameters &&
        this.TSTypeParameterDeclaration(node.typeParameters);

      return this.#createNode({
        type: Type.ClassExpression,
        body,
        abstract: node.abstract,
        declare: node.declare,
        decorators: [], // TODO,
        id,
        implements: $implements,
        superClass,
        superTypeArguments,
        typeParameters,
      }, node);
    });
  }

  #SuperClass(node: Deno.lint.ClassExpression["superClass"]) {
    if (node === null) return null;

    switch (node.type) {
      case "ArrayExpression":
        return this.ArrayExpression(node);
      case "ArrayPattern":
        return this.ArrayPattern(node);
      case "ArrowFunctionExpression":
        return this.ArrowFunctionExpression(node);
      case "CallExpression":
        return this.CallExpression(node);
      case "ClassExpression":
        return this.ClassExpression(node);
      case "FunctionExpression":
        return this.FunctionExpression(node);
      case "Identifier":
        return this.Identifier(node);
      case "JSXElement":
        return this.JSXElement(node);
      case "JSXFragment":
        return this.JSXFragment(node);
      case "Literal":
        return this.Literal(node);
      case "MemberExpression":
        return this.MemberExpression(node);
      case "MetaProperty":
        return this.MetaProperty(node);
      case "ObjectExpression":
        return this.ObjectExpression(node);
      case "ObjectPattern":
        return this.ObjectPattern(node);
      case "SequenceExpression":
        return this.SequenceExpression(node);
      case "Super":
        return this.Super(node);
      case "TaggedTemplateExpression":
        return this.TaggedTemplateExpression(node);
      case "TemplateLiteral":
        return this.TemplateLiteral(node);
      case "ThisExpression":
        return this.ThisExpression(node);
      case "TSAsExpression":
        return this.TSAsExpression(node);
      case "TSNonNullExpression":
        return this.TSNonNullExpression(node);
      case "TSTypeAssertion":
        return this.TSTypeAssertion(node);
    }
  }

  ConditionalExpression(
    node: Deno.lint.ConditionalExpression,
  ): TSESTree.ConditionalExpression {
    return this.#register(node, () => {
      const alternate = this.#Expression(node.alternate);
      const consequent = this.#Expression(node.consequent);
      const test = this.#Expression(node.test);

      return this.#createNode({
        type: Type.ConditionalExpression,
        alternate,
        consequent,
        test,
      }, node);
    });
  }
  FunctionExpression(
    node: Deno.lint.FunctionExpression,
  ): TSESTree.FunctionExpression {
    return this.#register(node, () => {
      const body = this.BlockStatement(node.body);
      const id = node.id && this.Identifier(node.id);
      const params = node.params.map(this.#Parameter.bind(this));
      const returnType = node.returnType &&
        this.TSTypeAnnotation(node.returnType);
      const typeParameters = node.typeParameters &&
        this.TSTypeParameterDeclaration(node.typeParameters);

      return this.#createNode({
        type: Type.FunctionExpression,
        async: node.async,
        body,
        generator: node.generator,
        id,
        params,
        expression: false,
        declare: false,
        returnType,
        typeParameters,
      }, node);
    });
  }

  #Parameter(node: Deno.lint.Parameter): TSESTree.Parameter {
    switch (node.type) {
      case "ArrayPattern":
        return this.ArrayPattern(node);
      case "Identifier":
        return this.Identifier(node);
      case "ObjectPattern":
        return this.ObjectPattern(node);
      case "AssignmentPattern":
        return this.AssignmentPattern(node);
      case "RestElement":
        return this.RestElement(node);
      case "TSParameterProperty":
        return this.TSParameterProperty(node);
    }
  }

  Identifier(node: Deno.lint.Identifier): TSESTree.Identifier {
    return this.#register(node, () => {
      const typeAnnotation = node.typeAnnotation &&
        this.TSTypeAnnotation(node.typeAnnotation);

      return this.#createNode({
        type: Type.Identifier,
        name: node.name,
        decorators: [], // TODO
        optional: node.optional,
        typeAnnotation,
      }, node);
    });
  }
  ImportExpression(
    node: Deno.lint.ImportExpression,
  ): TSESTree.ImportExpression {
    return this.#register(node, () => {
      const source = this.#Expression(node.source);
      const options = node.options && this.#Expression(node.options);

      return this.#createNode({
        type: Type.ImportExpression,
        source,
        options,
        attributes: options,
        phase: null, // TODO dynamic source phase import
      }, node);
    });
  }
  JSXElement(node: Deno.lint.JSXElement): TSESTree.JSXElement {
    return this.#register(node, () => {
      const closingElement = node.closingElement &&
        this.JSXClosingElement(node.closingElement);
      const openingElement = this.JSXOpeningElement(node.openingElement);
      const children = node.children.map(this.#JSXChild.bind(this));

      return this.#createNode({
        type: Type.JSXElement,
        closingElement,
        openingElement,
        children,
      }, node);
    });
  }

  #JSXChild(node: Deno.lint.JSXChild): TSESTree.JSXChild {
    switch (node.type) {
      case "JSXElement":
        return this.JSXElement(node);
      case "JSXFragment":
        return this.JSXFragment(node);
      case "JSXExpressionContainer":
        return this.JSXExpressionContainer(node);
      case "JSXText":
        return this.JSXText(node);
    }
  }

  JSXFragment(node: Deno.lint.JSXFragment): TSESTree.JSXFragment {
    return this.#register(node, () => {
      const closingFragment = this.JSXClosingFragment(node.closingFragment);
      const openingFragment = this.JSXOpeningFragment(node.openingFragment);
      const children = node.children.map(this.#JSXChild.bind(this));

      return this.#createNode({
        type: Type.JSXFragment,
        closingFragment,
        openingFragment,
        children,
      }, node);
    });
  }
  Literal(node: Deno.lint.Literal): TSESTree.Literal {
    if (typeof node.value === "string") {
      return this.#StringLiteral(node);
    }

    if (typeof node.value === "boolean") {
      return this.#BooleanLiteral(node);
    }

    if (typeof node.value === "number") {
      return this.#NumberLiteral(node);
    }

    if (typeof node.value === "bigint") {
      return this.#BigIntLiteral(node);
    }

    if ("regex" in node) {
      return this.#RegExpLiteral(node);
    }

    return this.#NullLiteral(node);
  }

  #StringLiteral(node: Deno.lint.StringLiteral): TSESTree.StringLiteral {
    return this.#register(node, () => {
      return this.#createNode({
        type: Type.Literal,
        raw: node.raw,
        value: node.value,
      }, node);
    });
  }

  #BooleanLiteral(node: Deno.lint.BooleanLiteral): TSESTree.BooleanLiteral {
    return this.#register(node, () => {
      return this.#createNode({
        type: Type.Literal,
        raw: node.raw,
        value: node.value,
      }, node);
    });
  }

  #NumberLiteral(node: Deno.lint.NumberLiteral): TSESTree.NumberLiteral {
    return this.#register(node, () => {
      return this.#createNode({
        type: Type.Literal,
        raw: node.raw,
        value: node.value,
      }, node);
    });
  }

  #NullLiteral(node: Deno.lint.NullLiteral): TSESTree.NullLiteral {
    return this.#register(node, () => {
      return this.#createNode({
        type: Type.Literal,
        raw: node.raw,
        value: node.value,
      }, node);
    });
  }

  #BigIntLiteral(node: Deno.lint.BigIntLiteral): TSESTree.BigIntLiteral {
    return this.#register(node, () => {
      return this.#createNode({
        type: Type.Literal,
        raw: node.raw,
        value: node.value,
        bigint: node.bigint,
      }, node);
    });
  }

  #RegExpLiteral(node: Deno.lint.RegExpLiteral): TSESTree.RegExpLiteral {
    return this.#register(node, () => {
      return this.#createNode({
        type: Type.Literal,
        raw: node.raw,
        value: node.value,
        regex: node.regex,
      }, node);
    });
  }

  LogicalExpression(
    node: Deno.lint.LogicalExpression,
  ): TSESTree.LogicalExpression {
    return this.#register(node, () => {
      const left = this.#Expression(node.left);
      const right = this.#Expression(node.right);

      return this.#createNode({
        type: Type.LogicalExpression,
        left,
        operator: node.operator,
        right,
      }, node);
    });
  }
  MemberExpression(
    node: Deno.lint.MemberExpression,
  ): TSESTree.MemberExpression {
    return this.#register(node, () => {
      const object = this.#Expression(node.object);

      if (
        node.computed &&
        !(node.property.type === "Identifier" ||
          node.property.type === "PrivateIdentifier")
      ) {
        const property = this.#Expression(node.property);

        return this.#createNode({
          type: Type.MemberExpression,
          computed: node.computed,
          object,
          optional: node.optional,
          property,
        }, node);
      }

      if (
        !node.computed &&
        (node.property.type === "Identifier" ||
          node.property.type === "PrivateIdentifier")
      ) {
        const property = node.property.type === "PrivateIdentifier"
          ? this.PrivateIdentifier(node.property)
          : this.Identifier(node.property);

        return this.#createNode({
          type: Type.MemberExpression,
          computed: node.computed,
          object,
          optional: node.optional,
          property,
        }, node);
      }

      throw new Error("semantic error");
    });
  }

  #register<T extends TSESTree.Node>(
    node: Deno.lint.Node,
    callback: () => T,
  ): T {
    const target = {} as T;

    if (this.#map.has(node)) {
      throw new Error("multiple register is called. it maybe bug");
    }

    this.#map.set(node, target);

    const result = callback();

    Object.assign(target, result);

    return target;
  }

  MetaProperty(node: Deno.lint.MetaProperty): TSESTree.MetaProperty {
    return this.#register(node, () => {
      const meta = this.Identifier(node.meta);
      const property = this.Identifier(node.property);

      return this.#createNode({
        type: Type.MetaProperty,
        meta,
        property,
        range: node.range,
        loc: this.#loc(node.range),
      }, node);
    });
  }
  NewExpression(node: Deno.lint.NewExpression): TSESTree.NewExpression {
    return this.#register(node, () => {
      const $arguments = node.arguments.map((child) => {
        if (child.type === "SpreadElement") {
          return this.SpreadElement(child);
        }
        return this.#Expression(child);
      });

      const callee = this.#Expression(node.callee);
      const typeArguments = node.typeArguments &&
        this.TSTypeParameterInstantiation(node.typeArguments);

      return this.#createNode({
        type: Type.NewExpression,
        arguments: $arguments,
        callee,
        typeArguments,
      }, node);
    });
  }
  ObjectExpression(
    node: Deno.lint.ObjectExpression,
  ): TSESTree.ObjectExpression {
    return this.#register(node, () => {
      const properties = node.properties.map((child) => {
        if (child.type === "SpreadElement") {
          return this.SpreadElement(child);
        }

        return this.Property(child);
      });
      return this.#createNode({
        type: Type.ObjectExpression,
        properties,
      }, node);
    });
  }
  ObjectPattern(node: Deno.lint.ObjectPattern): TSESTree.ObjectPattern {
    return this.#register(node, () => {
      const properties = node.properties.map((child) => {
        if (child.type === "RestElement") {
          return this.RestElement(child);
        }

        return this.Property(child);
      });
      const typeAnnotation = node.typeAnnotation &&
        this.TSTypeAnnotation(node.typeAnnotation);

      return this.#createNode({
        type: Type.ObjectPattern,
        properties,
        decorators: [], // TODO
        optional: node.optional,
        typeAnnotation,
      }, node);
    });
  }
  SequenceExpression(
    node: Deno.lint.SequenceExpression,
  ): TSESTree.SequenceExpression {
    return this.#register(node, () => {
      const expressions = node.expressions.map(this.#Expression.bind(this));
      return this.#createNode({
        type: Type.SequenceExpression,
        expressions,
      }, node);
    });
  }
  Super(node: Deno.lint.Super): TSESTree.Super {
    return this.#register(node, () => {
      return this.#createNode({
        type: Type.Super,
      }, node);
    });
  }

  TaggedTemplateExpression(
    node: Deno.lint.TaggedTemplateExpression,
  ): TSESTree.TaggedTemplateExpression {
    return this.#register(node, () => {
      const quasi = this.TemplateLiteral(node.quasi);
      const tag = this.#Expression(node.tag);
      const typeArguments = node.typeArguments &&
        this.TSTypeParameterInstantiation(node.typeArguments);

      return this.#createNode({
        type: Type.TaggedTemplateExpression,
        quasi,
        tag,
        typeArguments,
      }, node);
    });
  }
  TemplateLiteral(node: Deno.lint.TemplateLiteral): TSESTree.TemplateLiteral {
    return this.#register(node, () => {
      const expressions = node.expressions.map(this.#Expression.bind(this));
      const quasis = node.quasis.map(this.TemplateElement.bind(this));

      return this.#createNode({
        type: Type.TemplateLiteral,
        expressions,
        quasis,
      }, node);
    });
  }
  ThisExpression(node: Deno.lint.ThisExpression): TSESTree.ThisExpression {
    return this.#register(node, () => {
      return this.#createNode({
        type: Type.ThisExpression,
      }, node);
    });
  }
  TSAsExpression(node: Deno.lint.TSAsExpression): TSESTree.TSAsExpression {
    return this.#register(node, () => {
      const expression = this.#Expression(node.expression);
      const typeAnnotation = this.#TypeNode(node.typeAnnotation);

      return this.#createNode({
        type: Type.TSAsExpression,
        expression,
        typeAnnotation,
      }, node);
    });
  }
  TSInstantiationExpression(
    node: Deno.lint.TSInstantiationExpression,
  ): TSESTree.TSInstantiationExpression {
    return this.#register(node, () => {
      const expression = this.#Expression(node.expression);
      const typeArguments = this.TSTypeParameterInstantiation(
        node.typeArguments,
      );

      return this.#createNode({
        type: Type.TSInstantiationExpression,
        expression,
        typeArguments,
      }, node);
    });
  }
  TSNonNullExpression(
    node: Deno.lint.TSNonNullExpression,
  ): TSESTree.TSNonNullExpression {
    return this.#register(node, () => {
      const expression = this.#Expression(node.expression);

      return this.#createNode({
        type: Type.TSNonNullExpression,
        expression,
      }, node);
    });
  }

  TSSatisfiesExpression(
    node: Deno.lint.TSSatisfiesExpression,
  ): TSESTree.TSSatisfiesExpression {
    return this.#register(node, () => {
      const expression = this.#Expression(node.expression);
      const typeAnnotation = this.#TypeNode(node.typeAnnotation);

      return this.#createNode({
        type: Type.TSSatisfiesExpression,
        expression,
        typeAnnotation,
      }, node);
    });
  }
  TSTypeAssertion(node: Deno.lint.TSTypeAssertion): TSESTree.TSTypeAssertion {
    return this.#register(node, () => {
      const expression = this.#Expression(node.expression);
      const typeAnnotation = this.#TypeNode(node.typeAnnotation);

      return this.#createNode({
        type: Type.TSTypeAssertion,
        expression,
        typeAnnotation,
      }, node);
    });
  }
  UnaryExpression(node: Deno.lint.UnaryExpression): TSESTree.UnaryExpression {
    return this.#register(node, () => {
      const argument = this.#Expression(node.argument);

      return this.#createNode({
        type: Type.UnaryExpression,
        argument,
        operator: node.operator,
        prefix: true,
      }, node);
    });
  }

  UpdateExpression(
    node: Deno.lint.UpdateExpression,
  ): TSESTree.UpdateExpression {
    return this.#register(node, () => {
      const argument = this.#Expression(node.argument);

      return this.#createNode({
        type: Type.UpdateExpression,
        argument,
        operator: node.operator,
        prefix: node.prefix,
      }, node);
    });
  }
  YieldExpression(node: Deno.lint.YieldExpression): TSESTree.YieldExpression {
    return this.#register(node, () => {
      const argument = node.argument && this.#Expression(node.argument);

      if (node.delegate) {
        if (!argument) throw new Error("semantic error");

        return this.#createNode({
          type: Type.YieldExpression,
          delegate: node.delegate,
          argument,
        }, node);
      }

      return this.#createNode({
        type: Type.YieldExpression,
        argument,
        delegate: node.delegate,
      }, node);
    });
  }
  ClassDeclaration(
    node: Deno.lint.ClassDeclaration,
  ): TSESTree.ClassDeclaration {
    return this.#register(node, () => {
      const body = this.ClassBody(node.body);
      if (!node.id) throw new Error();

      const id = this.Identifier(node.id);
      const $implements = node.implements.map(
        this.TSClassImplements.bind(this),
      );
      const superClass = this.#SuperClass(node.superClass);

      return this.#createNode({
        type: Type.ClassDeclaration,
        body,
        id,
        abstract: node.abstract,
        declare: node.declare,
        decorators: [], // TODO,
        implements: $implements,
        superClass,
        superTypeArguments: undefined, // TODO
        typeParameters: undefined, // TODO
      }, node);
    });
  }
  ContinueStatement(
    node: Deno.lint.ContinueStatement,
  ): TSESTree.ContinueStatement {
    return this.#register(node, () => {
      const label = node.label && this.Identifier(node.label);

      return this.#createNode({
        type: Type.ContinueStatement,
        label,
      }, node);
    });
  }
  DebuggerStatement(
    node: Deno.lint.DebuggerStatement,
  ): TSESTree.DebuggerStatement {
    return this.#register(node, () => {
      return this.#createNode({
        type: Type.DebuggerStatement,
      }, node);
    });
  }
  DoWhileStatement(
    node: Deno.lint.DoWhileStatement,
  ): TSESTree.DoWhileStatement {
    return this.#register(node, () => {
      const body = this.#Statement(node.body);
      const test = this.#Expression(node.test);

      return this.#createNode({
        type: Type.DoWhileStatement,
        body,
        test,
      }, node);
    });
  }
  ExportAllDeclaration(
    node: Deno.lint.ExportAllDeclaration,
  ): TSESTree.ExportAllDeclaration {
    return this.#register(node, () => {
      const attributes = node.attributes.map(this.ImportAttribute.bind(this));
      const exported = node.exported && this.Identifier(node.exported);
      const source = this.#StringLiteral(node.source);

      return this.#createNode({
        type: Type.ExportAllDeclaration,
        attributes,
        exported,
        source,
        exportKind: node.exportKind,
        assertions: attributes, // TODO
      }, node);
    });
  }
  ExportDefaultDeclaration(
    node: Deno.lint.ExportDefaultDeclaration,
  ): TSESTree.ExportDefaultDeclaration {
    return this.#register(node, () => {
      if (node.exportKind === "type") throw new Error("semantic error");

      const declaration = this.#DefaultExportDeclaration(node.declaration);

      return this.#createNode({
        type: Type.ExportDefaultDeclaration,
        declaration,
        exportKind: node.exportKind,
      }, node);
    });
  }

  ExportNamedDeclaration(
    node: Deno.lint.ExportNamedDeclaration,
  ): TSESTree.ExportNamedDeclaration {
    throw new Error();

    return this.#register(node, () => {
      const attributes = node.attributes.map(this.ImportAttribute.bind(this));
      const declaration = exportNamedDeclarationDeclaration2Declaration(
        node.declaration,
        mapper,
      );
      const specifiers = node.specifiers.map(this.ExportSpecifier.bind(this));

      return this.#createNode({
        type: Type.ExportNamedDeclaration,
        attributes,
        declaration,
        specifiers,
      }, node);
    });
  }
  ExpressionStatement(
    node: Deno.lint.ExpressionStatement,
  ): TSESTree.ExpressionStatement {
    return this.#register(node, () => {
      const expression = this.#Node(node.expression);

      return this.#createNode({
        type: Type.ExpressionStatement,
        expression,
      }, node);
    });
  }
  ForInStatement(node: Deno.lint.ForInStatement): TSESTree.ForInStatement {
    throw new Error();

    return this.#register(node, () => {
      const body = this.#Statement(node.body);
      const left = node.left.type === "VariableDeclaration"
        ? this.VariableDeclaration(node.left)
        : this.#Expression(node.left);
      const right = this.#Expression(node.right);

      return this.#createNode({
        type: Type.ForInStatement,
        body,
        left,
        right,
      }, node);
    });
  }
  ForOfStatement(node: Deno.lint.ForOfStatement): TSESTree.ForOfStatement {
    throw new Error();
    return this.#register(node, () => {
      const body = this.#Statement(node.body);
      const left = node.left.type === "VariableDeclaration"
        ? this.VariableDeclaration(node.left)
        : this.#Expression(node.left);
      const right = this.#Expression(node.right);

      return this.#createNode({
        type: Type.ForOfStatement,
        body,
        await: node.await,
        left,
        right,
      }, node);
    });
  }
  ForStatement(node: Deno.lint.ForStatement): TSESTree.ForStatement {
    throw new Error();
    return this.#register(node, () => {
      const body = this.#Statement(node.body);
      const init = node.init && map(node.init, (node) => {
        switch (node.type) {
          case "VariableDeclaration":
            return this.VariableDeclaration(node);
          default:
            return this.#Expression(node);
        }
      });
      const test = node.test && this.#Expression(node.test);
      const update = node.update && this.#Expression(node.update);

      return this.#createNode({
        type: Type.ForStatement,
        body,
        init: init ?? null,
        test,
        update,
      }, node);
    });
  }
  FunctionDeclaration(
    node: Deno.lint.FunctionDeclaration,
  ): TSESTree.FunctionDeclaration {
    return this.#register(node, () => {
      if (node.declare) throw new Error("semantic error");

      if (!node.body) throw new Error();
      const body = this.BlockStatement(node.body);
      if (!node.id) throw new Error();
      const id = this.Identifier(node.id);
      const params = node.params.map(this.#Parameter.bind(this));
      const returnType = node.returnType &&
        this.TSTypeAnnotation(node.returnType);
      const typeParameters = node.typeParameters &&
        this.TSTypeParameterDeclaration(node.typeParameters);

      return this.#createNode({
        type: Type.FunctionDeclaration,
        body,
        async: node.async,
        id,
        params,
        generator: node.generator,
        declare: node.declare,
        expression: false,
        returnType,
        typeParameters,
      }, node);
    });
  }
  IfStatement(node: Deno.lint.IfStatement): TSESTree.IfStatement {
    return this.#register(node, () => {
      const alternate = node.alternate && this.#Statement(node.alternate);
      const consequent = this.#Statement(node.consequent);
      const test = this.#Expression(node.test);

      return this.#createNode({
        type: Type.IfStatement,
        alternate,
        consequent,
        test,
      }, node);
    });
  }
  ImportDeclaration(
    node: Deno.lint.ImportDeclaration,
  ): TSESTree.ImportDeclaration {
    return this.#register(node, () => {
      const attributes = node.attributes.map(this.ImportAttribute.bind(this));
      const source = this.#StringLiteral(node.source);
      const specifiers = node.specifiers.map((child) => {
        switch (child.type) {
          case "ImportDefaultSpecifier":
            return this.ImportDefaultSpecifier(child);
          case "ImportNamespaceSpecifier":
            return this.ImportNamespaceSpecifier(child);
          case "ImportSpecifier":
            return this.ImportSpecifier(child);
        }
      });
      return this.#createNode({
        type: Type.ImportDeclaration,
        attributes,
        source,
        specifiers,
        assertions: attributes,
        importKind: node.importKind,
        phase: null, // TODO
      }, node);
    });
  }
  LabeledStatement(
    node: Deno.lint.LabeledStatement,
  ): TSESTree.LabeledStatement {
    return this.#register(node, () => {
      const body = this.#Statement(node.body);
      const label = this.Identifier(node.label);

      return this.#createNode({
        type: Type.LabeledStatement,
        body,
        label,
      }, node);
    });
  }
  ReturnStatement(node: Deno.lint.ReturnStatement): TSESTree.ReturnStatement {
    return this.#register(node, () => {
      const argument = node.argument && this.#Expression(node.argument);

      return this.#createNode({
        type: Type.ReturnStatement,

        argument,
      }, node);
    });
  }
  SwitchStatement(node: Deno.lint.SwitchStatement): TSESTree.SwitchStatement {
    return this.#register(node, () => {
      const cases = node.cases.map(this.SwitchCase.bind(this));
      const discriminant = this.#Expression(node.discriminant);

      return this.#createNode({
        type: Type.SwitchStatement,
        cases,
        discriminant,
      }, node);
    });
  }
  ThrowStatement(node: Deno.lint.ThrowStatement): TSESTree.ThrowStatement {
    return this.#register(node, () => {
      const argument = this.#Expression(node.argument);

      return this.#createNode({
        type: Type.ThrowStatement,
        argument,
      }, node);
    });
  }
  TryStatement(node: Deno.lint.TryStatement): TSESTree.TryStatement {
    return this.#register(node, () => {
      const block = this.BlockStatement(node.block);
      const finalizer = node.finalizer && this.BlockStatement(node.finalizer);
      const handler = node.handler && this.CatchClause(node.handler);

      return this.#createNode({
        type: Type.TryStatement,
        block,
        finalizer,
        handler,
      }, node);
    });
  }
  TSDeclareFunction(
    node: Deno.lint.TSDeclareFunction,
  ): TSESTree.TSDeclareFunction {
    throw new Error();

    return this.#register(node, () => {
      return this.#createNode({
        type: Type.TSDeclareFunction,
        async: node.async,
      }, node);
    });
  }
  TSEnumDeclaration(
    node: Deno.lint.TSEnumDeclaration,
  ): TSESTree.TSEnumDeclaration {
    return this.#register(node, () => {
      const body = this.TSEnumBody(node.body);
      const id = this.Identifier(node.id);

      return this.#createNode({
        type: Type.TSEnumDeclaration,
        body,
        const: node.const,
        declare: node.declare,
        id,
        members: body.members,
      }, node);
    });
  }
  TSExportAssignment(
    node: Deno.lint.TSExportAssignment,
  ): TSESTree.TSExportAssignment {
    return this.#register(node, () => {
      const expression = this.#Expression(node.expression);

      return this.#createNode({
        type: Type.TSExportAssignment,
        expression,
      }, node);
    });
  }
  TSImportEqualsDeclaration(
    node: Deno.lint.TSImportEqualsDeclaration,
  ): TSESTree.TSImportEqualsDeclaration {
    return this.#register(node, () => {
      const id = this.Identifier(node.id);
      const moduleReference = this.TSExternalModuleReference(
        node.moduleReference,
      );

      return this.#createNode({
        type: Type.TSImportEqualsDeclaration,
        id,
        importKind: node.importKind,
        moduleReference,
      }, node);
    });
  }
  TSInterfaceDeclaration(
    node: Deno.lint.TSInterfaceDeclaration,
  ): TSESTree.TSInterfaceDeclaration {
    return this.#register(node, () => {
      const body = this.TSInterfaceBody(node.body);
      const id = this.Identifier(node.id);
      const typeParameters = node.typeParameters &&
        this.TSTypeParameterDeclaration(node.typeParameters);
      const $extends = node.extends.map(this.TSInterfaceHeritage.bind(this));

      return this.#createNode({
        type: Type.TSInterfaceDeclaration,
        body,
        declare: node.declare,
        id,
        typeParameters,
        extends: $extends,
      }, node);
    });
  }
  TSModuleDeclaration(
    node: Deno.lint.TSModuleDeclaration,
  ): TSESTree.TSModuleDeclaration {
    throw new Error();
    return this.#register(node, () => {
    });
  }
  TSNamespaceExportDeclaration(
    node: Deno.lint.TSNamespaceExportDeclaration,
  ): TSESTree.TSNamespaceExportDeclaration {
    throw new Error();
    return this.#register(node, () => {
    });
  }
  TSTypeAliasDeclaration(
    node: Deno.lint.TSTypeAliasDeclaration,
  ): TSESTree.TSTypeAliasDeclaration {
    return this.#register(node, () => {
      const id = this.Identifier(node.id);
      const typeAnnotation = this.#TypeNode(node.typeAnnotation);
      const typeParameters = node.typeParameters &&
        this.TSTypeParameterDeclaration(node.typeParameters);

      return this.#createNode({
        type: Type.TSTypeAliasDeclaration,
        declare: node.declare,
        id,
        typeAnnotation,
        typeParameters,
      }, node);
    });
  }
  VariableDeclaration(
    node: Deno.lint.VariableDeclaration,
  ): TSESTree.VariableDeclaration {
    return this.#register(node, () => {
      const declarations = node.declarations.map(
        this.VariableDeclarator.bind(this),
      );

      return this.#createNode({
        type: Type.VariableDeclaration,
        declarations,
        kind: node.kind,
      }, node);
    });
  }
  WhileStatement(node: Deno.lint.WhileStatement): TSESTree.WhileStatement {
    return this.#register(node, () => {
      const body = this.#Statement(node.body);
      const test = this.#Expression(node.test);

      return this.#createNode({
        type: Type.WhileStatement,
        body,
        test,
      }, node);
    });
  }
  WithStatement(node: Deno.lint.WithStatement): TSESTree.WithStatement {
    return this.#register(node, () => {
      const body = this.#Statement(node.body);
      const object = this.#Expression(node.object);

      return this.#createNode({
        type: Type.WithStatement,
        body,
        object,
      }, node);
    });
  }
  TSAnyKeyword(node: Deno.lint.TSAnyKeyword): TSESTree.TSAnyKeyword {
    return this.#register(node, () => {
      return this.#createNode({
        type: Type.TSAnyKeyword,
      }, node);
    });
  }
  TSArrayType(node: Deno.lint.TSArrayType): TSESTree.TSArrayType {
    return this.#register(node, () => {
      const elementType = this.#TypeNode(node.elementType);

      return this.#createNode({
        type: Type.TSArrayType,
        elementType,
      }, node);
    });
  }
  TSBigIntKeyword(node: Deno.lint.TSBigIntKeyword): TSESTree.TSBigIntKeyword {
    return this.#register(node, () => {
      return this.#createNode({
        type: Type.TSBigIntKeyword,
      }, node);
    });
  }
  TSBooleanKeyword(
    node: Deno.lint.TSBooleanKeyword,
  ): TSESTree.TSBooleanKeyword {
    return this.#register(node, () => {
      return this.#createNode({
        type: Type.TSBooleanKeyword,
      }, node);
    });
  }

  TSConditionalType(
    node: Deno.lint.TSConditionalType,
  ): TSESTree.TSConditionalType {
    return this.#register(node, () => {
      const checkType = this.#TypeNode(node.checkType);
      const extendsType = this.#TypeNode(node.extendsType);
      const falseType = this.#TypeNode(node.falseType);
      const trueType = this.#TypeNode(node.trueType);

      return this.#createNode({
        type: Type.TSConditionalType,
        checkType,
        extendsType,
        falseType,
        trueType,
      }, node);
    });
  }
  TSFunctionType(node: Deno.lint.TSFunctionType): TSESTree.TSFunctionType {
    return this.#register(node, () => {
      const params = node.params.map(this.#Parameter.bind(this));
      const returnType = node.returnType &&
        this.TSTypeAnnotation(node.returnType);
      const typeParameters = node.typeParameters &&
        this.TSTypeParameterDeclaration(node.typeParameters);

      return this.#createNode({
        type: Type.TSFunctionType,
        params,
        returnType,
        typeParameters,
      }, node);
    });
  }
  TSImportType(node: Deno.lint.TSImportType): TSESTree.TSImportType {
    throw new Error();
    return this.#register(node, () => {
      const argument = this.#TypeNode(node.argument);
      const qualifier = node.qualifier && this.#EntityName(node.qualifier);
      const typeArguments = node.typeArguments &&
        this.TSTypeParameterInstantiation(node.typeArguments);

      return this.#createNode({
        type: Type.TSImportType,
        argument,
        qualifier,
        typeArguments,
      }, node);
    });
  }

  #EntityName(
    node:
      | Deno.lint.Identifier
      | Deno.lint.ThisExpression
      | Deno.lint.TSQualifiedName,
  ): TSESTree.EntityName {
    switch (node.type) {
      case "Identifier":
        return this.Identifier(node);
      case "ThisExpression":
        return this.ThisExpression(node);
      case "TSQualifiedName":
        return this.TSQualifiedName(node);
    }
  }

  TSIndexedAccessType(
    node: Deno.lint.TSIndexedAccessType,
  ): TSESTree.TSIndexedAccessType {
    return this.#register(node, () => {
      const indexType = this.#TypeNode(node.indexType);
      const objectType = this.#TypeNode(node.objectType);

      return this.#createNode({
        type: Type.TSIndexedAccessType,
        indexType,
        objectType,
      }, node);
    });
  }
  TSInferType(node: Deno.lint.TSInferType): TSESTree.TSInferType {
    return this.#register(node, () => {
      const typeParameter = this.TSTypeParameter(node.typeParameter);

      return this.#createNode({
        type: Type.TSInferType,
        typeParameter,
      }, node);
    });
  }

  TSIntersectionType(
    node: Deno.lint.TSIntersectionType,
  ): TSESTree.TSIntersectionType {
    return this.#register(node, () => {
      const types = node.types.map(this.#TypeNode.bind(this));

      return this.#createNode({
        type: Type.TSIntersectionType,
        types,
      }, node);
    });
  }
  TSIntrinsicKeyword(
    node: Deno.lint.TSIntrinsicKeyword,
  ): TSESTree.TSIntrinsicKeyword {
    return this.#register(node, () => {
      return this.#createNode({
        type: Type.TSIntrinsicKeyword,
      }, node);
    });
  }

  TSLiteralType(node: Deno.lint.TSLiteralType): TSESTree.TSLiteralType {
    return this.#register(node, () => {
      const literal = this.#Node(node.literal);

      if (literal.type === Type.Literal) {
        if ("regex" in literal) {
          throw new Error();
        }

        if (literal.value === null && !("bigint" in literal)) {
          throw new Error();
        }
      }

      if (literal.type === Type.UnaryExpression) {
        if (!(literal.operator === "+" || literal.operator === "-")) {
          throw new Error();
        }
      }
      if (literal.type === Type.UpdateExpression) throw new Error();

      return this.#createNode({
        type: Type.TSLiteralType,
        literal,
      }, node);
    });
  }
  TSMappedType(node: Deno.lint.TSMappedType): TSESTree.TSMappedType {
    return this.#register(node, () => {
      const constraint = this.#Node(node.constraint);
      const key = this.#Node(node.key);
      const nameType = node.nameType && this.#Node(node.nameType);
      const typeAnnotation = node.typeAnnotation &&
        this.#Node(node.typeAnnotation);

      return this.#createNode({
        type: Type.TSMappedType,
        constraint,
        key,
        nameType,
        typeAnnotation,
        optional: node.optional,
        readonly: node.readonly,
      }, node);
    });
  }
  TSNamedTupleMember(
    node: Deno.lint.TSNamedTupleMember,
  ): TSESTree.TSNamedTupleMember {
    throw new Error();
    return this.#register(node, () => {
      return this.#createNode({
        type: Type.TSNamedTupleMember,
      }, node);
    });
  }
  TSNeverKeyword(node: Deno.lint.TSNeverKeyword): TSESTree.TSNeverKeyword {
    return this.#register(node, () => {
      return this.#createNode({
        type: Type.TSNeverKeyword,
      }, node);
    });
  }
  TSNullKeyword(node: Deno.lint.TSNullKeyword): TSESTree.TSNullKeyword {
    return this.#register(node, () => {
      return this.#createNode({
        type: Type.TSNullKeyword,
      }, node);
    });
  }
  TSNumberKeyword(node: Deno.lint.TSNumberKeyword): TSESTree.TSNumberKeyword {
    return this.#register(node, () => {
      return this.#createNode({
        type: Type.TSNumberKeyword,
      }, node);
    });
  }
  TSObjectKeyword(node: Deno.lint.TSObjectKeyword): TSESTree.TSObjectKeyword {
    return this.#register(node, () => {
      return this.#createNode({
        type: Type.TSObjectKeyword,
      }, node);
    });
  }
  TSOptionalType(node: Deno.lint.TSOptionalType): TSESTree.TSOptionalType {
    return this.#register(node, () => {
      return this.#createNode({
        type: Type.TSOptionalType,
      }, node);
    });
  }
  TSQualifiedName(node: Deno.lint.TSQualifiedName): TSESTree.TSQualifiedName {
    return this.#register(node, () => {
      return this.#createNode({
        type: Type.TSQualifiedName,
      }, node);
    });
  }
  TSRestType(node: Deno.lint.TSRestType): TSESTree.TSRestType {
    throw new Error();
    return this.#register(node, () => {
      return this.#createNode({
        type: Type.TSRestType,
      }, node);
    });
  }
  TSStringKeyword(node: Deno.lint.TSStringKeyword): TSESTree.TSStringKeyword {
    return this.#register(node, () => {
      return this.#createNode({
        type: Type.TSStringKeyword,
      }, node);
    });
  }
  TSSymbolKeyword(node: Deno.lint.TSSymbolKeyword): TSESTree.TSSymbolKeyword {
    return this.#register(node, () => {
      return this.#createNode({
        type: Type.TSSymbolKeyword,
      }, node);
    });
  }
  TSTemplateLiteralType(
    node: Deno.lint.TSTemplateLiteralType,
  ): TSESTree.TSTemplateLiteralType {
    throw new Error();
    return this.#register(node, () => {
      return this.#createNode({
        type: Type.TSTemplateLiteralType,
      }, node);
    });
  }
  TSThisType(node: Deno.lint.TSThisType): TSESTree.TSThisType {
    return this.#register(node, () => {
      return this.#createNode({
        type: Type.TSThisType,
      }, node);
    });
  }
  TSTupleType(node: Deno.lint.TSTupleType): TSESTree.TSTupleType {
    throw new Error();
    return this.#register(node, () => {
      return this.#createNode({
        type: Type.TSTupleType,
      }, node);
    });
  }
  TSTypeLiteral(node: Deno.lint.TSTypeLiteral): TSESTree.TSTypeLiteral {
    return this.#register(node, () => {
      const members = node.members.map(this.#TypeElement.bind(this));

      return this.#createNode({
        type: Type.TSTypeLiteral,
        members,
      }, node);
    });
  }
  TSTypeOperator(node: Deno.lint.TSTypeOperator): TSESTree.TSTypeOperator {
    return this.#register(node, () => {
      const typeAnnotation = this.#Node(node.typeAnnotation);

      return this.#createNode({
        type: Type.TSTypeOperator,
        operator: node.operator,
        typeAnnotation,
      }, node);
    });
  }
  TSTypePredicate(node: Deno.lint.TSTypePredicate): TSESTree.TSTypePredicate {
    return this.#register(node, () => {
      const parameterName = map(node.parameterName, (node) => {
        switch (node.type) {
          case "Identifier":
            return this.Identifier(node);
          case "TSThisType":
            return this.TSThisType(node);
        }
      });

      if (!node.asserts) {
        if (!node.typeAnnotation) throw new Error("semantic error");

        const typeAnnotation = this.TSTypeAnnotation(node.typeAnnotation);

        return this.#createNode({
          type: Type.TSTypePredicate,
          asserts: node.asserts,
          typeAnnotation,
          parameterName,
        }, node);
      }

      const typeAnnotation = node.typeAnnotation &&
        this.TSTypeAnnotation(node.typeAnnotation);

      return this.#createNode({
        type: Type.TSTypePredicate,
        asserts: node.asserts,
        typeAnnotation: typeAnnotation ?? null,
        parameterName,
      }, node);
    });
  }
  TSTypeQuery(node: Deno.lint.TSTypeQuery): TSESTree.TSTypeQuery {
    throw new Error();
    return this.#register(node, () => {
      return this.#createNode({
        type: Type.TSTypeQuery,
      }, node);
    });
  }
  TSTypeReference(node: Deno.lint.TSTypeReference): TSESTree.TSTypeReference {
    return this.#register(node, () => {
      const typeArguments = node.typeArguments &&
        this.#Node(node.typeArguments);
      const typeName = this.#Node(node.typeName);

      return this.#createNode({
        type: Type.TSTypeReference,
        typeArguments,
        typeName,
      }, node);
    });
  }
  TSUndefinedKeyword(
    node: Deno.lint.TSUndefinedKeyword,
  ): TSESTree.TSUndefinedKeyword {
    return this.#register(node, () => {
      return this.#createNode({
        type: Type.TSUndefinedKeyword,
      }, node);
    });
  }
  TSUnionType(node: Deno.lint.TSUnionType): TSESTree.TSUnionType {
    return this.#register(node, () => {
      const types = node.types.map(this.#Node.bind(this));

      return this.#createNode({
        type: Type.TSUnionType,
        types,
      }, node);
    });
  }
  TSUnknownKeyword(
    node: Deno.lint.TSUnknownKeyword,
  ): TSESTree.TSUnknownKeyword {
    return this.#register(node, () => {
      return this.#createNode({
        type: Type.TSUnknownKeyword,
      }, node);
    });
  }
  TSVoidKeyword(node: Deno.lint.TSVoidKeyword): TSESTree.TSVoidKeyword {
    return this.#register(node, () => {
      return this.#createNode({
        type: Type.TSVoidKeyword,
      }, node);
    });
  }
  ImportSpecifier(node: Deno.lint.ImportSpecifier): TSESTree.ImportSpecifier {
    return this.#register(node, () => {
      const imported = this.#Node(node.imported);
      const local = this.Identifier(node.local);

      if (imported.type === Type.Literal) {
        if (typeof imported.value !== "string") {
          throw new Error();
        }
      }

      return this.#createNode({
        type: Type.ImportSpecifier,
        imported,
        local,
        importKind: node.importKind,
      }, node);
    });
  }
  ImportDefaultSpecifier(
    node: Deno.lint.ImportDefaultSpecifier,
  ): TSESTree.ImportDefaultSpecifier {
    return this.#register(node, () => {
      const local = this.Identifier(node.local);

      return this.#createNode({
        type: Type.ImportDefaultSpecifier,
        local,
      }, node);
    });
  }
  ImportNamespaceSpecifier(
    node: Deno.lint.ImportNamespaceSpecifier,
  ): TSESTree.ImportNamespaceSpecifier {
    return this.#register(node, () => {
      const local = this.Identifier(node.local);

      return this.#createNode({
        type: Type.ImportNamespaceSpecifier,
        local,
      }, node);
    });
  }
  ImportAttribute(node: Deno.lint.ImportAttribute): TSESTree.ImportAttribute {
    throw new Error();
    return this.#register(node, () => {
      const key = _toIdentifierOrLiteral(node.key, mapper);
      const value = this.Literal(node.value);

      return this.#createNode({
        type: Type.ImportAttribute,
        key,
        value,
      }, node);
    });
  }
  TSExternalModuleReference(
    node: Deno.lint.TSExternalModuleReference,
  ): TSESTree.TSExternalModuleReference {
    return this.#register(node, () => {
      const expression = this.#StringLiteral(node.expression);

      return this.#createNode({
        type: Type.TSExternalModuleReference,
        expression,
      }, node);
    });
  }

  ExportSpecifier(node: Deno.lint.ExportSpecifier): TSESTree.ExportSpecifier {
    throw new Error();
    return this.#register(node, () => {
      const exported = _toIdentifierOrLiteral(node.exported, mapper);
      const local = _toIdentifierOrLiteral(node.local, mapper);

      return this.#createNode({
        type: Type.ExportSpecifier,
        exported,
        local,
      }, node);
    });
  }
  VariableDeclarator(
    node: Deno.lint.VariableDeclarator,
  ): TSESTree.VariableDeclarator {
    return this.#register(node, () => {
      const init = node.init && this.#Node(node.init);
      const id = this.#Node(node.id);

      return this.#createNode({
        type: Type.VariableDeclarator,
        id,
        init,
      }, node);
    });
  }
  Decorator(node: Deno.lint.Decorator): TSESTree.Decorator {
    return this.#register(node, () => {
      const expression = this.#LeftHandSideExpression(node.expression);

      return this.#createNode({
        type: Type.Decorator,
        expression,
      }, node);
    });
  }

  #LeftHandSideExpression(
    node: Deno.lint.Decorator["expression"],
  ): TSESTree.LeftHandSideExpression {
    switch (node.type) {
      case "ArrayExpression":
        return this.ArrayExpression(node);
      case "ArrayPattern":
        return this.ArrayPattern(node);
      case "ArrowFunctionExpression":
        return this.ArrowFunctionExpression(node);
      case "CallExpression":
        return this.CallExpression(node);
      case "ClassExpression":
        return this.ClassExpression(node);
      case "FunctionExpression":
        return this.FunctionExpression(node);
      case "Identifier":
        return this.Identifier(node);
      case "JSXElement":
        return this.JSXElement(node);
      case "JSXFragment":
        return this.JSXFragment(node);
      case "Literal":
        return this.Literal(node);
      case "TemplateLiteral":
        return this.TemplateLiteral(node);
      case "MemberExpression":
        return this.MemberExpression(node);
      case "MetaProperty":
        return this.MetaProperty(node);
      case "ObjectExpression":
        return this.ObjectExpression(node);
      case "ObjectPattern":
        return this.ObjectPattern(node);
      case "SequenceExpression":
        return this.SequenceExpression(node);
      case "Super":
        return this.Super(node);
      case "TaggedTemplateExpression":
        return this.TaggedTemplateExpression(node);
      case "ThisExpression":
        return this.ThisExpression(node);
      case "TSAsExpression":
        return this.TSAsExpression(node);
      case "TSNonNullExpression":
        return this.TSNonNullExpression(node);
      case "TSTypeAssertion":
        return this.TSTypeAssertion(node);
    }
  }

  ClassBody(node: Deno.lint.ClassBody): TSESTree.ClassBody {
    return this.#register(node, () => {
      const body = node.body.map((child) => {
        switch (child.type) {
          case "AccessorProperty":
            return this.AccessorProperty(child);
          case "MethodDefinition":
            return this.MethodDefinition(child);
          case "PropertyDefinition":
            return this.PropertyDefinition(child);
          case "StaticBlock":
            return this.StaticBlock(child);
          case "TSAbstractMethodDefinition":
            return this.TSAbstractMethodDefinition(child);
          case "TSAbstractPropertyDefinition":
            return this.TSAbstractPropertyDefinition(child);
          case "TSIndexSignature":
            return this.TSIndexSignature(child);
        }
      });

      return this.#createNode({
        type: Type.ClassBody,
        body,
      }, node);
    });
  }
  StaticBlock(node: Deno.lint.StaticBlock): TSESTree.StaticBlock {
    return this.#register(node, () => {
      const body = node.body.map(this.#Statement.bind(this));

      return this.#createNode({
        type: Type.StaticBlock,
        body,
      }, node);
    });
  }
  PropertyDefinition(
    node: Deno.lint.PropertyDefinition,
  ): TSESTree.PropertyDefinition {
    throw new Error();
    return this.#register(node, () => {
      const key = map(node.key, (child) => {
        if (child.type === "PrivateIdentifier") {
          return this.PrivateIdentifier(child);
        }

        return this.#Expression(child);
      });

      return this.#createNode({
        type: Type.PropertyDefinition,
        computed: node.computed,
        key,
        static: node.static,
      }, node);
    });
  }
  MethodDefinition(
    node: Deno.lint.MethodDefinition,
  ): TSESTree.MethodDefinition {
    return this.#register(node, () => {
      const key = map(node.key, (child) => {
        if (child.type === "PrivateIdentifier") {
          return this.PrivateIdentifier(child);
        }

        return this.#Expression(child);
      });
      const value = map(node.value, (child) => {
        switch (child.type) {
          case "FunctionExpression":
            return this.FunctionExpression(child);
          case "TSEmptyBodyFunctionExpression":
            return this.TSEmptyBodyFunctionExpression(child);
        }
      });
      const decorators = node.decorators.map(this.Decorator.bind(this));

      return this.#createNode({
        type: Type.MethodDefinition,
        computed: node.computed,
        key,
        kind: node.kind,
        static: node.static,
        value,
        decorators,
      }, node);
    });
  }
  SwitchCase(node: Deno.lint.SwitchCase): TSESTree.SwitchCase {
    return this.#register(node, () => {
      const consequent = node.consequent.map(this.#Statement.bind(this));

      return this.#createNode({
        type: Type.SwitchCase,
        consequent,
      }, node);
    });
  }
  CatchClause(node: Deno.lint.CatchClause): TSESTree.CatchClause {
    return this.#register(node, () => {
      return this.#createNode({
        type: Type.CatchClause,
      }, node);
    });
  }
  TemplateElement(node: Deno.lint.TemplateElement): TSESTree.TemplateElement {
    return this.#register(node, () => {
      return this.#createNode({
        type: Type.TemplateElement,
        tail: node.tail,
        value: {
          cooked: node.cooked,
          raw: node.raw,
        },
      }, node);
    });
  }
  PrivateIdentifier(
    node: Deno.lint.PrivateIdentifier,
  ): TSESTree.PrivateIdentifier {
    return this.#register(node, () => {
      return this.#createNode({
        type: Type.PrivateIdentifier,
        name: node.name,
      }, node);
    });
  }
  AssignmentPattern(
    node: Deno.lint.AssignmentPattern,
  ): TSESTree.AssignmentPattern {
    return this.#register(node, () => {
      const left = node.left.type === "ArrayPattern"
        ? this.ArrayPattern(node.left)
        : node.left.type === "Identifier"
        ? this.Identifier(node.left)
        : this.ObjectPattern(node.left);
      const right = this.#Expression(node.right);

      return this.#createNode({
        type: Type.AssignmentPattern,
        left,
        right,
      }, node);
    });
  }
  RestElement(node: Deno.lint.RestElement): TSESTree.RestElement {
    return this.#register(node, () => {
      const argument = map(node.argument, (child) => {
        switch (child.type) {
          case "Identifier":
            return this.Identifier(child);
          case "ArrayPattern":
            return this.ArrayPattern(child);
          case "MemberExpression":
            return this.MemberExpression(child);
          case "ObjectPattern":
            return this.ObjectPattern(child);
          case "AssignmentPattern":
            return this.AssignmentPattern(child);
          case "RestElement":
            return this.RestElement(child);
        }
      });

      return this.#createNode({
        type: Type.RestElement,
        argument,
      }, node);
    });
  }
  SpreadElement(node: Deno.lint.SpreadElement): TSESTree.SpreadElement {
    return this.#register(node, () => {
      const argument = this.#Expression(node.argument);

      return this.#createNode({
        type: Type.SpreadElement,
        argument,
      }, node);
    });
  }
  Property(node: Deno.lint.Property): TSESTree.Property {
    return this.#register(node, () => {
      const key = this.#Expression(node.key);
      const value = map(node.value, (child) => {
        switch (child.type) {
          case "AssignmentPattern":
            return this.AssignmentPattern(child);
          case "TSEmptyBodyFunctionExpression":
            return this.TSEmptyBodyFunctionExpression(child);
          default:
            return this.#Expression(child);
        }
      });

      return this.#createNode({
        type: Type.Property,
        computed: node.computed,
        key,
        kind: node.kind,
        method: node.method,
        shorthand: node.shorthand,
        value,
      }, node);
    });
  }
  JSXIdentifier(node: Deno.lint.JSXIdentifier): TSESTree.JSXIdentifier {
    return this.#register(node, () => {
      return this.#createNode({
        type: Type.JSXIdentifier,
        name: node.name,
      }, node);
    });
  }
  JSXNamespacedName(
    node: Deno.lint.JSXNamespacedName,
  ): TSESTree.JSXNamespacedName {
    return this.#register(node, () => {
      const name = this.JSXIdentifier(node.name);
      const namespace = this.JSXIdentifier(node.namespace);

      return this.#createNode({
        type: Type.JSXNamespacedName,
        name,
        namespace,
      }, node);
    });
  }
  JSXEmptyExpression(
    node: Deno.lint.JSXEmptyExpression,
  ): TSESTree.JSXEmptyExpression {
    return this.#register(node, () => {
      return this.#createNode({
        type: Type.JSXEmptyExpression,
      }, node);
    });
  }
  JSXOpeningElement(
    node: Deno.lint.JSXOpeningElement,
  ): TSESTree.JSXOpeningElement {
    throw new Error();
    return this.#register(node, () => {
      const attributes = node.attributes.map((child) => {
        switch (child.type) {
          case "JSXAttribute":
            return this.JSXAttribute(child);
          case "JSXSpreadAttribute":
            return this.JSXSpreadAttribute(child);
        }
      });
      const typeArguments = node.typeArguments &&
        this.TSTypeParameterInstantiation(node.typeArguments);

      return this.#createNode({
        type: Type.JSXOpeningElement,
        attributes,
        selfClosing: node.selfClosing,
        typeArguments,
      }, node);
    });
  }
  JSXAttribute(node: Deno.lint.JSXAttribute): TSESTree.JSXAttribute {
    throw new Error();
    return this.#register(node, () => {
      return this.#createNode({
        type: Type.JSXAttribute,
      }, node);
    });
  }
  JSXSpreadAttribute(
    node: Deno.lint.JSXSpreadAttribute,
  ): TSESTree.JSXSpreadAttribute {
    throw new Error();
    return this.#register(node, () => {
      return this.#createNode({
        type: Type.JSXSpreadAttribute,
      }, node);
    });
  }
  JSXClosingElement(
    node: Deno.lint.JSXClosingElement,
  ): TSESTree.JSXClosingElement {
    throw new Error();
    return this.#register(node, () => {
      return this.#createNode({}, node);
    });
  }
  JSXOpeningFragment(
    node: Deno.lint.JSXOpeningFragment,
  ): TSESTree.JSXOpeningFragment {
    throw new Error();
    return this.#register(node, () => {
      return this.#createNode({}, node);
    });
  }
  JSXClosingFragment(
    node: Deno.lint.JSXClosingFragment,
  ): TSESTree.JSXClosingFragment {
    throw new Error();
    return this.#register(node, () => {
      return this.#createNode({}, node);
    });
  }
  JSXExpressionContainer(
    node: Deno.lint.JSXExpressionContainer,
  ): TSESTree.JSXExpressionContainer {
    throw new Error();
    return this.#register(node, () => {
      return this.#createNode({}, node);
    });
  }
  JSXText(node: Deno.lint.JSXText): TSESTree.JSXText {
    throw new Error();
    return this.#register(node, () => {
      return this.#createNode({}, node);
    });
  }
  JSXMemberExpression(
    node: Deno.lint.JSXMemberExpression,
  ): TSESTree.JSXMemberExpression {
    throw new Error();
    return this.#register(node, () => {
      return this.#createNode({}, node);
    });
  }

  TSModuleBlock(node: Deno.lint.TSModuleBlock): TSESTree.TSModuleBlock {
    throw new Error();
    return this.#register(node, () => {
      return this.#createNode({}, node);
    });
  }
  TSClassImplements(
    node: Deno.lint.TSClassImplements,
  ): TSESTree.TSClassImplements {
    return this.#register(node, () => {
      const expression = this.#Node(node.expression);
      const typeArguments = node.typeArguments &&
        this.#Node(node.typeArguments);

      return this.#createNode({
        type: Type.TSClassImplements,
        expression,
        typeArguments,
      }, node);
    });
  }
  TSAbstractMethodDefinition(
    node: Deno.lint.TSAbstractMethodDefinition,
  ): TSESTree.TSAbstractMethodDefinition {
    return this.#register(node, () => {
      const key = this.#Node(node.key);

      return this.#createNode({
        type: Type.TSAbstractMethodDefinition,
        kind: node.kind,
        decorators: [], // TODO
        optional: node.optional,
        override: node.override,
        static: node.static,
        accessibility: node.accessibility,
        computed: node.computed,
        key,
      }, node);
    });
  }
  TSAbstractPropertyDefinition(
    node: Deno.lint.TSAbstractPropertyDefinition,
  ): TSESTree.TSAbstractPropertyDefinition {
    throw new Error();
    return this.#register(node, () => {
      return this.#createNode({}, node);
    });
  }
  TSEmptyBodyFunctionExpression(
    node: Deno.lint.TSEmptyBodyFunctionExpression,
  ): TSESTree.TSEmptyBodyFunctionExpression {
    throw new Error();
    return this.#register(node, () => {
      return this.#createNode({}, node);
    });
  }
  TSCallSignatureDeclaration(
    node: Deno.lint.TSCallSignatureDeclaration,
  ): TSESTree.TSCallSignatureDeclaration {
    throw new Error();
    return this.#register(node, () => {
      return this.#createNode({}, node);
    });
  }
  TSPropertySignature(
    node: Deno.lint.TSPropertySignature,
  ): TSESTree.TSPropertySignature {
    return this.#register(node, () => {
      const typeAnnotation = node.typeAnnotation &&
        this.#Node(node.typeAnnotation);

      const base = {
        type: Type.TSPropertySignature as const,
        accessibility: undefined, // TODO,
        // computed: node.computed,
        optional: node.optional,
        readonly: node.readonly,
        static: node.static,
        typeAnnotation,
      };

      const key = this.#Node(node.key);

      if (node.computed) {
        return {
          ...base,
          computed: node.computed,
          key: node.key,
        };
      }

      if (!(key.type === Type.Identifier || key.type === Type.Literal)) {
        throw new Error("semnatic");
      }

      return {
        type: Type.TSPropertySignature,
        accessibility: undefined, // TODO,
        optional: node.optional,
        readonly: node.readonly,
        static: node.static,
        typeAnnotation,
        computed: node.computed,
        key,
      };
    });
  }

  #C<T extends Deno.lint.Node>(node: T): NodeMap[T["type"]] {}

  TSEnumBody(node: Deno.lint.TSEnumBody): TSESTree.TSEnumBody {
    return this.#register(node, () => {
      const members = node.members.map(this.TSEnumMember.bind(this));

      return this.#createNode({
        type: Type.TSEnumBody,
        members,
      }, node);
    });
  }
  TSEnumMember(node: Deno.lint.TSEnumMember): TSESTree.TSEnumMember {
    return this.#register(node, () => {
      const id = map(node.id, (node) => {
        switch (node.type) {
          case "Identifier":
            return this.Identifier(node);
          case "Literal": {
            return this.#StringOrNumberLiteral(node);
          }
        }
      });
      const initializer = node.initializer &&
        this.#Expression(node.initializer);

      return this.#createNode({
        type: Type.TSEnumMember,
        id,
        initializer,
        computed: false,
      }, node);
    });
  }

  #StringOrNumberLiteral(
    node: Deno.lint.StringLiteral | Deno.lint.NumberLiteral,
  ): TSESTree.StringLiteral {
    if (typeof node.value === "number") {
      // Narrowing is not work.
      return this.#StringifyLiteral(node as Deno.lint.NumberLiteral);
    }

    return this.#StringLiteral(node as Deno.lint.StringLiteral);
  }

  #StringifyLiteral(
    node: Deno.lint.NumberLiteral,
  ): TSESTree.StringLiteral {
    return this.#register(node, () => {
      return this.#createNode({
        type: Type.Literal,
        raw: node.raw,
        value: node.value.toString(),
      }, node);
    });
  }

  TSTypeParameterInstantiation(
    node: Deno.lint.TSTypeParameterInstantiation,
  ): TSESTree.TSTypeParameterInstantiation {
    return this.#register(node, () => {
      const params = node.params.map(this.#Node.bind(this));

      return this.#createNode({
        type: Type.TSTypeParameterInstantiation,
        params,
      }, node);
    });
  }

  TSInterfaceBody(node: Deno.lint.TSInterfaceBody): TSESTree.TSInterfaceBody {
    return this.#register(node, () => {
      const body = node.body.map(this.#Node.bind(this));

      return this.#createNode({
        type: Type.TSInterfaceBody,
        body,
      }, node);
    });
  }

  #TypeElement(
    node: Deno.lint.TSInterfaceBody["body"][number],
  ): TSESTree.TypeElement {
    switch (node.type) {
      case "TSCallSignatureDeclaration":
        return this.TSCallSignatureDeclaration(node);
      case "TSConstructSignatureDeclaration":
        return this.TSConstructSignatureDeclaration(node);
      case "TSIndexSignature":
        return this.TSIndexSignature(node);
      case "TSMethodSignature":
        return this.TSMethodSignature(node);
      case "TSPropertySignature":
        return this.TSPropertySignature(node);
    }
  }

  TSConstructSignatureDeclaration(
    node: Deno.lint.TSConstructSignatureDeclaration,
  ): TSESTree.TSConstructSignatureDeclaration {
    return this.#register(node, () => {
      const params = node.params.map(this.#Parameter.bind(this));
      const returnType = this.TSTypeAnnotation(node.returnType);
      const typeParameters = node.typeParameters &&
        this.TSTypeParameterDeclaration(node.typeParameters);

      return this.#createNode({
        type: Type.TSConstructSignatureDeclaration,
        params,
        returnType,
        typeParameters,
      }, node);
    });
  }
  TSMethodSignature(
    node: Deno.lint.TSMethodSignature,
  ): TSESTree.TSMethodSignature {
    return this.#register(node, () => {
      const params = node.params.map(this.#Parameter.bind(this));
      const returnType = node.returnType &&
        this.TSTypeAnnotation(node.returnType);
      const typeParameters = node.typeParameters &&
        this.TSTypeParameterDeclaration(node.typeParameters);
      const key = this.#Node(node.key);

      return this.#createNode({
        type: Type.TSMethodSignature,
        kind: node.kind,
        params,
        returnType,
        typeParameters,
        accessibility: undefined, // TODO
        optional: node.optional,
        readonly: node.readonly,
        static: node.static,
        computed: node.computed,
        key,
      }, node);
    });
  }
  TSInterfaceHeritage(
    node: Deno.lint.TSInterfaceHeritage,
  ): TSESTree.TSInterfaceHeritage {
    return this.#register(node, () => {
      const expression = this.#Node(node.expression);
      const typeArguments = node.typeArguments &&
        this.TSTypeParameterInstantiation(node.typeArguments);

      return this.#createNode({
        type: Type.TSInterfaceHeritage,
        expression,
        typeArguments,
      }, node);
    });
  }

  TSIndexSignature(
    node: Deno.lint.TSIndexSignature,
  ): TSESTree.TSIndexSignature {
    return this.#register(node, () => {
      const parameters = node.parameters.map(this.#Parameter.bind(this));

      return this.#createNode({
        type: Type.TSIndexSignature,
        parameters,
        readonly: node.readonly,
        static: node.static,
      }, node);
    });
  }

  TSTypeAnnotation(
    node: Deno.lint.TSTypeAnnotation,
  ): TSESTree.TSTypeAnnotation {
    return this.#register(node, () => {
      const typeAnnotation = this.#Node(node.typeAnnotation);

      return this.#createNode({
        type: Type.TSTypeAnnotation,
        typeAnnotation,
      }, node);
    });
  }

  TSTypeParameterDeclaration(
    node: Deno.lint.TSTypeParameterDeclaration,
  ): TSESTree.TSTypeParameterDeclaration {
    return this.#register(node, () => {
      const params = node.params.map(this.TSTypeParameter.bind(this));

      return this.#createNode({
        type: Type.TSTypeParameterDeclaration,
        params,
      }, node);
    });
  }

  TSTypeParameter(node: Deno.lint.TSTypeParameter): TSESTree.TSTypeParameter {
    return this.#register(node, () => {
      const constraint = node.constraint && this.#Node(node.constraint);
      const $default = node.default && this.#Node(node.default);
      const name = this.Identifier(node.name);

      return this.#createNode({
        type: Type.TSTypeParameter,
        const: node.const,
        constraint: constraint ?? undefined,
        default: $default ?? undefined,
        in: node.in,
        name,
        out: node.out,
      }, node);
    });
  }

  TSParameterProperty(
    node: Deno.lint.TSParameterProperty,
  ): TSESTree.TSParameterProperty {
    return this.#register(node, () => {
      const parameter = this.#ParameterPropertyParameter(node.parameter);

      return {
        type: Type.TSParameterProperty,
        parameter,
      };
    });
  }

  #ParameterPropertyParameter(
    node: Deno.lint.Parameter,
  ): TSESTree.TSParameterProperty["parameter"] {
    switch (node.type) {
      case "AssignmentPattern":
        return this.AssignmentPattern(node);
      case "ArrayPattern":
        return this.ArrayPattern(node);
      case "ObjectPattern":
        return this.ObjectPattern(node);
      case "Identifier":
        return this.Identifier(node);
      case "RestElement":
        return this.RestElement(node);
      case "TSParameterProperty":
        return this.TSParameterProperty(node);
    }
  }

  Line(node: Deno.lint.LineComment): TSESTree.LineComment {
    return {
      type: Token.Line,
      value: node.value,
    };
  }

  Block(node: Deno.lint.BlockComment): TSESTree.BlockComment {
    return {
      type: Token.Block,
      value: node.value,
    };
  }
  #Comment(
    node: Deno.lint.LineComment | Deno.lint.BlockComment,
  ): TSESTree.Comment {
    switch (node.type) {
      case "Line":
        return this.Line(node);
      case "Block":
        return this.Block(node);
    }
  }

  #Node<T extends Deno.lint.Node>(node: T): NodeMap[T["type"]] {
    switch (node.type) {
      case "Program":
        return this.Program(node);
      case "ArrayExpression":
        return this.ArrayExpression(node);
      case "ArrayPattern":
        return this.ArrayPattern(node);
      case "ArrowFunctionExpression":
        return this.ArrowFunctionExpression(node);
      case "AssignmentExpression":
        return this.AssignmentExpression(node);
      case "AwaitExpression":
        return this.AwaitExpression(node);
      case "BinaryExpression":
        return this.BinaryExpression(node);
      case "CallExpression":
        return this.CallExpression(node);
      case "ChainExpression":
        return this.ChainExpression(node);
      case "ClassExpression":
        return this.ClassExpression(node);
      case "ConditionalExpression":
        return this.ConditionalExpression(node);
      case "FunctionExpression":
        return this.FunctionExpression(node);
      case "Identifier":
        return this.Identifier(node);
      case "ImportExpression":
        return this.ImportExpression(node);
      case "JSXElement":
        return this.JSXElement(node);
      case "JSXFragment":
        return this.JSXFragment(node);
      case "Literal":
        return this.Literal(node);
      case "TemplateLiteral":
        return this.TemplateLiteral(node);
      case "LogicalExpression":
        return this.LogicalExpression(node);
      case "MemberExpression":
        return this.MemberExpression(node);
      case "MetaProperty":
        return this.MetaProperty(node);
      case "NewExpression":
        return this.NewExpression(node);
      case "ObjectExpression":
        return this.ObjectExpression(node);
      case "ObjectPattern":
        return this.ObjectPattern(node);
      case "SequenceExpression":
        return this.SequenceExpression(node);
      case "Super":
        return this.Super(node);
      case "TaggedTemplateExpression":
        return this.TaggedTemplateExpression(node);
      case "ThisExpression":
        return this.ThisExpression(node);
      case "TSAsExpression":
        return this.TSAsExpression(node);
      case "TSInstantiationExpression":
        return this.TSInstantiationExpression(node);
      case "TSNonNullExpression":
        return this.TSNonNullExpression(node);
      case "TSSatisfiesExpression":
        return this.TSSatisfiesExpression(node);
      case "TSTypeAssertion":
        return this.TSTypeAssertion(node);
      case "UnaryExpression":
        return this.UnaryExpression(node);
      case "UpdateExpression":
        return this.UpdateExpression(node);
      case "YieldExpression":
        return this.YieldExpression(node);
      case "BlockStatement":
        return this.BlockStatement(node);
      case "BreakStatement":
        return this.BreakStatement(node);
      case "ClassDeclaration":
        return this.ClassDeclaration(node);
      case "ContinueStatement":
        return this.ContinueStatement(node);
      case "DebuggerStatement":
        return this.DebuggerStatement(node);
      case "DoWhileStatement":
        return this.DoWhileStatement(node);
      case "ExportAllDeclaration":
        return this.ExportAllDeclaration(node);
      case "ExportDefaultDeclaration":
        return this.ExportDefaultDeclaration(node);
      case "ExportNamedDeclaration":
        return this.ExportNamedDeclaration(node);
      case "ExpressionStatement":
        return this.ExpressionStatement(node);
      case "ForInStatement":
        return this.ForInStatement(node);
      case "ForOfStatement":
        return this.ForOfStatement(node);
      case "ForStatement":
        return this.ForStatement(node);
      case "FunctionDeclaration":
        return this.FunctionDeclaration(node);
      case "IfStatement":
        return this.IfStatement(node);
      case "ImportDeclaration":
        return this.ImportDeclaration(node);
      case "LabeledStatement":
        return this.LabeledStatement(node);
      case "ReturnStatement":
        return this.ReturnStatement(node);
      case "SwitchStatement":
        return this.SwitchStatement(node);
      case "ThrowStatement":
        return this.ThrowStatement(node);
      case "TryStatement":
        return this.TryStatement(node);
      case "TSDeclareFunction":
        return this.TSDeclareFunction(node);
      case "TSEnumDeclaration":
        return this.TSEnumDeclaration(node);
      case "TSExportAssignment":
        return this.TSExportAssignment(node);
      case "TSImportEqualsDeclaration":
        return this.TSImportEqualsDeclaration(node);
      case "TSInterfaceDeclaration":
        return this.TSInterfaceDeclaration(node);
      case "TSModuleDeclaration":
        return this.TSModuleDeclaration(node);
      case "TSNamespaceExportDeclaration":
        return this.TSNamespaceExportDeclaration(node);
      case "TSTypeAliasDeclaration":
        return this.TSTypeAliasDeclaration(node);
      case "VariableDeclaration":
        return this.VariableDeclaration(node);
      case "WhileStatement":
        return this.WhileStatement(node);
      case "WithStatement":
        return this.WithStatement(node);
      case "TSAnyKeyword":
        return this.TSAnyKeyword(node);
      case "TSArrayType":
        return this.TSArrayType(node);
      case "TSBigIntKeyword":
        return this.TSBigIntKeyword(node);
      case "TSBooleanKeyword":
        return this.TSBooleanKeyword(node);
      case "TSConditionalType":
        return this.TSConditionalType(node);
      case "TSFunctionType":
        return this.TSFunctionType(node);
      case "TSImportType":
        return this.TSImportType(node);
      case "TSIndexedAccessType":
        return this.TSIndexedAccessType(node);
      case "TSInferType":
        return this.TSInferType(node);
      case "TSIntersectionType":
        return this.TSIntersectionType(node);
      case "TSIntrinsicKeyword":
        return this.TSIntrinsicKeyword(node);
      case "TSLiteralType":
        return this.TSLiteralType(node);
      case "TSMappedType":
        return this.TSMappedType(node);
      case "TSNamedTupleMember":
        return this.TSNamedTupleMember(node);
      case "TSNeverKeyword":
        return this.TSNeverKeyword(node);
      case "TSNullKeyword":
        return this.TSNullKeyword(node);
      case "TSNumberKeyword":
        return this.TSNumberKeyword(node);
      case "TSObjectKeyword":
        return this.TSObjectKeyword(node);
      case "TSOptionalType":
        return this.TSOptionalType(node);
      case "TSQualifiedName":
        return this.TSQualifiedName(node);
      case "TSRestType":
        return this.TSRestType(node);
      case "TSStringKeyword":
        return this.TSStringKeyword(node);
      case "TSSymbolKeyword":
        return this.TSSymbolKeyword(node);
      case "TSTemplateLiteralType":
        return this.TSTemplateLiteralType(node);
      case "TSThisType":
        return this.TSThisType(node);
      case "TSTupleType":
        return this.TSTupleType(node);
      case "TSTypeLiteral":
        return this.TSTypeLiteral(node);
      case "TSTypeOperator":
        return this.TSTypeOperator(node);
      case "TSTypePredicate":
        return this.TSTypePredicate(node);
      case "TSTypeQuery":
        return this.TSTypeQuery(node);
      case "TSTypeReference":
        return this.TSTypeReference(node);
      case "TSUndefinedKeyword":
        return this.TSUndefinedKeyword(node);
      case "TSUnionType":
        return this.TSUnionType(node);
      case "TSUnknownKeyword":
        return this.TSUnknownKeyword(node);
      case "TSVoidKeyword":
        return this.TSVoidKeyword(node);
      case "ImportSpecifier":
        return this.ImportSpecifier(node);
      case "ImportDefaultSpecifier":
        return this.ImportDefaultSpecifier(node);
      case "ImportNamespaceSpecifier":
        return this.ImportNamespaceSpecifier(node);
      case "ImportAttribute":
        return this.ImportAttribute(node);
      case "TSExternalModuleReference":
        return this.TSExternalModuleReference(node);
      case "ExportSpecifier":
        return this.ExportSpecifier(node);
      case "VariableDeclarator":
        return this.VariableDeclarator(node);
      case "Decorator":
        return this.Decorator(node);
      case "ClassBody":
        return this.ClassBody(node);
      case "StaticBlock":
        return this.StaticBlock(node);
      case "PropertyDefinition":
        return this.PropertyDefinition(node);
      case "MethodDefinition":
        return this.MethodDefinition(node);
      case "SwitchCase":
        return this.SwitchCase(node);
      case "CatchClause":
        return this.CatchClause(node);
      case "TemplateElement":
        return this.TemplateElement(node);
      case "PrivateIdentifier":
        return this.PrivateIdentifier(node);
      case "AssignmentPattern":
        return this.AssignmentPattern(node);
      case "RestElement":
        return this.RestElement(node);
      case "SpreadElement":
        return this.SpreadElement(node);
      case "Property":
        return this.Property(node);
      case "JSXIdentifier":
        return this.JSXIdentifier(node);
      case "JSXNamespacedName":
        return this.JSXNamespacedName(node);
      case "JSXEmptyExpression":
        return this.JSXEmptyExpression(node);
      case "JSXOpeningElement":
        return this.JSXOpeningElement(node);
      case "JSXAttribute":
        return this.JSXAttribute(node);
      case "JSXSpreadAttribute":
        return this.JSXSpreadAttribute(node);
      case "JSXClosingElement":
        return this.JSXClosingElement(node);
      case "JSXOpeningFragment":
        return this.JSXOpeningFragment(node);
      case "JSXClosingFragment":
        return this.JSXClosingFragment(node);
      case "JSXExpressionContainer":
        return this.JSXExpressionContainer(node);
      case "JSXText":
        return this.JSXText(node);
      case "JSXMemberExpression":
        return this.JSXMemberExpression(node);
      case "TSModuleBlock":
        return this.TSModuleBlock(node);
      case "TSClassImplements":
        return this.TSClassImplements(node);
      case "TSAbstractMethodDefinition":
        return this.TSAbstractMethodDefinition(node);
      case "TSAbstractPropertyDefinition":
        return this.TSAbstractPropertyDefinition(node);
      case "TSEmptyBodyFunctionExpression":
        return this.TSEmptyBodyFunctionExpression(node);
      case "TSCallSignatureDeclaration":
        return this.TSCallSignatureDeclaration(node);
      case "TSPropertySignature":
        return this.TSPropertySignature(node);
      case "TSEnumBody":
        return this.TSEnumBody(node);
      case "TSEnumMember":
        return this.TSEnumMember(node);
      case "TSTypeParameterInstantiation":
        return this.TSTypeParameterInstantiation(node);
      case "TSInterfaceBody":
        return this.TSInterfaceBody(node);
      case "TSConstructSignatureDeclaration":
        return this.TSConstructSignatureDeclaration(node);
      case "TSMethodSignature":
        return this.TSMethodSignature(node);
      case "TSInterfaceHeritage":
        return this.TSInterfaceHeritage(node);
      case "TSIndexSignature":
        return this.TSIndexSignature(node);
      case "TSTypeAnnotation":
        return this.TSTypeAnnotation(node);
      case "TSTypeParameterDeclaration":
        return this.TSTypeParameterDeclaration(node);
      case "TSTypeParameter":
        return this.TSTypeParameter(node);
      case "Line":
        return this.Line(node);
      case "Block":
        return this.Block(node);
    }
  }

  #Statement(node: Deno.lint.Statement): TSESTree.Statement {
    switch (node.type) {
      case "BlockStatement":
        return this.BlockStatement(node);
      case "BreakStatement":
        return this.BreakStatement(node);
      case "ClassDeclaration":
        return this.ClassDeclaration(node);
      case "ContinueStatement":
        return this.ContinueStatement(node);
      case "DebuggerStatement":
        return this.DebuggerStatement(node);
      case "DoWhileStatement":
        return this.DoWhileStatement(node);
      case "ExportAllDeclaration":
        return this.ExportAllDeclaration(node);
      case "ExportDefaultDeclaration":
        return this.ExportDefaultDeclaration(node);
      case "ExportNamedDeclaration":
        return this.ExportNamedDeclaration(node);
      case "ExpressionStatement":
        return this.ExpressionStatement(node);
      case "ForInStatement":
        return this.ForInStatement(node);
      case "ForOfStatement":
        return this.ForOfStatement(node);
      case "ForStatement":
        return this.ForStatement(node);
      case "FunctionDeclaration":
        return this.FunctionDeclaration(node);
      case "IfStatement":
        return this.IfStatement(node);
      case "ImportDeclaration":
        return this.ImportDeclaration(node);
      case "LabeledStatement":
        return this.LabeledStatement(node);
      case "ReturnStatement":
        return this.ReturnStatement(node);
      case "SwitchStatement":
        return this.SwitchStatement(node);
      case "ThrowStatement":
        return this.ThrowStatement(node);
      case "TryStatement":
        return this.TryStatement(node);
      case "TSDeclareFunction":
        return this.TSDeclareFunction(node);
      case "TSEnumDeclaration":
        return this.TSEnumDeclaration(node);
      case "TSExportAssignment":
        return this.TSExportAssignment(node);
      case "TSImportEqualsDeclaration":
        return this.TSImportEqualsDeclaration(node);
      case "TSInterfaceDeclaration":
        return this.TSInterfaceDeclaration(node);
      case "TSModuleDeclaration":
        return this.TSModuleDeclaration(node);
      case "TSNamespaceExportDeclaration":
        return this.TSNamespaceExportDeclaration(node);
      case "TSTypeAliasDeclaration":
        return this.TSTypeAliasDeclaration(node);
      case "VariableDeclaration":
        return this.VariableDeclaration(node);
      case "WhileStatement":
        return this.WhileStatement(node);
      case "WithStatement":
        return this.WithStatement(node);
    }
  }

  #Expression(node: Deno.lint.Expression): TSESTree.Expression {
    switch (node.type) {
      case "ArrayExpression":
        return this.ArrayExpression(node);
      case "ArrayPattern":
        return this.ArrayPattern(node);
      case "ArrowFunctionExpression":
        return this.ArrowFunctionExpression(node);
      case "AssignmentExpression":
        return this.AssignmentExpression(node);
      case "AwaitExpression":
        return this.AwaitExpression(node);
      case "BinaryExpression":
        return this.BinaryExpression(node);
      case "CallExpression":
        return this.CallExpression(node);
      case "ChainExpression":
        return this.ChainExpression(node);
      case "ClassExpression":
        return this.ClassExpression(node);
      case "ConditionalExpression":
        return this.ConditionalExpression(node);
      case "FunctionExpression":
        return this.FunctionExpression(node);
      case "Identifier":
        return this.Identifier(node);
      case "ImportExpression":
        return this.ImportExpression(node);
      case "JSXElement":
        return this.JSXElement(node);
      case "JSXFragment":
        return this.JSXFragment(node);
      case "Literal":
        return this.Literal(node);
      case "TemplateLiteral":
        return this.TemplateLiteral(node);
      case "LogicalExpression":
        return this.LogicalExpression(node);
      case "MemberExpression":
        return this.MemberExpression(node);
      case "MetaProperty":
        return this.MetaProperty(node);
      case "NewExpression":
        return this.NewExpression(node);
      case "ObjectExpression":
        return this.ObjectExpression(node);
      case "ObjectPattern":
        return this.ObjectPattern(node);
      case "SequenceExpression":
        return this.SequenceExpression(node);
      case "Super":
        return this.Super(node);
      case "TaggedTemplateExpression":
        return this.TaggedTemplateExpression(node);
      case "ThisExpression":
        return this.ThisExpression(node);
      case "TSAsExpression":
        return this.TSAsExpression(node);
      case "TSInstantiationExpression":
        return this.TSInstantiationExpression(node);
      case "TSNonNullExpression":
        return this.TSNonNullExpression(node);
      case "TSSatisfiesExpression":
        return this.TSSatisfiesExpression(node);
      case "TSTypeAssertion":
        return this.TSTypeAssertion(node);
      case "UnaryExpression":
        return this.UnaryExpression(node);
      case "UpdateExpression":
        return this.UpdateExpression(node);
      case "YieldExpression":
        return this.YieldExpression(node);
    }
  }

  #TypeNode(node: Deno.lint.TypeNode): TSESTree.TypeNode {
    switch (node.type) {
      case "TSAnyKeyword":
        return this.TSAnyKeyword(node);
      case "TSArrayType":
        return this.TSArrayType(node);
      case "TSBigIntKeyword":
        return this.TSBigIntKeyword(node);
      case "TSBooleanKeyword":
        return this.TSBooleanKeyword(node);
      case "TSConditionalType":
        return this.TSConditionalType(node);
      case "TSFunctionType":
        return this.TSFunctionType(node);
      case "TSImportType":
        return this.TSImportType(node);
      case "TSIndexedAccessType":
        return this.TSIndexedAccessType(node);
      case "TSInferType":
        return this.TSInferType(node);
      case "TSIntersectionType":
        return this.TSIntersectionType(node);
      case "TSIntrinsicKeyword":
        return this.TSIntrinsicKeyword(node);
      case "TSLiteralType":
        return this.TSLiteralType(node);
      case "TSMappedType":
        return this.TSMappedType(node);
      case "TSNamedTupleMember":
        return this.TSNamedTupleMember(node);
      case "TSNeverKeyword":
        return this.TSNeverKeyword(node);
      case "TSNullKeyword":
        return this.TSNullKeyword(node);
      case "TSNumberKeyword":
        return this.TSNumberKeyword(node);
      case "TSObjectKeyword":
        return this.TSObjectKeyword(node);
      case "TSOptionalType":
        return this.TSOptionalType(node);
      case "TSQualifiedName":
        return this.TSQualifiedName(node);
      case "TSRestType":
        return this.TSRestType(node);
      case "TSStringKeyword":
        return this.TSStringKeyword(node);
      case "TSSymbolKeyword":
        return this.TSSymbolKeyword(node);
      case "TSTemplateLiteralType":
        return this.TSTemplateLiteralType(node);
      case "TSThisType":
        return this.TSThisType(node);
      case "TSTupleType":
        return this.TSTupleType(node);
      case "TSTypeLiteral":
        return this.TSTypeLiteral(node);
      case "TSTypeOperator":
        return this.TSTypeOperator(node);
      case "TSTypePredicate":
        return this.TSTypePredicate(node);
      case "TSTypeQuery":
        return this.TSTypeQuery(node);
      case "TSTypeReference":
        return this.TSTypeReference(node);
      case "TSUndefinedKeyword":
        return this.TSUndefinedKeyword(node);
      case "TSUnionType":
        return this.TSUnionType(node);
      case "TSUnknownKeyword":
        return this.TSUnknownKeyword(node);
      case "TSVoidKeyword":
        return this.TSVoidKeyword(node);
    }
  }

  #DefaultExportDeclaration(
    node: Deno.lint.ExportDefaultDeclaration["declaration"],
  ): TSESTree.DefaultExportDeclarations {
    switch (node.type) {
      case "ClassDeclaration":
        return this.ClassDeclaration(node);
      case "ArrayExpression":
        return this.ArrayExpression(node);
      case "ArrayPattern":
        return this.ArrayPattern(node);
      case "ArrowFunctionExpression":
        return this.ArrowFunctionExpression(node);
      case "AssignmentExpression":
        return this.AssignmentExpression(node);
      case "AwaitExpression":
        return this.AwaitExpression(node);
      case "BinaryExpression":
        return this.BinaryExpression(node);
      case "CallExpression":
        return this.CallExpression(node);
      case "ChainExpression":
        return this.ChainExpression(node);
      case "ClassExpression":
        return this.ClassExpression(node);
      case "ConditionalExpression":
        return this.ConditionalExpression(node);
      case "FunctionExpression":
        return this.FunctionExpression(node);
      case "Identifier":
        return this.Identifier(node);
      case "ImportExpression":
        return this.ImportExpression(node);
      case "JSXElement":
        return this.JSXElement(node);
      case "JSXFragment":
        return this.JSXFragment(node);
      case "Literal":
        return this.Literal(node);
      case "TemplateLiteral":
        return this.TemplateLiteral(node);
      case "LogicalExpression":
        return this.LogicalExpression(node);
      case "MemberExpression":
        return this.MemberExpression(node);
      case "MetaProperty":
        return this.MetaProperty(node);
      case "NewExpression":
        return this.NewExpression(node);
      case "ObjectExpression":
        return this.ObjectExpression(node);
      case "ObjectPattern":
        return this.ObjectPattern(node);
      case "SequenceExpression":
        return this.SequenceExpression(node);
      case "Super":
        return this.Super(node);
      case "TaggedTemplateExpression":
        return this.TaggedTemplateExpression(node);
      case "ThisExpression":
        return this.ThisExpression(node);
      case "TSAsExpression":
        return this.TSAsExpression(node);
      case "TSInstantiationExpression":
        return this.TSInstantiationExpression(node);
      case "TSNonNullExpression":
        return this.TSNonNullExpression(node);
      case "TSSatisfiesExpression":
        return this.TSSatisfiesExpression(node);
      case "TSTypeAssertion":
        return this.TSTypeAssertion(node);
      case "UnaryExpression":
        return this.UnaryExpression(node);
      case "UpdateExpression":
        return this.UpdateExpression(node);
      case "YieldExpression":
        return this.YieldExpression(node);
      case "FunctionDeclaration":
        return this.FunctionDeclaration(node);
      case "TSDeclareFunction":
        return this.TSDeclareFunction(node);
      case "TSEnumDeclaration":
        return this.TSEnumDeclaration(node);
      case "TSInterfaceDeclaration":
        return this.TSInterfaceDeclaration(node);
      case "TSModuleDeclaration":
        return this.TSModuleDeclaration(node);
      case "TSTypeAliasDeclaration":
        return this.TSTypeAliasDeclaration(node);
      case "VariableDeclaration":
        return this.VariableDeclaration(node);
    }
  }
}

function map<T, U>(value: T, mapper: (value: T) => U) {
  return mapper(value);
}

type WithoutComment = Exclude<
  Deno.lint.Node,
  Deno.lint.LineComment | Deno.lint.BlockComment
>;

type NodeMap =
  & { [k in WithoutComment["type"]]: Extract<TSESTree.Node, { type: k }> }
  & { Line: TSESTree.LineComment; Block: TSESTree.BlockComment };
