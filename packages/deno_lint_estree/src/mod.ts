import type * as estree from "estree";

export function toProgram(
  ast: Deno.lint.Program,
  mapper: Mapper,
): estree.Program {
  const body = ast.body.map((child) => statement2ProgramBody(child, mapper))
    .filter(isNonNullable);

  return {
    type: ast.type,
    sourceType: ast.sourceType,
    body,
    comments: ast.comments,
    range: ast.range,
  };
}

function isNonNullable<T>(value: T): value is NonNullable<T> {
  return !!value;
}

function statement2ProgramBody(
  node: Deno.lint.Statement,
  mapper: Mapper,
): estree.Program["body"][number] | null {
  switch (node.type) {
    case "BlockStatement":
      return mapper.BlockStatement(node);
    case "BreakStatement":
      return mapper.BreakStatement(node);
    case "ClassDeclaration":
      return mapper.ClassDeclaration(node);
    case "ContinueStatement":
      return mapper.ContinueStatement(node);
    case "DebuggerStatement":
      return mapper.DebuggerStatement(node);
    case "DoWhileStatement":
      return mapper.DoWhileStatement(node);
    case "ExportAllDeclaration":
      return mapper.ExportAllDeclaration(node);
    case "ExportDefaultDeclaration":
      return mapper.ExportDefaultDeclaration(node);
    case "ExportNamedDeclaration":
      return mapper.ExportNamedDeclaration(node);
    case "ExpressionStatement":
      return mapper.ExpressionStatement(node);
    case "ForInStatement":
      return mapper.ForInStatement(node);
    case "ForOfStatement":
      return mapper.ForOfStatement(node);
    case "ForStatement":
      return mapper.ForStatement(node);
    case "FunctionDeclaration":
      return mapper.FunctionDeclaration(node);
    case "IfStatement":
      return mapper.IfStatement(node);
    case "ImportDeclaration":
      return mapper.ImportDeclaration(node);
    case "LabeledStatement":
      return mapper.LabeledStatement(node);
    case "ReturnStatement":
      return mapper.ReturnStatement(node);
    case "SwitchStatement":
      return mapper.SwitchStatement(node);
    case "ThrowStatement":
      return mapper.ThrowStatement(node);
    case "TryStatement":
      return mapper.TryStatement(node);
    case "TSDeclareFunction":
    case "TSEnumDeclaration":
    case "TSExportAssignment":
    case "TSImportEqualsDeclaration":
    case "TSInterfaceDeclaration":
    case "TSModuleDeclaration":
    case "TSNamespaceExportDeclaration":
    case "TSTypeAliasDeclaration": {
      return null;
    }
    case "VariableDeclaration":
      return mapper.VariableDeclaration(node);
    case "WhileStatement":
      return mapper.WhileStatement(node);
    case "WithStatement":
      return mapper.WithStatement(node);
  }
}

function toExportAllDeclaration(
  node: Deno.lint.ExportAllDeclaration,
  mapper: Mapper,
): estree.ExportAllDeclaration {
  const attributes = node.attributes.map(mapper.ImportAttribute);
  const exported = node.exported && mapper.Identifier(node.exported);
  const source = node.source;

  return {
    type: node.type,
    attributes,
    exported,
    source,
    range: node.range,
  };
}

function toExportDefaultDeclaration(
  node: Deno.lint.ExportDefaultDeclaration,
  mapper: Mapper,
): estree.ExportDefaultDeclaration {
  const declaration = map(
    node.declaration,
    (child): estree.ExportDefaultDeclaration["declaration"] => {
      switch (child.type) {
        case "ClassDeclaration":
          return mapper.ClassDeclaration(child);
        case "FunctionDeclaration":
          return mapper.FunctionDeclaration(child);
        case "VariableDeclaration":
          return mapper.VariableDeclaration(child);
        case "TSDeclareFunction":
        case "TSEnumDeclaration":
        case "TSInterfaceDeclaration":
        case "TSModuleDeclaration":
        case "TSTypeAliasDeclaration": {
          throw new Error();
        }
        default: {
          throw new Error();
          // return mapper.Expression(child);
        }
      }
    },
  );
  return {
    type: node.type,
    declaration,
    range: node.range,
  };
}

function toExportNamedDeclaration(
  node: Deno.lint.ExportNamedDeclaration,
  mapper: Mapper,
): estree.ExportNamedDeclaration {
  const attributes = node.attributes.map(mapper.ImportAttribute);
  const declaration = exportNamedDeclarationDeclaration2Declaration(
    node.declaration,
    mapper,
  );
  const specifiers = node.specifiers.map(mapper.ExportSpecifier);

  return {
    type: node.type,
    attributes,
    declaration,
    specifiers,
    range: node.range,
  };
}

function exportNamedDeclarationDeclaration2Declaration(
  node: Deno.lint.ExportNamedDeclaration["declaration"],
  mapper: Mapper,
): estree.Declaration | null {
  if (node === null) return null;

  switch (node.type) {
    case "ClassDeclaration":
      return mapper.ClassDeclaration(node);
    case "FunctionDeclaration":
      return mapper.FunctionDeclaration(node);
    case "TSDeclareFunction":
    case "TSEnumDeclaration":
    case "TSImportEqualsDeclaration":
    case "TSInterfaceDeclaration":
    case "TSModuleDeclaration":
    case "TSTypeAliasDeclaration": {
      throw new Error();
    }
    case "VariableDeclaration":
      return mapper.VariableDeclaration(node);
  }
}

function toExportSpecifier(
  node: Deno.lint.ExportSpecifier,
  mapper: Mapper,
): estree.ExportSpecifier {
  const exported = _toIdentifierOrLiteral(node.exported, mapper);
  const local = _toIdentifierOrLiteral(node.local, mapper);

  return {
    type: node.type,
    exported,
    local,
    range: node.range,
  };
}

function _toIdentifierOrLiteral(
  node: Deno.lint.Identifier | Deno.lint.Literal,
  mapper: Mapper,
): estree.Identifier | estree.Literal {
  switch (node.type) {
    case "Literal":
      return mapper.Literal(node);
    case "Identifier":
      return mapper.Identifier(node);
  }
}

function toImportDeclaration(
  node: Deno.lint.ImportDeclaration,
  mapper: Mapper,
): estree.ImportDeclaration {
  const attributes = node.attributes.map(mapper.ImportAttribute);
  const source = mapper.Literal(node.source);
  const specifiers = node.specifiers.map((child) => {
    switch (child.type) {
      case "ImportDefaultSpecifier":
        return mapper.ImportDefaultSpecifier(child);
      case "ImportNamespaceSpecifier":
        return mapper.ImportNamespaceSpecifier(child);
      case "ImportSpecifier":
        return mapper.ImportSpecifier(child);
    }
  });
  return {
    type: node.type,
    attributes,
    source,
    specifiers,
    range: node.range,
  };
}

function toImportDefaultSpecifier(
  node: Deno.lint.ImportDefaultSpecifier,
  mapper: Mapper,
): estree.ImportDefaultSpecifier {
  const local = mapper.Identifier(node.local);

  return {
    type: node.type,
    local,
    range: node.range,
  };
}

function toImportNamespaceSpecifier(
  node: Deno.lint.ImportNamespaceSpecifier,
  mapper: Mapper,
): estree.ImportNamespaceSpecifier {
  const local = mapper.Identifier(node.local);

  return {
    type: node.type,
    local,
    range: node.range,
  };
}

function toImportAttribute(
  node: Deno.lint.ImportAttribute,
  mapper: Mapper,
): estree.ImportAttribute {
  const key = _toIdentifierOrLiteral(node.key, mapper);
  const value = mapper.Literal(node.value);

  return {
    type: node.type,
    key,
    value,
    range: node.range,
  };
}

// TODO
function toLiteral(node: Deno.lint.Literal, mapper: Mapper): estree.Literal {
  const type = node.type;

  if (
    typeof node.value === "string" || typeof node.value === "number" ||
    typeof node.value === "boolean" || node.value === null
  ) {
    return {
      type,
      value: node.value,
      range: node.range,
    } satisfies estree.SimpleLiteral;
  }

  if (typeof node.value === "bigint") {
    return {
      type,
      bigint: node.bigint,
      range: node.range,
    } satisfies estree.BigIntLiteral;
  }

  return {
    type: node.type,
    regex: {
      flags: node.regex.flags,
      pattern: node.regex.pattern,
    },
    range: node.range,
  } satisfies estree.RegExpLiteral;
}

function toBlockStatement(
  node: Deno.lint.BlockStatement,
  mapper: Mapper,
): estree.BlockStatement {
  const body = node.body.map((child) => _toStatement(child, mapper));

  return {
    type: node.type,
    body,
    range: node.range,
  };
}
function toBreakStatement(
  node: Deno.lint.BreakStatement,
  mapper: Mapper,
): estree.BreakStatement {
  return {
    type: node.type,
    range: node.range,
  };
}

function toContinueStatement(
  node: Deno.lint.ContinueStatement,
  mapper: Mapper,
): estree.ContinueStatement {
  return {
    type: node.type,
    range: node.range,
  };
}

function toDebuggerStatement(
  node: Deno.lint.DebuggerStatement,
  mapper: Mapper,
): estree.DebuggerStatement {
  return {
    type: node.type,
    range: node.range,
  };
}

