import type { ChallengeValidationDefinition } from '@/lib/content.types';
import {
  PLAYWRIGHT_ACTION_METHODS,
  PLAYWRIGHT_LOCATOR_RETURNING_METHODS,
} from './playwright-methods';

/**
 * Findings from the source-policy pass. This is intentionally a report, not a
 * sandbox: the learner code still runs in the existing iframe shim and runtime
 * evidence is the authority for opt-in executed-evidence contracts.
 */
export interface SourcePolicyAnalysis {
  calledMethods: string[];
  calledFunctions?: string[];
  memberCalls?: string[];
  asyncFunctions?: string[];
  awaitedFunctionCalls?: string[];
  awaitedMemberCalls?: string[];
  awaitedPromiseAllFunctionCalls?: string[];
  constBindings?: string[];
  typeScriptEvidence?: string[];
  conditionalBranchCount?: number;
  tryCatchCount?: number;
  forbiddenMethods: string[];
  structuralLocatorCalls: number;
  forcedActions: Array<{ method: string; value: unknown; line: number }>;
  directDomAccesses: string[];
  swallowedErrorCount: number;
  strictViolations: string[];
  parserError?: string;
}

interface TypeScriptModule {
  SyntaxKind: typeof import('typescript')['SyntaxKind'];
  NodeFlags: typeof import('typescript')['NodeFlags'];
  ScriptKind: typeof import('typescript')['ScriptKind'];
  ScriptTarget: typeof import('typescript')['ScriptTarget'];
  createSourceFile: typeof import('typescript')['createSourceFile'];
  forEachChild: typeof import('typescript')['forEachChild'];
  isArrayLiteralExpression: typeof import('typescript')['isArrayLiteralExpression'];
  isBinaryExpression: typeof import('typescript')['isBinaryExpression'];
  isBindingElement: typeof import('typescript')['isBindingElement'];
  isBlock: typeof import('typescript')['isBlock'];
  isCallExpression: typeof import('typescript')['isCallExpression'];
  isCatchClause: typeof import('typescript')['isCatchClause'];
  isConditionalExpression: typeof import('typescript')['isConditionalExpression'];
  isComputedPropertyName: typeof import('typescript')['isComputedPropertyName'];
  isElementAccessExpression: typeof import('typescript')['isElementAccessExpression'];
  isArrowFunction: typeof import('typescript')['isArrowFunction'];
  isFunctionDeclaration: typeof import('typescript')['isFunctionDeclaration'];
  isFunctionExpression: typeof import('typescript')['isFunctionExpression'];
  isInterfaceDeclaration: typeof import('typescript')['isInterfaceDeclaration'];
  isIdentifier: typeof import('typescript')['isIdentifier'];
  isNumericLiteral: typeof import('typescript')['isNumericLiteral'];
  isObjectBindingPattern: typeof import('typescript')['isObjectBindingPattern'];
  isObjectLiteralExpression: typeof import('typescript')['isObjectLiteralExpression'];
  isParenthesizedExpression: typeof import('typescript')['isParenthesizedExpression'];
  isPrefixUnaryExpression: typeof import('typescript')['isPrefixUnaryExpression'];
  isPropertyAccessExpression: typeof import('typescript')['isPropertyAccessExpression'];
  isPropertyAssignment: typeof import('typescript')['isPropertyAssignment'];
  isPropertyDeclaration: typeof import('typescript')['isPropertyDeclaration'];
  isPropertySignature: typeof import('typescript')['isPropertySignature'];
  isShorthandPropertyAssignment: typeof import('typescript')['isShorthandPropertyAssignment'];
  isSpreadAssignment: typeof import('typescript')['isSpreadAssignment'];
  isStringLiteral: typeof import('typescript')['isStringLiteral'];
  isVariableDeclaration: typeof import('typescript')['isVariableDeclaration'];
  isVariableDeclarationList: typeof import('typescript')['isVariableDeclarationList'];
  isThrowStatement: typeof import('typescript')['isThrowStatement'];
  isFunctionLike: typeof import('typescript')['isFunctionLike'];
  isIfStatement: typeof import('typescript')['isIfStatement'];
  isReturnStatement: typeof import('typescript')['isReturnStatement'];
  isAwaitExpression: typeof import('typescript')['isAwaitExpression'];
}

