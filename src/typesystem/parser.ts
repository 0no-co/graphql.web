type digit =
  | '0' | '1' | '2' | '3' | '4' | '5' | '6' | '7' | '8' | '9';

type letter =
  | 'A' | 'B' | 'C' | 'D' | 'E' | 'F' | 'G' | 'H' | 'I' | 'J' | 'K' | 'L' | 'M'
  | 'N' | 'O' | 'P' | 'Q' | 'R' | 'S' | 'T' | 'U' | 'V' | 'W' | 'X' | 'Y' | 'Z'
  | 'a' | 'b' | 'c' | 'd' | 'e' | 'f' | 'g' | 'h' | 'i' | 'j' | 'k' | 'l' | 'm'
  | 'n' | 'o' | 'p' | 'q' | 'r' | 's' | 't' | 'u' | 'v' | 'w' | 'x' | 'y' | 'z';

type skipIgnored<In> =
  In extends `#${infer _}\n${infer In}`
    ? skipIgnored<In>
    : In extends `${' ' | '\n' | '\t' | '\r' | ',' | '\ufeff'}${infer In}`
    ? skipIgnored<In>
    : In extends string
    ? In
    : never;

type _RestNameContinue<In extends string> =
  In extends `${letter | digit | '_'}${infer In}`
    ? _RestNameContinue<In>
    : In;
type _RestName<In extends string> =
  In extends `${letter | '_'}${infer In}`
    ? _RestNameContinue<In>
    : never;

type _RestDigits<In extends string> =
  In extends `${digit}${infer In}`
    ? _RestDigits<In>
    : In;
type _RestInt<In extends string> =
  In extends `${'-'}${infer In}`
    ? _RestDigits<In>
    : In extends `${digit}${infer In}`
    ? _RestDigits<In>
    : never;

type _RestExponent<In extends string> =
  In extends `${'e' | 'E'}${'+' | '-'}${infer In}`
    ? _RestDigits<In>
    : In extends `${'e' | 'E'}${infer In}`
    ? _RestDigits<In>
    : In;
type _RestFloat<In extends string> =
  In extends `${'.'}${infer In}`
    ? In extends `${digit}${infer In}`
    ? _RestExponent<_RestDigits<In>>
    : never
    : In extends `${'e' | 'E'}${infer _}`
    ? _RestExponent<In>
    : never;

type _RestBlockStringContinue<In extends string> =
  In extends `${infer _}${'\\"""'}${infer In}`
    ? _RestStringContinue<In>
    : In extends `${infer _}${'"""'}${infer In}`
    ? In
    : never;
type _RestStringContinue<In extends string> =
  In extends `${infer _}${'\\"'}${infer In}`
    ? _RestStringContinue<In>
    : In extends `${infer _}${'"'}${infer In}`
    ? In
    : never;
type _RestString<In extends string> =
  In extends `${'"""'}${infer In}`
    ? _RestBlockStringContinue<In>
    : In extends `${'"'}${infer In}`
    ? _RestStringContinue<In>
    : never;

type TakeName<In extends string> =
  In extends `${infer Out}${_RestName<In>}`
    ? In extends `${Out}${infer In}`
    ? [{ kind: 'Name', value: Out }, In]
    : void
    : void;

type TakeOptionalName<In extends string> =
  In extends `${infer Out}${_RestName<In>}`
    ? In extends `${Out}${infer In}`
    ? [{ kind: 'Name', value: Out }, In]
    : [undefined, In]
    : [undefined, In];

type TakeEnum<In extends string> =
  In extends `${infer Out}${_RestName<In>}`
    ? In extends `${Out}${infer In}`
    ? [{ kind: 'EnumValue', value: Out }, In]
    : void
    : void;

type TakeVariable<In extends string, Const extends boolean> =
  Const extends false
    ? In extends `${'$'}${infer In}`
    ? TakeName<In> extends [infer NameNode, infer Rest]
    ? [{ kind: 'Variable', name: NameNode }, Rest]
    : void
    : void
    : void;

type TakeNumber<In extends string> =
  In extends `${infer Out}${_RestInt<In>}`
    ? In extends `${Out}${infer In}`
    ? In extends `${infer Out}${_RestFloat<In>}`
    ? (
      In extends `${Out}${infer In}`
        ? [{ kind: 'FloatValue', value: number }, In]
        : never
    ) : [{ kind: 'IntValue', value: number }, In]
    : void
    : void;

type TakeString<In extends string> =
  In extends `${infer Out}${_RestString<In>}`
    ? In extends `${Out}${infer In}`
    ? [{ kind: 'StringValue', value: string }, In]
    : void
    : void;
 