function toDoWhileStatement(
  node: Deno.lint.DoWhileStatement,
  mapper: Mapper,
): estree.DoWhileStatement {
  const body = _toStatement(node.body, mapper);
  const test = _toExpression(node.test, mapper);

  return {
    type: node.type,
    body,
    test,
    range: node.range,
  };
}

function toExpressionStatement(
  node: Deno.lint.ExpressionStatement,
  mapper: Mapper,
): estree.ExpressionStatement {
  const expression = _toExpression(node.expression, mapper);

  return {
    type: node.type,
    expression,
    range: node.range,
  };
}

function toForInStatement(
  node: Deno.lint.ForInStatement,
  mapper: Mapper,
): estree.ForInStatement {
  const body = _toStatement(node.body, mapper);
  const left = node.left.type === "VariableDeclaration"
    ? mapper.VariableDeclaration(node.left)
    : expression2Pattern(node.left, mapper);
  const right = _toExpression(node.right, mapper);

  return {
    type: node.type,
    body,
    left,
    right,
    range: node.range,
  };
}

function toForOfStatement(
  node: Deno.lint.ForOfStatement,
  mapper: Mapper,
): estree.ForOfStatement {
  const body = _toStatement(node.body, mapper);
  const left = node.left.type === "VariableDeclaration"
    ? mapper.VariableDeclaration(node.left)
    : expression2Pattern(node.left, mapper);
  const right = _toExpression(node.right, mapper);

  return {
    type: node.type,
    body,
    await: node.await,
    left,
    right,
    range: node.range,
  };
}

function toForStatement(
  node: Deno.lint.ForStatement,
  mapper: Mapper,
): estree.ForStatement {
  const body = _toStatement(node.body, mapper);

  return {
    type: node.type,
    body,
    range: node.range,
  };
}

function toFunctionDeclaration(
  node: Deno.lint.FunctionDeclaration,
  mapper: Mapper,
): estree.FunctionDeclaration {
  if (!node.body) throw new Error();
  const body = mapper.BlockStatement(node.body);
  if (!node.id) throw new Error();
  const id = mapper.Identifier(node.id);
  const params = node.params.map((child) => parameter2Pattern(child, mapper));

  return {
    type: node.type,
    body,
    async: node.async,
    id,
    params,
    generator: node.generator,
    range: node.range,
  };
}

function toIfStatement(
  node: Deno.lint.IfStatement,
  mapper: Mapper,
): estree.IfStatement {
  const alternate = node.alternate && _toStatement(node.alternate, mapper);
  const consequent = _toStatement(node.consequent, mapper);
  const test = _toExpression(node.test, mapper);

  return {
    type: node.type,
    alternate,
    consequent,
    test,
    range: node.range,
  };
}

function toLabeledStatement(
  node: Deno.lint.LabeledStatement,
  mapper: Mapper,
): estree.LabeledStatement {
  const body = _toStatement(node.body, mapper);
  const label = mapper.Identifier(node.label);

  return {
    type: node.type,
    body,
    label,
    range: node.range,
  };
}

function toReturnStatement(
  node: Deno.lint.ReturnStatement,
  mapper: Mapper,
): estree.ReturnStatement {
  const argument = node.argument && _toExpression(node.argument, mapper);

  return {
    type: node.type,
    range: node.range,
    argument,
  };
}

function toSwitchStatement(
  node: Deno.lint.SwitchStatement,
  mapper: Mapper,
): estree.SwitchStatement {
  const cases = node.cases.map(mapper.SwitchCase);
  const discriminant = _toExpression(node.discriminant, mapper);

  return {
    type: node.type,
    cases,
    discriminant,
    range: node.range,
  };
}

function toThrowStatement(
  node: Deno.lint.ThrowStatement,
  mapper: Mapper,
): estree.ThrowStatement {
  const argument = _toExpression(node.argument, mapper);

  return {
    type: node.type,
    argument,
    range: node.range,
  };
}

function toWhileStatement(
  node: Deno.lint.WhileStatement,
  mapper: Mapper,
): estree.WhileStatement {
  const body = _toStatement(node.body, mapper);
  const test = _toExpression(node.test, mapper);

  return {
    type: node.type,
    body,
    test,
    range: node.range,
  };
}

function toWithStatement(
  node: Deno.lint.WithStatement,
  mapper: Mapper,
): estree.WithStatement {
  const body = _toStatement(node.body, mapper);
  const object = _toExpression(node.object, mapper);

  return {
    type: node.type,
    body,
    object,
    range: node.range,
  };
}

function toTryStatement(
  node: Deno.lint.TryStatement,
  mapper: Mapper,
): estree.TryStatement {
  const block = mapper.BlockStatement(node.block);

  return {
    type: node.type,
    block,
    range: node.range,
  };
}

function _toStatement(
  node: Deno.lint.Statement,
  mapper: Mapper,
): estree.Statement {
  switch (node.type) {
    case "BlockStatement":
      return mapper.BlockStatement(node);
    case "BreakStatement":
      return mapper.BreakStatement(node);
    case "ClassDeclaration": {
      return mapper.ClassDeclaration(node);
    }
    case "ContinueStatement":
      return mapper.ContinueStatement(node);
    case "DebuggerStatement":
      return mapper.DebuggerStatement(node);
    case "DoWhileStatement":
      return mapper.DoWhileStatement(node);
    case "ExportAllDeclaration": {
      throw new Error();
    }
    case "ExportDefaultDeclaration": {
      throw new Error();
    }
    case "ExportNamedDeclaration": {
      throw new Error();
    }
    case "ExpressionStatement":
      return mapper.ExpressionStatement(node);
    case "ForInStatement":
      return mapper.ForInStatement(node);
    case "ForOfStatement":
      return mapper.ForOfStatement(node);
    case "ForStatement":
      return mapper.ForStatement(node);
    case "FunctionDeclaration":
      return mapper.FunctionDeclaration(node);
    case "IfStatement":
      return mapper.IfStatement(node);
    case "ImportDeclaration": {
      throw new Error();
    }
    case "LabeledStatement":
      return mapper.LabeledStatement(node);
    case "ReturnStatement":
      return mapper.ReturnStatement(node);
    case "SwitchStatement":
      return mapper.SwitchStatement(node);
    case "ThrowStatement":
      return mapper.ThrowStatement(node);
    case "TryStatement":
      return mapper.TryStatement(node);
    case "TSDeclareFunction":
    case "TSEnumDeclaration":
    case "TSExportAssignment":
    case "TSImportEqualsDeclaration":
    case "TSInterfaceDeclaration":
    case "TSModuleDeclaration":
    case "TSNamespaceExportDeclaration":
    case "TSTypeAliasDeclaration": {
      throw new Error();
    }
    case "VariableDeclaration":
      return mapper.VariableDeclaration(node);
    case "WhileStatement":
      return mapper.WhileStatement(node);
    case "WithStatement":
      return mapper.WithStatement(node);
  }
}

function toClassBody(
  node: Deno.lint.ClassBody,
  mapper: Mapper,
): estree.ClassBody {
  const body = node.body.map((child) => _toClassBodyBody(child, mapper)).filter(
    isNonNullable,
  );

  return {
    type: node.type,
    body,
    range: node.range,
  };
}

function _toClassBodyBody(
  node: Deno.lint.ClassBody["body"][number],
  mapper: Mapper,
): estree.ClassBody["body"][number] | null {
  switch (node.type) {
    case "StaticBlock":
      return mapper.StaticBlock(node);
    case "PropertyDefinition":
      return mapper.PropertyDefinition(node);
    case "MethodDefinition":
      return mapper.MethodDefinition(node);
    case "AccessorProperty":
    case "TSAbstractMethodDefinition":
    case "TSAbstractPropertyDefinition":
    case "TSIndexSignature": {
      return null;
    }
  }
}

function toStaticBlock(
  node: Deno.lint.StaticBlock,
  mapper: Mapper,
): estree.StaticBlock {
  const body = node.body.map((child) => _toStatement(child, mapper));

  return {
    type: node.type,
    body,
    range: node.range,
  };
}

function toPropertyDefinition(
  node: Deno.lint.PropertyDefinition,
  mapper: Mapper,
): estree.PropertyDefinition {
  const key = map(node.key, (child) => {
    if (child.type === "PrivateIdentifier") {
      return mapper.PrivateIdentifier(child);
    }

    return _toExpression(child, mapper);
  });

  return {
    type: node.type,
    computed: node.computed,
    key,
    static: node.static,
    range: node.range,
  };
}

function toMethodDefinition(
  node: Deno.lint.MethodDefinition,
  mapper: Mapper,
): estree.MethodDefinition {
  const key = map(node.key, (child) => {
    if (child.type === "PrivateIdentifier") {
      return mapper.PrivateIdentifier(child);
    }

    return _toExpression(child, mapper);
  });
  const value = map(node.value, (child) => {
    switch (child.type) {
      case "FunctionExpression":
        return mapper.FunctionExpression(child);
      case "TSEmptyBodyFunctionExpression": {
        throw new Error();
      }
    }
  });

  return {
    type: node.type,
    computed: node.computed,
    key,
    kind: node.kind,
    static: node.static,
    value,
    range: node.range,
  };
}

function toFunctionExpression(
  node: Deno.lint.FunctionExpression,
  mapper: Mapper,
): estree.FunctionExpression {
  const body = mapper.BlockStatement(node.body);
  const id = node.id && toIdentifier(node.id, mapper);
  const params = node.params.map((child) => parameter2Pattern(child, mapper));

  return {
    type: node.type,
    async: node.async,
    body,
    generator: node.generator,
    id,
    params,
    range: node.range,
  };
}