type TypeScriptNode = import('typescript').Node;
type TypeScriptExpression = import('typescript').Expression;

let typeScriptPromise: Promise<TypeScriptModule> | undefined;

function loadTypeScript(): Promise<TypeScriptModule> {
  // TypeScript is kept out of the initial app module graph. Practice execution
  // loads this analyzer only when a challenge needs source policy or strict
  // Playwright checks. It is already a direct project dependency for tooling.
  typeScriptPromise ??= import('typescript') as unknown as Promise<TypeScriptModule>;
  return typeScriptPromise;
}

const EMPTY_ANALYSIS: SourcePolicyAnalysis = {
  calledMethods: [],
  calledFunctions: [],
  memberCalls: [],
  asyncFunctions: [],
  awaitedFunctionCalls: [],
  awaitedMemberCalls: [],
  awaitedPromiseAllFunctionCalls: [],
  constBindings: [],
  typeScriptEvidence: [],
  conditionalBranchCount: 0,
  tryCatchCount: 0,
  forbiddenMethods: [],
  structuralLocatorCalls: 0,
  forcedActions: [],
  directDomAccesses: [],
  swallowedErrorCount: 0,
  strictViolations: [],
};

const GLOBAL_DOM_NAMES = new Set(['document', 'window', 'globalThis']);

interface StaticValue {
  known: boolean;
  value?: unknown;
}

interface MethodReference {
  method: string;
}

function unknownValue(): StaticValue {
  return { known: false };
}

function knownValue(value: unknown): StaticValue {
  return { known: true, value };
}

function getPropertyName(
  ts: TypeScriptModule,
  node: TypeScriptNode,
): string | undefined {
  if (ts.isIdentifier(node) || ts.isStringLiteral(node)) return node.text;
  if (ts.isNumericLiteral(node)) return node.text;
  return undefined;
}

function unwrapExpression(
  ts: TypeScriptModule,
  expression: TypeScriptExpression,
): TypeScriptExpression {
  let current = expression;
  while (ts.isParenthesizedExpression(current)) current = current.expression;
  return current;
}

function isBindingName(
  ts: TypeScriptModule,
  node: TypeScriptNode,
): boolean {
  const parent = node.parent;
  if (!parent) return false;
  if (ts.isVariableDeclaration(parent) && parent.name === node) return true;
  if (ts.isBindingElement(parent) && parent.name === node) return true;
  if (ts.isFunctionLike(parent)) {
    return parent.parameters.some((parameter) => parameter.name === node);
  }
  return false;
}

function isTruthy(value: unknown): boolean {
  return Boolean(value);
}