type TakeLiteral<In extends string> =
  In extends `${'null'}${infer In}`
    ? [{ kind: 'NullValue' }, In]
    : In extends `${'true' | 'false'}${infer In}`
    ? [{ kind: 'BooleanValue', value: boolean }, In]
    : void;

export type TakeValue<In extends string, Const extends boolean> =
  TakeLiteral<In> extends [infer Node, infer Rest]
    ? [Node, Rest]
    : TakeVariable<In, Const> extends [infer Node, infer Rest]
    ? [Node, Rest]
    : TakeNumber<In> extends [infer Node, infer Rest]
    ? [Node, Rest]
    : TakeEnum<In> extends [infer Node, infer Rest]
    ? [Node, Rest]
    : TakeString<In> extends [infer Node, infer Rest]
    ? [Node, Rest]
    : TakeList<In, Const> extends [infer Node, infer Rest]
    ? [Node, Rest]
    : TakeObject<In, Const> extends [infer Node, infer Rest]
    ? [Node, Rest]
    : void;

type _TakeListContinue<Nodes extends unknown[], In extends string, Const extends boolean> =
  In extends `${']'}${infer In}`
    ? [{ kind: 'ListValue', values: Nodes }, In]
    : TakeValue<skipIgnored<In>, Const> extends [infer Node, infer In]
    ? _TakeListContinue<[...Nodes, Node], skipIgnored<In>, Const>
    : void;
export type TakeList<In extends string, Const extends boolean> =
  In extends `${'['}${infer In}`
    ? _TakeListContinue<[], skipIgnored<In>, Const>
    : void;

type TakeObjectField<In extends string, Const extends boolean> =
  TakeName<In> extends [infer Name, infer In]
    ? skipIgnored<In> extends `${':'}${infer In}`
    ? TakeValue<skipIgnored<In>, Const> extends [infer Value, infer In]
    ? [{ kind: 'ObjectField', name: Name, value: Value }, In]
    : void
    : void
    : void;

type _TakeObjectContinue<Fields extends unknown[], In extends string, Const extends boolean> =
  In extends `${'}'}${infer In}`
    ? [{ kind: 'ObjectValue', fields: Fields }, In]
    : TakeObjectField<In, Const> extends [infer Field, infer In]
    ? _TakeObjectContinue<[...Fields, Field], skipIgnored<In>, Const>
    : void;
export type TakeObject<In extends string, Const extends boolean> =
  In extends `${'{'}${infer In}`
    ? _TakeObjectContinue<[], skipIgnored<In>, Const>
    : void;

type TakeArgument<In extends string, Const extends boolean> =
  TakeName<In> extends [infer Name, infer In]
    ? skipIgnored<In> extends `${':'}${infer In}`
    ? TakeValue<skipIgnored<In>, Const> extends [infer Value, infer In]
    ? [{ kind: 'Argument', name: Name, value: Value }, In]
    : void
    : void
    : void;

type _TakeArgumentsContinue<Arguments extends unknown[], In extends string, Const extends boolean> =
  In extends `${')'}${infer In}`
    ? [Arguments, In]
    : TakeArgument<In, Const> extends [infer Argument, infer In]
    ? _TakeArgumentsContinue<[...Arguments, Argument], skipIgnored<In>, Const>
    : void;
export type TakeArguments<In extends string, Const extends boolean> =
  In extends `${'('}${infer In}`
    ? _TakeArgumentsContinue<[], skipIgnored<In>, Const>
    : [[], In];

type TakeDirective<In extends string, Const extends boolean> =
  In extends `${'@'}${infer In}`
    ? TakeName<In> extends [infer Name, infer In]
    ? TakeArguments<skipIgnored<In>, Const> extends [infer Arguments, infer In]
    ? [{ kind: 'Directive', name: Name, arguments: Arguments }, In]
    : void
    : void
    : void;

export type TakeDirectives<In extends string, Const extends boolean> =
  TakeDirective<In, Const> extends [infer Directive, infer In]
    ? TakeDirectives<skipIgnored<In>, Const> extends [[...infer Directives], infer In]
    ? [[Directive, ...Directives], In]
    : [[], In]
    : [[], In];

type _TakeFieldName<In extends string> =
  TakeName<In> extends [infer MaybeAlias, infer In]
    ? skipIgnored<In> extends `${':'}${infer In}`
    ? TakeName<skipIgnored<In>> extends [infer Name, infer In]
    ? [MaybeAlias, Name, In]
    : void
    : [undefined, MaybeAlias, In]
    : void;
