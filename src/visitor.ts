import { ASTNode } from './ast';

export const BREAK = {};

export function visit<N extends ASTNode>(root: N, visitor: ASTVisitor): N;
export function visit<R>(root: ASTNode, visitor: ASTReducer<R>): R;

export function visit(node: ASTNode, visitor: ASTVisitor | ASTReducer<any>) {
  const ancestors: Array<ASTNode | ReadonlyArray<ASTNode>> = [];
  const path: Array<string | number> = [];

  function traverse(
    node: ASTNode,
    key?: string | number | undefined,
    parent?: ASTNode | ReadonlyArray<ASTNode> | undefined
  ) {
    let hasEdited = false;

    const enter = (visitor[node.kind] && visitor[node.kind].enter) || visitor[node.kind];
    const resultEnter = enter && enter.call(visitor, node, key, parent, path, ancestors);
    if (resultEnter === false) {
      return node;
    } else if (resultEnter === null) {
      return null;
    } else if (resultEnter === BREAK) {
      throw BREAK;
    } else if (resultEnter && typeof resultEnter.kind === 'string') {
      hasEdited = resultEnter !== node;
      node = resultEnter;
    }

    if (parent) ancestors.push(parent);

    let result: any;
    const copy = { ...node };
    for (const nodeKey in node) {
      path.push(nodeKey);
      let value = node[nodeKey];
      if (Array.isArray(value)) {
        const newValue: any[] = [];
        for (let index = 0; index < value.length; index++) {
          if (value[index] != null && typeof value[index].kind === 'string') {
            ancestors.push(node);
            path.push(index);
            result = traverse(value[index], index, value);
            path.pop();
            ancestors.pop();
            if (result === undefined) {
              newValue.push(value[index]);
            } else if (result === null) {
              hasEdited = true;
            } else {
              hasEdited = hasEdited || result !== value[index];
              newValue.push(result);
            }
          }
        }
        value = newValue;
      } else if (value != null && typeof value.kind === 'string') {
        result = traverse(value, nodeKey, node);
        if (result !== undefined) {
          hasEdited = hasEdited || value !== result;
          value = result;
        }
      }

      path.pop();
      if (hasEdited) copy[nodeKey] = value;
    }

    if (parent) ancestors.pop();
    const leave = visitor[node.kind] && visitor[node.kind].leave;
    const resultLeave = leave && leave.call(visitor, node, key, parent, path, ancestors);
    if (resultLeave === BREAK) {
      throw BREAK;
    } else if (resultLeave !== undefined) {
      return resultLeave;
    } else if (resultEnter !== undefined) {
      return hasEdited ? copy : resultEnter;
    } else {
      return hasEdited ? copy : node;
    }
  }

  try {
    const result = traverse(node);
    return result !== undefined && result !== false ? result : node;
  } catch (error) {
    if (error !== BREAK) throw error;
    return node;
  }
}

export type ASTVisitor = EnterLeaveVisitor<ASTNode> | KindVisitor;

type KindVisitor = {
  readonly [NodeT in ASTNode as NodeT['kind']]?: ASTVisitFn<NodeT> | EnterLeaveVisitor<NodeT>;
};

interface EnterLeaveVisitor<TVisitedNode extends ASTNode> {
  readonly enter?: ASTVisitFn<TVisitedNode> | undefined;
  readonly leave?: ASTVisitFn<TVisitedNode> | undefined;
}

export type ASTVisitFn<Node extends ASTNode> = (
  node: Node,
  key: string | number | undefined,
  parent: ASTNode | ReadonlyArray<ASTNode> | undefined,
  path: ReadonlyArray<string | number>,
  ancestors: ReadonlyArray<ASTNode | ReadonlyArray<ASTNode>>
) => any;

export type ASTReducer<R> = {
  readonly [NodeT in ASTNode as NodeT['kind']]?: {
    readonly enter?: ASTVisitFn<NodeT>;
    readonly leave: ASTReducerFn<NodeT, R>;
  };
};

type ASTReducerFn<TReducedNode extends ASTNode, R> = (
  node: { [K in keyof TReducedNode]: ReducedField<TReducedNode[K], R> },
  key: string | number | undefined,
  parent: ASTNode | ReadonlyArray<ASTNode> | undefined,
  path: ReadonlyArray<string | number>,
  ancestors: ReadonlyArray<ASTNode | ReadonlyArray<ASTNode>>
) => R;

type ReducedField<T, R> = T extends null | undefined
  ? T
  : T extends ReadonlyArray<any>
  ? ReadonlyArray<R>
  : R;