function toClassDeclaration(
  node: Deno.lint.ClassDeclaration,
  mapper: Mapper,
): estree.ClassDeclaration {
  const body = mapper.ClassBody(node.body);
  if (!node.id) throw new Error();

  const id = toIdentifier(node.id, mapper);

  return {
    type: node.type,
    body,
    id,
    range: node.range,
  };
}

function toIdentifier(
  node: Deno.lint.Identifier,
  mapper: Mapper,
): estree.Identifier {
  return {
    type: node.type,
    name: node.name,
    range: node.range,
  };
}
function _toExpression(
  node: Deno.lint.Expression,
  mapper: Mapper,
): estree.Expression {
  switch (node.type) {
    case "ArrayExpression":
      return mapper.ArrayExpression(node);
    case "Identifier":
      return mapper.Identifier(node);
    case "ArrayPattern": {
      throw new Error();
    }
    case "ArrowFunctionExpression":
      return mapper.ArrowFunctionExpression(node);
    case "AssignmentExpression":
      return mapper.AssignmentExpression(node);
    case "AwaitExpression":
      return mapper.AwaitExpression(node);
    case "BinaryExpression":
      return mapper.BinaryExpression(node);
    case "CallExpression":
      return mapper.CallExpression(node);

    case "ChainExpression":
      return mapper.ChainExpression(node);

    case "ClassExpression":
      return mapper.ClassExpression(node);

    case "ConditionalExpression":
      return mapper.ConditionalExpression(node);

    case "FunctionExpression":
      return mapper.FunctionExpression(node);

    case "ImportExpression":
      return mapper.ImportExpression(node);

    case "JSXElement":
    case "JSXFragment": {
      throw new Error();
    }
    case "Literal":
      return mapper.Literal(node);

    case "TemplateLiteral": {
      return mapper.TemplateLiteral(node);
    }
    case "LogicalExpression":
      return mapper.LogicalExpression(node);

    case "MemberExpression": {
      return mapper.MemberExpression(node);
    }
    case "MetaProperty":
      return mapper.MetaProperty(node);

    case "NewExpression":
      return mapper.NewExpression(node);

    case "ObjectExpression":
      return mapper.ObjectExpression(node);

    case "ObjectPattern": {
      throw new Error();
    }
    case "SequenceExpression":
      return mapper.SequenceExpression(node);

    case "Super": {
      throw new Error();
    }
    case "TaggedTemplateExpression":
      return mapper.TaggedTemplateExpression(node);

    case "ThisExpression":
      return mapper.ThisExpression(node);

    case "TSAsExpression":
    case "TSInstantiationExpression":
    case "TSNonNullExpression":
    case "TSSatisfiesExpression":
    case "TSTypeAssertion": {
      throw new Error();
    }
    case "UnaryExpression":
      return mapper.UnaryExpression(node);
    case "UpdateExpression":
      return mapper.UpdateExpression(node);

    case "YieldExpression":
      return mapper.YieldExpression(node);
  }
}

function toChainExpression(
  node: Deno.lint.ChainExpression,
  mapper: Mapper,
): estree.ChainExpression {
  const expression = map(node.expression, (child) => {
    switch (child.type) {
      case "CallExpression":
        return callExpression2Simple(child, mapper);
      case "MemberExpression":
        return mapper.MemberExpression(child);
      case "TSNonNullExpression": {
        throw new Error();
      }
    }
  });

  return {
    type: node.type,
    expression,
    range: node.range,
  };
}

function callExpression2Simple(
  node: Deno.lint.CallExpression,
  mapper: Mapper,
): estree.SimpleCallExpression {
  const $arguments = node.arguments.map((child) => {
    if (child.type === "SpreadElement") {
      return mapper.SpreadElement(child);
    }
    return _toExpression(child, mapper);
  });
  const callee = _toExpression(node.callee, mapper);

  return {
    type: node.type,
    optional: node.optional,
    arguments: $arguments,
    callee,
    range: node.range,
  };
}

function toClassExpression(
  node: Deno.lint.ClassExpression,
  mapper: Mapper,
): estree.ClassExpression {
  const body = mapper.ClassBody(node.body);

  return {
    type: node.type,
    body,
    range: node.range,
  };
}

function toImportExpression(
  node: Deno.lint.ImportExpression,
  mapper: Mapper,
): estree.ImportExpression {
  const source = _toExpression(node.source, mapper);

  return {
    type: node.type,
    source,
    range: node.range,
  };
}

function toConditionalExpression(
  node: Deno.lint.ConditionalExpression,
  mapper: Mapper,
): estree.ConditionalExpression {
  const alternate = _toExpression(node.alternate, mapper);
  const consequent = _toExpression(node.consequent, mapper);
  const test = _toExpression(node.test, mapper);

  return {
    type: node.type,
    alternate,
    consequent,
    test,
    range: node.range,
  };
}

function toMetaProperty(
  node: Deno.lint.MetaProperty,
  mapper: Mapper,
): estree.MetaProperty {
  const meta = mapper.Identifier(node.meta);
  const property = mapper.Identifier(node.property);

  return {
    type: node.type,
    meta,
    property,
    range: node.range,
  };
}

function toArrowFunctionExpression(
  node: Deno.lint.ArrowFunctionExpression,
  mapper: Mapper,
): estree.ArrowFunctionExpression {
  const body = node.body.type === "BlockStatement"
    ? mapper.BlockStatement(node.body)
    : _toExpression(node.body, mapper);
  const params = node.params.map((child) => parameter2Pattern(child, mapper));
  const expression = body.type !== "BlockStatement";

  return {
    type: node.type,
    async: node.async,
    body,
    generator: node.generator,
    params,
    expression,
    range: node.range,
  };
}

function toAssignmentExpression(
  node: Deno.lint.AssignmentExpression,
  mapper: Mapper,
): estree.AssignmentExpression {
  const left = expression2Pattern(node.left, mapper);
  const right = _toExpression(node.right, mapper);

  return {
    type: node.type,
    left,
    operator: node.operator,
    right,
    range: node.range,
  };
}

function toLogicalExpression(
  node: Deno.lint.LogicalExpression,
  mapper: Mapper,
): estree.LogicalExpression {
  const left = _toExpression(node.left, mapper);
  const right = _toExpression(node.right, mapper);

  return {
    type: node.type,
    left,
    operator: node.operator,
    right,
    range: node.range,
  };
}

function toNewExpression(
  node: Deno.lint.NewExpression,
  mapper: Mapper,
): estree.NewExpression {
  const $arguments = node.arguments.map((child) => {
    if (child.type === "SpreadElement") {
      return mapper.SpreadElement(child);
    }
    return _toExpression(child, mapper);
  });

  const callee = _toExpression(node.callee, mapper);

  return {
    type: node.type,
    arguments: $arguments,
    callee,
    range: node.range,
  };
}

function toAwaitExpression(
  node: Deno.lint.AwaitExpression,
  mapper: Mapper,
): estree.AwaitExpression {
  const argument = _toExpression(node.argument, mapper);

  return {
    type: node.type,
    argument,
    range: node.range,
  };
}

function toBinaryExpression(
  node: Deno.lint.BinaryExpression,
  mapper: Mapper,
): estree.BinaryExpression {
  const left = node.left.type === "PrivateIdentifier"
    ? mapper.PrivateIdentifier(node.left)
    : _toExpression(node.left, mapper);
  const right = _toExpression(node.right, mapper);

  if (node.operator === "||") {
    throw new Error("invalid");
  }

  return {
    type: node.type,
    left,
    right,
    operator: node.operator,
    range: node.range,
  };
}

function toObjectExpression(
  node: Deno.lint.ObjectExpression,
  mapper: Mapper,
): estree.ObjectExpression {
  const properties = node.properties.map((child) => {
    if (child.type === "SpreadElement") {
      return mapper.SpreadElement(child);
    }

    return mapper.Property(child);
  });
  return {
    type: node.type,
    properties,
    range: node.range,
  };
}

function toSequenceExpression(
  node: Deno.lint.SequenceExpression,
  mapper: Mapper,
): estree.SequenceExpression {
  const expressions = node.expressions.map((child) =>
    _toExpression(child, mapper)
  );
  return {
    type: node.type,
    expressions,
    range: node.range,
  };
}

function toCallExpression(
  node: Deno.lint.CallExpression,
  mapper: Mapper,
): estree.CallExpression {
  const $arguments = node.arguments.map((child) => {
    if (child.type === "SpreadElement") {
      return mapper.SpreadElement(child);
    }

    return _toExpression(child, mapper);
  });

  const callee = _toExpression(node.callee, mapper);

  return {
    type: node.type,
    arguments: $arguments,
    callee,
    optional: node.optional,
    range: node.range,
  };
}

function toTaggedTemplateExpression(
  node: Deno.lint.TaggedTemplateExpression,
  mapper: Mapper,
): estree.TaggedTemplateExpression {
  const quasi = mapper.TemplateLiteral(node.quasi);
  const tag = _toExpression(node.tag, mapper);

  return {
    type: node.type,
    quasi,
    tag,
    range: node.range,
  };
}

function toThisExpression(
  node: Deno.lint.ThisExpression,
  mapper: Mapper,
): estree.ThisExpression {
  return {
    type: node.type,
    range: node.range,
  };
}