function analyzeWithTypeScript(
  ts: TypeScriptModule,
  code: string,
  validation: ChallengeValidationDefinition | undefined,
  strictMode: boolean,
): SourcePolicyAnalysis {
  const sourceFile = ts.createSourceFile(
    'challenge.ts',
    code,
    ts.ScriptTarget.Latest,
    true,
    ts.ScriptKind.TSX,
  );
  const calledMethods = new Set<string>();
  const calledFunctions = new Set<string>();
  const memberCalls = new Set<string>();
  const asyncFunctions = new Set<string>();
  const awaitedFunctionCalls = new Set<string>();
  const awaitedMemberCalls = new Set<string>();
  const awaitedPromiseAllFunctionCalls = new Set<string>();
  const constBindings = new Set<string>();
  const typeScriptEvidence = new Set<string>();
  const forbiddenMethods = new Set<string>();
  const directDomAccesses = new Set<string>();
  const strictViolations = new Set<string>();
  const requiredMethods = new Set(validation?.requiredMethods ?? []);
  const forcedActions: SourcePolicyAnalysis['forcedActions'] = [];
  let structuralLocatorCalls = 0;
  let conditionalBranchCount = 0;
  let tryCatchCount = 0;
  const methodAliases = new Map<string, MethodReference>();
  const objectAliases = new Set(['page']);
  const variableInitializers = new Map<string, TypeScriptExpression>();

  const getStaticPropertyName = (
    expression: TypeScriptExpression,
    seen = new Set<string>(),
  ): string | undefined => {
    const unwrapped = unwrapExpression(ts, expression);
    if (ts.isStringLiteral(unwrapped) || ts.isNumericLiteral(unwrapped)) {
      return unwrapped.text;
    }
    if (ts.isIdentifier(unwrapped)) {
      if (seen.has(unwrapped.text)) return undefined;
      seen.add(unwrapped.text);
      const initializer = variableInitializers.get(unwrapped.text);
      return initializer === undefined
        ? undefined
        : getStaticPropertyName(initializer, seen);
    }
    if (ts.isConditionalExpression(unwrapped)) {
      const condition = unwrapExpression(ts, unwrapped.condition);
      if (condition.kind === ts.SyntaxKind.TrueKeyword) {
        return getStaticPropertyName(unwrapped.whenTrue, seen);
      }
      if (condition.kind === ts.SyntaxKind.FalseKeyword) {
        return getStaticPropertyName(unwrapped.whenFalse, seen);
      }
    }
    return undefined;
  };

  const getMethodReference = (
    expression: TypeScriptExpression,
    seen = new Set<string>(),
  ): MethodReference | undefined => {
    const unwrapped = unwrapExpression(ts, expression);

    if (ts.isPropertyAccessExpression(unwrapped)) {
      return { method: unwrapped.name.text };
    }
    if (ts.isElementAccessExpression(unwrapped)) {
      const argument = unwrapped.argumentExpression;
      const propertyName = argument
        ? getStaticPropertyName(argument)
        : undefined;
      return propertyName === undefined ? undefined : { method: propertyName };
    }
    if (ts.isCallExpression(unwrapped)) {
      const bindTarget = ts.isPropertyAccessExpression(unwrapped.expression)
        ? unwrapped.expression
        : ts.isElementAccessExpression(unwrapped.expression)
          ? unwrapped.expression
          : undefined;
      const bindName = bindTarget
        ? ts.isPropertyAccessExpression(bindTarget)
          ? bindTarget.name.text
          : bindTarget.argumentExpression === undefined
            ? undefined
            : getStaticPropertyName(bindTarget.argumentExpression)
        : undefined;
      if (bindTarget && bindName === 'bind') {
        return getMethodReference(bindTarget.expression, seen);
      }
    }
    if (ts.isIdentifier(unwrapped)) {
      if (seen.has(unwrapped.text)) return undefined;
      seen.add(unwrapped.text);
      return methodAliases.get(unwrapped.text);
    }
    return undefined;
  };

  const isPlaywrightObject = (expression: TypeScriptExpression): boolean => {
    const unwrapped = unwrapExpression(ts, expression);
    if (ts.isIdentifier(unwrapped)) return objectAliases.has(unwrapped.text);
    if (ts.isCallExpression(unwrapped)) {
      const method = ts.isIdentifier(unwrapped.expression)
        ? unwrapped.expression.text
        : getMethodReference(unwrapped.expression)?.method;
      return (
        method !== undefined && PLAYWRIGHT_LOCATOR_RETURNING_METHODS.has(method)
      );
    }
    return false;
  };

  const isPlaywrightMethodReference = (
    expression: TypeScriptExpression,
  ): boolean => {
    const unwrapped = unwrapExpression(ts, expression);
    if (ts.isIdentifier(unwrapped)) {
      return methodAliases.has(unwrapped.text);
    }
    if (ts.isPropertyAccessExpression(unwrapped)) {
      return isPlaywrightObject(unwrapped.expression);
    }
    if (ts.isElementAccessExpression(unwrapped)) {
      return isPlaywrightObject(unwrapped.expression);
    }
    if (ts.isCallExpression(unwrapped)) {
      const bindTarget = ts.isPropertyAccessExpression(unwrapped.expression)
        ? unwrapped.expression
        : ts.isElementAccessExpression(unwrapped.expression)
          ? unwrapped.expression
          : undefined;
      if (bindTarget === undefined) return false;
      const bindName = ts.isPropertyAccessExpression(bindTarget)
        ? bindTarget.name.text
        : bindTarget.argumentExpression === undefined
          ? undefined
          : getStaticPropertyName(bindTarget.argumentExpression);
      return (
        bindName === 'bind' &&
        isPlaywrightMethodReference(bindTarget.expression)
      );
    }
    return false;
  };

  const evaluateStatic = (
    expression: TypeScriptExpression,
    seen = new Set<string>(),
  ): StaticValue => {
    const unwrapped = unwrapExpression(ts, expression);
    if (ts.isStringLiteral(unwrapped)) return knownValue(unwrapped.text);
    if (ts.isNumericLiteral(unwrapped)) return knownValue(Number(unwrapped.text));
    if (unwrapped.kind === ts.SyntaxKind.TrueKeyword) return knownValue(true);
    if (unwrapped.kind === ts.SyntaxKind.FalseKeyword) return knownValue(false);
    if (unwrapped.kind === ts.SyntaxKind.NullKeyword) return knownValue(null);

    if (ts.isPrefixUnaryExpression(unwrapped)) {
      const operand = evaluateStatic(unwrapped.operand, seen);
      if (!operand.known) return unknownValue();
      switch (unwrapped.operator) {
        case ts.SyntaxKind.ExclamationToken:
          return knownValue(!operand.value);
        case ts.SyntaxKind.PlusToken:
          return knownValue(Number(operand.value));
        case ts.SyntaxKind.MinusToken:
          return knownValue(-Number(operand.value));
        default:
          return unknownValue();
      }
    }

    if (ts.isConditionalExpression(unwrapped)) {
      const condition = evaluateStatic(unwrapped.condition, seen);
      if (!condition.known) return unknownValue();
      return evaluateStatic(
        isTruthy(condition.value)
          ? unwrapped.whenTrue
          : unwrapped.whenFalse,
        seen,
      );
    }

    if (ts.isBinaryExpression(unwrapped)) {
      const left = evaluateStatic(unwrapped.left, seen);
      const right = evaluateStatic(unwrapped.right, seen);
      if (!left.known || !right.known) return unknownValue();
      switch (unwrapped.operatorToken.kind) {
        case ts.SyntaxKind.AmpersandAmpersandToken:
          return knownValue(left.value && right.value);
        case ts.SyntaxKind.BarBarToken:
          return knownValue(left.value || right.value);
        case ts.SyntaxKind.QuestionQuestionToken:
          return knownValue(left.value ?? right.value);
        default:
          return unknownValue();
      }
    }

    if (ts.isArrayLiteralExpression(unwrapped)) {
      const values: unknown[] = [];
      for (const element of unwrapped.elements) {
        if (ts.isSpreadAssignment(element)) return unknownValue();
        const value = evaluateStatic(element, seen);
        if (!value.known) return unknownValue();
        values.push(value.value);
      }
      return knownValue(values);
    }

    if (ts.isObjectLiteralExpression(unwrapped)) {
      const object: Record<string, unknown> = {};
      for (const property of unwrapped.properties) {
        if (ts.isSpreadAssignment(property)) {
          const spread = evaluateStatic(property.expression, seen);
          if (!spread.known || typeof spread.value !== 'object' || spread.value === null) {
            return unknownValue();
          }
          Object.assign(object, spread.value);
          continue;
        }
        if (ts.isPropertyAssignment(property)) {
          let name = getPropertyName(ts, property.name);
          if (name === undefined && ts.isComputedPropertyName(property.name)) {
            const computedName = evaluateStatic(property.name.expression, seen);
            if (computedName.known && typeof computedName.value === 'string') {
              name = computedName.value;
            }
          }
          const value = evaluateStatic(property.initializer, seen);
          if (name === undefined || !value.known) return unknownValue();
          object[name] = value.value;
          continue;
        }
        if (ts.isShorthandPropertyAssignment(property)) {
          const value = evaluateStatic(property.name, seen);
          if (!value.known) return unknownValue();
          object[property.name.text] = value.value;
        }
      }
      return knownValue(object);
    }

    if (ts.isCallExpression(unwrapped)) {
      const method = ts.isIdentifier(unwrapped.expression)
        ? unwrapped.expression.text
        : getMethodReference(unwrapped.expression)?.method;
      if (method === 'Boolean' && unwrapped.arguments.length === 1) {
        const argument = unwrapped.arguments[0];
        if (argument) {
          const value = evaluateStatic(argument, seen);
          return value.known ? knownValue(Boolean(value.value)) : unknownValue();
        }
      }
      return unknownValue();
    }

    if (ts.isIdentifier(unwrapped)) {
      if (seen.has(unwrapped.text)) return unknownValue();
      seen.add(unwrapped.text);
      const initializer = variableInitializers.get(unwrapped.text);
      return initializer === undefined
        ? unknownValue()
        : evaluateStatic(initializer, seen);
    }

    return unknownValue();
  };

  const getGlobalRoot = (
    expression: TypeScriptExpression,
  ): string | undefined => {
    const unwrapped = unwrapExpression(ts, expression);
    if (ts.isIdentifier(unwrapped)) {
      return GLOBAL_DOM_NAMES.has(unwrapped.text) ? unwrapped.text : undefined;
    }
    if (ts.isPropertyAccessExpression(unwrapped)) {
      return getGlobalRoot(unwrapped.expression);
    }
    if (ts.isElementAccessExpression(unwrapped)) {
      return getGlobalRoot(unwrapped.expression);
    }
    return undefined;
  };

  const recordDirectDomReference = (name: string, node: TypeScriptNode): void => {
    directDomAccesses.add(name);
    let current: TypeScriptNode | undefined = node;
    let insideEvaluate = false;
    while (current) {
      if (
        ts.isCallExpression(current) &&
        getCallMethod(current.expression) === 'evaluate'
      ) {
        insideEvaluate = true;
        break;
      }
      current = current.parent;
    }
    if (strictMode && !insideEvaluate) {
      strictViolations.add(
        `Direct '${name}' access is not available in Playwright test code. Use page.locator() or page.evaluate().`,
      );
    }
  };

  const getCallMethod = (
    expression: TypeScriptExpression,
  ): string | undefined => {
    const method = getMethodReference(expression)?.method;
    if (method === undefined) return undefined;

    const unwrapped = unwrapExpression(ts, expression);
    if (ts.isIdentifier(unwrapped)) {
      return methodAliases.has(unwrapped.text) ? method : undefined;
    }
    if (ts.isPropertyAccessExpression(unwrapped) || ts.isElementAccessExpression(unwrapped)) {
      // Assertion matchers are exposed by the injected expect helper rather
      // than page/locator, so retain their names for validation evidence.
      if (method === 'soft' || method.startsWith('to')) return method;
      if (isPlaywrightObject(unwrapped.expression)) return method;

      // Optional JavaScript DOM exercises can require evidence that the
      // learner used a specific document method. Only recognize configured
      // methods on a browser-global receiver so an unrelated helper with the
      // same method name cannot satisfy the challenge contract.
      return requiredMethods.has(method) &&
        getGlobalRoot(unwrapped.expression) !== undefined
        ? method
        : undefined;
    }

    return method === 'soft' || method.startsWith('to') ? method : undefined;
  };

  const isPromiseRejectExpression = (
    expression: TypeScriptExpression | undefined,
  ): boolean => {
    if (expression === undefined) return false;
    const unwrapped = unwrapExpression(ts, expression);
    if (ts.isAwaitExpression(unwrapped)) {
      return isPromiseRejectExpression(unwrapped.expression);
    }
    if (!ts.isCallExpression(unwrapped)) return false;
    const callee = unwrapExpression(ts, unwrapped.expression);
    if (ts.isPropertyAccessExpression(callee)) {
      const receiver = unwrapExpression(ts, callee.expression);
      return (
        callee.name.text === 'reject' &&
        ts.isIdentifier(receiver) &&
        receiver.text === 'Promise'
      );
    }
    if (ts.isElementAccessExpression(callee)) {
      const receiver = unwrapExpression(ts, callee.expression);
      return (
        getStaticPropertyName(callee.argumentExpression ?? callee.expression) ===
          'reject' &&
        ts.isIdentifier(receiver) &&
        receiver.text === 'Promise'
      );
    }
    return false;
  };

  const alwaysPropagates = (node: TypeScriptNode): boolean => {
    // Do not descend into nested functions: a throw in an unused helper is not
    // evidence that the surrounding catch propagates its failure.
    if (ts.isFunctionLike(node)) return false;
    if (ts.isThrowStatement(node)) return true;
    if (ts.isReturnStatement(node)) {
      return isPromiseRejectExpression(node.expression);
    }
    if (ts.isCallExpression(node)) {
      return isPromiseRejectExpression(node);
    }
    if (ts.isBlock(node)) {
      return node.statements.some(alwaysPropagates);
    }
    if (ts.isIfStatement(node)) {
      return (
        node.elseStatement !== undefined &&
        alwaysPropagates(node.thenStatement) &&
        alwaysPropagates(node.elseStatement)
      );
    }
    return false;
  };

  const isPlaywrightPromiseExpression = (
    expression: TypeScriptExpression,
  ): boolean => {
    const unwrapped = unwrapExpression(ts, expression);
    if (!ts.isCallExpression(unwrapped)) return false;
    const method = getCallMethod(unwrapped.expression);
    return (
      method !== undefined &&
      (PLAYWRIGHT_ACTION_METHODS.has(method) ||
        method === 'evaluate' ||
        method === 'goto' ||
        method.startsWith('to') ||
        method.startsWith('wait'))
    );
  };

  const recordForcedAction = (
    call: import('typescript').CallExpression,
    method: string,
  ): void => {
    if (!PLAYWRIGHT_ACTION_METHODS.has(method)) return;
    const options = call.arguments.at(-1);
    if (!options) return;
    const value = evaluateStatic(options, new Set());
    if (!value.known || typeof value.value !== 'object' || value.value === null) return;
    const force = (value.value as Record<string, unknown>)['force'];
    if (isTruthy(force)) {
      forcedActions.push({
        method,
        value: force,
        line: sourceFile.getLineAndCharacterOfPosition(call.getStart(sourceFile)).line + 1,
      });
    }
  };

  const registerVariable = (declaration: import('typescript').VariableDeclaration): void => {
    if (ts.isIdentifier(declaration.name)) {
      if (
        ts.isVariableDeclarationList(declaration.parent) &&
        (declaration.parent.flags & ts.NodeFlags.Const) !== 0
      ) {
        constBindings.add(declaration.name.text);
      }
      if (declaration.initializer) {
        variableInitializers.set(declaration.name.text, declaration.initializer);
        const method = getMethodReference(declaration.initializer);
        if (
          method &&
          isPlaywrightMethodReference(declaration.initializer)
        ) {
          methodAliases.set(declaration.name.text, method);
        }
        if (isPlaywrightObject(declaration.initializer)) objectAliases.add(declaration.name.text);
      }
      return;
    }

    if (
      !declaration.initializer ||
      !ts.isObjectBindingPattern(declaration.name) ||
      !isPlaywrightObject(declaration.initializer)
    ) return;
    for (const element of declaration.name.elements) {
      if (!ts.isBindingElement(element)) continue;
      const propertyName = element.propertyName ?? element.name;
      const sourceName = getPropertyName(ts, propertyName);
      if (sourceName === undefined) continue;
      if (ts.isIdentifier(element.name)) {
        methodAliases.set(element.name.text, { method: sourceName });
      }
    }
  };

  // Gather bindings before walking calls so aliases and object destructuring
  // work for the normal declaration-before-use shape of learner code.
  const collectBindings = (node: TypeScriptNode): void => {
    if (ts.isVariableDeclaration(node)) registerVariable(node);
    ts.forEachChild(node, collectBindings);
  };
  collectBindings(sourceFile);

  const validationForbidden = new Set(validation?.forbiddenMethods ?? []);
  let swallowedErrorCount = 0;

  const countConditionalBranches = (
    statement: import('typescript').IfStatement,
  ): number => {
    let branches = 1;
    let alternative = statement.elseStatement;
    while (alternative && ts.isIfStatement(alternative)) {
      branches += 1;
      alternative = alternative.elseStatement;
    }
    return alternative === undefined ? branches : branches + 1;
  };

  const normalizeTypeAnnotation = (node: import('typescript').TypeNode): string =>
    node.getText(sourceFile).replace(/\s+/g, '').replaceAll("'", '"');

  const optionalMarker = (optional: boolean): string =>
    optional ? '?' : '';

  const isUndefinedIdentifier = (node: TypeScriptNode): boolean =>
    ts.isIdentifier(node) && node.text === 'undefined';

  const visit = (node: TypeScriptNode): void => {
    if (ts.isVariableDeclaration(node) && ts.isIdentifier(node.name)) {
      if (node.type === undefined) {
        typeScriptEvidence.add(`inferred-variable:${node.name.text}`);
      } else {
        typeScriptEvidence.add(
          `variable-type:${node.name.text}:${normalizeTypeAnnotation(node.type)}`,
        );
      }
    }

    if (ts.isInterfaceDeclaration(node)) {
      for (const member of node.members) {
        if (!ts.isPropertySignature(member) || member.type === undefined) {
          continue;
        }
        const property = getPropertyName(ts, member.name);
        if (property === undefined) continue;
        typeScriptEvidence.add(
          `interface-property:${node.name.text}:${property}${optionalMarker(member.questionToken !== undefined)}:${normalizeTypeAnnotation(member.type)}`,
        );
      }
    }

    if (ts.isFunctionDeclaration(node) && node.name !== undefined) {
      for (const parameter of node.parameters) {
        if (!ts.isIdentifier(parameter.name) || parameter.type === undefined) {
          continue;
        }
        typeScriptEvidence.add(
          `function-parameter:${node.name.text}:${parameter.name.text}${optionalMarker(parameter.questionToken !== undefined)}:${normalizeTypeAnnotation(parameter.type)}`,
        );
      }
      if (node.type !== undefined) {
        typeScriptEvidence.add(
          `function-return:${node.name.text}:${normalizeTypeAnnotation(node.type)}`,
        );
      }
    }

    if (ts.isBinaryExpression(node)) {
      if (node.operatorToken.kind === ts.SyntaxKind.QuestionQuestionToken) {
        typeScriptEvidence.add('operator:nullish-coalescing');
      }
      if (
        node.operatorToken.kind ===
          ts.SyntaxKind.ExclamationEqualsEqualsToken &&
        (isUndefinedIdentifier(node.left) ||
          isUndefinedIdentifier(node.right))
      ) {
        typeScriptEvidence.add('operator:strict-undefined-check');
      }
    }

    if (
      ts.isFunctionDeclaration(node) &&
      node.name !== undefined &&
      node.modifiers?.some(
        (modifier) => modifier.kind === ts.SyntaxKind.AsyncKeyword,
      )
    ) {
      asyncFunctions.add(node.name.text);
    }

    if (
      ts.isVariableDeclaration(node) &&
      ts.isIdentifier(node.name) &&
      node.initializer !== undefined &&
      (ts.isArrowFunction(node.initializer) ||
        ts.isFunctionExpression(node.initializer)) &&
      node.initializer.modifiers?.some(
        (modifier) => modifier.kind === ts.SyntaxKind.AsyncKeyword,
      )
    ) {
      asyncFunctions.add(node.name.text);
    }

    if (ts.isAwaitExpression(node)) {
      const awaited = unwrapExpression(ts, node.expression);
      if (ts.isCallExpression(awaited)) {
        const callee = unwrapExpression(ts, awaited.expression);
        if (ts.isIdentifier(callee)) {
          awaitedFunctionCalls.add(callee.text);
        } else if (
          ts.isPropertyAccessExpression(callee) ||
          ts.isElementAccessExpression(callee)
        ) {
          const memberName = ts.isPropertyAccessExpression(callee)
            ? callee.name.text
            : getStaticPropertyName(
                callee.argumentExpression ?? callee.expression,
              );
          if (memberName !== undefined) {
            const receiver = unwrapExpression(ts, callee.expression);
            const qualifiedMemberName = ts.isIdentifier(receiver)
              ? `${receiver.text}.${memberName}`
              : memberName;
            awaitedMemberCalls.add(qualifiedMemberName);
            if (
              qualifiedMemberName === 'Promise.all' &&
              awaited.arguments[0] !== undefined &&
              ts.isArrayLiteralExpression(awaited.arguments[0])
            ) {
              for (const element of awaited.arguments[0].elements) {
                const operation = unwrapExpression(ts, element);
                if (!ts.isCallExpression(operation)) continue;
                const operationCallee = unwrapExpression(
                  ts,
                  operation.expression,
                );
                if (ts.isIdentifier(operationCallee)) {
                  awaitedPromiseAllFunctionCalls.add(operationCallee.text);
                }
              }
            }
          }
        }
      }
    }

    if (
      ts.isIfStatement(node) &&
      (!ts.isIfStatement(node.parent) || node.parent.elseStatement !== node)
    ) {
      conditionalBranchCount = Math.max(
        conditionalBranchCount,
        countConditionalBranches(node),
      );
    }

    if (ts.isCallExpression(node)) {
      const callee = unwrapExpression(ts, node.expression);
      const calleeName = ts.isPropertyAccessExpression(callee)
        ? callee.name.text
        : ts.isElementAccessExpression(callee)
          ? getStaticPropertyName(callee.argumentExpression ?? callee.expression)
          : undefined;
      if (calleeName !== undefined) memberCalls.add(calleeName);
      if (ts.isIdentifier(callee)) calledFunctions.add(callee.text);
      const promiseExpression =
        ts.isPropertyAccessExpression(callee) ||
        ts.isElementAccessExpression(callee)
          ? callee.expression
          : undefined;
      if (
        calleeName === 'catch' &&
        promiseExpression !== undefined &&
        isPlaywrightPromiseExpression(promiseExpression)
      ) {
        const handler = node.arguments[0];
        if (
          handler &&
          ts.isFunctionLike(handler) &&
          !alwaysPropagates(handler.body)
        ) {
          swallowedErrorCount += 1;
        }
      }

      const method = getCallMethod(node.expression);
      if (method) {
        calledMethods.add(method);
        if (validationForbidden.has(method)) forbiddenMethods.add(method);
        if (method === 'locator') {
          structuralLocatorCalls += 1;
        }
        recordForcedAction(node, method);
        if (method === 'alert' && strictMode) {
          const receiver = ts.isPropertyAccessExpression(node.expression)
            ? getGlobalRoot(node.expression.expression)
            : undefined;
          if (!receiver || receiver === 'window' || receiver === 'globalThis') {
            strictViolations.add(
              'Use page.on("dialog", ...) instead of calling alert() in Playwright test code.',
            );
          }
        }

      } else if (ts.isIdentifier(node.expression) && node.expression.text === 'alert' && strictMode) {
        strictViolations.add(
          'Use page.on("dialog", ...) instead of calling alert() in Playwright test code.',
        );
      }
    }

    if (ts.isCatchClause(node)) {
      tryCatchCount += 1;
      if (!alwaysPropagates(node.block)) swallowedErrorCount += 1;
    }

    if (ts.isPropertyAccessExpression(node) || ts.isElementAccessExpression(node)) {
      const root = getGlobalRoot(node.expression);
      if (root) recordDirectDomReference(root, node);
    }

    if (ts.isIdentifier(node) && GLOBAL_DOM_NAMES.has(node.text)) {
      const parent = node.parent;
      const isPropertyName =
        (ts.isPropertyAccessExpression(parent) && parent.name === node) ||
        (ts.isPropertyDeclaration(parent) && parent.name === node) ||
        (ts.isPropertySignature(parent) && parent.name === node) ||
        isBindingName(ts, node);
      if (!isPropertyName) recordDirectDomReference(node.text, node);
    }

    ts.forEachChild(node, visit);
  };
  visit(sourceFile);

  return {
    calledMethods: [...calledMethods],
    calledFunctions: [...calledFunctions],
    memberCalls: [...memberCalls],
    asyncFunctions: [...asyncFunctions],
    awaitedFunctionCalls: [...awaitedFunctionCalls],
    awaitedMemberCalls: [...awaitedMemberCalls],
    awaitedPromiseAllFunctionCalls: [...awaitedPromiseAllFunctionCalls],
    constBindings: [...constBindings],
    typeScriptEvidence: [...typeScriptEvidence],
    conditionalBranchCount,
    tryCatchCount,
    forbiddenMethods: [...forbiddenMethods],
    structuralLocatorCalls,
    forcedActions,
    directDomAccesses: [...directDomAccesses],
    swallowedErrorCount,
    strictViolations: [...strictViolations],
  };
}

export async function analyzeSourcePolicy(
  code: string,
  options: {
    validation?: ChallengeValidationDefinition;
    strictMode?: boolean;
  } = {},
): Promise<SourcePolicyAnalysis> {
  try {
    const ts = await loadTypeScript();
    return analyzeWithTypeScript(
      ts,
      code,
      options.validation,
      options.strictMode === true,
    );
  } catch (error) {
    return {
      ...EMPTY_ANALYSIS,
      parserError: error instanceof Error ? error.message : String(error),
    };
  }
}