export type TakeField<In extends string> =
  _TakeFieldName<In> extends [infer Alias, infer Name, infer In]
    ? TakeArguments<skipIgnored<In>, false> extends [infer Arguments, infer In]
    ? TakeDirectives<skipIgnored<In>, false> extends [infer Directives, infer In]
    ? TakeSelectionSet<skipIgnored<In>> extends [infer SelectionSet, infer In]
    ? [
        {
          kind: 'Field',
          alias: Alias,
          name: Name,
          arguments: Arguments,
          directives: Directives,
          selectionSet: SelectionSet
        },
        In
      ]
    : void
    : void
    : void
    : void;

export type TakeType<In extends string> =
  In extends `${'['}${infer In}`
    ? TakeType<skipIgnored<In>> extends [infer Subtype, infer In]
    ? In extends `${']'}${infer In}`
    ? skipIgnored<In> extends `${'!'}${infer In}`
    ? [{ kind: 'NonNullType', type: { kind: 'ListType', type: Subtype }}, In]
    : [{ kind: 'ListType', type: Subtype }, In]
    : void
    : void
    : TakeName<skipIgnored<In>> extends [infer Name, infer In]
    ? skipIgnored<In> extends `${'!'}${infer In}`
    ? [{ kind: 'NonNullType', type: { kind: 'NamedType', name: Name }}, In]
    : [{ kind: 'NamedType', name: Name }, In]
    : void;

type TakeOn<In extends string> =
  In extends `${infer Out}${_RestName<In>}`
    ? ([Out, In] extends ['on', `${Out}${infer In}`] ? [In] : void)
    : void;

type TakeTypeCondition<In extends string> =
  In extends `${'on'}${infer In}`
    ? TakeName<skipIgnored<In>> extends [infer Name, infer In]
    ? [{ kind: 'NamedType', name: Name }, In]
    : void
    : void;

type TakeFragmentSpread<In extends string> =
  In extends `${'...'}${infer In}` ? (
    TakeOn<skipIgnored<In>> extends [infer In] ? (
      TakeName<skipIgnored<In>> extends [infer Name, infer In]
        ? TakeDirectives<skipIgnored<In>, false> extends [infer Directives, infer In]
          ? TakeSelectionSetContinue<skipIgnored<In>> extends [infer SelectionSet, infer In]
            ? [
                {
                  kind: 'InlineFragment',
                  typeCondition: Name,
                  directives: Directives,
                  selectionSet: SelectionSet,
                },
                In
              ]
            : void
          : void
        : void
    ) : TakeName<skipIgnored<In>> extends [infer Name, infer In] ? (
      TakeDirectives<skipIgnored<In>, false> extends [infer Directives, infer In]
        ? [{ kind: 'FragmentSpread', name: Name, directives: Directives }, In]
        : void
    ) : TakeDirectives<skipIgnored<In>, false> extends [infer Directives, infer In] ? (
      TakeSelectionSetContinue<skipIgnored<In>> extends [infer SelectionSet, infer In]
        ? [
            {
              kind: 'InlineFragment',
              typeCondition: undefined,
              directives: Directives,
              selectionSet: SelectionSet,
            },
            In
          ]
        : void
    ) : void
  ) : void;

type _TakeSelection<Selections extends unknown[], In extends string> =
  In extends `${'}'}${infer In}`
    ? [{ kind: 'SelectionSet', selections: Selections }, In]
    : TakeFragmentSpread<skipIgnored<In>> extends [infer Selection, infer In]
    ? _TakeSelection<[...Selections, Selection], skipIgnored<In>>
    : TakeField<skipIgnored<In>> extends [infer Selection, infer In]
    ? _TakeSelection<[...Selections, Selection], skipIgnored<In>>
    : void;

export type TakeSelectionSetContinue<In extends string> =
  In extends `${'{'}${infer In}`
    ? _TakeSelection<[], skipIgnored<In>>
    : void;
type TakeSelectionSet<In extends string> =
  TakeSelectionSetContinue<In> extends [infer SelectionSet, infer In]
    ? [SelectionSet, In]
    : [[], In];

