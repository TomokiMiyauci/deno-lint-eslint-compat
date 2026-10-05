import { AST_NODE_TYPES as Type, TSESTree } from "@typescript-eslint/types";

type ExcludeBase<T> = Omit<T, keyof TSESTree.BaseNode>;

export { TSESTree } from "@typescript-eslint/types";

const definition = {
  Program: (
    node: Deno.lint.Program,
    context,
  ): ExcludeBase<TSESTree.Program> => {
    const body = node.body.map(context.toNode);
    const comments = node.comments.map(context.toNode);

    return {
      body,
      sourceType: node.sourceType,
      comments,
      tokens: undefined,
    };
  },

  ArrayExpression: (
    node: Deno.lint.ArrayExpression,
    context,
  ): ExcludeBase<TSESTree.ArrayExpression> => {
    const elements = node.elements.map(context.toNode);

    return { elements };
  },

  AccessorProperty: (
    node: Deno.lint.AccessorProperty,
    context,
  ): ExcludeBase<TSESTree.AccessorProperty> => {
    const value = node.value && context.toNode(node.value);
    const key = context.toNode(node.key);
    const decorators = node.decorators.map(context.toNode);

    return {
      declare: node.declare,
      computed: node.computed,
      optional: node.optional,
      override: node.override,
      readonly: node.readonly,
      static: node.static,
      value,
      key,
      decorators,
      typeAnnotation: undefined, // TODO
      accessibility: node.accessibility,
    };
  },

  ArrayPattern: (
    node: Deno.lint.ArrayPattern,
    context,
  ): ExcludeBase<TSESTree.ArrayPattern> => {
    const elements = node.elements.map((node) => {
      if (node === null) return null;
      return context.toNode(node);
    });
    const typeAnnotation = node.typeAnnotation &&
      context.toNode(node.typeAnnotation);

    return {
      elements,
      optional: node.optional,
      typeAnnotation,
      decorators: [], // TODo
    };
  },

  ArrowFunctionExpression: (
    node: Deno.lint.ArrowFunctionExpression,
    context,
  ): ExcludeBase<TSESTree.ArrowFunctionExpression> => {
    if (node.generator) {
      throw new Error();
    }

    const params = node.params.map(context.toNode);
    const returnType = node.returnType &&
      context.toNode(node.returnType);
    const typeParameters = node.typeParameters &&
      context.toNode(node.typeParameters);

    if (node.body.type === "BlockStatement") {
      const body = context.toNode(node.body);

      return {
        async: node.async,
        body,
        id: node.id,
        expression: false,
        generator: node.generator,
        params,
        returnType,
        typeParameters,
      };
    }

    const body = context.toNode(node.body);

    return {
      expression: true,
      generator: node.generator,
      body,
      async: node.async,
      id: node.id,
      params,
      returnType,
      typeParameters,
    };
  },

  AssignmentExpression: (
    node: Deno.lint.AssignmentExpression,
    context,
  ): ExcludeBase<TSESTree.AssignmentExpression> => {
    const left = context.toNode(node.left);
    const right = context.toNode(node.right);

    return {
      left,
      operator: node.operator,
      right,
    };
  },

  AwaitExpression: (
    node: Deno.lint.AwaitExpression,
    context,
  ): ExcludeBase<TSESTree.AwaitExpression> => {
    const argument = context.toNode(node.argument);

    return { argument };
  },

  BinaryExpression: (
    node: Deno.lint.BinaryExpression,
    context,
  ): ExcludeBase<TSESTree.BinaryExpression> => {
    const right = context.toNode(node.right);
    const left = context.toNode(node.left);

    return { operator: node.operator, left, right };
  },

  BlockStatement: (
    node: Deno.lint.BlockStatement,
    context,
  ): ExcludeBase<TSESTree.BlockStatement> => {
    const body = node.body.map(context.toNode);

    return { body };
  },

  BreakStatement: (
    node: Deno.lint.BreakStatement,
    context,
  ): ExcludeBase<TSESTree.BreakStatement> => {
    const label = node.label && context.toNode(node.label);

    return { label };
  },

  CallExpression: (
    node: Deno.lint.CallExpression,
    context,
  ): ExcludeBase<TSESTree.CallExpression> => {
    const $arguments = node.arguments.map(
      context.toNode,
    );
    const callee = context.toNode(node.callee);
    const typeArguments = node.typeArguments &&
      context.toNode(node.typeArguments);

    return {
      arguments: $arguments,
      callee,
      optional: node.optional,
      typeArguments: typeArguments ?? undefined,
    };
  },

  ChainExpression: (
    node: Deno.lint.ChainExpression,
    context,
  ): ExcludeBase<TSESTree.ChainExpression> => {
    const expression = context.toNode(node.expression);

    return { expression };
  },

  ClassExpression: (
    node: Deno.lint.ClassExpression,
    context,
  ): ExcludeBase<TSESTree.ClassExpression> => {
    if (node.abstract) throw new Error();
    if (node.declare) throw new Error();

    const body = context.toNode(node.body);
    const id = node.id && context.toNode(node.id);
    const $implements = node.implements.map(
      context.toNode,
    );
    const superClass = node.superClass && context.toNode(node.superClass);
    const superTypeArguments = node.superTypeArguments &&
      context.toNode(node.superTypeArguments);
    const typeParameters = node.typeParameters &&
      context.toNode(node.typeParameters);

    return {
      body,
      abstract: node.abstract,
      declare: node.declare,
      decorators: [], // TODO,
      id,
      implements: $implements,
      superClass,
      superTypeArguments,
      typeParameters,
    };
  },

  ConditionalExpression: (
    node: Deno.lint.ConditionalExpression,
    context,
  ): ExcludeBase<TSESTree.ConditionalExpression> => {
    const alternate = context.toNode(node.alternate);
    const consequent = context.toNode(node.consequent);
    const test = context.toNode(node.test);

    return { alternate, consequent, test };
  },

  FunctionExpression: (
    node: Deno.lint.FunctionExpression,
    context,
  ): ExcludeBase<TSESTree.FunctionExpression> => {
    const body = context.toNode(node.body);
    const id = node.id && context.toNode(node.id);
    const params = node.params.map(context.toNode);
    const returnType = node.returnType &&
      context.toNode(node.returnType);
    const typeParameters = node.typeParameters &&
      context.toNode(node.typeParameters);

    return {
      async: node.async,
      body,
      generator: node.generator,
      id,
      params,
      expression: false,
      declare: false,
      returnType,
      typeParameters,
    };
  },

  Identifier: (
    node: Deno.lint.Identifier,
    context,
  ): ExcludeBase<TSESTree.Identifier> => {
    const typeAnnotation = node.typeAnnotation &&
      context.toNode(node.typeAnnotation);

    return {
      name: node.name,
      decorators: [], // TODO
      optional: node.optional,
      typeAnnotation,
    };
  },

  ImportExpression: (
    node: Deno.lint.ImportExpression,
    context,
  ): ExcludeBase<TSESTree.ImportExpression> => {
    const source = context.toNode(node.source);
    const options = node.options && context.toNode(node.options);

    return {
      source,
      options,
      attributes: options,
      phase: null, // TODO dynamic source phase import}
    };
  },

  JSXElement: (
    node: Deno.lint.JSXElement,
    context,
  ): ExcludeBase<TSESTree.JSXElement> => {
    const closingElement = node.closingElement &&
      context.toNode(node.closingElement);
    const openingElement = context.toNode(node.openingElement);
    const children = node.children.map(context.toNode);

    return { closingElement, openingElement, children };
  },

  JSXFragment: (
    node: Deno.lint.JSXFragment,
    context,
  ): ExcludeBase<TSESTree.JSXFragment> => {
    const closingFragment = context.toNode(node.closingFragment);
    const openingFragment = context.toNode(node.openingFragment);
    const children = node.children.map(context.toNode);

    return {
      closingFragment,
      openingFragment,
      children,
    };
  },

  Literal: (
    node: Deno.lint.Literal,
    _,
  ): ExcludeBase<TSESTree.Literal> => {
    return {
      value: node.value,
      raw: node.raw,
    };
  },

  LogicalExpression: (
    node: Deno.lint.LogicalExpression,
    context,
  ): ExcludeBase<TSESTree.LogicalExpression> => {
    const left = context.toNode(node.left);
    const right = context.toNode(node.right);

    return {
      left,
      operator: node.operator,
      right,
    };
  },

  MemberExpression: (
    node: Deno.lint.MemberExpression,
    context,
  ): ExcludeBase<TSESTree.MemberExpression> => {
    const object = context.toNode(node.object);
    const property = context.toNode(node.property);

    return {
      computed: node.computed,
      object,
      optional: node.optional,
      property,
    };
  },

  MetaProperty: (
    node: Deno.lint.MetaProperty,
    context,
  ): ExcludeBase<TSESTree.MetaProperty> => {
    const meta = context.toNode(node.meta);
    const property = context.toNode(node.property);

    return {
      meta,
      property,
    };
  },

  NewExpression: (
    node: Deno.lint.NewExpression,
    context,
  ): ExcludeBase<TSESTree.NewExpression> => {
    const $arguments = node.arguments.map(context.toNode);

    const callee = context.toNode(node.callee);
    const typeArguments = node.typeArguments &&
      context.toNode(node.typeArguments);

    return {
      arguments: $arguments,
      callee,
      typeArguments,
    };
  },

  ObjectExpression: (
    node: Deno.lint.ObjectExpression,
    context,
  ): ExcludeBase<TSESTree.ObjectExpression> => {
    const properties = node.properties.map(context.toNode);
    return { properties };
  },

  ObjectPattern: (
    node: Deno.lint.ObjectPattern,
    context,
  ): ExcludeBase<TSESTree.ObjectPattern> => {
    const properties = node.properties.map(context.toNode);
    const typeAnnotation = node.typeAnnotation &&
      context.toNode(node.typeAnnotation);

    return {
      properties,
      decorators: [], // TODO
      optional: node.optional,
      typeAnnotation,
    };
  },

  SequenceExpression: (
    node: Deno.lint.SequenceExpression,
    context,
  ): ExcludeBase<TSESTree.SequenceExpression> => {
    const expressions = node.expressions.map(context.toNode);
    return { expressions };
  },

  Super: (node: Deno.lint.Super, context): ExcludeBase<TSESTree.Super> => {
    return {};
  },

  TaggedTemplateExpression: (
    node: Deno.lint.TaggedTemplateExpression,
    context,
  ): ExcludeBase<TSESTree.TaggedTemplateExpression> => {
    const quasi = context.toNode(node.quasi);
    const tag = context.toNode(node.tag);
    const typeArguments = node.typeArguments &&
      context.toNode(node.typeArguments);

    return { quasi, tag, typeArguments };
  },

  TemplateLiteral: (
    node: Deno.lint.TemplateLiteral,
    context,
  ): ExcludeBase<TSESTree.TemplateLiteral> => {
    const expressions = node.expressions.map(context.toNode);
    const quasis = node.quasis.map(context.toNode);

    return { expressions, quasis };
  },

  ThisExpression: (
    node: Deno.lint.ThisExpression,
    context,
  ): ExcludeBase<TSESTree.ThisExpression> => {
    return {};
  },

  TSAsExpression: (
    node: Deno.lint.TSAsExpression,
    context,
  ): ExcludeBase<TSESTree.TSAsExpression> => {
    const expression = context.toNode(node.expression);
    const typeAnnotation = context.toNode(node.typeAnnotation);

    return { expression, typeAnnotation };
  },

  TSInstantiationExpression: (
    node: Deno.lint.TSInstantiationExpression,
    context,
  ): ExcludeBase<TSESTree.TSInstantiationExpression> => {
    const expression = context.toNode(node.expression);
    const typeArguments = context.toNode(
      node.typeArguments,
    );

    return { expression, typeArguments };
  },

  TSNonNullExpression: (
    node: Deno.lint.TSNonNullExpression,
    context,
  ): ExcludeBase<TSESTree.TSNonNullExpression> => {
    const expression = context.toNode(node.expression);

    return { expression };
  },

  TSSatisfiesExpression: (
    node: Deno.lint.TSSatisfiesExpression,
    context,
  ): ExcludeBase<TSESTree.TSSatisfiesExpression> => {
    const expression = context.toNode(node.expression);
    const typeAnnotation = context.toNode(node.typeAnnotation);

    return { expression, typeAnnotation };
  },

  TSTypeAssertion: (
    node: Deno.lint.TSTypeAssertion,
    context,
  ): ExcludeBase<TSESTree.TSTypeAssertion> => {
    const expression = context.toNode(node.expression);
    const typeAnnotation = context.toNode(node.typeAnnotation);

    return { expression, typeAnnotation };
  },

  UnaryExpression: (
    node: Deno.lint.UnaryExpression,
    context,
  ): ExcludeBase<TSESTree.UnaryExpression> => {
    const argument = context.toNode(node.argument);

    return {
      argument,
      operator: node.operator,
      prefix: true,
    };
  },

  UpdateExpression: (
    node: Deno.lint.UpdateExpression,
    context,
  ): ExcludeBase<TSESTree.UpdateExpression> => {
    const argument = context.toNode(node.argument);

    return {
      argument,
      operator: node.operator,
      prefix: node.prefix,
    };
  },

  YieldExpression: (
    node: Deno.lint.YieldExpression,
    context,
  ): ExcludeBase<TSESTree.YieldExpression> => {
    const argument = node.argument && context.toNode(node.argument);

    if (node.delegate) {
      if (!argument) throw new Error("semantic error");

      return { delegate: node.delegate, argument };
    }

    return { argument, delegate: node.delegate };
  },

  ClassDeclaration: (
    node: Deno.lint.ClassDeclaration,
    context,
  ): ExcludeBase<TSESTree.ClassDeclaration> => {
    const body = context.toNode(node.body);
    if (!node.id) throw new Error();

    const id = context.toNode(node.id);
    const $implements = node.implements.map(
      context.toNode,
    );
    const superClass = node.superClass && context.toNode(node.superClass);

    return {
      body,
      id,
      abstract: node.abstract,
      declare: node.declare,
      decorators: [], // TODO,
      implements: $implements,
      superClass,
      superTypeArguments: undefined, // TODO
      typeParameters: undefined, // TODO
    };
  },

  ContinueStatement: (
    node: Deno.lint.ContinueStatement,
    context,
  ): ExcludeBase<TSESTree.ContinueStatement> => {
    const label = node.label && context.toNode(node.label);

    return { label };
  },

  DebuggerStatement: (
    node: Deno.lint.DebuggerStatement,
    context,
  ): ExcludeBase<TSESTree.DebuggerStatement> => {
    return {};
  },

  DoWhileStatement: (
    node: Deno.lint.DoWhileStatement,
    context,
  ): ExcludeBase<TSESTree.DoWhileStatement> => {
    const body = context.toNode(node.body);

    if (
      body.type === Type.ClassDeclaration && !isClassDeclarationWithName(body)
    ) {
      throw new Error();
    }

    if (
      body.type === Type.FunctionDeclaration &&
      !isFunctionDeclarationWithName(body)
    ) {
      throw new Error();
    }

    const test = context.toNode(node.test);

    return { body, test };
  },

  ExportAllDeclaration: (
    node: Deno.lint.ExportAllDeclaration,
    context,
  ): ExcludeBase<TSESTree.ExportAllDeclaration> => {
    const attributes = node.attributes.map(context.toNode);
    const exported = node.exported && context.toNode(node.exported);
    const source = context.toNode(node.source);

    return {
      attributes,
      exported,
      source,
      exportKind: node.exportKind,
      assertions: attributes, // TODO
    };
  },

  ExportDefaultDeclaration: (
    node: Deno.lint.ExportDefaultDeclaration,
    context,
  ): ExcludeBase<TSESTree.ExportDefaultDeclaration> => {
    if (node.exportKind === "type") throw new Error("semantic error");

    const declaration = context.toNode(node.declaration);

    return {
      declaration,
      exportKind: node.exportKind,
    };
  },

  ExportNamedDeclaration: (
    node: Deno.lint.ExportNamedDeclaration,
    context,
  ): ExcludeBase<TSESTree.ExportNamedDeclaration> => {
    const attributes = node.attributes.map(context.toNode);
    const declaration = node.declaration && context.toNode(node.declaration);
    const specifiers = node.specifiers.map(context.toNode);
    const source = node.source && context.toNode(node.source);

    return {
      attributes,
      declaration,
      specifiers,
      exportKind: node.exportKind,
      source,
      assertions: attributes,
    };
  },

  ExpressionStatement: (
    node: Deno.lint.ExpressionStatement,
    context,
  ): ExcludeBase<TSESTree.ExpressionStatement> => {
    const expression = context.toNode(node.expression);

    return {
      expression,
      directive: undefined, // TODO
    };
  },

  ForInStatement: (
    node: Deno.lint.ForInStatement,
    context,
  ): ExcludeBase<TSESTree.ForInStatement> => {
    const body = context.toNode(node.body);
    const left = context.toNode(node.left);
    const right = context.toNode(node.right);

    return { body, left, right };
  },

  ForOfStatement: (
    node: Deno.lint.ForOfStatement,
    context,
  ): ExcludeBase<TSESTree.ForOfStatement> => {
    const body = context.toNode(node.body);
    const left = context.toNode(node.left);
    const right = context.toNode(node.right);

    return { body, await: node.await, left, right };
  },

  ForStatement: (
    node: Deno.lint.ForStatement,
    context,
  ): ExcludeBase<TSESTree.ForStatement> => {
    const body = context.toNode(node.body);
    const init = node.init && context.toNode(node);
    const test = node.test && context.toNode(node.test);
    const update = node.update && context.toNode(node.update);

    return { body, init: init ?? null, test, update };
  },

  FunctionDeclaration: (
    node: Deno.lint.FunctionDeclaration,
    context,
  ): ExcludeBase<TSESTree.FunctionDeclaration> => {
    if (node.declare) throw new Error("semantic error");

    if (!node.body) throw new Error();
    const body = context.toNode(node.body);
    if (!node.id) throw new Error();
    const id = context.toNode(node.id);
    const params = node.params.map(context.toNode);
    const returnType = node.returnType &&
      context.toNode(node.returnType);
    const typeParameters = node.typeParameters &&
      context.toNode(node.typeParameters);

    return {
      body,
      async: node.async,
      id,
      params,
      generator: node.generator,
      declare: node.declare,
      expression: false,
      returnType,
      typeParameters,
    };
  },

  IfStatement: (
    node: Deno.lint.IfStatement,
    context,
  ): ExcludeBase<TSESTree.IfStatement> => {
    const alternate = node.alternate && context.toNode(node.alternate);
    const consequent = context.toNode(node.consequent);
    const test = context.toNode(node.test);

    return { alternate, consequent, test };
  },

  ImportDeclaration: (
    node: Deno.lint.ImportDeclaration,
    context,
  ): ExcludeBase<TSESTree.ImportDeclaration> => {
    const attributes = node.attributes.map(context.toNode);
    const source = context.toNode(node.source);
    const specifiers = node.specifiers.map(context.toNode);
    return {
      attributes,
      source,
      specifiers,
      assertions: attributes,
      importKind: node.importKind,
      phase: null, // TODO
    };
  },

  LabeledStatement: (
    node: Deno.lint.LabeledStatement,
    context,
  ): ExcludeBase<TSESTree.LabeledStatement> => {
    const body = context.toNode(node.body);
    const label = context.toNode(node.label);

    return { body, label };
  },

  ReturnStatement: (
    node: Deno.lint.ReturnStatement,
    context,
  ): ExcludeBase<TSESTree.ReturnStatement> => {
    const argument = node.argument && context.toNode(node.argument);

    return { argument };
  },

  SwitchStatement: (
    node: Deno.lint.SwitchStatement,
    context,
  ): ExcludeBase<TSESTree.SwitchStatement> => {
    const cases = node.cases.map(context.toNode);
    const discriminant = context.toNode(node.discriminant);

    return { cases, discriminant };
  },

  ThrowStatement: (
    node: Deno.lint.ThrowStatement,
    context,
  ): ExcludeBase<TSESTree.ThrowStatement> => {
    const argument = context.toNode(node.argument);

    return { argument };
  },

  TryStatement: (
    node: Deno.lint.TryStatement,
    context,
  ): ExcludeBase<TSESTree.TryStatement> => {
    const block = context.toNode(node.block);
    const finalizer = node.finalizer && context.toNode(node.finalizer);
    const handler = node.handler && context.toNode(node.handler);

    return { block, finalizer, handler };
  },

  TSDeclareFunction: (
    node: Deno.lint.TSDeclareFunction,
    context,
  ): ExcludeBase<TSESTree.TSDeclareFunction> => {
    const id = node.id && context.toNode(node.id);
    const params = node.params.map(context.toNode);
    const returnType = node.returnType && context.toNode(node.returnType);
    const typeParameters = node.typeParameters &&
      context.toNode(node.typeParameters);

    return {
      async: node.async,
      body: node.body,
      declare: node.declare,
      expression: false,
      generator: node.generator,
      id,
      params,
      returnType,
      typeParameters,
    };
  },

  TSEnumDeclaration: (
    node: Deno.lint.TSEnumDeclaration,
    context,
  ): ExcludeBase<TSESTree.TSEnumDeclaration> => {
    const body = context.toNode(node.body);
    const id = context.toNode(node.id);

    return {
      body,
      const: node.const,
      declare: node.declare,
      id,
      members: body.members,
    };
  },

  TSExportAssignment: (
    node: Deno.lint.TSExportAssignment,
    context,
  ): ExcludeBase<TSESTree.TSExportAssignment> => {
    const expression = context.toNode(node.expression);

    return { expression };
  },

  TSImportEqualsDeclaration: (
    node: Deno.lint.TSImportEqualsDeclaration,
    context,
  ): ExcludeBase<TSESTree.TSImportEqualsDeclaration> => {
    const id = context.toNode(node.id);
    const moduleReference = context.toNode(
      node.moduleReference,
    );

    return {
      id,
      importKind: node.importKind,
      moduleReference,
    };
  },

  TSInterfaceDeclaration: (
    node: Deno.lint.TSInterfaceDeclaration,
    context,
  ): ExcludeBase<TSESTree.TSInterfaceDeclaration> => {
    const body = context.toNode(node.body);
    const id = context.toNode(node.id);
    const typeParameters = node.typeParameters &&
      context.toNode(node.typeParameters);
    const $extends = node.extends.map(context.toNode);

    return {
      body,
      declare: node.declare,
      id,
      typeParameters,
      extends: $extends,
    };
  },

  TSModuleDeclaration: (
    node: Deno.lint.TSModuleDeclaration,
    context,
  ): ExcludeBase<TSESTree.TSModuleDeclaration> => {
    throw new Error();
  },

  TSNamespaceExportDeclaration: (
    node: Deno.lint.TSNamespaceExportDeclaration,
    context,
  ): ExcludeBase<TSESTree.TSNamespaceExportDeclaration> => {
    throw new Error();
  },

  TSTypeAliasDeclaration: (
    node: Deno.lint.TSTypeAliasDeclaration,
    context,
  ): ExcludeBase<TSESTree.TSTypeAliasDeclaration> => {
    const id = context.toNode(node.id);
    const typeAnnotation = context.toNode(node.typeAnnotation);
    const typeParameters = node.typeParameters &&
      context.toNode(node.typeParameters);

    return {
      declare: node.declare,
      id,
      typeAnnotation,
      typeParameters,
    };
  },

  VariableDeclaration: (
    node: Deno.lint.VariableDeclaration,
    context,
  ): ExcludeBase<TSESTree.VariableDeclaration> => {
    const declarations = node.declarations.map(context.toNode);

    return { declarations, kind: node.kind, declare: node.declare };
  },

  WhileStatement: (
    node: Deno.lint.WhileStatement,
    context,
  ): ExcludeBase<TSESTree.WhileStatement> => {
    const body = context.toNode(node.body);
    const test = context.toNode(node.test);

    return { body, test };
  },

  WithStatement: (
    node: Deno.lint.WithStatement,
    context,
  ): ExcludeBase<TSESTree.WithStatement> => {
    const body = context.toNode(node.body);
    const object = context.toNode(node.object);

    return { body, object };
  },

  TSAnyKeyword: (
    node: Deno.lint.TSAnyKeyword,
    context,
  ): ExcludeBase<TSESTree.TSAnyKeyword> => {
    return {};
  },

  TSArrayType: (
    node: Deno.lint.TSArrayType,
    context,
  ): ExcludeBase<TSESTree.TSArrayType> => {
    const elementType = context.toNode(node.elementType);

    return { elementType };
  },

  TSBigIntKeyword: (
    node: Deno.lint.TSBigIntKeyword,
    context,
  ): ExcludeBase<TSESTree.TSBigIntKeyword> => {
    return {};
  },

  TSBooleanKeyword: (
    node: Deno.lint.TSBooleanKeyword,
    context,
  ): ExcludeBase<TSESTree.TSBooleanKeyword> => {
    return {};
  },

  TSConditionalType: (
    node: Deno.lint.TSConditionalType,
    context,
  ): ExcludeBase<TSESTree.TSConditionalType> => {
    const checkType = context.toNode(node.checkType);
    const extendsType = context.toNode(node.extendsType);
    const falseType = context.toNode(node.falseType);
    const trueType = context.toNode(node.trueType);

    return {
      checkType,
      extendsType,
      falseType,
      trueType,
    };
  },

  TSFunctionType: (
    node: Deno.lint.TSFunctionType,
    context,
  ): ExcludeBase<TSESTree.TSFunctionType> => {
    const params = node.params.map(context.toNode);
    const returnType = node.returnType &&
      context.toNode(node.returnType);
    const typeParameters = node.typeParameters &&
      context.toNode(node.typeParameters);

    return { params, returnType, typeParameters };
  },

  TSImportType: (
    node: Deno.lint.TSImportType,
    context,
  ): ExcludeBase<TSESTree.TSImportType> => {
    const argument = context.toNode(node.argument);
    const qualifier = node.qualifier && context.toNode(node.qualifier);
    const typeArguments = node.typeArguments &&
      context.toNode(node.typeArguments);

    return {
      argument,
      qualifier,
      typeArguments,
    };
  },

  TSIndexedAccessType: (
    node: Deno.lint.TSIndexedAccessType,
    context,
  ): ExcludeBase<TSESTree.TSIndexedAccessType> => {
    const indexType = context.toNode(node.indexType);
    const objectType = context.toNode(node.objectType);

    return { indexType, objectType };
  },

  TSInferType: (
    node: Deno.lint.TSInferType,
    context,
  ): ExcludeBase<TSESTree.TSInferType> => {
    const typeParameter = context.toNode(node.typeParameter);

    return { typeParameter };
  },

  TSIntersectionType: (
    node: Deno.lint.TSIntersectionType,
    context,
  ): ExcludeBase<TSESTree.TSIntersectionType> => {
    const types = node.types.map(context.toNode);

    return { types };
  },

  TSIntrinsicKeyword: (
    node: Deno.lint.TSIntrinsicKeyword,
    context,
  ): ExcludeBase<TSESTree.TSIntrinsicKeyword> => {
    return {};
  },

  TSLiteralType: (
    node: Deno.lint.TSLiteralType,
    context,
  ): ExcludeBase<TSESTree.TSLiteralType> => {
    const literal = context.toNode(node.literal);

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

    return { literal };
  },

  TSMappedType: (
    node: Deno.lint.TSMappedType,
    context,
  ): ExcludeBase<TSESTree.TSMappedType> => {
    const constraint = context.toNode(node.constraint);
    const key = context.toNode(node.key);
    const nameType = node.nameType && context.toNode(node.nameType);
    const typeAnnotation = node.typeAnnotation &&
      context.toNode(node.typeAnnotation);

    return {
      constraint,
      key,
      nameType,
      typeAnnotation,
      optional: node.optional,
      readonly: node.readonly,
    };
  },

  TSNamedTupleMember: (
    node: Deno.lint.TSNamedTupleMember,
    context,
  ): ExcludeBase<TSESTree.TSNamedTupleMember> => {
    const elementType = context.toNode(node.elementType);
    const label = context.toNode(node.label);

    return {
      elementType,
      label,
      optional: node.optional,
    };
  },

  TSNeverKeyword: (
    node: Deno.lint.TSNeverKeyword,
    context,
  ): ExcludeBase<TSESTree.TSNeverKeyword> => {
    return {};
  },

  TSNullKeyword: (
    node: Deno.lint.TSNullKeyword,
    context,
  ): ExcludeBase<TSESTree.TSNullKeyword> => {
    return {};
  },

  TSNumberKeyword: (
    node: Deno.lint.TSNumberKeyword,
    context,
  ): ExcludeBase<TSESTree.TSNumberKeyword> => {
    return {};
  },

  TSObjectKeyword: (
    node: Deno.lint.TSObjectKeyword,
    context,
  ): ExcludeBase<TSESTree.TSObjectKeyword> => {
    return {};
  },

  TSOptionalType: (
    node: Deno.lint.TSOptionalType,
    context,
  ): ExcludeBase<TSESTree.TSOptionalType> => {
    const typeAnnotation = context.toNode(node.typeAnnotation);

    return {
      typeAnnotation,
    };
  },

  TSQualifiedName: (
    node: Deno.lint.TSQualifiedName,
    context,
  ): ExcludeBase<TSESTree.TSQualifiedName> => {
    const left = context.toNode(node.left);
    const right = context.toNode(node.right);

    return {
      left,
      right,
    };
  },

  TSRestType: (
    node: Deno.lint.TSRestType,
    context,
  ): ExcludeBase<TSESTree.TSRestType> => {
    const typeAnnotation = context.toNode(node.typeAnnotation);

    return {
      typeAnnotation,
    };
  },

  TSStringKeyword: (
    node: Deno.lint.TSStringKeyword,
    context,
  ): ExcludeBase<TSESTree.TSStringKeyword> => {
    return {};
  },

  TSSymbolKeyword: (
    node: Deno.lint.TSSymbolKeyword,
    context,
  ): ExcludeBase<TSESTree.TSSymbolKeyword> => {
    return {};
  },

  TSTemplateLiteralType: (
    node: Deno.lint.TSTemplateLiteralType,
    context,
  ): ExcludeBase<TSESTree.TSTemplateLiteralType> => {
    const quasis = node.quasis.map(context.toNode);
    const types = node.types.map(context.toNode);

    return {
      quasis,
      types,
    };
  },

  TSThisType: (
    node: Deno.lint.TSThisType,
    context,
  ): ExcludeBase<TSESTree.TSThisType> => {
    return {};
  },

  TSTupleType: (
    node: Deno.lint.TSTupleType,
    context,
  ): ExcludeBase<TSESTree.TSTupleType> => {
    const elementTypes = node.elementTypes.map(context.toNode);

    return {
      elementTypes,
    };
  },

  TSTypeLiteral: (
    node: Deno.lint.TSTypeLiteral,
    context,
  ): ExcludeBase<TSESTree.TSTypeLiteral> => {
    const members = node.members.map(context.toNode);

    return { members };
  },

  TSTypeOperator: (
    node: Deno.lint.TSTypeOperator,
    context,
  ): ExcludeBase<TSESTree.TSTypeOperator> => {
    const typeAnnotation = context.toNode(node.typeAnnotation);

    return {
      operator: node.operator,
      typeAnnotation,
    };
  },

  TSTypePredicate: (
    node: Deno.lint.TSTypePredicate,
    context,
  ): ExcludeBase<TSESTree.TSTypePredicate> => {
    const parameterName = context.toNode(node.parameterName);

    if (!node.asserts) {
      if (!node.typeAnnotation) throw new Error("semantic error");

      const typeAnnotation = context.toNode(node.typeAnnotation);

      return {
        asserts: node.asserts,
        typeAnnotation,
        parameterName,
      };
    }

    const typeAnnotation = node.typeAnnotation &&
      context.toNode(node.typeAnnotation);

    return {
      asserts: node.asserts,
      typeAnnotation: typeAnnotation ?? null,
      parameterName,
    };
  },

  TSTypeQuery: (
    node: Deno.lint.TSTypeQuery,
    context,
  ): ExcludeBase<TSESTree.TSTypeQuery> => {
    const exprName = context.toNode(node.exprName);
    const typeArguments = node.typeArguments &&
      context.toNode(node.typeArguments);

    return {
      exprName,
      typeArguments,
    };
  },

  TSTypeReference: (
    node: Deno.lint.TSTypeReference,
    context,
  ): ExcludeBase<TSESTree.TSTypeReference> => {
    const typeArguments = node.typeArguments &&
      context.toNode(node.typeArguments);
    const typeName = context.toNode(node.typeName);

    return { typeArguments, typeName };
  },

  TSUndefinedKeyword: (
    node: Deno.lint.TSUndefinedKeyword,
    context,
  ): ExcludeBase<TSESTree.TSUndefinedKeyword> => {
    return {};
  },

  TSUnionType: (
    node: Deno.lint.TSUnionType,
    context,
  ): ExcludeBase<TSESTree.TSUnionType> => {
    const types = node.types.map(context.toNode);

    return { types };
  },

  TSUnknownKeyword: (
    node: Deno.lint.TSUnknownKeyword,
    context,
  ): ExcludeBase<TSESTree.TSUnknownKeyword> => {
    return {};
  },

  TSVoidKeyword: (
    node: Deno.lint.TSVoidKeyword,
    context,
  ): ExcludeBase<TSESTree.TSVoidKeyword> => {
    return {};
  },

  ImportSpecifier: (
    node: Deno.lint.ImportSpecifier,
    context,
  ): ExcludeBase<TSESTree.ImportSpecifier> => {
    const imported = context.toNode(node.imported);
    const local = context.toNode(node.local);

    if (imported.type === Type.Literal) {
      if (typeof imported.value !== "string") {
        throw new Error();
      }
    }

    return {
      imported,
      local,
      importKind: node.importKind,
    };
  },

  ImportDefaultSpecifier: (
    node: Deno.lint.ImportDefaultSpecifier,
    context,
  ): ExcludeBase<TSESTree.ImportDefaultSpecifier> => {
    const local = context.toNode(node.local);

    return { local };
  },

  ImportNamespaceSpecifier: (
    node: Deno.lint.ImportNamespaceSpecifier,
    context,
  ): ExcludeBase<TSESTree.ImportNamespaceSpecifier> => {
    const local = context.toNode(node.local);

    return { local };
  },

  ImportAttribute: (
    node: Deno.lint.ImportAttribute,
    context,
  ): ExcludeBase<TSESTree.ImportAttribute> => {
    const key = context.toNode(node.key);
    const value = context.toNode(node.value);

    return { key, value };
  },

  TSExternalModuleReference: (
    node: Deno.lint.TSExternalModuleReference,
    context,
  ): ExcludeBase<TSESTree.TSExternalModuleReference> => {
    const expression = context.toNode(node.expression);

    return { expression };
  },

  ExportSpecifier: (
    node: Deno.lint.ExportSpecifier,
    context,
  ): ExcludeBase<TSESTree.ExportSpecifier> => {
    const exported = context.toNode(node.exported);
    const local = context.toNode(node.local);

    return { exported, local, exportKind: node.exportKind };
  },

  VariableDeclarator: (
    node: Deno.lint.VariableDeclarator,
    context,
  ): ExcludeBase<TSESTree.VariableDeclarator> => {
    const init = node.init && context.toNode(node.init);
    const id = context.toNode(node.id);

    return { id, init, definite: node.definite };
  },

  Decorator: (
    node: Deno.lint.Decorator,
    context,
  ): ExcludeBase<TSESTree.Decorator> => {
    const expression = context.toNode(node.expression);

    return { expression };
  },

  ClassBody: (
    node: Deno.lint.ClassBody,
    context,
  ): ExcludeBase<TSESTree.ClassBody> => {
    const body = node.body.map(context.toNode);

    return { body };
  },

  StaticBlock: (
    node: Deno.lint.StaticBlock,
    context,
  ): ExcludeBase<TSESTree.StaticBlock> => {
    const body = node.body.map(context.toNode);

    return { body };
  },

  PropertyDefinition: (
    node: Deno.lint.PropertyDefinition,
    context,
  ): ExcludeBase<TSESTree.PropertyDefinition> => {
    const key = context.toNode(node.key);
    const decorators = node.decorators.map(context.toNode);
    const typeAnnotation = node.typeAnnotation &&
      context.toNode(node.typeAnnotation);
    const value = node.value && context.toNode(node.value);

    return {
      computed: node.computed,
      key,
      static: node.static,
      accessibility: node.accessibility,
      declare: node.declare,
      decorators,
      optional: node.optional,
      override: node.override,
      readonly: node.readonly,
      typeAnnotation,
      value,
    };
  },

  MethodDefinition: (
    node: Deno.lint.MethodDefinition,
    context,
  ): ExcludeBase<TSESTree.MethodDefinition> => {
    const key = context.toNode(node.key);
    const value = context.toNode(node.value);
    const decorators = node.decorators.map(context.toNode);

    return {
      computed: node.computed,
      key,
      kind: node.kind,
      static: node.static,
      value,
      decorators,
      optional: node.optional,
      override: node.override,
      accessibility: node.accessibility,
    };
  },

  SwitchCase: (
    node: Deno.lint.SwitchCase,
    context,
  ): ExcludeBase<TSESTree.SwitchCase> => {
    const consequent = node.consequent.map(context.toNode);
    const test = node.test && context.toNode(node.test);

    return { consequent, test };
  },

  CatchClause: (
    node: Deno.lint.CatchClause,
    context,
  ): ExcludeBase<TSESTree.CatchClause> => {
    const body = context.toNode(node.body);
    const param = node.param && context.toNode(node.param);

    return {
      body,
      param,
    };
  },

  TemplateElement: (
    node: Deno.lint.TemplateElement,
    context,
  ): ExcludeBase<TSESTree.TemplateElement> => {
    return {
      tail: node.tail,
      value: {
        cooked: node.cooked,
        raw: node.raw,
      },
    };
  },

  PrivateIdentifier: (
    node: Deno.lint.PrivateIdentifier,
    context,
  ): ExcludeBase<TSESTree.PrivateIdentifier> => {
    return { name: node.name };
  },

  AssignmentPattern: (
    node: Deno.lint.AssignmentPattern,
    context,
  ): ExcludeBase<TSESTree.AssignmentPattern> => {
    const left = context.toNode(node.left);
    const right = context.toNode(node.right);

    return {
      left,
      right,
      decorators: [], // TODO
      typeAnnotation: undefined, // TODO
    };
  },

  RestElement: (
    node: Deno.lint.RestElement,
    context,
  ): ExcludeBase<TSESTree.RestElement> => {
    const argument = context.toNode(node.argument);
    const typeAnnotation = node.typeAnnotation &&
      context.toNode(node.typeAnnotation);

    return {
      argument,
      decorators: [], // TODO
      typeAnnotation,
      value: undefined, // TODO
    };
  },

  SpreadElement: (
    node: Deno.lint.SpreadElement,
    context,
  ): ExcludeBase<TSESTree.SpreadElement> => {
    const argument = context.toNode(node.argument);

    return { argument };
  },

  Property: (
    node: Deno.lint.Property,
    context,
  ): ExcludeBase<TSESTree.Property> => {
    const key = context.toNode(node.key);
    const value = context.toNode(node.value);

    return {
      computed: node.computed,
      key,
      kind: node.kind,
      method: node.method,
      shorthand: node.shorthand,
      value,
    };
  },

  JSXIdentifier: (
    node: Deno.lint.JSXIdentifier,
    context,
  ): ExcludeBase<TSESTree.JSXIdentifier> => {
    return { name: node.name };
  },

  JSXNamespacedName: (
    node: Deno.lint.JSXNamespacedName,
    context,
  ): ExcludeBase<TSESTree.JSXNamespacedName> => {
    const name = context.toNode(node.name);
    const namespace = context.toNode(node.namespace);

    return { name, namespace };
  },

  JSXEmptyExpression: (
    node: Deno.lint.JSXEmptyExpression,
    context,
  ): ExcludeBase<TSESTree.JSXEmptyExpression> => {
    return {};
  },

  JSXOpeningElement: (
    node: Deno.lint.JSXOpeningElement,
    context,
  ): ExcludeBase<TSESTree.JSXOpeningElement> => {
    const attributes = node.attributes.map(context.toNode);
    const typeArguments = node.typeArguments &&
      context.toNode(node.typeArguments);
    const name = context.toNode(node.name);

    return {
      attributes,
      selfClosing: node.selfClosing,
      typeArguments,
      name,
    };
  },

  JSXAttribute: (
    node: Deno.lint.JSXAttribute,
    context,
  ): ExcludeBase<TSESTree.JSXAttribute> => {
    const name = context.toNode(node.name);
    const value = node.value && context.toNode(node.value);

    return {
      name,
      value,
    };
  },

  JSXSpreadAttribute: (
    node: Deno.lint.JSXSpreadAttribute,
    context,
  ): ExcludeBase<TSESTree.JSXSpreadAttribute> => {
    const argument = context.toNode(node.argument);

    return {
      argument,
    };
  },

  JSXClosingElement: (
    node: Deno.lint.JSXClosingElement,
    context,
  ): ExcludeBase<TSESTree.JSXClosingElement> => {
    const name = context.toNode(node.name);

    return {
      name,
    };
  },

  JSXOpeningFragment: (
    node: Deno.lint.JSXOpeningFragment,
    context,
  ): ExcludeBase<TSESTree.JSXOpeningFragment> => {
    return {};
  },

  JSXClosingFragment: (
    node: Deno.lint.JSXClosingFragment,
    context,
  ): ExcludeBase<TSESTree.JSXClosingFragment> => {
    return {};
  },

  JSXExpressionContainer: (
    node: Deno.lint.JSXExpressionContainer,
    context,
  ): ExcludeBase<TSESTree.JSXExpressionContainer> => {
    const expression = context.toNode(node.expression);
    return {
      expression,
    };
  },

  JSXText: (
    node: Deno.lint.JSXText,
    context,
  ): ExcludeBase<TSESTree.JSXText> => {
    return {
      raw: node.raw,
      value: node.value,
    };
  },

  JSXMemberExpression: (
    node: Deno.lint.JSXMemberExpression,
    context,
  ): ExcludeBase<TSESTree.JSXMemberExpression> => {
    const $object = context.toNode(node.object);
    const property = context.toNode(node.property);

    return {
      object: $object,
      property,
    };
  },

  TSModuleBlock: (
    node: Deno.lint.TSModuleBlock,
    context,
  ): ExcludeBase<TSESTree.TSModuleBlock> => {
    const body = node.body.map(context.toNode);

    return {
      body,
    };
  },

  TSClassImplements: (
    node: Deno.lint.TSClassImplements,
    context,
  ): ExcludeBase<TSESTree.TSClassImplements> => {
    const expression = context.toNode(node.expression);
    const typeArguments = node.typeArguments &&
      context.toNode(node.typeArguments);

    return { expression, typeArguments };
  },

  TSAbstractMethodDefinition: (
    node: Deno.lint.TSAbstractMethodDefinition,
    context,
  ): ExcludeBase<TSESTree.TSAbstractMethodDefinition> => {
    const key = context.toNode(node.key);
    const value = context.toNode(node.value);

    return {
      kind: node.kind,
      decorators: [], // TODO
      optional: node.optional,
      override: node.override,
      static: node.static,
      accessibility: node.accessibility,
      computed: node.computed,
      key,
      value,
    };
  },

  TSAbstractPropertyDefinition: (
    node: Deno.lint.TSAbstractPropertyDefinition,
    context,
  ): ExcludeBase<TSESTree.TSAbstractPropertyDefinition> => {
    const decorators = node.decorators.map(context.toNode);
    const key = context.toNode(node.key);
    const typeAnnotation = node.typeAnnotation &&
      context.toNode(node.typeAnnotation);

    return {
      accessibility: node.accessibility,
      computed: node.computed,
      declare: node.declare,
      decorators,
      definite: node.definite,
      key,
      optional: node.optional,
      override: node.override,
      readonly: node.readonly,
      static: node.static,
      typeAnnotation,
      value: node.value,
    };
  },

  TSEmptyBodyFunctionExpression: (
    node: Deno.lint.TSEmptyBodyFunctionExpression,
    context,
  ): ExcludeBase<TSESTree.TSEmptyBodyFunctionExpression> => {
    const params = node.params.map(context.toNode);
    const returnType = node.returnType && context.toNode(node.returnType);
    const typeParameters = node.typeParameters &&
      context.toNode(node.typeParameters);

    return {
      async: node.async,
      body: node.body,
      declare: node.declare,
      expression: node.expression,
      generator: node.generator,
      id: node.id,
      params,
      returnType,
      typeParameters,
    };
  },

  TSCallSignatureDeclaration: (
    node: Deno.lint.TSCallSignatureDeclaration,
    context,
  ): ExcludeBase<TSESTree.TSCallSignatureDeclaration> => {
    const params = node.params.map(context.toNode);
    const returnType = node.returnType && context.toNode(node.returnType);
    const typeParameters = node.typeParameters &&
      context.toNode(node.typeParameters);

    return {
      params,
      returnType,
      typeParameters,
    };
  },

  TSPropertySignature: (
    node: Deno.lint.TSPropertySignature,
    context,
  ): ExcludeBase<TSESTree.TSPropertySignature> => {
    const typeAnnotation = node.typeAnnotation &&
      context.toNode(node.typeAnnotation);
    const key = context.toNode(node.key);

    return {
      accessibility: undefined, // TODO,
      optional: node.optional,
      readonly: node.readonly,
      static: node.static,
      typeAnnotation,
      computed: node.computed,
      key,
    };
  },

  TSEnumBody: (
    node: Deno.lint.TSEnumBody,
    context,
  ): ExcludeBase<TSESTree.TSEnumBody> => {
    const members = node.members.map(context.toNode);

    return { members };
  },

  TSEnumMember: (
    node: Deno.lint.TSEnumMember,
    context,
  ): ExcludeBase<TSESTree.TSEnumMember> => {
    const id = context.toNode(node.id);
    const initializer = node.initializer &&
      context.toNode(node.initializer);

    return { id, initializer, computed: false };
  },

  TSTypeParameterInstantiation: (
    node: Deno.lint.TSTypeParameterInstantiation,
    context,
  ): ExcludeBase<TSESTree.TSTypeParameterInstantiation> => {
    const params = node.params.map(context.toNode);

    return { params };
  },

  TSInterfaceBody: (
    node: Deno.lint.TSInterfaceBody,
    context,
  ): ExcludeBase<TSESTree.TSInterfaceBody> => {
    const body = node.body.map(context.toNode);

    return { body };
  },

  TSConstructSignatureDeclaration: (
    node: Deno.lint.TSConstructSignatureDeclaration,
    context,
  ): ExcludeBase<TSESTree.TSConstructSignatureDeclaration> => {
    const params = node.params.map(context.toNode);
    const returnType = context.toNode(node.returnType);
    const typeParameters = node.typeParameters &&
      context.toNode(node.typeParameters);

    return {
      params,
      returnType,
      typeParameters,
    };
  },

  TSMethodSignature: (
    node: Deno.lint.TSMethodSignature,
    context,
  ): ExcludeBase<TSESTree.TSMethodSignature> => {
    const params = node.params.map(context.toNode);
    const returnType = node.returnType &&
      context.toNode(node.returnType);
    const typeParameters = node.typeParameters &&
      context.toNode(node.typeParameters);
    const key = context.toNode(node.key);

    return {
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
    };
  },

  TSInterfaceHeritage: (
    node: Deno.lint.TSInterfaceHeritage,
    context,
  ): ExcludeBase<TSESTree.TSInterfaceHeritage> => {
    const expression = context.toNode(node.expression);
    const typeArguments = node.typeArguments &&
      context.toNode(node.typeArguments);

    return { expression, typeArguments };
  },

  TSIndexSignature: (
    node: Deno.lint.TSIndexSignature,
    context,
  ): ExcludeBase<TSESTree.TSIndexSignature> => {
    const parameters = node.parameters.map(context.toNode);
    const typeAnnotation = node.typeAnnotation &&
      context.toNode(node.typeAnnotation);

    return {
      parameters,
      readonly: node.readonly,
      static: node.static,
      accessibility: undefined, // TODO
      typeAnnotation,
    };
  },

  TSTypeAnnotation: (
    node: Deno.lint.TSTypeAnnotation,
    context,
  ): ExcludeBase<TSESTree.TSTypeAnnotation> => {
    const typeAnnotation = context.toNode(node.typeAnnotation);

    return { typeAnnotation };
  },

  TSTypeParameterDeclaration: (
    node: Deno.lint.TSTypeParameterDeclaration,
    context,
  ): ExcludeBase<TSESTree.TSTypeParameterDeclaration> => {
    const params = node.params.map(context.toNode);

    return { params };
  },

  TSTypeParameter: (
    node: Deno.lint.TSTypeParameter,
    context,
  ): ExcludeBase<TSESTree.TSTypeParameter> => {
    const constraint = node.constraint && context.toNode(node.constraint);
    const $default = node.default && context.toNode(node.default);
    const name = context.toNode(node.name);

    return {
      const: node.const,
      constraint: constraint ?? undefined,
      default: $default ?? undefined,
      in: node.in,
      name,
      out: node.out,
    };
  },

  TSParameterProperty: (
    node: Deno.lint.TSParameterProperty,
    context,
  ): ExcludeBase<TSESTree.TSParameterProperty> => {
    const parameter = context.toNode(node.parameter);
    const decorators = node.decorators.map(context.toNode);

    return {
      parameter,
      accessibility: node.accessibility,
      decorators,
      override: node.override,
      readonly: node.readonly,
      static: node.static,
    };
  },

  Line: (
    node: Deno.lint.LineComment,
    context,
  ): ExcludeBase<TSESTree.LineComment> => {
    return {
      value: node.value,
    };
  },

  Block: (
    node: Deno.lint.BlockComment,
    context,
  ): ExcludeBase<TSESTree.BlockComment> => {
    return {
      value: node.value,
    };
  },
} satisfies Definition<Context>;

