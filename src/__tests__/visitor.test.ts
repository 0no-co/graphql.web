import { describe, it, expect } from 'vitest';
import { Kind, parse, print } from 'graphql';
import { visit, BREAK } from '../visitor';

function checkVisitorFnArgs(ast, args, isEdited = false) {
  const [node, key, parent, path, ancestors] = args;

  expect(node).toBeInstanceOf(Object);
  expect(Object.values(Kind)).toContain(node.kind);

  const isRoot = key === undefined;
  if (isRoot) {
    if (!isEdited) {
      expect(node).toEqual(ast);
    }
    expect(parent).toEqual(undefined);
    expect(path).toEqual([]);
    expect(ancestors).toEqual([]);
    return;
  }

  expect(typeof key).toMatch(/number|string/);

  expect(parent).toHaveProperty([key]);

  expect(path).toBeInstanceOf(Array);
  expect(path[path.length - 1]).toEqual(key);

  expect(ancestors).toBeInstanceOf(Array);
  expect(ancestors.length).toEqual(path.length - 1);

  if (!isEdited) {
    let currentNode = ast;
    for (let i = 0; i < ancestors.length; ++i) {
      expect(ancestors[i]).toEqual(currentNode);

      currentNode = currentNode[path[i]];
      expect(currentNode).not.toEqual(undefined);
    }
  }
}

function getValue(node: any) {
  return 'value' in node ? node.value : undefined;
}