export type TakeVarDefinition<In extends string> =
  TakeVariable<In, false> extends [infer Variable, infer In]
    ? skipIgnored<In> extends `${':'}${infer In}`
    ? TakeType<skipIgnored<In>> extends [infer Type, infer In]
    ? skipIgnored<In> extends `${'='}${infer In}` ? (
      TakeValue<skipIgnored<In>, true> extends [infer DefaultValue, infer In]
        ? TakeDirectives<skipIgnored<In>, true> extends [infer Directives, infer In]
          ? [
              {
                kind: 'VariableDefinition',
                variable: Variable,
                type: Type,
                defaultValue: DefaultValue,
                directives: Directives,
              },
              In
            ]
          : void
        : void
    ) : TakeDirectives<skipIgnored<In>, true> extends [infer Directives, infer In]
      ? [
          {
            kind: 'VariableDefinition',
            variable: Variable,
            type: Type,
            defaultValue: undefined,
            directives: Directives,
          },
          In
        ]
    : void
    : void
    : void
    : void;

type _TakeVarDefinitionContinue<Definitions extends unknown[], In extends string> =
  In extends `${')'}${infer In}`
    ? [Definitions, In]
    : TakeVarDefinition<In> extends [infer Definition, infer In]
    ? _TakeArgumentsContinue<[...Definitions, Definition], skipIgnored<In>, true>
    : void;
type TakeVarDefinitions<In extends string> =
  skipIgnored<In> extends `${'('}${infer In}`
    ? _TakeVarDefinitionContinue<[], skipIgnored<In>>
    : [[], In]

type TakeFragmentDefinition<In extends string> =
  In extends `${'fragment'}${infer In}`
    ? TakeName<skipIgnored<In>> extends [infer Name, infer In]
    ? TakeTypeCondition<skipIgnored<In>> extends [infer TypeCondition, infer In]
    ? TakeDirectives<skipIgnored<In>, true> extends [infer Directives, infer In]
    ? TakeSelectionSetContinue<skipIgnored<In>> extends [infer SelectionSet, infer In]
    ? [
        {
          kind: 'FragmentDefinition',
          name: Name,
          typeCondition: TypeCondition,
          directives: Directives,
          selectionSet: SelectionSet,
        },
        In
      ]
    : void
    : void
    : void
    : void
    : void;

type TakeOperation<In extends string> =
  In extends `${'query'}${infer In}`
    ? ['query', In]
    : In extends `${'mutation'}${infer In}`
    ? ['mutation', In]
    : In extends `${'subscription'}${infer In}`
    ? ['subscription', In]
    : void;

export type TakeOperationDefinition<In extends string> =
  TakeOperation<In> extends [infer Operation, infer In] ? (
    TakeOptionalName<skipIgnored<In>> extends [infer Name, infer In]
      ? TakeVarDefinitions<skipIgnored<In>> extends [infer VarDefinitions, infer In]
      ? TakeDirectives<skipIgnored<In>, false> extends [infer Directives, infer In]
      ? TakeSelectionSetContinue<skipIgnored<In>> extends [infer SelectionSet, infer In]
      ? [
          {
            kind: 'OperationDefinition',
            operation: Operation,
            name: Name,
            variableDefinitions: VarDefinitions,
            directives: Directives,
            selectionSet: SelectionSet,
          },
          In
        ]
      : void
      : void
      : void
      : void
  ) : TakeSelectionSetContinue<skipIgnored<In>> extends [infer SelectionSet, infer In]
    ? [
        {
          kind: 'OperationDefinition',
          operation: 'query',
          name: undefined,
          variableDefinitions: [],
          directives: [],
          selectionSet: SelectionSet,
        },
        In
      ]
    : void;

type _TakeDocumentContinue<Definitions extends unknown[], In extends string> =
  TakeFragmentDefinition<In> extends [infer Definition, infer In]
    ? _TakeDocumentContinue<[...Definitions, Definition], skipIgnored<In>>
    : TakeOperationDefinition<In> extends [infer Definition, infer In]
    ? _TakeDocumentContinue<[...Definitions, Definition], skipIgnored<In>>
    : [Definitions, In];
type ParseDocument<In extends string> =
  _TakeDocumentContinue<[], skipIgnored<In>> extends [[...infer Definitions], infer _]
    ? { kind: 'Document', definitions: Definitions }
    : void;

type ParseValue<In> = TakeValue<skipIgnored<In>, false> extends [infer Node, string] ? Node : void;
type ParseConstValue<In> = TakeValue<skipIgnored<In>, true> extends [infer Node, string] ? Node : void;
type ParseType<In> = TakeType<skipIgnored<In>> extends [infer Node, string] ? Node : void;
type ParseOperation<In> = TakeOperation<skipIgnored<In>> extends [infer Node, string] ? Node : void;

export type {
  ParseConstValue as ConstValue,
  ParseOperation as Operation,
  ParseDocument as Document,
  ParseValue as Value,
  ParseType as Type,
};