function toUnaryExpression(
  node: Deno.lint.UnaryExpression,
  mapper: Mapper,
): estree.UnaryExpression {
  const argument = _toExpression(node.argument, mapper);

  return {
    type: node.type,
    argument,
    operator: node.operator,
    prefix: true,
    range: node.range,
  };
}

function toUpdateExpression(
  node: Deno.lint.UpdateExpression,
  mapper: Mapper,
): estree.UpdateExpression {
  const argument = _toExpression(node.argument, mapper);

  return {
    type: node.type,
    argument,
    operator: node.operator,
    prefix: node.prefix,
    range: node.range,
  };
}

function toYieldExpression(
  node: Deno.lint.YieldExpression,
  mapper: Mapper,
): estree.YieldExpression {
  const argument = node.argument && _toExpression(node.argument, mapper);

  return {
    type: node.type,
    argument,
    delegate: node.delegate,
    range: node.range,
  };
}

function toSwitchCase(
  node: Deno.lint.SwitchCase,
  mapper: Mapper,
): estree.SwitchCase {
  const consequent = node.consequent.map((child) =>
    _toStatement(child, mapper)
  );

  return {
    type: node.type,
    consequent,
    range: node.range,
  };
}

function toMemberExpression(
  node: Deno.lint.MemberExpression,
  mapper: Mapper,
): estree.MemberExpression {
  const object = _toExpression(node.object, mapper);
  const property = node.property.type === "PrivateIdentifier"
    ? mapper.PrivateIdentifier(node.property)
    : _toExpression(node.property, mapper);

  return {
    type: node.type,
    computed: node.computed,
    object,
    optional: node.optional,
    property,
    range: node.range,
  };
}

function toVariableDeclarator(
  node: Deno.lint.VariableDeclarator,
  mapper: Mapper,
): estree.VariableDeclarator {
  const init = node.init && _toExpression(node.init, mapper);
  const id = map(node.id, (child) => {
    switch (child.type) {
      case "Identifier":
        return mapper.Identifier(child);
      case "ArrayPattern":
        return mapper.ArrayPattern(child);
      case "ObjectPattern":
        return mapper.ObjectPattern(child);
    }
  });

  return {
    type: node.type,
    id,
    init,
    range: node.range,
  };
}

function toVariableDeclaration(
  node: Deno.lint.VariableDeclaration,
  mapper: Mapper,
): estree.VariableDeclaration {
  const declarations = node.declarations.map(mapper.VariableDeclarator);

  return {
    type: node.type,
    declarations,
    kind: node.kind,
    range: node.range,
  };
}

export function toArrayExpression(
  node: Deno.lint.ArrayExpression,
  mapper: Mapper,
): estree.ArrayExpression {
  const elements = node.elements.map((child) => {
    if (child.type === "SpreadElement") return mapper.SpreadElement(child);

    return _toExpression(child, mapper);
  });

  return {
    type: "ArrayExpression",
    range: node.range,
    elements,
  };
}

function parameter2Pattern(
  node: Deno.lint.Parameter,
  mapper: Mapper,
): estree.Pattern {
  switch (node.type) {
    case "Identifier":
      return mapper.Identifier(node);

    case "ArrayPattern":
      return mapper.ArrayPattern(node);
    case "ObjectPattern":
      return mapper.ObjectPattern(node);

    case "AssignmentPattern":
      return mapper.AssignmentPattern(node);

    case "RestElement":
      return mapper.RestElement(node);
    case "TSParameterProperty": {
      throw new Error();
    }
  }
}

function expression2Pattern(
  node: Deno.lint.Expression,
  mapper: Mapper,
): estree.Pattern {
  switch (node.type) {
    case "Identifier":
      return mapper.Identifier(node);
    case "ArrayPattern":
      return mapper.ArrayPattern(node);
    case "MemberExpression":
      return mapper.MemberExpression(node);
    case "ObjectPattern":
      return mapper.ObjectPattern(node);

    case "ArrayExpression":
    case "ArrowFunctionExpression":
    case "AssignmentExpression":
    case "AwaitExpression":
    case "BinaryExpression":
    case "CallExpression":
    case "ChainExpression":
    case "ClassExpression":
    case "ConditionalExpression":
    case "FunctionExpression":
    case "ImportExpression":
    case "JSXElement":
    case "JSXFragment":
    case "Literal":
    case "TemplateLiteral":
    case "LogicalExpression":
    case "MetaProperty":
    case "NewExpression":
    case "ObjectExpression":
    case "SequenceExpression":
    case "Super":
    case "TaggedTemplateExpression":
    case "ThisExpression":
    case "TSAsExpression":
    case "TSInstantiationExpression":
    case "TSNonNullExpression":
    case "TSSatisfiesExpression":
    case "TSTypeAssertion":
    case "UnaryExpression":
    case "UpdateExpression":
    case "YieldExpression": {
      throw new Error();
    }
  }
}

function toArrayPattern(
  node: Deno.lint.ArrayPattern,
  mapper: Mapper,
): estree.ArrayPattern {
  const elements = node.elements.map<estree.Pattern | null>((child) => {
    if (child === null) return null;

    switch (child.type) {
      case "Identifier": {
        return mapper.Identifier(child);
      }
      case "ArrayPattern": {
        return mapper.ArrayPattern(child);
      }
      case "MemberExpression": {
        return mapper.MemberExpression(child);
      }
      case "ObjectPattern": {
        return mapper.ObjectPattern(child);
      }
      case "AssignmentPattern": {
        return mapper.AssignmentPattern(child);
      }
      case "RestElement": {
        return mapper.RestElement(child);
      }
    }
  });

  return {
    type: node.type,
    elements,
    range: node.range,
  };
}
function toObjectPattern(
  node: Deno.lint.ObjectPattern,
  mapper: Mapper,
): estree.ObjectPattern {
  const properties = node.properties.map<
    estree.RestElement | estree.AssignmentProperty
  >((child) => {
    if (child.type === "RestElement") {
      return mapper.RestElement(child);
    }

    return property2AssignmentProperty(child, mapper);
  });

  return {
    type: node.type,
    properties,
    range: node.range,
  };
}

function property2AssignmentProperty(
  node: Deno.lint.Property,
  mapper: Mapper,
): estree.AssignmentProperty {
  const property = mapper.Property(node);
  const value = map(node.value, (child) => {
    switch (child.type) {
      case "AssignmentPattern":
        return mapper.AssignmentPattern(child);
      case "TSEmptyBodyFunctionExpression": {
        throw new Error();
      }
      default: {
        return expression2Pattern(child, mapper);
      }
    }
  });

  return {
    ...property,
    kind: "init",
    method: node.method,
    value,
    range: node.range,
  };
}

function toAssignmentPattern(
  node: Deno.lint.AssignmentPattern,
  mapper: Mapper,
): estree.AssignmentPattern {
  const left = node.left.type === "ArrayPattern"
    ? mapper.ArrayPattern(node.left)
    : node.left.type === "Identifier"
    ? mapper.Identifier(node.left)
    : mapper.ObjectPattern(node.left);
  const right = _toExpression(node.right, mapper);

  return {
    type: node.type,
    left,
    right,
    range: node.range,
  };
}

function toRestElement(
  node: Deno.lint.RestElement,
  mapper: Mapper,
): estree.RestElement {
  const argument = map(node.argument, (child) => {
    switch (child.type) {
      case "Identifier":
        return mapper.Identifier(child);
      case "ArrayPattern":
        return mapper.ArrayPattern(child);
      case "MemberExpression":
        return mapper.MemberExpression(child);
      case "ObjectPattern":
        return mapper.ObjectPattern(child);
      case "AssignmentPattern":
        return mapper.AssignmentPattern(child);
      case "RestElement":
        return mapper.RestElement(child);
    }
  });

  return {
    type: node.type,
    argument,
    range: node.range,
  };
}

function toPrivateIdentifier(
  node: Deno.lint.PrivateIdentifier,
  mapper: Mapper,
): estree.PrivateIdentifier {
  return {
    type: node.type,
    name: node.name,
  };
}

function toTemplateElement(
  node: Deno.lint.TemplateElement,
  mapper: Mapper,
): estree.TemplateElement {
  return {
    type: node.type,
    tail: node.tail,
    value: {
      cooked: node.cooked,
      raw: node.raw,
    },
    range: node.range,
  };
}

function toSpreadElement(
  node: Deno.lint.SpreadElement,
  mapper: Mapper,
): estree.SpreadElement {
  const argument = _toExpression(node.argument, mapper);

  return {
    type: node.type,
    argument,
    range: node.range,
  };
}

function toProperty(node: Deno.lint.Property, mapper: Mapper): estree.Property {
  const key = _toExpression(node.key, mapper);
  const value = map(node.value, (child) => {
    switch (child.type) {
      case "AssignmentPattern":
        return mapper.AssignmentPattern(child);
      case "TSEmptyBodyFunctionExpression": {
        throw new Error();
      }
      default:
        return _toExpression(child, mapper);
    }
  });

  return {
    type: node.type,
    computed: node.computed,
    key,
    kind: node.kind,
    method: node.method,
    shorthand: node.shorthand,
    value,
    range: node.range,
  };
}

function toTemplateLiteral(
  node: Deno.lint.TemplateLiteral,
  mapper: Mapper,
): estree.TemplateLiteral {
  const expressions = node.expressions.map((child) =>
    _toExpression(child, mapper)
  );
  const quasis = node.quasis.map(mapper.TemplateElement);

  return {
    type: node.type,
    expressions,
    quasis,
    range: node.range,
  };
}