type WithoutComment = Exclude<
  AllNode,
  Deno.lint.LineComment | Deno.lint.BlockComment
>;

interface TokenNodeMap {
  Line: TSESTree.LineComment;
  Block: TSESTree.BlockComment;
}

type NodeMap =
  & { [k in WithoutComment["type"]]: Extract<TSESTree.Node, { type: k }> }
  & TokenNodeMap;

function isClassDeclarationWithName(
  node: TSESTree.ClassDeclaration,
): node is TSESTree.ClassDeclarationWithName {
  return node.id !== null;
}

function isFunctionDeclarationWithName(
  node: TSESTree.FunctionDeclaration,
): node is TSESTree.FunctionDeclarationWithName {
  return node.id !== null;
}

type AllNode =
  | Deno.lint.Node
  | Deno.lint.TSParameterProperty
  | Deno.lint.AccessorProperty; // TSParameterProperty is not Node yet

type Definition<T> = {
  [k in keyof NodeMap]: (
    node: Extract<AllNode, { type: k }>,
    context: T,
  ) => ExcludeBase<NodeMap[k]>;
};

interface Context {
  toNode: (node: AllNode) => any;
}

interface ConvertResult<T> {
  map: WeakMap<Deno.lint.Node, TSESTree.Node>;
  node: T;
}