describe('Visitor', () => {
  it('handles empty visitor', () => {
    const ast = parse('{ a }', { noLocation: true });
    expect(() => visit(ast, {})).not.toThrow();
  });

  it('handles noop visitor', () => {
    const ast = parse('{ a, b }', { noLocation: true });
    expect(() => visit(ast, { enter() {
      /*noop*/
    }})).not.toThrow();

    expect(() => visit(ast, { enter(node) {
      return node;
    }})).not.toThrow();

    expect(() => visit(ast, { enter() {
      throw new Error();
    }})).toThrow();
  });

  it('validates path argument', () => {
    const visited: any[] = [];

    const ast = parse('{ a }', { noLocation: true });

    visit(ast, {
      enter(_node, _key, _parent, path) {
        checkVisitorFnArgs(ast, arguments);
        visited.push(['enter', path.slice()]);
      },
      leave(_node, _key, _parent, path) {
        checkVisitorFnArgs(ast, arguments);
        visited.push(['leave', path.slice()]);
      },
    });

    expect(visited).toEqual([
      ['enter', []],
      ['enter', ['definitions', 0]],
      ['enter', ['definitions', 0, 'selectionSet']],
      ['enter', ['definitions', 0, 'selectionSet', 'selections', 0]],
      ['enter', ['definitions', 0, 'selectionSet', 'selections', 0, 'name']],
      ['leave', ['definitions', 0, 'selectionSet', 'selections', 0, 'name']],
      ['leave', ['definitions', 0, 'selectionSet', 'selections', 0]],
      ['leave', ['definitions', 0, 'selectionSet']],
      ['leave', ['definitions', 0]],
      ['leave', []],
    ]);
  });

  it('validates ancestors argument', () => {
    const ast = parse('{ a }', { noLocation: true });
    const visitedNodes: any[] = [];

    visit(ast, {
      enter(node, key, parent, _path, ancestors) {
        const inArray = typeof key === 'number';
        if (inArray) {
          visitedNodes.push(parent);
        }
        visitedNodes.push(node);

        const expectedAncestors = visitedNodes.slice(0, -2);
        expect(ancestors).toEqual(expectedAncestors);
      },
      leave(_node, key, _parent, _path, ancestors) {
        const expectedAncestors = visitedNodes.slice(0, -2);
        expect(ancestors).toEqual(expectedAncestors);

        const inArray = typeof key === 'number';
        if (inArray) {
          visitedNodes.pop();
        }
        visitedNodes.pop();
      },
    });
  });

  it('allows editing a node both on enter and on leave', () => {
    const ast = parse('{ a, b, c { a, b, c } }', { noLocation: true });

    let selectionSet;

    const editedAST = visit(ast, {
      OperationDefinition: {
        enter(node) {
          checkVisitorFnArgs(ast, arguments);
          selectionSet = node.selectionSet;
          return {
            ...node,
            selectionSet: {
              kind: 'SelectionSet',
              selections: [],
            },
            didEnter: true,
          };
        },
        leave(node) {
          checkVisitorFnArgs(ast, arguments, /* isEdited */ true);
          return {
            ...node,
            selectionSet,
            didLeave: true,
          };
        },
      },
    });

    expect(editedAST).toEqual({
      ...ast,
      definitions: [
        {
          ...ast.definitions[0],
          didEnter: true,
          didLeave: true,
        },
      ],
    });
  });

  it('allows editing the root node on enter and on leave', () => {
    const ast = parse('{ a, b, c { a, b, c } }', { noLocation: true });

    const { definitions } = ast;

    const editedAST = visit(ast, {
      Document: {
        enter(node) {
          checkVisitorFnArgs(ast, arguments);
          return {
            ...node,
            definitions: [],
            didEnter: true,
          };
        },
        leave(node) {
          checkVisitorFnArgs(ast, arguments, /* isEdited */ true);
          return {
            ...node,
            definitions,
            didLeave: true,
          };
        },
      },
    });

    expect(editedAST).toEqual({
      ...ast,
      didEnter: true,
      didLeave: true,
    });
  });

  it('allows for editing on enter', () => {
    const ast = parse('{ a, b, c { a, b, c } }', { noLocation: true });
    const editedAST = visit(ast, {
      enter(node) {
        checkVisitorFnArgs(ast, arguments);
        if (node.kind === 'Field' && node.name.value === 'b') {
          return null;
        }
      },
    });

    expect(ast).toEqual(parse('{ a, b, c { a, b, c } }', { noLocation: true }));

    expect(editedAST).toEqual(parse('{ a,    c { a,    c } }', { noLocation: true }));
  });

  it('allows for editing on leave', () => {
    const ast = parse('{ a, b, c { a, b, c } }', { noLocation: true });
    const editedAST = visit(ast, {
      leave(node) {
        checkVisitorFnArgs(ast, arguments, /* isEdited */ true);
        if (node.kind === 'Field' && node.name.value === 'b') {
          return null;
        }
      },
    });

    expect(ast).toEqual(parse('{ a, b, c { a, b, c } }', { noLocation: true }));

    expect(editedAST).toEqual(parse('{ a,    c { a,    c } }', { noLocation: true }));
  });

  it('ignores false returned on leave', () => {
    const ast = parse('{ a, b, c { a, b, c } }', { noLocation: true });
    const returnedAST = visit(ast, {
      leave() {
        return false;
      },
    });

    expect(returnedAST).toEqual(parse('{ a, b, c { a, b, c } }', { noLocation: true }));
  });

  it('visits edited node', () => {
    const addedField = {
      kind: 'Field',
      name: {
        kind: 'Name',
        value: '__typename',
      },
    };

    let didVisitAddedField;

    const ast = parse('{ a { x } }', { noLocation: true });
    visit(ast, {
      enter(node) {
        checkVisitorFnArgs(ast, arguments, /* isEdited */ true);
        if (node.kind === 'Field' && node.name.value === 'a') {
          return {
            kind: 'Field',
            selectionSet: [addedField, node.selectionSet],
          };
        }
        if (node === addedField) {
          didVisitAddedField = true;
        }
      },
    });

    expect(didVisitAddedField).toEqual(true);
  });

  it('allows skipping a sub-tree', () => {
    const visited: any[] = [];

    const ast = parse('{ a, b { x }, c }', { noLocation: true });
    visit(ast, {
      enter(node) {
        checkVisitorFnArgs(ast, arguments);
        visited.push(['enter', node.kind, getValue(node)]);
        if (node.kind === 'Field' && node.name.value === 'b') {
          return false;
        }
      },

      leave(node) {
        checkVisitorFnArgs(ast, arguments);
        visited.push(['leave', node.kind, getValue(node)]);
      },
    });

    expect(visited).toEqual([
      ['enter', 'Document', undefined],
      ['enter', 'OperationDefinition', undefined],
      ['enter', 'SelectionSet', undefined],
      ['enter', 'Field', undefined],
      ['enter', 'Name', 'a'],
      ['leave', 'Name', 'a'],
      ['leave', 'Field', undefined],
      ['enter', 'Field', undefined],
      ['enter', 'Field', undefined],
      ['enter', 'Name', 'c'],
      ['leave', 'Name', 'c'],
      ['leave', 'Field', undefined],
      ['leave', 'SelectionSet', undefined],
      ['leave', 'OperationDefinition', undefined],
      ['leave', 'Document', undefined],
    ]);
  });

  it('allows early exit while visiting', () => {
    const visited: any[] = [];

    const ast = parse('{ a, b { x }, c }', { noLocation: true });
    visit(ast, {
      enter(node) {
        checkVisitorFnArgs(ast, arguments);
        visited.push(['enter', node.kind, getValue(node)]);
        if (node.kind === 'Name' && node.value === 'x') {
          return BREAK;
        }
      },
      leave(node) {
        checkVisitorFnArgs(ast, arguments);
        visited.push(['leave', node.kind, getValue(node)]);
      },
    });

    expect(visited).toEqual([
      ['enter', 'Document', undefined],
      ['enter', 'OperationDefinition', undefined],
      ['enter', 'SelectionSet', undefined],
      ['enter', 'Field', undefined],
      ['enter', 'Name', 'a'],
      ['leave', 'Name', 'a'],
      ['leave', 'Field', undefined],
      ['enter', 'Field', undefined],
      ['enter', 'Name', 'b'],
      ['leave', 'Name', 'b'],
      ['enter', 'SelectionSet', undefined],
      ['enter', 'Field', undefined],
      ['enter', 'Name', 'x'],
    ]);
  });

  it('allows early exit while leaving', () => {
    const visited: any[] = [];

    const ast = parse('{ a, b { x }, c }', { noLocation: true });
    visit(ast, {
      enter(node) {
        checkVisitorFnArgs(ast, arguments);
        visited.push(['enter', node.kind, getValue(node)]);
      },

      leave(node) {
        checkVisitorFnArgs(ast, arguments);
        visited.push(['leave', node.kind, getValue(node)]);
        if (node.kind === 'Name' && node.value === 'x') {
          return BREAK;
        }
      },
    });

    expect(visited).toEqual([
      ['enter', 'Document', undefined],
      ['enter', 'OperationDefinition', undefined],
      ['enter', 'SelectionSet', undefined],
      ['enter', 'Field', undefined],
      ['enter', 'Name', 'a'],
      ['leave', 'Name', 'a'],
      ['leave', 'Field', undefined],
      ['enter', 'Field', undefined],
      ['enter', 'Name', 'b'],
      ['leave', 'Name', 'b'],
      ['enter', 'SelectionSet', undefined],
      ['enter', 'Field', undefined],
      ['enter', 'Name', 'x'],
      ['leave', 'Name', 'x'],
    ]);
  });

  it('allows a named functions visitor API', () => {
    const visited: any[] = [];

    const ast = parse('{ a, b { x }, c }', { noLocation: true });
    visit(ast, {
      Name(node) {
        checkVisitorFnArgs(ast, arguments);
        visited.push(['enter', node.kind, getValue(node)]);
      },
      SelectionSet: {
        enter(node) {
          checkVisitorFnArgs(ast, arguments);
          visited.push(['enter', node.kind, getValue(node)]);
        },
        leave(node) {
          checkVisitorFnArgs(ast, arguments);
          visited.push(['leave', node.kind, getValue(node)]);
        },
      },
    });

    expect(visited).toEqual([
      ['enter', 'SelectionSet', undefined],
      ['enter', 'Name', 'a'],
      ['enter', 'Name', 'b'],
      ['enter', 'SelectionSet', undefined],
      ['enter', 'Name', 'x'],
      ['leave', 'SelectionSet', undefined],
      ['enter', 'Name', 'c'],
      ['leave', 'SelectionSet', undefined],
    ]);
  });

  it('handles deep immutable edits correctly when using "enter"', () => {
    const formatNode = node => {
      if (
        node.selectionSet &&
        !node.selectionSet.selections.some(
          node => node.kind === Kind.FIELD && node.name.value === '__typename' && !node.alias
        )
      ) {
        return {
          ...node,
          selectionSet: {
            ...node.selectionSet,
            selections: [
              ...node.selectionSet.selections,
              {
                kind: Kind.FIELD,
                name: {
                  kind: Kind.NAME,
                  value: '__typename',
                },
              },
            ],
          },
        };
      }
    };
    const ast = parse('{ players { nodes { id } } }');
    const expected = parse('{ players { nodes { id __typename } __typename } }');
    const visited = visit(ast, {
      Field: formatNode,
      InlineFragment: formatNode,
    });

    expect(print(visited)).toEqual(print(expected));
  });
});