function map<T, U>(value: T, mapper: (value: T) => U) {
  return mapper(value);
}

export function toNode(node: Deno.lint.Node, mapper: Mapper): estree.Node {
  switch (node.type) {
    case "Program":
      return mapper.Program(node);
    case "BlockStatement":
      return mapper.BlockStatement(node);
    case "BreakStatement":
      return mapper.BreakStatement(node);
    case "ClassDeclaration":
      return mapper.ClassDeclaration(node);
    case "ContinueStatement":
      return mapper.ContinueStatement(node);
    case "DebuggerStatement":
      return mapper.DebuggerStatement(node);
    case "DoWhileStatement":
      return mapper.DoWhileStatement(node);
    case "ExportAllDeclaration":
      return mapper.ExportAllDeclaration(node);
    case "ExportDefaultDeclaration":
      return mapper.ExportDefaultDeclaration(node);
    case "ExportNamedDeclaration":
      return mapper.ExportNamedDeclaration(node);
    case "ExpressionStatement":
      return mapper.ExpressionStatement(node);
    case "ForInStatement":
      return mapper.ForInStatement(node);
    case "ForOfStatement":
      return mapper.ForOfStatement(node);
    case "ForStatement":
      return mapper.ForStatement(node);
    case "FunctionDeclaration":
      return mapper.FunctionDeclaration(node);
    case "IfStatement":
      return mapper.IfStatement(node);
    case "ImportDeclaration":
      return mapper.ImportDeclaration(node);
    case "LabeledStatement":
      return mapper.LabeledStatement(node);
    case "ReturnStatement":
      return mapper.ReturnStatement(node);
    case "SwitchStatement":
      return mapper.SwitchStatement(node);
    case "ThrowStatement":
      return mapper.ThrowStatement(node);
    case "TryStatement":
      return mapper.TryStatement(node);
    case "WhileStatement":
      return mapper.WhileStatement(node);
    case "WithStatement":
      return mapper.WithStatement(node);
    case "Literal":
      return mapper.Literal(node);
    case "ArrayExpression":
      return mapper.ArrayExpression(node);
    case "ArrowFunctionExpression":
      return mapper.ArrowFunctionExpression(node);
    case "AssignmentExpression":
      return mapper.AssignmentExpression(node);
    case "AwaitExpression":
      return mapper.AwaitExpression(node);
    case "BinaryExpression":
      return mapper.BinaryExpression(node);
    case "CallExpression":
      return mapper.CallExpression(node);
    case "ChainExpression":
      return mapper.ChainExpression(node);
    case "ClassExpression":
      return mapper.ClassExpression(node);
    case "ConditionalExpression":
      return mapper.ConditionalExpression(node);
    case "FunctionExpression":
      return mapper.FunctionExpression(node);
    case "Identifier":
      return mapper.Identifier(node);
    case "ImportExpression":
      return mapper.ImportExpression(node);
    case "LogicalExpression":
      return mapper.LogicalExpression(node);
    case "MemberExpression":
      return mapper.MemberExpression(node);
    case "MetaProperty":
      return mapper.MetaProperty(node);
    case "NewExpression":
      return mapper.NewExpression(node);
    case "ObjectExpression":
      return mapper.ObjectExpression(node);
    case "SequenceExpression":
      return mapper.SequenceExpression(node);
    case "TaggedTemplateExpression":
      return mapper.TaggedTemplateExpression(node);
    case "TemplateLiteral":
      return mapper.TemplateLiteral(node);
    case "ThisExpression":
      return mapper.ThisExpression(node);
    case "UnaryExpression":
      return mapper.UnaryExpression(node);
    case "UpdateExpression":
      return mapper.UpdateExpression(node);
    case "YieldExpression":
      return mapper.YieldExpression(node);
    case "ExportSpecifier":
      return mapper.ExportSpecifier(node);
    // case "ImportDefaultSpecifier":
    // case "ImportNamespaceSpecifier":
    // case "ImportSpecifier":
    // case "ImportAttribute":
    case "ArrayPattern":
      return mapper.ArrayPattern(node);
    // case "JSXElement":
    // case "JSXFragment":
    case "ObjectPattern":
      return mapper.ObjectPattern(node);
    // case "Super":

    case "AssignmentPattern":
      return mapper.AssignmentPattern(node);
    case "RestElement":
      return mapper.RestElement(node);
    case "ClassBody":
      return mapper.ClassBody(node);
    case "MethodDefinition":
      return mapper.MethodDefinition(node);
    case "PropertyDefinition":
      return mapper.PropertyDefinition(node);
    case "StaticBlock":
      return mapper.StaticBlock(node);
    // case "PrivateIdentifier":
    case "SpreadElement":
      return mapper.SpreadElement(node);
    case "Property":
      return mapper.Property(node);
    case "SwitchCase":
      return mapper.SwitchCase(node);
    case "ImportSpecifier":
      return mapper.ImportSpecifier(node);
    case "VariableDeclarator":
    case "TemplateElement":
    case "CatchClause":
    case "TSDeclareFunction":
    case "TSEnumDeclaration":
    case "TSExportAssignment":
    case "TSImportEqualsDeclaration":
    case "TSInterfaceDeclaration":
    case "TSModuleDeclaration":
    case "TSNamespaceExportDeclaration":
    case "TSTypeAliasDeclaration":
    case "TSAsExpression":
    case "TSInstantiationExpression":
    case "TSNonNullExpression":
    case "TSSatisfiesExpression":
    case "TSTypeAssertion":
    case "VariableDeclaration":
    case "TSAnyKeyword":
    case "TSArrayType":
    case "TSBigIntKeyword":
    case "TSBooleanKeyword":
    case "TSConditionalType":
    case "TSFunctionType":
    case "TSImportType":
    case "TSIndexedAccessType":
    case "TSInferType":
    case "TSIntersectionType":
    case "TSIntrinsicKeyword":
    case "TSLiteralType":
    case "TSMappedType":
    case "TSNamedTupleMember":
    case "TSNeverKeyword":
    case "TSNullKeyword":
    case "TSNumberKeyword":
    case "TSObjectKeyword":
    case "TSOptionalType":
    case "TSQualifiedName":
    case "TSRestType":
    case "TSStringKeyword":
    case "TSSymbolKeyword":
    case "TSTemplateLiteralType":
    case "TSThisType":
    case "TSTupleType":
    case "TSTypeLiteral":
    case "TSTypeOperator":
    case "TSTypePredicate":
    case "TSTypeQuery":
    case "TSTypeReference":
    case "TSUndefinedKeyword":
    case "TSUnionType":
    case "TSUnknownKeyword":
    case "TSVoidKeyword":
    case "TSExternalModuleReference":
    case "Decorator":
    case "JSXIdentifier":
    case "JSXNamespacedName":
    case "JSXEmptyExpression":
    case "JSXOpeningElement":
    case "JSXAttribute":
    case "JSXSpreadAttribute":
    case "JSXClosingElement":
    case "JSXOpeningFragment":
    case "JSXClosingFragment":
    case "JSXExpressionContainer":
    case "JSXText":
    case "JSXMemberExpression":
    case "TSModuleBlock":
    case "TSClassImplements":
    case "TSCallSignatureDeclaration":
    case "TSPropertySignature":
    case "TSEnumBody":
    case "TSEnumMember":
    case "TSTypeParameterInstantiation":
    case "TSInterfaceBody":
    case "TSConstructSignatureDeclaration":
    case "TSMethodSignature":
    case "TSInterfaceHeritage":
    case "TSTypeAnnotation":
    case "TSTypeParameterDeclaration":
    case "TSAbstractMethodDefinition":
    case "TSAbstractPropertyDefinition":
    case "TSIndexSignature":
    case "TSEmptyBodyFunctionExpression":
    case "TSTypeParameter": {
      throw new Error(node.type);
    }
    default: {
      throw new Error(node.type);
    }
  }
}

function toImportSpecifier(
  node: Deno.lint.ImportSpecifier,
  mapper: Mapper,
): estree.ImportSpecifier {
  const imported = _toIdentifierOrLiteral(node.imported, mapper);
  const local = mapper.Identifier(node.local);

  return {
    type: node.type,
    imported,
    local,
    range: node.range,
  };
}