export function convert<T extends Deno.lint.Node>(
  node: T,
  source: string,
): ConvertResult<NodeMap[T["type"]]> {
  const map = new WeakMap<Deno.lint.Node, TSESTree.Node>();
  const lines = calcLineStarts(source);

  function toNode(node: Deno.lint.Node) {
    const target = {
      type: node.type,
      range: node.range,
      loc: loc(lines, node.range),
    } as TSESTree.Node;

    map.set(node, target);

    const properties = definition[node.type](node, { toNode });

    Object.assign(target, properties);

    if ("parent" in node) {
      const parent = map.get(node.parent);

      target.parent = parent;
    }

    return target;
  }

  const tsNode = toNode(node);

  return {
    node: tsNode,
    map,
  };
}

function calcLineStarts(source: string): number[] {
  const starts = [0];

  for (let i = 0; i < source.length; i++) {
    if (source[i] === "\n") {
      starts.push(i + 1);
    }
  }

  return starts;
}

function findLine(lines: readonly number[], offset: number): number {
  let low = 0;
  let high = lines.length - 1;

  while (low <= high) {
    const mid = (low + high) >>> 1;

    if (lines[mid] <= offset) {
      low = mid + 1;
    } else {
      high = mid - 1;
    }
  }

  return high;
}

function loc(
  lines: readonly number[],
  range: readonly [number, number],
): SourceLocation {
  return {
    start: position(lines, range[0]),
    end: position(lines, range[1]),
  };
}

type Position = {
  line: number;
  column: number;
};

type SourceLocation = {
  start: Position;
  end: Position;
};

function position(lines: readonly number[], offset: number): Position {
  const line = findLine(lines, offset);
  const lineStart = lines[line];

  return {
    line: line + 1,
    column: offset - lineStart,
  };
}
