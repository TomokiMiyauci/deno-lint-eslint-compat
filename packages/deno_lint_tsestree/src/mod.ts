import {
  AST_NODE_TYPES as Type,
  AST_TOKEN_TYPES as Token,
  TSESTree,
} from "@typescript-eslint/types";

export { TSESTree } from "@typescript-eslint/types";

const definition = {
  Program: (node: Deno.lint.Program, context): TSESTree.Program => {
    const body = node.body.map(context.toNode);
    const comments = node.comments.map(context.toNode);

    return {
      type: Type.Program,
      body,
      sourceType: node.sourceType,
      comments,
      range: node.range,
      tokens: undefined,
      loc: context.loc(node),
    };
  },

  ArrayExpression: (
    node: Deno.lint.ArrayExpression,
    context,
  ): TSESTree.ArrayExpression => {
    const elements = node.elements.map(context.toNode);

    return {
      type: Type.ArrayExpression,
      elements,
    };
  },

  AccessorProperty: (
    node: Deno.lint.AccessorProperty,
    context,
  ): TSESTree.AccessorProperty => {
    const value = node.value && context.toNode(node.value);
    const key = context.toNode(node.key);
    const decorators = node.decorators.map(context.toNode);

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
  },

  ArrayPattern: (
    node: Deno.lint.ArrayPattern,
    context,
  ): TSESTree.ArrayPattern => {
    const elements = node.elements.map((node) => {
      if (node === null) return null;
      return context.toNode(node);
    });
    const typeAnnotation = node.typeAnnotation &&
      context.toNode(node.typeAnnotation);

    return createNode({
      type: Type.ArrayPattern,
      elements,
      optional: node.optional,
      typeAnnotation,
      decorators: [], // TODo
    }, node);
  },

  ArrowFunctionExpression: (
    node: Deno.lint.ArrowFunctionExpression,
    context,
  ): TSESTree.ArrowFunctionExpression => {
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

      return createNode(
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

    const body = context.toNode(node.body);

    return createNode(
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
  },

  AssignmentExpression: (
    node: Deno.lint.AssignmentExpression,
    context,
  ): TSESTree.AssignmentExpression => {
    const left = context.toNode(node.left);
    const right = context.toNode(node.right);

    return createNode({
      type: Type.AssignmentExpression,
      left,
      operator: node.operator,
      right,
    }, node);
  },

  AwaitExpression: (
    node: Deno.lint.AwaitExpression,
    context,
  ): TSESTree.AwaitExpression => {
    const argument = context.toNode(node.argument);

    return createNode({
      type: Type.AwaitExpression,
      argument,
    }, node);
  },

  BinaryExpression: (
    node: Deno.lint.BinaryExpression,
    context,
  ): TSESTree.BinaryExpression => {
    const right = context.toNode(node.right);

    if (node.operator === "in" && node.left.type === "PrivateIdentifier") {
      const left = context.toNode(node.left);

      return createNode({
        type: Type.BinaryExpression,
        left,
        right,
        operator: node.operator,
      }, node);
    }

    if (node.left.type === "PrivateIdentifier") {
      throw new Error("semantic error");
    }

    const left = context.toNode(node.left);

    return createNode({
      type: Type.BinaryExpression,
      left,
      right,
      operator: node.operator,
    }, node);
  },

  BlockStatement: (
    node: Deno.lint.BlockStatement,
    context,
  ): TSESTree.BlockStatement => {
    const body = node.body.map(context.toNode);

    return createNode({
      type: Type.BlockStatement,
      body,
    }, node);
  },

  BreakStatement: (
    node: Deno.lint.BreakStatement,
    context,
  ): TSESTree.BreakStatement => {
    const label = node.label && context.toNode(node.label);

    return createNode({
      type: Type.BreakStatement,
      label,
    }, node);
  },

  CallExpression: (
    node: Deno.lint.CallExpression,
    context,
  ): TSESTree.CallExpression => {
    const $arguments = node.arguments.map(
      context.toNode,
    );
    const callee = context.toNode(node.callee);
    const typeArguments = node.typeArguments &&
      context.toNode(node.typeArguments);

    return createNode({
      type: Type.CallExpression,
      arguments: $arguments,
      callee,
      optional: node.optional,
      typeArguments: typeArguments ?? undefined,
    }, node);
  },

  ChainExpression: (
    node: Deno.lint.ChainExpression,
    context,
  ): TSESTree.ChainExpression => {
    const expression = context.toNode(node.expression);

    return createNode({
      type: Type.ChainExpression,
      expression,
    }, node);
  },

  ClassExpression: (
    node: Deno.lint.ClassExpression,
    context,
  ): TSESTree.ClassExpression => {
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

    return createNode({
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
  },

  ConditionalExpression: (
    node: Deno.lint.ConditionalExpression,
    context,
  ): TSESTree.ConditionalExpression => {
    const alternate = context.toNode(node.alternate);
    const consequent = context.toNode(node.consequent);
    const test = context.toNode(node.test);

    return createNode({
      type: Type.ConditionalExpression,
      alternate,
      consequent,
      test,
    }, node);
  },

  FunctionExpression: (
    node: Deno.lint.FunctionExpression,
    context,
  ): TSESTree.FunctionExpression => {
    const body = context.toNode(node.body);
    const id = node.id && context.toNode(node.id);
    const params = node.params.map(context.toNode);
    const returnType = node.returnType &&
      context.toNode(node.returnType);
    const typeParameters = node.typeParameters &&
      context.toNode(node.typeParameters);

    return createNode({
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
  },

  Identifier: (node: Deno.lint.Identifier, context): TSESTree.Identifier => {
    const typeAnnotation = node.typeAnnotation &&
      context.toNode(node.typeAnnotation);

    return createNode({
      type: Type.Identifier,
      name: node.name,
      decorators: [], // TODO
      optional: node.optional,
      typeAnnotation,
    }, node);
  },

  ImportExpression: (
    node: Deno.lint.ImportExpression,
    context,
  ): TSESTree.ImportExpression => {
    const source = context.toNode(node.source);
    const options = node.options && context.toNode(node.options);

    return createNode({
      type: Type.ImportExpression,
      source,
      options,
      attributes: options,
      phase: null, // TODO dynamic source phase import
    }, node);
  },

  JSXElement: (node: Deno.lint.JSXElement, context): TSESTree.JSXElement => {
    const closingElement = node.closingElement &&
      context.toNode(node.closingElement);
    const openingElement = context.toNode(node.openingElement);
    const children = node.children.map(context.toNode);

    return createNode({
      type: Type.JSXElement,
      closingElement,
      openingElement,
      children,
    }, node);
  },

  JSXFragment: (node: Deno.lint.JSXFragment, context): TSESTree.JSXFragment => {
    const closingFragment = context.toNode(node.closingFragment);
    const openingFragment = context.toNode(node.openingFragment);
    const children = node.children.map(context.toNode);

    return createNode({
      type: Type.JSXFragment,
      closingFragment,
      openingFragment,
      children,
    }, node);
  },

  Literal: (node: Deno.lint.Literal, context): TSESTree.Literal => {
    return {
      ...node,
      type: Type.Literal,
      loc: {} as any,
      parent: {} as any,
    };
  },

  LogicalExpression: (
    node: Deno.lint.LogicalExpression,
    context,
  ): TSESTree.LogicalExpression => {
    const left = context.toNode(node.left);
    const right = context.toNode(node.right);

    return createNode({
      type: Type.LogicalExpression,
      left,
      operator: node.operator,
      right,
    }, node);
  },

  MemberExpression: (
    node: Deno.lint.MemberExpression,
    context,
  ): TSESTree.MemberExpression => {
    const object = context.toNode(node.object);

    if (
      node.computed &&
      !(node.property.type === "Identifier" ||
        node.property.type === "PrivateIdentifier")
    ) {
      const property = context.toNode(node.property);

      return createNode({
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
      const property = context.toNode(node.property);

      return createNode({
        type: Type.MemberExpression,
        computed: node.computed,
        object,
        optional: node.optional,
        property,
      }, node);
    }

    throw new Error("semantic error");
  },

  MetaProperty: (
    node: Deno.lint.MetaProperty,
    context,
  ): TSESTree.MetaProperty => {
    const meta = context.toNode(node.meta);
    const property = context.toNode(node.property);

    return createNode({
      type: Type.MetaProperty,
      meta,
      property,
      range: node.range,
      loc: context.loc(node),
    }, node);
  },

  NewExpression: (
    node: Deno.lint.NewExpression,
    context,
  ): TSESTree.NewExpression => {
    const $arguments = node.arguments.map(context.toNode);

    const callee = context.toNode(node.callee);
    const typeArguments = node.typeArguments &&
      context.toNode(node.typeArguments);

    return createNode({
      type: Type.NewExpression,
      arguments: $arguments,
      callee,
      typeArguments,
    }, node);
  },

  ObjectExpression: (
    node: Deno.lint.ObjectExpression,
    context,
  ): TSESTree.ObjectExpression => {
    const properties = node.properties.map(context.toNode);
    return createNode({
      type: Type.ObjectExpression,
      properties,
    }, node);
  },

  ObjectPattern: (
    node: Deno.lint.ObjectPattern,
    context,
  ): TSESTree.ObjectPattern => {
    const properties = node.properties.map(context.toNode);
    const typeAnnotation = node.typeAnnotation &&
      context.toNode(node.typeAnnotation);

    return createNode({
      type: Type.ObjectPattern,
      properties,
      decorators: [], // TODO
      optional: node.optional,
      typeAnnotation,
    }, node);
  },

  SequenceExpression: (
    node: Deno.lint.SequenceExpression,
    context,
  ): TSESTree.SequenceExpression => {
    const expressions = node.expressions.map(context.toNode);
    return createNode({
      type: Type.SequenceExpression,
      expressions,
    }, node);
  },

  Super: (node: Deno.lint.Super, context): TSESTree.Super => {
    return createNode({
      type: Type.Super,
    }, node);
  },

  TaggedTemplateExpression: (
    node: Deno.lint.TaggedTemplateExpression,
    context,
  ): TSESTree.TaggedTemplateExpression => {
    const quasi = context.toNode(node.quasi);
    const tag = context.toNode(node.tag);
    const typeArguments = node.typeArguments &&
      context.toNode(node.typeArguments);

    return createNode({
      type: Type.TaggedTemplateExpression,
      quasi,
      tag,
      typeArguments,
    }, node);
  },

  TemplateLiteral: (
    node: Deno.lint.TemplateLiteral,
    context,
  ): TSESTree.TemplateLiteral => {
    const expressions = node.expressions.map(context.toNode);
    const quasis = node.quasis.map(context.toNode);

    return createNode({
      type: Type.TemplateLiteral,
      expressions,
      quasis,
    }, node);
  },

  ThisExpression: (
    node: Deno.lint.ThisExpression,
    context,
  ): TSESTree.ThisExpression => {
    return createNode({
      type: Type.ThisExpression,
    }, node);
  },

  TSAsExpression: (
    node: Deno.lint.TSAsExpression,
    context,
  ): TSESTree.TSAsExpression => {
    const expression = context.toNode(node.expression);
    const typeAnnotation = context.toNode(node.typeAnnotation);

    return createNode({
      type: Type.TSAsExpression,
      expression,
      typeAnnotation,
    }, node);
  },

  TSInstantiationExpression: (
    node: Deno.lint.TSInstantiationExpression,
    context,
  ): TSESTree.TSInstantiationExpression => {
    const expression = context.toNode(node.expression);
    const typeArguments = context.toNode(
      node.typeArguments,
    );

    return createNode({
      type: Type.TSInstantiationExpression,
      expression,
      typeArguments,
    }, node);
  },

  TSNonNullExpression: (
    node: Deno.lint.TSNonNullExpression,
    context,
  ): TSESTree.TSNonNullExpression => {
    const expression = context.toNode(node.expression);

    return createNode({
      type: Type.TSNonNullExpression,
      expression,
    }, node);
  },

  TSSatisfiesExpression: (
    node: Deno.lint.TSSatisfiesExpression,
    context,
  ): TSESTree.TSSatisfiesExpression => {
    const expression = context.toNode(node.expression);
    const typeAnnotation = context.toNode(node.typeAnnotation);

    return createNode({
      type: Type.TSSatisfiesExpression,
      expression,
      typeAnnotation,
    }, node);
  },

  TSTypeAssertion: (
    node: Deno.lint.TSTypeAssertion,
    context,
  ): TSESTree.TSTypeAssertion => {
    const expression = context.toNode(node.expression);
    const typeAnnotation = context.toNode(node.typeAnnotation);

    return createNode({
      type: Type.TSTypeAssertion,
      expression,
      typeAnnotation,
    }, node);
  },

  UnaryExpression: (
    node: Deno.lint.UnaryExpression,
    context,
  ): TSESTree.UnaryExpression => {
    const argument = context.toNode(node.argument);

    return createNode({
      type: Type.UnaryExpression,
      argument,
      operator: node.operator,
      prefix: true,
    }, node);
  },

  UpdateExpression: (
    node: Deno.lint.UpdateExpression,
    context,
  ): TSESTree.UpdateExpression => {
    const argument = context.toNode(node.argument);

    return createNode({
      type: Type.UpdateExpression,
      argument,
      operator: node.operator,
      prefix: node.prefix,
    }, node);
  },

  YieldExpression: (
    node: Deno.lint.YieldExpression,
    context,
  ): TSESTree.YieldExpression => {
    const argument = node.argument && context.toNode(node.argument);

    if (node.delegate) {
      if (!argument) throw new Error("semantic error");

      return createNode({
        type: Type.YieldExpression,
        delegate: node.delegate,
        argument,
      }, node);
    }

    return createNode({
      type: Type.YieldExpression,
      argument,
      delegate: node.delegate,
    }, node);
  },

  ClassDeclaration: (
    node: Deno.lint.ClassDeclaration,
    context,
  ): TSESTree.ClassDeclaration => {
    const body = context.toNode(node.body);
    if (!node.id) throw new Error();

    const id = context.toNode(node.id);
    const $implements = node.implements.map(
      context.toNode,
    );
    const superClass = node.superClass && context.toNode(node.superClass);

    return createNode({
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
  },

  ContinueStatement: (
    node: Deno.lint.ContinueStatement,
    context,
  ): TSESTree.ContinueStatement => {
    const label = node.label && context.toNode(node.label);

    return createNode({
      type: Type.ContinueStatement,
      label,
    }, node);
  },

  DebuggerStatement: (
    node: Deno.lint.DebuggerStatement,
    context,
  ): TSESTree.DebuggerStatement => {
    return createNode({
      type: Type.DebuggerStatement,
    }, node);
  },

  DoWhileStatement: (
    node: Deno.lint.DoWhileStatement,
    context,
  ): TSESTree.DoWhileStatement => {
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

    return createNode({
      type: Type.DoWhileStatement,
      body,
      test,
    }, node);
  },

  ExportAllDeclaration: (
    node: Deno.lint.ExportAllDeclaration,
    context,
  ): TSESTree.ExportAllDeclaration => {
    const attributes = node.attributes.map(context.toNode);
    const exported = node.exported && context.toNode(node.exported);
    const source = context.toNode(node.source);

    return createNode({
      type: Type.ExportAllDeclaration,
      attributes,
      exported,
      source,
      exportKind: node.exportKind,
      assertions: attributes, // TODO
    }, node);
  },

  ExportDefaultDeclaration: (
    node: Deno.lint.ExportDefaultDeclaration,
    context,
  ): TSESTree.ExportDefaultDeclaration => {
    if (node.exportKind === "type") throw new Error("semantic error");

    const declaration = context.toNode(node.declaration);

    return createNode({
      type: Type.ExportDefaultDeclaration,
      declaration,
      exportKind: node.exportKind,
    }, node);
  },

  ExportNamedDeclaration: (
    node: Deno.lint.ExportNamedDeclaration,
    context,
  ): TSESTree.ExportNamedDeclaration => {
    throw new Error();

    const attributes = node.attributes.map(context.toNode);
    const declaration = exportNamedDeclarationDeclaration2Declaration(
      node.declaration,
      mapper,
    );
    const specifiers = node.specifiers.map(context.toNode);

    return createNode({
      type: Type.ExportNamedDeclaration,
      attributes,
      declaration,
      specifiers,
    }, node);
  },

  ExpressionStatement: (
    node: Deno.lint.ExpressionStatement,
    context,
  ): TSESTree.ExpressionStatement => {
    const expression = context.toNode(node.expression);

    return createNode({
      type: Type.ExpressionStatement,
      expression,
    }, node);
  },

  ForInStatement: (
    node: Deno.lint.ForInStatement,
    context,
  ): TSESTree.ForInStatement => {
    throw new Error();

    const body = context.toNode(node.body);
    const left = node.left.type === "VariableDeclaration"
      ? context.toNode(node.left)
      : context.toNode(node.left);
    const right = context.toNode(node.right);

    return createNode({
      type: Type.ForInStatement,
      body,
      left,
      right,
    }, node);
  },

  ForOfStatement: (
    node: Deno.lint.ForOfStatement,
    context,
  ): TSESTree.ForOfStatement => {
    throw new Error();
    const body = context.toNode(node.body);
    const left = node.left.type === "VariableDeclaration"
      ? context.toNode(node.left)
      : context.toNode(node.left);
    const right = context.toNode(node.right);

    return createNode({
      type: Type.ForOfStatement,
      body,
      await: node.await,
      left,
      right,
    }, node);
  },

  ForStatement: (
    node: Deno.lint.ForStatement,
    context,
  ): TSESTree.ForStatement => {
    throw new Error();
    const body = context.toNode(node.body);
    const init = node.init && context.toNode(node);
    const test = node.test && context.toNode(node.test);
    const update = node.update && context.toNode(node.update);

    return createNode({
      type: Type.ForStatement,
      body,
      init: init ?? null,
      test,
      update,
    }, node);
  },

  FunctionDeclaration: (
    node: Deno.lint.FunctionDeclaration,
    context,
  ): TSESTree.FunctionDeclaration => {
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

    return createNode({
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
  },

  IfStatement: (node: Deno.lint.IfStatement, context): TSESTree.IfStatement => {
    const alternate = node.alternate && context.toNode(node.alternate);
    const consequent = context.toNode(node.consequent);
    const test = context.toNode(node.test);

    return createNode({
      type: Type.IfStatement,
      alternate,
      consequent,
      test,
    }, node);
  },

  ImportDeclaration: (
    node: Deno.lint.ImportDeclaration,
    context,
  ): TSESTree.ImportDeclaration => {
    const attributes = node.attributes.map(context.toNode);
    const source = context.toNode(node.source);
    const specifiers = node.specifiers.map(context.toNode);
    return createNode({
      type: Type.ImportDeclaration,
      attributes,
      source,
      specifiers,
      assertions: attributes,
      importKind: node.importKind,
      phase: null, // TODO
    }, node);
  },

  LabeledStatement: (
    node: Deno.lint.LabeledStatement,
    context,
  ): TSESTree.LabeledStatement => {
    const body = context.toNode(node.body);
    const label = context.toNode(node.label);

    return createNode({
      type: Type.LabeledStatement,
      body,
      label,
    }, node);
  },

  ReturnStatement: (
    node: Deno.lint.ReturnStatement,
    context,
  ): TSESTree.ReturnStatement => {
    const argument = node.argument && context.toNode(node.argument);

    return createNode({
      type: Type.ReturnStatement,

      argument,
    }, node);
  },

  SwitchStatement: (
    node: Deno.lint.SwitchStatement,
    context,
  ): TSESTree.SwitchStatement => {
    const cases = node.cases.map(context.toNode);
    const discriminant = context.toNode(node.discriminant);

    return createNode({
      type: Type.SwitchStatement,
      cases,
      discriminant,
    }, node);
  },

  ThrowStatement: (
    node: Deno.lint.ThrowStatement,
    context,
  ): TSESTree.ThrowStatement => {
    const argument = context.toNode(node.argument);

    return createNode({
      type: Type.ThrowStatement,
      argument,
    }, node);
  },

  TryStatement: (
    node: Deno.lint.TryStatement,
    context,
  ): TSESTree.TryStatement => {
    const block = context.toNode(node.block);
    const finalizer = node.finalizer && context.toNode(node.finalizer);
    const handler = node.handler && context.toNode(node.handler);

    return createNode({
      type: Type.TryStatement,
      block,
      finalizer,
      handler,
    }, node);
  },

  TSDeclareFunction: (
    node: Deno.lint.TSDeclareFunction,
    context,
  ): TSESTree.TSDeclareFunction => {
    throw new Error();

    return createNode({
      type: Type.TSDeclareFunction,
      async: node.async,
    }, node);
  },

  TSEnumDeclaration: (
    node: Deno.lint.TSEnumDeclaration,
    context,
  ): TSESTree.TSEnumDeclaration => {
    const body = context.toNode(node.body);
    const id = context.toNode(node.id);

    return createNode({
      type: Type.TSEnumDeclaration,
      body,
      const: node.const,
      declare: node.declare,
      id,
      members: body.members,
    }, node);
  },

  TSExportAssignment: (
    node: Deno.lint.TSExportAssignment,
    context,
  ): TSESTree.TSExportAssignment => {
    const expression = context.toNode(node.expression);

    return createNode({
      type: Type.TSExportAssignment,
      expression,
    }, node);
  },

  TSImportEqualsDeclaration: (
    node: Deno.lint.TSImportEqualsDeclaration,
    context,
  ): TSESTree.TSImportEqualsDeclaration => {
    const id = context.toNode(node.id);
    const moduleReference = context.toNode(
      node.moduleReference,
    );

    return createNode({
      type: Type.TSImportEqualsDeclaration,
      id,
      importKind: node.importKind,
      moduleReference,
    }, node);
  },

  TSInterfaceDeclaration: (
    node: Deno.lint.TSInterfaceDeclaration,
    context,
  ): TSESTree.TSInterfaceDeclaration => {
    const body = context.toNode(node.body);
    const id = context.toNode(node.id);
    const typeParameters = node.typeParameters &&
      context.toNode(node.typeParameters);
    const $extends = node.extends.map(context.toNode);

    return createNode({
      type: Type.TSInterfaceDeclaration,
      body,
      declare: node.declare,
      id,
      typeParameters,
      extends: $extends,
    }, node);
  },

  TSModuleDeclaration: (
    node: Deno.lint.TSModuleDeclaration,
    context,
  ): TSESTree.TSModuleDeclaration => {
    throw new Error();
  },

  TSNamespaceExportDeclaration: (
    node: Deno.lint.TSNamespaceExportDeclaration,
    context,
  ): TSESTree.TSNamespaceExportDeclaration => {
    throw new Error();
  },

  TSTypeAliasDeclaration: (
    node: Deno.lint.TSTypeAliasDeclaration,
    context,
  ): TSESTree.TSTypeAliasDeclaration => {
    const id = context.toNode(node.id);
    const typeAnnotation = context.toNode(node.typeAnnotation);
    const typeParameters = node.typeParameters &&
      context.toNode(node.typeParameters);

    return createNode({
      type: Type.TSTypeAliasDeclaration,
      declare: node.declare,
      id,
      typeAnnotation,
      typeParameters,
    }, node);
  },

  VariableDeclaration: (
    node: Deno.lint.VariableDeclaration,
    context,
  ): TSESTree.VariableDeclaration => {
    const declarations = node.declarations.map(context.toNode);

    return createNode({
      type: Type.VariableDeclaration,
      declarations,
      kind: node.kind,
    }, node);
  },

  WhileStatement: (
    node: Deno.lint.WhileStatement,
    context,
  ): TSESTree.WhileStatement => {
    const body = context.toNode(node.body);
    const test = context.toNode(node.test);

    return createNode({
      type: Type.WhileStatement,
      body,
      test,
    }, node);
  },

  WithStatement: (
    node: Deno.lint.WithStatement,
    context,
  ): TSESTree.WithStatement => {
    const body = context.toNode(node.body);
    const object = context.toNode(node.object);

    return createNode({
      type: Type.WithStatement,
      body,
      object,
    }, node);
  },

  TSAnyKeyword: (
    node: Deno.lint.TSAnyKeyword,
    context,
  ): TSESTree.TSAnyKeyword => {
    return createNode({
      type: Type.TSAnyKeyword,
    }, node);
  },

  TSArrayType: (node: Deno.lint.TSArrayType, context): TSESTree.TSArrayType => {
    const elementType = context.toNode(node.elementType);

    return createNode({
      type: Type.TSArrayType,
      elementType,
    }, node);
  },

  TSBigIntKeyword: (
    node: Deno.lint.TSBigIntKeyword,
    context,
  ): TSESTree.TSBigIntKeyword => {
    return createNode({
      type: Type.TSBigIntKeyword,
    }, node);
  },

  TSBooleanKeyword: (
    node: Deno.lint.TSBooleanKeyword,
    context,
  ): TSESTree.TSBooleanKeyword => {
    return createNode({
      type: Type.TSBooleanKeyword,
    }, node);
  },

  TSConditionalType: (
    node: Deno.lint.TSConditionalType,
    context,
  ): TSESTree.TSConditionalType => {
    const checkType = context.toNode(node.checkType);
    const extendsType = context.toNode(node.extendsType);
    const falseType = context.toNode(node.falseType);
    const trueType = context.toNode(node.trueType);

    return createNode({
      type: Type.TSConditionalType,
      checkType,
      extendsType,
      falseType,
      trueType,
    }, node);
  },

  TSFunctionType: (
    node: Deno.lint.TSFunctionType,
    context,
  ): TSESTree.TSFunctionType => {
    const params = node.params.map(context.toNode);
    const returnType = node.returnType &&
      context.toNode(node.returnType);
    const typeParameters = node.typeParameters &&
      context.toNode(node.typeParameters);

    return createNode({
      type: Type.TSFunctionType,
      params,
      returnType,
      typeParameters,
    }, node);
  },

  TSImportType: (
    node: Deno.lint.TSImportType,
    context,
  ): TSESTree.TSImportType => {
    throw new Error();
    const argument = context.toNode(node.argument);
    const qualifier = node.qualifier && context.toNode(node.qualifier);
    const typeArguments = node.typeArguments &&
      context.toNode(node.typeArguments);

    return createNode({
      type: Type.TSImportType,
      argument,
      qualifier,
      typeArguments,
    }, node);
  },

  TSIndexedAccessType: (
    node: Deno.lint.TSIndexedAccessType,
    context,
  ): TSESTree.TSIndexedAccessType => {
    const indexType = context.toNode(node.indexType);
    const objectType = context.toNode(node.objectType);

    return createNode({
      type: Type.TSIndexedAccessType,
      indexType,
      objectType,
    }, node);
  },

  TSInferType: (node: Deno.lint.TSInferType, context): TSESTree.TSInferType => {
    const typeParameter = context.toNode(node.typeParameter);

    return createNode({
      type: Type.TSInferType,
      typeParameter,
    }, node);
  },

  TSIntersectionType: (
    node: Deno.lint.TSIntersectionType,
    context,
  ): TSESTree.TSIntersectionType => {
    const types = node.types.map(context.toNode);

    return createNode({
      type: Type.TSIntersectionType,
      types,
    }, node);
  },

  TSIntrinsicKeyword: (
    node: Deno.lint.TSIntrinsicKeyword,
    context,
  ): TSESTree.TSIntrinsicKeyword => {
    return createNode({
      type: Type.TSIntrinsicKeyword,
    }, node);
  },

  TSLiteralType: (
    node: Deno.lint.TSLiteralType,
    context,
  ): TSESTree.TSLiteralType => {
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

    return createNode({
      type: Type.TSLiteralType,
      literal,
    }, node);
  },

  TSMappedType: (
    node: Deno.lint.TSMappedType,
    context,
  ): TSESTree.TSMappedType => {
    const constraint = context.toNode(node.constraint);
    const key = context.toNode(node.key);
    const nameType = node.nameType && context.toNode(node.nameType);
    const typeAnnotation = node.typeAnnotation &&
      context.toNode(node.typeAnnotation);

    return createNode({
      type: Type.TSMappedType,
      constraint,
      key,
      nameType,
      typeAnnotation,
      optional: node.optional,
      readonly: node.readonly,
    }, node);
  },

  TSNamedTupleMember: (
    node: Deno.lint.TSNamedTupleMember,
    context,
  ): TSESTree.TSNamedTupleMember => {
    throw new Error();
    return createNode({
      type: Type.TSNamedTupleMember,
    }, node);
  },

  TSNeverKeyword: (
    node: Deno.lint.TSNeverKeyword,
    context,
  ): TSESTree.TSNeverKeyword => {
    return createNode({
      type: Type.TSNeverKeyword,
    }, node);
  },

  TSNullKeyword: (
    node: Deno.lint.TSNullKeyword,
    context,
  ): TSESTree.TSNullKeyword => {
    return createNode({
      type: Type.TSNullKeyword,
    }, node);
  },

  TSNumberKeyword: (
    node: Deno.lint.TSNumberKeyword,
    context,
  ): TSESTree.TSNumberKeyword => {
    return createNode({
      type: Type.TSNumberKeyword,
    }, node);
  },

  TSObjectKeyword: (
    node: Deno.lint.TSObjectKeyword,
    context,
  ): TSESTree.TSObjectKeyword => {
    return createNode({
      type: Type.TSObjectKeyword,
    }, node);
  },

  TSOptionalType: (
    node: Deno.lint.TSOptionalType,
    context,
  ): TSESTree.TSOptionalType => {
    throw new Error();

    return createNode({
      type: Type.TSOptionalType,
    }, node);
  },

  TSQualifiedName: (
    node: Deno.lint.TSQualifiedName,
    context,
  ): TSESTree.TSQualifiedName => {
    throw new Error();

    return createNode({
      type: Type.TSQualifiedName,
    }, node);
  },

  TSRestType: (node: Deno.lint.TSRestType, context): TSESTree.TSRestType => {
    throw new Error();
    return createNode({
      type: Type.TSRestType,
    }, node);
  },

  TSStringKeyword: (
    node: Deno.lint.TSStringKeyword,
    context,
  ): TSESTree.TSStringKeyword => {
    return createNode({
      type: Type.TSStringKeyword,
    }, node);
  },

  TSSymbolKeyword: (
    node: Deno.lint.TSSymbolKeyword,
    context,
  ): TSESTree.TSSymbolKeyword => {
    return createNode({
      type: Type.TSSymbolKeyword,
    }, node);
  },

  TSTemplateLiteralType: (
    node: Deno.lint.TSTemplateLiteralType,
    context,
  ): TSESTree.TSTemplateLiteralType => {
    throw new Error();
    return createNode({
      type: Type.TSTemplateLiteralType,
    }, node);
  },

  TSThisType: (node: Deno.lint.TSThisType, context): TSESTree.TSThisType => {
    return createNode({
      type: Type.TSThisType,
    }, node);
  },

  TSTupleType: (node: Deno.lint.TSTupleType, context): TSESTree.TSTupleType => {
    throw new Error();
    return createNode({
      type: Type.TSTupleType,
    }, node);
  },

  TSTypeLiteral: (
    node: Deno.lint.TSTypeLiteral,
    context,
  ): TSESTree.TSTypeLiteral => {
    const members = node.members.map(context.toNode);

    return createNode({
      type: Type.TSTypeLiteral,
      members,
    }, node);
  },

  TSTypeOperator: (
    node: Deno.lint.TSTypeOperator,
    context,
  ): TSESTree.TSTypeOperator => {
    const typeAnnotation = context.toNode(node.typeAnnotation);

    return createNode({
      type: Type.TSTypeOperator,
      operator: node.operator,
      typeAnnotation,
    }, node);
  },

  TSTypePredicate: (
    node: Deno.lint.TSTypePredicate,
    context,
  ): TSESTree.TSTypePredicate => {
    const parameterName = context.toNode(node.parameterName);

    if (!node.asserts) {
      if (!node.typeAnnotation) throw new Error("semantic error");

      const typeAnnotation = context.toNode(node.typeAnnotation);

      return createNode({
        type: Type.TSTypePredicate,
        asserts: node.asserts,
        typeAnnotation,
        parameterName,
      }, node);
    }

    const typeAnnotation = node.typeAnnotation &&
      context.toNode(node.typeAnnotation);

    return createNode({
      type: Type.TSTypePredicate,
      asserts: node.asserts,
      typeAnnotation: typeAnnotation ?? null,
      parameterName,
    }, node);
  },

  TSTypeQuery: (node: Deno.lint.TSTypeQuery, context): TSESTree.TSTypeQuery => {
    throw new Error();
    return createNode({
      type: Type.TSTypeQuery,
    }, node);
  },

  TSTypeReference: (
    node: Deno.lint.TSTypeReference,
    context,
  ): TSESTree.TSTypeReference => {
    const typeArguments = node.typeArguments &&
      context.toNode(node.typeArguments);
    const typeName = context.toNode(node.typeName);

    return createNode({
      type: Type.TSTypeReference,
      typeArguments,
      typeName,
    }, node);
  },

  TSUndefinedKeyword: (
    node: Deno.lint.TSUndefinedKeyword,
    context,
  ): TSESTree.TSUndefinedKeyword => {
    return createNode({
      type: Type.TSUndefinedKeyword,
    }, node);
  },

  TSUnionType: (node: Deno.lint.TSUnionType, context): TSESTree.TSUnionType => {
    const types = node.types.map(context.toNode);

    return createNode({
      type: Type.TSUnionType,
      types,
    }, node);
  },

  TSUnknownKeyword: (
    node: Deno.lint.TSUnknownKeyword,
    context,
  ): TSESTree.TSUnknownKeyword => {
    return createNode({
      type: Type.TSUnknownKeyword,
    }, node);
  },

  TSVoidKeyword: (
    node: Deno.lint.TSVoidKeyword,
    context,
  ): TSESTree.TSVoidKeyword => {
    return createNode({
      type: Type.TSVoidKeyword,
    }, node);
  },

  ImportSpecifier: (
    node: Deno.lint.ImportSpecifier,
    context,
  ): TSESTree.ImportSpecifier => {
    const imported = context.toNode(node.imported);
    const local = context.toNode(node.local);

    if (imported.type === Type.Literal) {
      if (typeof imported.value !== "string") {
        throw new Error();
      }
    }

    return createNode({
      type: Type.ImportSpecifier,
      imported,
      local,
      importKind: node.importKind,
    }, node);
  },

  ImportDefaultSpecifier: (
    node: Deno.lint.ImportDefaultSpecifier,
    context,
  ): TSESTree.ImportDefaultSpecifier => {
    const local = context.toNode(node.local);

    return createNode({
      type: Type.ImportDefaultSpecifier,
      local,
    }, node);
  },

  ImportNamespaceSpecifier: (
    node: Deno.lint.ImportNamespaceSpecifier,
    context,
  ): TSESTree.ImportNamespaceSpecifier => {
    const local = context.toNode(node.local);

    return createNode({
      type: Type.ImportNamespaceSpecifier,
      local,
    }, node);
  },

  ImportAttribute: (
    node: Deno.lint.ImportAttribute,
    context,
  ): TSESTree.ImportAttribute => {
    const key = context.toNode(node.key);
    const value = context.toNode(node.value);

    return createNode({
      type: Type.ImportAttribute,
      key,
      value,
    }, node);
  },

  TSExternalModuleReference: (
    node: Deno.lint.TSExternalModuleReference,
    context,
  ): TSESTree.TSExternalModuleReference => {
    const expression = context.toNode(node.expression);

    return createNode({
      type: Type.TSExternalModuleReference,
      expression,
    }, node);
  },

  ExportSpecifier: (
    node: Deno.lint.ExportSpecifier,
    context,
  ): TSESTree.ExportSpecifier => {
    const exported = context.toNode(node.exported);
    const local = context.toNode(node.local);

    return createNode({
      type: Type.ExportSpecifier,
      exported,
      local,
    }, node);
  },

  VariableDeclarator: (
    node: Deno.lint.VariableDeclarator,
    context,
  ): TSESTree.VariableDeclarator => {
    const init = node.init && context.toNode(node.init);
    const id = context.toNode(node.id);

    return createNode({
      type: Type.VariableDeclarator,
      id,
      init,
    }, node);
  },

  Decorator: (node: Deno.lint.Decorator, context): TSESTree.Decorator => {
    const expression = context.toNode(node.expression);

    return createNode({
      type: Type.Decorator,
      expression,
    }, node);
  },

  ClassBody: (node: Deno.lint.ClassBody, context): TSESTree.ClassBody => {
    const body = node.body.map(context.toNode);

    return createNode({
      type: Type.ClassBody,
      body,
    }, node);
  },

  StaticBlock: (node: Deno.lint.StaticBlock, context): TSESTree.StaticBlock => {
    const body = node.body.map(context.toNode);

    return createNode({
      type: Type.StaticBlock,
      body,
    }, node);
  },

  PropertyDefinition: (
    node: Deno.lint.PropertyDefinition,
    context,
  ): TSESTree.PropertyDefinition => {
    throw new Error();
    const key = context.toNode(node.key);

    return createNode({
      type: Type.PropertyDefinition,
      computed: node.computed,
      key,
      static: node.static,
    }, node);
  },

  MethodDefinition: (
    node: Deno.lint.MethodDefinition,
    context,
  ): TSESTree.MethodDefinition => {
    const key = context.toNode(node.key);
    const value = context.toNode(node.value);
    const decorators = node.decorators.map(context.toNode);

    return createNode({
      type: Type.MethodDefinition,
      computed: node.computed,
      key,
      kind: node.kind,
      static: node.static,
      value,
      decorators,
    }, node);
  },

  SwitchCase: (node: Deno.lint.SwitchCase, context): TSESTree.SwitchCase => {
    const consequent = node.consequent.map(context.toNode);

    return createNode({
      type: Type.SwitchCase,
      consequent,
    }, node);
  },

  CatchClause: (node: Deno.lint.CatchClause, context): TSESTree.CatchClause => {
    return createNode({
      type: Type.CatchClause,
    }, node);
  },

  TemplateElement: (
    node: Deno.lint.TemplateElement,
    context,
  ): TSESTree.TemplateElement => {
    return createNode({
      type: Type.TemplateElement,
      tail: node.tail,
      value: {
        cooked: node.cooked,
        raw: node.raw,
      },
    }, node);
  },

  PrivateIdentifier: (
    node: Deno.lint.PrivateIdentifier,
    context,
  ): TSESTree.PrivateIdentifier => {
    return createNode({
      type: Type.PrivateIdentifier,
      name: node.name,
    }, node);
  },

  AssignmentPattern: (
    node: Deno.lint.AssignmentPattern,
    context,
  ): TSESTree.AssignmentPattern => {
    const left = context.toNode(node.left);
    const right = context.toNode(node.right);

    return createNode({
      type: Type.AssignmentPattern,
      left,
      right,
    }, node);
  },

  RestElement: (node: Deno.lint.RestElement, context): TSESTree.RestElement => {
    const argument = context.toNode(node.argument);

    return createNode({
      type: Type.RestElement,
      argument,
    }, node);
  },

  SpreadElement: (
    node: Deno.lint.SpreadElement,
    context,
  ): TSESTree.SpreadElement => {
    const argument = context.toNode(node.argument);

    return createNode({
      type: Type.SpreadElement,
      argument,
    }, node);
  },

  Property: (node: Deno.lint.Property, context): TSESTree.Property => {
    const key = context.toNode(node.key);
    const value = context.toNode(node.value);

    return createNode({
      type: Type.Property,
      computed: node.computed,
      key,
      kind: node.kind,
      method: node.method,
      shorthand: node.shorthand,
      value,
    }, node);
  },

  JSXIdentifier: (
    node: Deno.lint.JSXIdentifier,
    context,
  ): TSESTree.JSXIdentifier => {
    return createNode({
      type: Type.JSXIdentifier,
      name: node.name,
    }, node);
  },

  JSXNamespacedName: (
    node: Deno.lint.JSXNamespacedName,
    context,
  ): TSESTree.JSXNamespacedName => {
    const name = context.toNode(node.name);
    const namespace = context.toNode(node.namespace);

    return createNode({
      type: Type.JSXNamespacedName,
      name,
      namespace,
    }, node);
  },

  JSXEmptyExpression: (
    node: Deno.lint.JSXEmptyExpression,
    context,
  ): TSESTree.JSXEmptyExpression => {
    return createNode({
      type: Type.JSXEmptyExpression,
    }, node);
  },

  JSXOpeningElement: (
    node: Deno.lint.JSXOpeningElement,
    context,
  ): TSESTree.JSXOpeningElement => {
    throw new Error();
    const attributes = node.attributes.map((child) => {
      switch (child.type) {
        case "JSXAttribute":
          return context.toNode(child);
        case "JSXSpreadAttribute":
          return context.toNode(child);
      }
    });
    const typeArguments = node.typeArguments &&
      context.toNode(node.typeArguments);

    return createNode({
      type: Type.JSXOpeningElement,
      attributes,
      selfClosing: node.selfClosing,
      typeArguments,
    }, node);
  },

  JSXAttribute: (
    node: Deno.lint.JSXAttribute,
    context,
  ): TSESTree.JSXAttribute => {
    throw new Error();
    return createNode({
      type: Type.JSXAttribute,
    }, node);
  },

  JSXSpreadAttribute: (
    node: Deno.lint.JSXSpreadAttribute,
    context,
  ): TSESTree.JSXSpreadAttribute => {
    throw new Error();
    return createNode({
      type: Type.JSXSpreadAttribute,
    }, node);
  },

  JSXClosingElement: (
    node: Deno.lint.JSXClosingElement,
    context,
  ): TSESTree.JSXClosingElement => {
    throw new Error();
    return createNode({}, node);
  },

  JSXOpeningFragment: (
    node: Deno.lint.JSXOpeningFragment,
    context,
  ): TSESTree.JSXOpeningFragment => {
    throw new Error();
    return createNode({}, node);
  },

  JSXClosingFragment: (
    node: Deno.lint.JSXClosingFragment,
    context,
  ): TSESTree.JSXClosingFragment => {
    throw new Error();
    return createNode({}, node);
  },

  JSXExpressionContainer: (
    node: Deno.lint.JSXExpressionContainer,
    context,
  ): TSESTree.JSXExpressionContainer => {
    throw new Error();
    return createNode({}, node);
  },

  JSXText: (node: Deno.lint.JSXText, context): TSESTree.JSXText => {
    throw new Error();
    return createNode({}, node);
  },

  JSXMemberExpression: (
    node: Deno.lint.JSXMemberExpression,
    context,
  ): TSESTree.JSXMemberExpression => {
    throw new Error();
    return createNode({}, node);
  },

  TSModuleBlock: (
    node: Deno.lint.TSModuleBlock,
    context,
  ): TSESTree.TSModuleBlock => {
    throw new Error();
    return createNode({}, node);
  },

  TSClassImplements: (
    node: Deno.lint.TSClassImplements,
    context,
  ): TSESTree.TSClassImplements => {
    const expression = context.toNode(node.expression);
    const typeArguments = node.typeArguments &&
      context.toNode(node.typeArguments);

    return createNode({
      type: Type.TSClassImplements,
      expression,
      typeArguments,
    }, node);
  },

  TSAbstractMethodDefinition: (
    node: Deno.lint.TSAbstractMethodDefinition,
    context,
  ): TSESTree.TSAbstractMethodDefinition => {
    const key = context.toNode(node.key);

    return createNode({
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
  },

  TSAbstractPropertyDefinition: (
    node: Deno.lint.TSAbstractPropertyDefinition,
    context,
  ): TSESTree.TSAbstractPropertyDefinition => {
    throw new Error();
    return createNode({}, node);
  },

  TSEmptyBodyFunctionExpression: (
    node: Deno.lint.TSEmptyBodyFunctionExpression,
    context,
  ): TSESTree.TSEmptyBodyFunctionExpression => {
    throw new Error();
    return createNode({}, node);
  },

  TSCallSignatureDeclaration: (
    node: Deno.lint.TSCallSignatureDeclaration,
    context,
  ): TSESTree.TSCallSignatureDeclaration => {
    throw new Error();
    return createNode({}, node);
  },

  TSPropertySignature: (
    node: Deno.lint.TSPropertySignature,
    context,
  ): TSESTree.TSPropertySignature => {
    const typeAnnotation = node.typeAnnotation &&
      context.toNode(node.typeAnnotation);

    const base = {
      type: Type.TSPropertySignature as const,
      accessibility: undefined, // TODO,
      // computed: node.computed,
      optional: node.optional,
      readonly: node.readonly,
      static: node.static,
      typeAnnotation,
    };

    const key = context.toNode(node.key);

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
  },

  TSEnumBody: (node: Deno.lint.TSEnumBody, context): TSESTree.TSEnumBody => {
    const members = node.members.map(context.toNode);

    return createNode({
      type: Type.TSEnumBody,
      members,
    }, node);
  },

  TSEnumMember: (
    node: Deno.lint.TSEnumMember,
    context,
  ): TSESTree.TSEnumMember => {
    const id = context.toNode(node.id);
    const initializer = node.initializer &&
      context.toNode(node.initializer);

    return createNode({
      type: Type.TSEnumMember,
      id,
      initializer,
      computed: false,
    }, node);
  },

  TSTypeParameterInstantiation: (
    node: Deno.lint.TSTypeParameterInstantiation,
    context,
  ): TSESTree.TSTypeParameterInstantiation => {
    const params = node.params.map(context.toNode);

    return createNode({
      type: Type.TSTypeParameterInstantiation,
      params,
    }, node);
  },

  TSInterfaceBody: (
    node: Deno.lint.TSInterfaceBody,
    context,
  ): TSESTree.TSInterfaceBody => {
    const body = node.body.map(context.toNode);

    return createNode({
      type: Type.TSInterfaceBody,
      body,
    }, node);
  },

  TSConstructSignatureDeclaration: (
    node: Deno.lint.TSConstructSignatureDeclaration,
    context,
  ): TSESTree.TSConstructSignatureDeclaration => {
    const params = node.params.map(context.toNode);
    const returnType = context.toNode(node.returnType);
    const typeParameters = node.typeParameters &&
      context.toNode(node.typeParameters);

    return createNode({
      type: Type.TSConstructSignatureDeclaration,
      params,
      returnType,
      typeParameters,
    }, node);
  },

  TSMethodSignature: (
    node: Deno.lint.TSMethodSignature,
    context,
  ): TSESTree.TSMethodSignature => {
    const params = node.params.map(context.toNode);
    const returnType = node.returnType &&
      context.toNode(node.returnType);
    const typeParameters = node.typeParameters &&
      context.toNode(node.typeParameters);
    const key = context.toNode(node.key);

    return createNode({
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
  },

  TSInterfaceHeritage: (
    node: Deno.lint.TSInterfaceHeritage,
    context,
  ): TSESTree.TSInterfaceHeritage => {
    const expression = context.toNode(node.expression);
    const typeArguments = node.typeArguments &&
      context.toNode(node.typeArguments);

    return createNode({
      type: Type.TSInterfaceHeritage,
      expression,
      typeArguments,
    }, node);
  },

  TSIndexSignature: (
    node: Deno.lint.TSIndexSignature,
    context,
  ): TSESTree.TSIndexSignature => {
    const parameters = node.parameters.map(context.toNode);

    return createNode({
      type: Type.TSIndexSignature,
      parameters,
      readonly: node.readonly,
      static: node.static,
    }, node);
  },

  TSTypeAnnotation: (
    node: Deno.lint.TSTypeAnnotation,
    context,
  ): TSESTree.TSTypeAnnotation => {
    const typeAnnotation = context.toNode(node.typeAnnotation);

    return createNode({
      type: Type.TSTypeAnnotation,
      typeAnnotation,
    }, node);
  },

  TSTypeParameterDeclaration: (
    node: Deno.lint.TSTypeParameterDeclaration,
    context,
  ): TSESTree.TSTypeParameterDeclaration => {
    const params = node.params.map(context.toNode);

    return createNode({
      type: Type.TSTypeParameterDeclaration,
      params,
    }, node);
  },

  TSTypeParameter: (
    node: Deno.lint.TSTypeParameter,
    context,
  ): TSESTree.TSTypeParameter => {
    const constraint = node.constraint && context.toNode(node.constraint);
    const $default = node.default && context.toNode(node.default);
    const name = context.toNode(node.name);

    return createNode({
      type: Type.TSTypeParameter,
      const: node.const,
      constraint: constraint ?? undefined,
      default: $default ?? undefined,
      in: node.in,
      name,
      out: node.out,
    }, node);
  },

  TSParameterProperty: (
    node: Deno.lint.TSParameterProperty,
    context,
  ): TSESTree.TSParameterProperty => {
    const parameter = context.toNode(node.parameter);

    return {
      type: Type.TSParameterProperty,
      parameter,
    };
  },

  Line: (node: Deno.lint.LineComment, context): TSESTree.LineComment => {
    return {
      type: Token.Line,
      value: node.value,
    };
  },

  Block: (node: Deno.lint.BlockComment, context): TSESTree.BlockComment => {
    return {
      type: Token.Block,
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
  ) => NodeMap[k];
};

function createNode<T>(
  property: T,
  node: Deno.lint.Node,
): T & Omit<TSESTree.NodeOrTokenData, "type"> & { parent: any } {
  const tsNode = {
    ...property,
    loc: {} as any,
    parent: undefined,
    range: node.range,
  };

  return tsNode;
}

interface Context {
  toNode: (node: any) => any;
  loc: (node: any) => any;
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
  const context = {
    toNode,
    loc: (node) => {
      return loc(lines, node.range);
    },
  } satisfies Context;

  function toNode(node: Deno.lint.Node) {
    const target = {} as TSESTree.Node;

    map.set(node, target);

    const properties = definition[node.type](node, context);

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