export interface Mapper {
  Program: (node: Deno.lint.Program) => estree.Program;
  BlockStatement: (node: Deno.lint.BlockStatement) => estree.BlockStatement;
  BreakStatement: (node: Deno.lint.BreakStatement) => estree.BreakStatement;
  ClassDeclaration: (
    node: Deno.lint.ClassDeclaration,
  ) => estree.ClassDeclaration;
  ContinueStatement: (
    node: Deno.lint.ContinueStatement,
  ) => estree.ContinueStatement;
  DebuggerStatement: (
    node: Deno.lint.DebuggerStatement,
  ) => estree.DebuggerStatement;
  DoWhileStatement: (
    node: Deno.lint.DoWhileStatement,
  ) => estree.DoWhileStatement;
  ExportAllDeclaration: (
    node: Deno.lint.ExportAllDeclaration,
  ) => estree.ExportAllDeclaration;
  ExportDefaultDeclaration: (
    node: Deno.lint.ExportDefaultDeclaration,
  ) => estree.ExportDefaultDeclaration;
  ExportNamedDeclaration: (
    node: Deno.lint.ExportNamedDeclaration,
  ) => estree.ExportNamedDeclaration;
  ExpressionStatement: (
    node: Deno.lint.ExpressionStatement,
  ) => estree.ExpressionStatement;
  ForInStatement: (node: Deno.lint.ForInStatement) => estree.ForInStatement;
  ForOfStatement: (node: Deno.lint.ForOfStatement) => estree.ForOfStatement;
  ForStatement: (node: Deno.lint.ForStatement) => estree.ForStatement;
  FunctionDeclaration: (
    node: Deno.lint.FunctionDeclaration,
  ) => estree.FunctionDeclaration;
  IfStatement: (node: Deno.lint.IfStatement) => estree.IfStatement;
  ImportDeclaration: (
    node: Deno.lint.ImportDeclaration,
  ) => estree.ImportDeclaration;
  LabeledStatement: (
    node: Deno.lint.LabeledStatement,
  ) => estree.LabeledStatement;
  ReturnStatement: (node: Deno.lint.ReturnStatement) => estree.ReturnStatement;
  SwitchStatement: (node: Deno.lint.SwitchStatement) => estree.SwitchStatement;
  ThrowStatement: (node: Deno.lint.ThrowStatement) => estree.ThrowStatement;
  TryStatement: (node: Deno.lint.TryStatement) => estree.TryStatement;
  TSDeclareFunction: (
    node: Deno.lint.TSDeclareFunction,
  ) => estree.TSDeclareFunction;
  TSEnumDeclaration: (
    node: Deno.lint.TSEnumDeclaration,
  ) => estree.TSEnumDeclaration;
  TSExportAssignment: (
    node: Deno.lint.TSExportAssignment,
  ) => estree.TSExportAssignment;
  TSImportEqualsDeclaration: (
    node: Deno.lint.TSImportEqualsDeclaration,
  ) => estree.TSImportEqualsDeclaration;
  TSInterfaceDeclaration: (
    node: Deno.lint.TSInterfaceDeclaration,
  ) => estree.TSInterfaceDeclaration;
  TSModuleDeclaration: (
    node: Deno.lint.TSModuleDeclaration,
  ) => estree.TSModuleDeclaration;
  TSNamespaceExportDeclaration: (
    node: Deno.lint.TSNamespaceExportDeclaration,
  ) => estree.TSNamespaceExportDeclaration;
  TSTypeAliasDeclaration: (
    node: Deno.lint.TSTypeAliasDeclaration,
  ) => estree.TSTypeAliasDeclaration;
  VariableDeclaration: (
    node: Deno.lint.VariableDeclaration,
  ) => estree.VariableDeclaration;
  WhileStatement: (node: Deno.lint.WhileStatement) => estree.WhileStatement;
  WithStatement: (node: Deno.lint.WithStatement) => estree.WithStatement;
  ArrayExpression: (node: Deno.lint.ArrayExpression) => estree.ArrayExpression;
  ArrayPattern: (node: Deno.lint.ArrayPattern) => estree.ArrayPattern;
  ArrowFunctionExpression: (
    node: Deno.lint.ArrowFunctionExpression,
  ) => estree.ArrowFunctionExpression;
  AssignmentExpression: (
    node: Deno.lint.AssignmentExpression,
  ) => estree.AssignmentExpression;
  AwaitExpression: (node: Deno.lint.AwaitExpression) => estree.AwaitExpression;
  BinaryExpression: (
    node: Deno.lint.BinaryExpression,
  ) => estree.BinaryExpression;
  CallExpression: (node: Deno.lint.CallExpression) => estree.CallExpression;
  ChainExpression: (node: Deno.lint.ChainExpression) => estree.ChainExpression;
  ClassExpression: (node: Deno.lint.ClassExpression) => estree.ClassExpression;
  ConditionalExpression: (
    node: Deno.lint.ConditionalExpression,
  ) => estree.ConditionalExpression;
  FunctionExpression: (
    node: Deno.lint.FunctionExpression,
  ) => estree.FunctionExpression;
  Identifier: (node: Deno.lint.Identifier) => estree.Identifier;
  ImportExpression: (
    node: Deno.lint.ImportExpression,
  ) => estree.ImportExpression;
  JSXElement: (node: Deno.lint.JSXElement) => estree.JSXElement;
  JSXFragment: (node: Deno.lint.JSXFragment) => estree.JSXFragment;
  Literal: (node: Deno.lint.Literal) => estree.Literal;
  TemplateLiteral: (node: Deno.lint.TemplateLiteral) => estree.TemplateLiteral;
  LogicalExpression: (
    node: Deno.lint.LogicalExpression,
  ) => estree.LogicalExpression;
  MemberExpression: (
    node: Deno.lint.MemberExpression,
  ) => estree.MemberExpression;
  MetaProperty: (node: Deno.lint.MetaProperty) => estree.MetaProperty;
  NewExpression: (node: Deno.lint.NewExpression) => estree.NewExpression;
  ObjectExpression: (
    node: Deno.lint.ObjectExpression,
  ) => estree.ObjectExpression;
  ObjectPattern: (node: Deno.lint.ObjectPattern) => estree.ObjectPattern;
  SequenceExpression: (
    node: Deno.lint.SequenceExpression,
  ) => estree.SequenceExpression;
  Super: (node: Deno.lint.Super) => estree.Super;
  TaggedTemplateExpression: (
    node: Deno.lint.TaggedTemplateExpression,
  ) => estree.TaggedTemplateExpression;
  ThisExpression: (node: Deno.lint.ThisExpression) => estree.ThisExpression;
  TSAsExpression: (node: Deno.lint.TSAsExpression) => estree.TSAsExpression;
  TSInstantiationExpression: (
    node: Deno.lint.TSInstantiationExpression,
  ) => estree.TSInstantiationExpression;
  TSNonNullExpression: (
    node: Deno.lint.TSNonNullExpression,
  ) => estree.TSNonNullExpression;
  TSSatisfiesExpression: (
    node: Deno.lint.TSSatisfiesExpression,
  ) => estree.TSSatisfiesExpression;
  TSTypeAssertion: (node: Deno.lint.TSTypeAssertion) => estree.TSTypeAssertion;
  UnaryExpression: (node: Deno.lint.UnaryExpression) => estree.UnaryExpression;
  UpdateExpression: (
    node: Deno.lint.UpdateExpression,
  ) => estree.UpdateExpression;
  YieldExpression: (node: Deno.lint.YieldExpression) => estree.YieldExpression;
  ImportSpecifier: (node: Deno.lint.ImportSpecifier) => estree.ImportSpecifier;
  ImportDefaultSpecifier: (
    node: Deno.lint.ImportDefaultSpecifier,
  ) => estree.ImportDefaultSpecifier;
  ImportNamespaceSpecifier: (
    node: Deno.lint.ImportNamespaceSpecifier,
  ) => estree.ImportNamespaceSpecifier;
  ImportAttribute: (node: Deno.lint.ImportAttribute) => estree.ImportAttribute;
  TSExternalModuleReference: (
    node: Deno.lint.TSExternalModuleReference,
  ) => estree.TSExternalModuleReference;
  ExportSpecifier: (node: Deno.lint.ExportSpecifier) => estree.ExportSpecifier;
  VariableDeclarator: (
    node: Deno.lint.VariableDeclarator,
  ) => estree.VariableDeclarator;
  Decorator: (node: Deno.lint.Decorator) => estree.Decorator;
  ClassBody: (node: Deno.lint.ClassBody) => estree.ClassBody;
  StaticBlock: (node: Deno.lint.StaticBlock) => estree.StaticBlock;
  PropertyDefinition: (
    node: Deno.lint.PropertyDefinition,
  ) => estree.PropertyDefinition;
  MethodDefinition: (
    node: Deno.lint.MethodDefinition,
  ) => estree.MethodDefinition;
  SwitchCase: (node: Deno.lint.SwitchCase) => estree.SwitchCase;
  CatchClause: (node: Deno.lint.CatchClause) => estree.CatchClause;
  TemplateElement: (node: Deno.lint.TemplateElement) => estree.TemplateElement;
  PrivateIdentifier: (
    node: Deno.lint.PrivateIdentifier,
  ) => estree.PrivateIdentifier;
  AssignmentPattern: (
    node: Deno.lint.AssignmentPattern,
  ) => estree.AssignmentPattern;
  RestElement: (node: Deno.lint.RestElement) => estree.RestElement;
  SpreadElement: (node: Deno.lint.SpreadElement) => estree.SpreadElement;
  Property: (node: Deno.lint.Property) => estree.Property;
  JSXIdentifier: (node: Deno.lint.JSXIdentifier) => estree.JSXIdentifier;
  JSXNamespacedName: (
    node: Deno.lint.JSXNamespacedName,
  ) => estree.JSXNamespacedName;
  JSXEmptyExpression: (
    node: Deno.lint.JSXEmptyExpression,
  ) => estree.JSXEmptyExpression;
  JSXOpeningElement: (
    node: Deno.lint.JSXOpeningElement,
  ) => estree.JSXOpeningElement;
  JSXAttribute: (node: Deno.lint.JSXAttribute) => estree.JSXAttribute;
  JSXSpreadAttribute: (
    node: Deno.lint.JSXSpreadAttribute,
  ) => estree.JSXSpreadAttribute;
  JSXClosingElement: (
    node: Deno.lint.JSXClosingElement,
  ) => estree.JSXClosingElement;
  JSXOpeningFragment: (
    node: Deno.lint.JSXOpeningFragment,
  ) => estree.JSXOpeningFragment;
  JSXClosingFragment: (
    node: Deno.lint.JSXClosingFragment,
  ) => estree.JSXClosingFragment;
  JSXExpressionContainer: (
    node: Deno.lint.JSXExpressionContainer,
  ) => estree.JSXExpressionContainer;
  JSXText: (node: Deno.lint.JSXText) => estree.JSXText;
  JSXMemberExpression: (
    node: Deno.lint.JSXMemberExpression,
  ) => estree.JSXMemberExpression;
  TSModuleBlock: (node: Deno.lint.TSModuleBlock) => estree.TSModuleBlock;
  TSClassImplements: (
    node: Deno.lint.TSClassImplements,
  ) => estree.TSClassImplements;
  TSAbstractMethodDefinition: (
    node: Deno.lint.TSAbstractMethodDefinition,
  ) => estree.TSAbstractMethodDefinition;
  TSAbstractPropertyDefinition: (
    node: Deno.lint.TSAbstractPropertyDefinition,
  ) => estree.TSAbstractPropertyDefinition;
  TSEmptyBodyFunctionExpression: (
    node: Deno.lint.TSEmptyBodyFunctionExpression,
  ) => estree.TSEmptyBodyFunctionExpression;
  TSCallSignatureDeclaration: (
    node: Deno.lint.TSCallSignatureDeclaration,
  ) => estree.TSCallSignatureDeclaration;
  TSPropertySignature: (
    node: Deno.lint.TSPropertySignature,
  ) => estree.TSPropertySignature;
  TSEnumBody: (node: Deno.lint.TSEnumBody) => estree.TSEnumBody;
  TSEnumMember: (node: Deno.lint.TSEnumMember) => estree.TSEnumMember;
  TSTypeParameterInstantiation: (
    node: Deno.lint.TSTypeParameterInstantiation,
  ) => estree.TSTypeParameterInstantiation;
  TSInterfaceBody: (node: Deno.lint.TSInterfaceBody) => estree.TSInterfaceBody;
  TSConstructSignatureDeclaration: (
    node: Deno.lint.TSConstructSignatureDeclaration,
  ) => estree.TSConstructSignatureDeclaration;
  TSMethodSignature: (
    node: Deno.lint.TSMethodSignature,
  ) => estree.TSMethodSignature;
  TSInterfaceHeritage: (
    node: Deno.lint.TSInterfaceHeritage,
  ) => estree.TSInterfaceHeritage;
  TSIndexSignature: (
    node: Deno.lint.TSIndexSignature,
  ) => estree.TSIndexSignature;
  TSTypeAnnotation: (
    node: Deno.lint.TSTypeAnnotation,
  ) => estree.TSTypeAnnotation;
  TSTypeParameterDeclaration: (
    node: Deno.lint.TSTypeParameterDeclaration,
  ) => estree.TSTypeParameterDeclaration;
  TSTypeParameter: (node: Deno.lint.TSTypeParameter) => estree.TSTypeParameter;
  LineComment: (node: Deno.lint.LineComment) => estree.LineComment;
  BlockComment: (node: Deno.lint.BlockComment) => estree.BlockComment;
}

export function createMapper(
  on: (node: Deno.lint.Node, estree: estree.Node) => void,
): Mapper {
  const mapper: Mapper = {
    Program: (node) => {
      const result = toProgram(node, mapper);
      on(node, result);
      return result;
    },

    BlockStatement: (node) => {
      const result = toBlockStatement(node, mapper);
      on(node, result);
      return result;
    },

    BreakStatement: (node) => {
      const result = toBreakStatement(node, mapper);
      on(node, result);
      return result;
    },

    ClassDeclaration: (node) => {
      const result = toClassDeclaration(node, mapper);
      on(node, result);
      return result;
    },

    ContinueStatement: (node) => {
      const result = toContinueStatement(node, mapper);
      on(node, result);
      return result;
    },

    DebuggerStatement: (node) => {
      const result = toDebuggerStatement(node, mapper);
      on(node, result);
      return result;
    },

    DoWhileStatement: (node) => {
      const result = toDoWhileStatement(node, mapper);
      on(node, result);
      return result;
    },

    ExportAllDeclaration: (node) => {
      const result = toExportAllDeclaration(node, mapper);
      on(node, result);
      return result;
    },

    ExportDefaultDeclaration: (node) => {
      const result = toExportDefaultDeclaration(node, mapper);
      on(node, result);
      return result;
    },

    ExportNamedDeclaration: (node) => {
      const result = toExportNamedDeclaration(node, mapper);
      on(node, result);
      return result;
    },

    ExpressionStatement: (node) => {
      const result = toExpressionStatement(node, mapper);
      on(node, result);
      return result;
    },

    ForInStatement: (node) => {
      const result = toForInStatement(node, mapper);
      on(node, result);
      return result;
    },

    ForOfStatement: (node) => {
      const result = toForOfStatement(node, mapper);
      on(node, result);
      return result;
    },

    ForStatement: (node) => {
      const result = toForStatement(node, mapper);
      on(node, result);
      return result;
    },

    FunctionDeclaration: (node) => {
      const result = toFunctionDeclaration(node, mapper);
      on(node, result);
      return result;
    },

    IfStatement: (node) => {
      const result = toIfStatement(node, mapper);
      on(node, result);
      return result;
    },

    ImportDeclaration: (node) => {
      const result = toImportDeclaration(node, mapper);
      on(node, result);
      return result;
    },

    LabeledStatement: (node) => {
      const result = toLabeledStatement(node, mapper);
      on(node, result);
      return result;
    },

    ReturnStatement: (node) => {
      const result = toReturnStatement(node, mapper);
      on(node, result);
      return result;
    },

    SwitchStatement: (node) => {
      const result = toSwitchStatement(node, mapper);
      on(node, result);
      return result;
    },

    ThrowStatement: (node) => {
      const result = toThrowStatement(node, mapper);
      on(node, result);
      return result;
    },

    TryStatement: (node) => {
      const result = toTryStatement(node, mapper);
      on(node, result);
      return result;
    },

    TSDeclareFunction: (node) => {
      const result = toTSDeclareFunction(node, mapper);
      on(node, result);
      return result;
    },

    TSEnumDeclaration: (node) => {
      const result = toTSEnumDeclaration(node, mapper);
      on(node, result);
      return result;
    },

    TSExportAssignment: (node) => {
      const result = toTSExportAssignment(node, mapper);
      on(node, result);
      return result;
    },

    TSImportEqualsDeclaration: (node) => {
      const result = toTSImportEqualsDeclaration(node, mapper);
      on(node, result);
      return result;
    },

    TSInterfaceDeclaration: (node) => {
      const result = toTSInterfaceDeclaration(node, mapper);
      on(node, result);
      return result;
    },

    TSModuleDeclaration: (node) => {
      const result = toTSModuleDeclaration(node, mapper);
      on(node, result);
      return result;
    },

    TSNamespaceExportDeclaration: (node) => {
      const result = toTSNamespaceExportDeclaration(node, mapper);
      on(node, result);
      return result;
    },

    TSTypeAliasDeclaration: (node) => {
      const result = toTSTypeAliasDeclaration(node, mapper);
      on(node, result);
      return result;
    },

    VariableDeclaration: (node) => {
      const result = toVariableDeclaration(node, mapper);
      on(node, result);
      return result;
    },

    WhileStatement: (node) => {
      const result = toWhileStatement(node, mapper);
      on(node, result);
      return result;
    },

    WithStatement: (node) => {
      const result = toWithStatement(node, mapper);
      on(node, result);
      return result;
    },

    ArrayExpression: (node) => {
      const result = toArrayExpression(node, mapper);
      on(node, result);
      return result;
    },

    ArrayPattern: (node) => {
      const result = toArrayPattern(node, mapper);
      on(node, result);
      return result;
    },

    ArrowFunctionExpression: (node) => {
      const result = toArrowFunctionExpression(node, mapper);
      on(node, result);
      return result;
    },

    AssignmentExpression: (node) => {
      const result = toAssignmentExpression(node, mapper);
      on(node, result);
      return result;
    },

    AwaitExpression: (node) => {
      const result = toAwaitExpression(node, mapper);
      on(node, result);
      return result;
    },

    BinaryExpression: (node) => {
      const result = toBinaryExpression(node, mapper);
      on(node, result);
      return result;
    },

    CallExpression: (node) => {
      const result = toCallExpression(node, mapper);
      on(node, result);
      return result;
    },

    ChainExpression: (node) => {
      const result = toChainExpression(node, mapper);
      on(node, result);
      return result;
    },

    ClassExpression: (node) => {
      const result = toClassExpression(node, mapper);
      on(node, result);
      return result;
    },

    ConditionalExpression: (node) => {
      const result = toConditionalExpression(node, mapper);
      on(node, result);
      return result;
    },

    FunctionExpression: (node) => {
      const result = toFunctionExpression(node, mapper);
      on(node, result);
      return result;
    },

    Identifier: (node) => {
      const result = toIdentifier(node, mapper);
      on(node, result);
      return result;
    },

    ImportExpression: (node) => {
      const result = toImportExpression(node, mapper);
      on(node, result);
      return result;
    },

    JSXElement: (node) => {
      const result = toJSXElement(node, mapper);
      on(node, result);
      return result;
    },

    JSXFragment: (node) => {
      const result = toJSXFragment(node, mapper);
      on(node, result);
      return result;
    },

    Literal: (node) => {
      const result = toLiteral(node, mapper);
      on(node, result);
      return result;
    },

    TemplateLiteral: (node) => {
      const result = toTemplateLiteral(node, mapper);
      on(node, result);
      return result;
    },

    LogicalExpression: (node) => {
      const result = toLogicalExpression(node, mapper);
      on(node, result);
      return result;
    },

    MemberExpression: (node) => {
      const result = toMemberExpression(node, mapper);
      on(node, result);
      return result;
    },

    MetaProperty: (node) => {
      const result = toMetaProperty(node, mapper);
      on(node, result);
      return result;
    },

    NewExpression: (node) => {
      const result = toNewExpression(node, mapper);
      on(node, result);
      return result;
    },

    ObjectExpression: (node) => {
      const result = toObjectExpression(node, mapper);
      on(node, result);
      return result;
    },

    ObjectPattern: (node) => {
      const result = toObjectPattern(node, mapper);
      on(node, result);
      return result;
    },

    SequenceExpression: (node) => {
      const result = toSequenceExpression(node, mapper);
      on(node, result);
      return result;
    },

    Super: (node) => {
      const result = toSuper(node, mapper);
      on(node, result);
      return result;
    },

    TaggedTemplateExpression: (node) => {
      const result = toTaggedTemplateExpression(node, mapper);
      on(node, result);
      return result;
    },

    ThisExpression: (node) => {
      const result = toThisExpression(node, mapper);
      on(node, result);
      return result;
    },

    TSAsExpression: (node) => {
      const result = toTSAsExpression(node, mapper);
      on(node, result);
      return result;
    },

    TSInstantiationExpression: (node) => {
      const result = toTSInstantiationExpression(node, mapper);
      on(node, result);
      return result;
    },

    TSNonNullExpression: (node) => {
      const result = toTSNonNullExpression(node, mapper);
      on(node, result);
      return result;
    },

    TSSatisfiesExpression: (node) => {
      const result = toTSSatisfiesExpression(node, mapper);
      on(node, result);
      return result;
    },

    TSTypeAssertion: (node) => {
      const result = toTSTypeAssertion(node, mapper);
      on(node, result);
      return result;
    },

    UnaryExpression: (node) => {
      const result = toUnaryExpression(node, mapper);
      on(node, result);
      return result;
    },

    UpdateExpression: (node) => {
      const result = toUpdateExpression(node, mapper);
      on(node, result);
      return result;
    },

    YieldExpression: (node) => {
      const result = toYieldExpression(node, mapper);
      on(node, result);
      return result;
    },

    ImportSpecifier: (node) => {
      const result = toImportSpecifier(node, mapper);
      on(node, result);
      return result;
    },

    ImportDefaultSpecifier: (node) => {
      const result = toImportDefaultSpecifier(node, mapper);
      on(node, result);
      return result;
    },

    ImportNamespaceSpecifier: (node) => {
      const result = toImportNamespaceSpecifier(node, mapper);
      on(node, result);
      return result;
    },

    ImportAttribute: (node) => {
      const result = toImportAttribute(node, mapper);
      on(node, result);
      return result;
    },

    TSExternalModuleReference: (node) => {
      const result = toTSExternalModuleReference(node, mapper);
      on(node, result);
      return result;
    },

    ExportSpecifier: (node) => {
      const result = toExportSpecifier(node, mapper);
      on(node, result);
      return result;
    },

    VariableDeclarator: (node) => {
      const result = toVariableDeclarator(node, mapper);
      on(node, result);
      return result;
    },

    Decorator: (node) => {
      const result = toDecorator(node, mapper);
      on(node, result);
      return result;
    },

    ClassBody: (node) => {
      const result = toClassBody(node, mapper);
      on(node, result);
      return result;
    },

    StaticBlock: (node) => {
      const result = toStaticBlock(node, mapper);
      on(node, result);
      return result;
    },

    PropertyDefinition: (node) => {
      const result = toPropertyDefinition(node, mapper);
      on(node, result);
      return result;
    },

    MethodDefinition: (node) => {
      const result = toMethodDefinition(node, mapper);
      on(node, result);
      return result;
    },

    SwitchCase: (node) => {
      const result = toSwitchCase(node, mapper);
      on(node, result);
      return result;
    },

    CatchClause: (node) => {
      const result = toCatchClause(node, mapper);
      on(node, result);
      return result;
    },

    TemplateElement: (node) => {
      const result = toTemplateElement(node, mapper);
      on(node, result);
      return result;
    },

    PrivateIdentifier: (node) => {
      const result = toPrivateIdentifier(node, mapper);
      on(node, result);
      return result;
    },

    AssignmentPattern: (node) => {
      const result = toAssignmentPattern(node, mapper);
      on(node, result);
      return result;
    },

    RestElement: (node) => {
      const result = toRestElement(node, mapper);
      on(node, result);
      return result;
    },

    SpreadElement: (node) => {
      const result = toSpreadElement(node, mapper);
      on(node, result);
      return result;
    },

    Property: (node) => {
      const result = toProperty(node, mapper);
      on(node, result);
      return result;
    },

    JSXIdentifier: (node) => {
      const result = toJSXIdentifier(node, mapper);
      on(node, result);
      return result;
    },

    JSXNamespacedName: (node) => {
      const result = toJSXNamespacedName(node, mapper);
      on(node, result);
      return result;
    },

    JSXEmptyExpression: (node) => {
      const result = toJSXEmptyExpression(node, mapper);
      on(node, result);
      return result;
    },

    JSXOpeningElement: (node) => {
      const result = toJSXOpeningElement(node, mapper);
      on(node, result);
      return result;
    },

    JSXAttribute: (node) => {
      const result = toJSXAttribute(node, mapper);
      on(node, result);
      return result;
    },

    JSXSpreadAttribute: (node) => {
      const result = toJSXSpreadAttribute(node, mapper);
      on(node, result);
      return result;
    },

    JSXClosingElement: (node) => {
      const result = toJSXClosingElement(node, mapper);
      on(node, result);
      return result;
    },

    JSXOpeningFragment: (node) => {
      const result = toJSXOpeningFragment(node, mapper);
      on(node, result);
      return result;
    },

    JSXClosingFragment: (node) => {
      const result = toJSXClosingFragment(node, mapper);
      on(node, result);
      return result;
    },

    JSXExpressionContainer: (node) => {
      const result = toJSXExpressionContainer(node, mapper);
      on(node, result);
      return result;
    },

    JSXText: (node) => {
      const result = toJSXText(node, mapper);
      on(node, result);
      return result;
    },

    JSXMemberExpression: (node) => {
      const result = toJSXMemberExpression(node, mapper);
      on(node, result);
      return result;
    },

    TSModuleBlock: (node) => {
      const result = toTSModuleBlock(node, mapper);
      on(node, result);
      return result;
    },

    TSClassImplements: (node) => {
      const result = toTSClassImplements(node, mapper);
      on(node, result);
      return result;
    },

    TSAbstractMethodDefinition: (node) => {
      const result = toTSAbstractMethodDefinition(node, mapper);
      on(node, result);
      return result;
    },

    TSAbstractPropertyDefinition: (node) => {
      const result = toTSAbstractPropertyDefinition(node, mapper);
      on(node, result);
      return result;
    },

    TSEmptyBodyFunctionExpression: (node) => {
      const result = toTSEmptyBodyFunctionExpression(node, mapper);
      on(node, result);
      return result;
    },

    TSCallSignatureDeclaration: (node) => {
      const result = toTSCallSignatureDeclaration(node, mapper);
      on(node, result);
      return result;
    },

    TSPropertySignature: (node) => {
      const result = toTSPropertySignature(node, mapper);
      on(node, result);
      return result;
    },

    TSEnumBody: (node) => {
      const result = toTSEnumBody(node, mapper);
      on(node, result);
      return result;
    },

    TSEnumMember: (node) => {
      const result = toTSEnumMember(node, mapper);
      on(node, result);
      return result;
    },

    TSTypeParameterInstantiation: (node) => {
      const result = toTSTypeParameterInstantiation(node, mapper);
      on(node, result);
      return result;
    },

    TSInterfaceBody: (node) => {
      const result = toTSInterfaceBody(node, mapper);
      on(node, result);
      return result;
    },

    TSConstructSignatureDeclaration: (node) => {
      const result = toTSConstructSignatureDeclaration(node, mapper);
      on(node, result);
      return result;
    },

    TSMethodSignature: (node) => {
      const result = toTSMethodSignature(node, mapper);
      on(node, result);
      return result;
    },

    TSInterfaceHeritage: (node) => {
      const result = toTSInterfaceHeritage(node, mapper);
      on(node, result);
      return result;
    },

    TSIndexSignature: (node) => {
      const result = toTSIndexSignature(node, mapper);
      on(node, result);
      return result;
    },

    TSTypeAnnotation: (node) => {
      const result = toTSTypeAnnotation(node, mapper);
      on(node, result);
      return result;
    },

    TSTypeParameterDeclaration: (node) => {
      const result = toTSTypeParameterDeclaration(node, mapper);
      on(node, result);
      return result;
    },

    TSTypeParameter: (node) => {
      const result = toTSTypeParameter(node, mapper);
      on(node, result);
      return result;
    },

    LineComment: (node) => {
      const result = toLineComment(node, mapper);
      on(node, result);
      return result;
    },

    BlockComment: (node) => {
      const result = toBlockComment(node, mapper);
      on(node, result);
      return result;
    },
  };

  return mapper;
}
