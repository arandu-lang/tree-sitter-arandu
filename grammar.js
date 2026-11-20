/// <reference types="tree-sitter-cli/dsl" />
// @ts-check

const PREC = {
  ASSIGN: 1,
  CATCH: 2,
  PIPE: 3,
  COALESCE: 4,
  OR: 5,
  AND: 6,
  EQUALITY: 7,
  COMPARE: 8,
  RANGE: 9,
  BITOR: 10,
  BITXOR: 11,
  BITAND: 12,
  SHIFT: 13,
  ADD: 14,
  MUL: 15,
  CAST: 16,
  UNARY: 17,
  POSTFIX: 18,
  CALL: 19,
  FIELD: 20,
};

module.exports = grammar({
  name: "arandu",

  extras: ($) => [/\s/, $.line_comment, $.block_comment],

  word: ($) => $.identifier,

  conflicts: ($) => [
    [$.module_path],
    [$.module_path, $._primary_expression],
    [$.type_name, $._primary_expression],
    [$._type_primary, $.generic_type],
    [$.generic_argument, $._literal],
    [$.generic_argument, $.parenthesized_expression],
    [$.binary_expression, $.call_expression],
    [$.binary_expression, $.unary_expression, $.call_expression],
    [$.lambda_parameter, $._primary_expression],
    [$.for_binding, $._primary_expression],
    [$.type_name, $.pattern_alt],
    [$.binding_item, $.pattern_alt],
  ],

  rules: {
    source_file: ($) =>
      seq(
        optional($.module_declaration),
        repeat(choice($._top_level_declaration, ";"))
      ),

    // -----------------------------------------------------------------------
    // Comments
    // -----------------------------------------------------------------------
    line_comment: (_) => token(seq("//", /[^\r\n]*/)),

    block_comment: (_) =>
      token(seq("/*", /[^*]*\*+([^/*][^*]*\*+)*/, "/")),

    // -----------------------------------------------------------------------
    // Identifiers & Paths
    // -----------------------------------------------------------------------
    identifier: (_) => /[a-z_][a-zA-Z0-9_]*/,

    type_identifier: (_) => /[A-Z][a-zA-Z0-9_]*/,

    module_path: ($) => seq($.identifier, repeat(seq(".", $.identifier))),

    type_name: ($) =>
      choice(
        seq($.module_path, ".", $.type_identifier),
        $.type_identifier
      ),

    visibility: (_) => choice("public", "internal", "private"),

    attribute: ($) =>
      seq(
        "@",
        field("name", choice($.type_identifier, $.identifier)),
        optional(seq("(", optional($.argument_list), ")"))
      ),

    // -----------------------------------------------------------------------
    // Top-level Declarations
    // -----------------------------------------------------------------------
    _top_level_declaration: ($) =>
      choice(
        $.import_declaration,
        $.from_import_declaration,
        $.use_declaration,
        $.const_declaration,
        $.type_alias_declaration,
        $.function_declaration,
        $.struct_declaration,
        $.enum_declaration,
        $.interface_declaration,
        $.impl_declaration,
        $.submodule_declaration,
        $.extern_declaration
      ),

    module_declaration: ($) => seq("module", field("path", $.module_path)),

    import_declaration: ($) =>
      seq(
        "import",
        field("source", choice($.module_path, $.string_literal)),
        optional(seq("as", field("alias", choice($.identifier, $.type_identifier))))
      ),

    from_import_declaration: ($) =>
      seq(
        "from",
        field("source", choice($.module_path, $.string_literal)),
        "import",
        "{",
        commaSep1($.import_item),
        optional(","),
        "}"
      ),

    use_declaration: ($) =>
      seq(
        optional($.visibility),
        "use",
        field("path", $.module_path),
        ".",
        "{",
        commaSep1($.import_item),
        optional(","),
        "}"
      ),

    import_item: ($) =>
      seq(
        field("name", choice($.identifier, $.type_identifier)),
        optional(seq("as", field("alias", choice($.identifier, $.type_identifier))))
      ),

    const_declaration: ($) =>
      seq(
        repeat($.attribute),
        optional($.visibility),
        "const",
        field("name", choice($.identifier, $.type_identifier)),
        optional(seq(":", field("type", $._type))),
        "=",
        field("value", $._expression)
      ),

    type_alias_declaration: ($) =>
      seq(
        repeat($.attribute),
        optional($.visibility),
        "type",
        field("name", $.type_identifier),
        optional($.generic_parameters),
        "=",
        field("type", $._type)
      ),

    function_declaration: ($) =>
      seq(
        repeat($.attribute),
        optional($.visibility),
        optional("async"),
        "func",
        optional(seq(field("receiver", choice($.type_name, $.primitive_type, "ptr", "slice")), ".")),
        field("name", $.identifier),
        optional($.generic_parameters),
        field("parameters", $.parameter_list),
        optional(seq(":", field("return_type", $.result_type))),
        optional($.where_clause),
        field("body", $.block)
      ),

    function_signature: ($) =>
      seq(
        repeat($.attribute),
        optional($.visibility),
        optional("async"),
        "func",
        field("name", $.identifier),
        optional($.generic_parameters),
        field("parameters", $.parameter_list),
        optional(seq(":", field("return_type", $.result_type))),
        optional($.where_clause),
        optional(";")
      ),

    parameter_list: ($) =>
      seq("(", optional(seq(commaSep1($.parameter), optional(","))), ")"),

    parameter: ($) =>
      seq(
        repeat($.attribute),
        choice($.self_parameter, $.regular_parameter),
        optional("...")
      ),

    self_parameter: ($) =>
      choice(
        seq(optional(choice("mut", "ref", "own", seq("mut", "ref"))), "self"),
        seq(
          "self",
          ":",
          optional(choice("ref", seq("mut", "ref"), "own")),
          optional($._type)
        )
      ),

    regular_parameter: ($) =>
      seq(
        optional(choice("own", "mut", "shared")),
        field("name", $.identifier),
        ":",
        field("type", $._type)
      ),

    result_type: ($) => $._type,

    where_clause: ($) =>
      seq("where", commaSep1($.where_predicate), optional(",")),

    where_predicate: ($) =>
      seq(
        field("type", $.type_identifier),
        ":",
        $.constraint_list
      ),

    constraint_list: ($) => seq($._type, repeat(seq("+", $._type))),

    struct_declaration: ($) =>
      seq(
        repeat($.attribute),
        optional($.visibility),
        "struct",
        field("name", $.type_identifier),
        optional($.generic_parameters),
        optional($.where_clause),
        field("body", $.struct_body)
      ),

    struct_body: ($) => seq("{", repeat($.field_declaration), "}"),

    field_declaration: ($) =>
      seq(
        repeat($.attribute),
        optional($.visibility),
        field("name", $.identifier),
        ":",
        field("type", $._type),
        optional(seq("=", field("default", $._expression))),
        optional(choice(",", ";"))
      ),

    enum_declaration: ($) =>
      seq(
        repeat($.attribute),
        optional($.visibility),
        "enum",
        field("name", $.type_identifier),
        optional($.generic_parameters),
        optional($.where_clause),
        field("body", $.enum_body)
      ),

    enum_body: ($) =>
      seq("{", repeat(seq($.enum_variant, optional(choice(",", ";")))), "}"),

    enum_variant: ($) =>
      seq(
        repeat($.attribute),
        field("name", $.type_identifier),
        optional(
          choice(
            seq("(", optional(seq(commaSep1($._type), optional(","))), ")"),
            $.struct_body
          )
        )
      ),

    interface_declaration: ($) =>
      seq(
        repeat($.attribute),
        optional($.visibility),
        optional("sealed"),
        "interface",
        field("name", $.type_identifier),
        optional($.generic_parameters),
        optional($.where_clause),
        "{",
        repeat($.function_signature),
        "}"
      ),

    impl_declaration: ($) =>
      seq(
        repeat($.attribute),
        optional($.visibility),
        "impl",
        optional($.generic_parameters),
        field("type", $.type_name),
        optional($.generic_arguments),
        optional(seq(":", field("interface", $.type_name), optional($.generic_arguments))),
        optional($.where_clause),
        "{",
        repeat($.function_declaration),
        "}"
      ),

    submodule_declaration: ($) =>
      seq(
        repeat($.attribute),
        optional($.visibility),
        "module",
        field("name", $.identifier),
        "{",
        repeat(choice($._top_level_declaration, ";")),
        "}"
      ),

    extern_declaration: ($) =>
      seq(
        repeat($.attribute),
        "extern",
        field("abi", $.string_literal),
        "{",
        repeat($.function_signature),
        "}"
      ),

    // -----------------------------------------------------------------------
    // Generics
    // -----------------------------------------------------------------------
    generic_parameters: ($) =>
      seq("<", commaSep1($.generic_parameter), optional(","), ">"),

    generic_parameter: ($) =>
      seq(
        optional(choice("const", "comptime")),
        field("name", $.type_identifier),
        optional(seq(":", $.constraint_list)),
        optional(seq("=", $._type))
      ),

    generic_arguments: ($) =>
      seq("<", commaSep1($.generic_argument), optional(","), ">"),

    generic_argument: ($) =>
      choice(
        $._type,
        $.integer_literal,
        seq("comptime", "(", $._expression, ")")
      ),

    // -----------------------------------------------------------------------
    // Types
    // -----------------------------------------------------------------------
    _type: ($) => choice($.optional_type, $._type_primary),

    optional_type: ($) => prec.right(2, seq($._type_primary, "?")),

    _type_primary: ($) =>
      choice(
        $.primitive_type,
        $.generic_type,
        $.type_name,
        $.reference_type,
        $.own_type,
        $.pointer_type,
        $.slice_type,
        $.array_type,
        $.function_type,
        $.tuple_type
      ),

    primitive_type: (_) =>
      choice(
        "int", "uint", "isize", "usize", "float",
        "i8", "i16", "i32", "i64",
        "u8", "u16", "u32", "u64",
        "f32", "f64",
        "bool", "byte", "char", "str", "void",
        "any", "Err", "err"
      ),

    generic_type: ($) => seq($.type_name, $.generic_arguments),

    reference_type: ($) =>
      prec.right(
        1,
        seq(choice("ref", "&", seq("mut", "ref"), "&mut"), $._type)
      ),

    own_type: ($) => prec.right(1, seq("own", $._type)),

    pointer_type: ($) => seq("ptr", "[", $._type, "]"),

    slice_type: ($) => prec.right(1, seq(optional("mut"), "[", "]", $._type)),

    array_type: ($) =>
      prec.right(
        1,
        seq("[", choice($.integer_literal, $.comptime_expression, $.identifier), "]", $._type)
      ),

    function_type: ($) =>
      choice(
        seq(
          "func",
          "(",
          optional(seq(commaSep1($._type), optional(","))),
          ")",
          optional(seq(":", $.result_type))
        ),
        seq(
          "(",
          optional(seq(commaSep1($._type), optional(","))),
          ")",
          "->",
          $._type
        )
      ),

    tuple_type: ($) =>
      seq("(", optional(seq(commaSep1($._type), optional(","))), ")"),

    // -----------------------------------------------------------------------
    // Blocks & Statements
    // -----------------------------------------------------------------------
    block: ($) => seq("{", repeat(choice($._statement, ";")), "}"),

    _statement: ($) =>
      choice(
        $.let_else_statement,
        $.let_statement,
        $.guard_statement,
        $.assignment_statement,
        $.return_statement,
        $.break_statement,
        $.continue_statement,
        $.free_statement,
        $.for_statement,
        $.while_statement,
        $.defer_statement,
        $.errdefer_statement,
        $.const_declaration,
        $.expression_statement
      ),

    let_statement: ($) =>
      seq(
        "let",
        choice(
          seq("(", commaSep1($.binding_item), optional(","), ")"),
          commaSep1($.binding_item)
        ),
        "=",
        field("value", $._expression)
      ),

    let_else_statement: ($) =>
      seq(
        "let",
        field("pattern", $.pattern),
        optional(seq(":", field("type", $._type))),
        "=",
        field("value", $._expression),
        "else",
        field("alternative", $.block)
      ),

    binding_item: ($) =>
      seq(
        optional("mut"),
        field("name", $.identifier),
        optional(seq(":", field("type", $._type)))
      ),

    guard_statement: ($) =>
      seq("guard", field("condition", $.condition), "else", field("alternative", $.block)),

    assignment_statement: ($) =>
      prec.right(
        PREC.ASSIGN,
        choice(
          seq(
            optional("set"),
            commaSep1($._expression),
            "=",
            $._expression
          ),
          seq(
            $._expression,
            choice("+=", "-=", "*=", "/=", "%=", "&=", "|=", "^=", "<<=", ">>="),
            $._expression
          )
        )
      ),

    return_statement: ($) =>
      prec.right(
        seq("return", optional(commaSep1($._expression)))
      ),

    break_statement: (_) => "break",

    continue_statement: (_) => "continue",

    free_statement: ($) => seq("free", $._expression),

    expression_statement: ($) => $._expression,

    if_statement: ($) =>
      prec.right(
        seq(
          "if",
          field("condition", $.condition),
          field("consequence", $.block),
          repeat(seq("else", "if", $.condition, $.block)),
          optional(seq("else", field("alternative", $.block)))
        )
      ),

    condition: ($) =>
      seq($.condition_clause, repeat(seq(choice("&&", ","), $.condition_clause))),

    condition_clause: ($) =>
      choice(
        seq("let", $.pattern, "=", $._expression),
        seq($._expression, "is", $.pattern),
        $._expression
      ),

    for_statement: ($) =>
      seq(
        optional("comptime"),
        "for",
        $.for_clause,
        field("body", $.block)
      ),

    for_clause: ($) =>
      choice(
        seq(commaSep1($.for_binding), "in", field("iterable", $._expression)),
        seq(
          optional(choice($.let_statement, $.assignment_statement, $._expression)),
          ";",
          optional($._expression),
          ";",
          optional(choice($.assignment_statement, $._expression))
        )
      ),

    for_binding: ($) => seq(optional("mut"), field("name", $.identifier)),

    while_statement: ($) =>
      seq("while", field("condition", $.condition), field("body", $.block)),

    match_statement: ($) =>
      seq("match", field("value", $._expression), "{", repeat($.match_arm), "}"),

    match_arm: ($) =>
      seq(
        field("pattern", $.pattern),
        optional(seq("if", field("guard", $._expression))),
        "=>",
        field(
          "body",
          choice(
            $.block,
            seq(
              choice($.return_statement, $.break_statement, $.continue_statement, $._expression),
              optional(choice(",", ";"))
            )
          )
        )
      ),

    comptime_statement: ($) =>
      seq("comptime", choice($.if_statement, $.for_statement, $.block)),

    defer_statement: ($) =>
      seq("defer", choice($.block, $._expression)),

    errdefer_statement: ($) =>
      seq("errdefer", choice($.block, $._expression)),

    unsafe_statement: ($) => seq("unsafe", $.block),

    // -----------------------------------------------------------------------
    // Patterns
    // -----------------------------------------------------------------------
    pattern: ($) => seq($.pattern_alt, repeat(seq("|", $.pattern_alt))),

    pattern_alt: ($) =>
      choice(
        "_",
        $.range_pattern,
        $.enum_pattern,
        $.struct_pattern,
        $.tuple_pattern,
        $._literal,
        seq($.type_identifier, optional(seq("(", optional(seq(commaSep1($.pattern), optional(","))), ")"))),
        seq(optional("mut"), $.identifier)
      ),

    enum_pattern: ($) =>
      choice(
        seq(
          $.type_name,
          ".",
          choice($.type_identifier, $.identifier),
          optional(seq("(", optional(seq(commaSep1($.pattern), optional(","))), ")"))
        ),
        seq(
          ".",
          choice($.type_identifier, $.identifier),
          optional(seq("(", optional(seq(commaSep1($.pattern), optional(","))), ")"))
        )
      ),

    struct_pattern: ($) =>
      seq(
        $.type_name,
        "{",
        optional(
          seq(
            commaSep1(choice($.field_pattern, "..")),
            optional(",")
          )
        ),
        "}"
      ),

    field_pattern: ($) =>
      seq(field("name", $.identifier), optional(seq(":", $.pattern))),

    tuple_pattern: ($) =>
      seq("(", $.pattern, ",", commaSep1($.pattern), optional(","), ")"),

    range_pattern: ($) => seq($._literal, choice("..", "..="), $._literal),

    // -----------------------------------------------------------------------
    // Expressions
    // -----------------------------------------------------------------------
    _expression: ($) =>
      choice(
        $.catch_expression,
        $.binary_expression,
        $.cast_expression,
        $.unary_expression,
        $.call_expression,
        $.field_expression,
        $.index_expression,
        $.try_expression,
        $._primary_expression
      ),

    catch_expression: ($) =>
      prec.right(
        PREC.CATCH,
        seq(
          $._expression,
          "catch",
          choice(
            seq("|", field("error", $.identifier), "|", $.block),
            $._expression
          )
        )
      ),

    binary_expression: ($) => {
      /** @type {[number, any, "left" | "right"][]} */
      const table = [
        [PREC.PIPE, "|>", "left"],
        [PREC.COALESCE, "??", "right"],
        [PREC.OR, "||", "left"],
        [PREC.AND, "&&", "left"],
        [PREC.EQUALITY, choice("==", "!="), "left"],
        [PREC.COMPARE, choice("<", ">", "<=", ">="), "left"],
        [PREC.RANGE, choice("..", "..="), "left"],
        [PREC.BITOR, "|", "left"],
        [PREC.BITXOR, "^", "left"],
        [PREC.BITAND, "&", "left"],
        [PREC.SHIFT, choice("<<", ">>"), "left"],
        [PREC.ADD, choice("+", "-"), "left"],
        [PREC.MUL, choice("*", "/", "%"), "left"],
      ];
      return choice(
        ...table.map(([precedence, operator, assoc]) =>
          (assoc === "left" ? prec.left : prec.right)(
            precedence,
            seq(
              field("left", $._expression),
              field("operator", operator),
              field("right", $._expression)
            )
          )
        )
      );
    },

    cast_expression: ($) =>
      prec.left(PREC.CAST, seq($._expression, "as", field("type", $._type))),

    unary_expression: ($) =>
      prec.right(
        PREC.UNARY,
        seq(
          field(
            "operator",
            choice("!", "-", "~", "await", "*", "ref", seq("mut", "ref"), "&", "&mut")
          ),
          field("operand", $._expression)
        )
      ),

    call_expression: ($) =>
      prec.left(
        PREC.CALL,
        seq(
          field("function", $._expression),
          optional($.generic_arguments),
          "(",
          optional($.argument_list),
          ")",
          optional($.block)
        )
      ),

    field_expression: ($) =>
      prec.left(
        PREC.FIELD,
        seq(
          field("value", $._expression),
          choice(".", "?."),
          field("field", choice($.identifier, $.type_identifier))
        )
      ),

    index_expression: ($) =>
      prec.left(
        PREC.POSTFIX,
        seq(
          field("value", $._expression),
          choice("[", "?["),
          field("index", $._expression),
          "]"
        )
      ),

    try_expression: ($) => prec.left(PREC.POSTFIX, seq($._expression, "?")),

    _primary_expression: ($) =>
      choice(
        $._literal,
        $.struct_literal,
        $.array_repeat_literal,
        $.array_literal,
        $.variant_sugar,
        $.layout_expression,
        $.lambda_expression,
        $.alloc_expression,
        $.comptime_expression,
        $.async_block,
        $.unsafe_block,
        $.if_statement,
        $.match_statement,
        $.type_qualified_expression,
        $.type_identifier,
        $.identifier,
        $.self_expression,
        $.parenthesized_expression
      ),

    self_expression: (_) => "self",

    parenthesized_expression: ($) =>
      seq("(", commaSep1($._expression), optional(","), ")"),

    type_qualified_expression: ($) =>
      seq(
        $.type_name,
        optional($.generic_arguments),
        ".",
        choice($.identifier, $.type_identifier)
      ),

    variant_sugar: ($) =>
      prec.right(
        seq(
          ".",
          field("variant", choice($.type_identifier, $.identifier)),
          optional(seq("(", optional($.argument_list), ")"))
        )
      ),

    layout_expression: ($) =>
      seq(choice("@sizeOf", "@alignOf"), "(", field("type", $._type), ")"),

    comptime_expression: ($) =>
      prec.right(seq("comptime", choice($.block, $._expression))),

    argument_list: ($) => seq(commaSep1($.argument), optional(",")),

    argument: ($) =>
      choice(
        seq(field("name", $.identifier), ":", optional($._expression)),
        "_",
        $._expression
      ),

    struct_literal: ($) =>
      prec(
        -1,
        seq(
          field("type", $.type_name),
          optional($.generic_arguments),
          "{",
          optional(seq(commaSep1($.struct_field_init), optional(","))),
          "}"
        )
      ),

    struct_field_init: ($) =>
      choice(
        seq(field("name", $.identifier), ":", field("value", $._expression)),
        seq("..", field("base", $._expression)),
        field("name", $.identifier)
      ),

    array_literal: ($) =>
      seq("[", optional(seq(commaSep1($._expression), optional(","))), "]"),

    array_repeat_literal: ($) =>
      seq("[", $._expression, ";", choice($.integer_literal, $.comptime_expression, $._type), "]"),

    lambda_expression: ($) =>
      choice(
        seq(
          "(",
          optional(seq(commaSep1($.lambda_parameter), optional(","))),
          ")",
          "=>",
          choice($.block, $._expression)
        ),
        seq(
          optional(choice("move", "own")),
          choice(
            seq("|", optional(seq(commaSep1($.lambda_parameter), optional(","))), "|"),
            "||"
          ),
          choice($.block, $._expression)
        )
      ),

    lambda_parameter: ($) =>
      seq(field("name", $.identifier), optional(seq(":", field("type", $._type)))),

    alloc_expression: ($) => prec.right(seq("alloc", $._expression)),

    async_block: ($) => seq("async", $.block),

    unsafe_block: ($) => seq("unsafe", $.block),

    // -----------------------------------------------------------------------
    // Literals
    // -----------------------------------------------------------------------
    _literal: ($) =>
      choice(
        $.integer_literal,
        $.float_literal,
        $.boolean_literal,
        $.nil_literal,
        $.char_literal,
        $.byte_char_literal,
        $.byte_string_literal,
        $.c_string_literal,
        $.raw_string_literal,
        $.multiline_string_literal,
        $.string_literal
      ),

    boolean_literal: (_) => choice("true", "false"),

    nil_literal: (_) => "nil",

    integer_literal: (_) =>
      token(
        choice(
          /0[xX][0-9a-fA-F][0-9a-fA-F_]*/,
          /0[bB][01][01_]*/,
          /0[oO][0-7][0-7_]*/,
          /[0-9][0-9_]*/
        )
      ),

    float_literal: (_) =>
      token(
        choice(
          /[0-9][0-9_]*\.[0-9][0-9_]*([eE][+-]?[0-9][0-9_]*)?/,
          /[0-9][0-9_]*[eE][+-]?[0-9][0-9_]*/
        )
      ),

    char_literal: ($) =>
      seq("'", choice($.escape_sequence, /[^'\\]/), "'"),

    byte_char_literal: ($) =>
      seq("b'", choice($.escape_sequence, /[^'\\]/), "'"),

    byte_string_literal: ($) =>
      seq('b"', repeat(choice($.escape_sequence, /[^"\\\r\n]+/)), '"'),

    c_string_literal: ($) =>
      seq('c"', repeat(choice($.escape_sequence, /[^"\\\r\n]+/)), '"'),

    raw_string_literal: (_) =>
      token(
        choice(
          seq('r"""', /([^"]|"[^"]|""[^"])*/, '"""'),
          seq('r"', /[^"]*/, '"')
        )
      ),

    multiline_string_literal: ($) =>
      seq(
        '"""',
        repeat(choice($.escape_sequence, $.string_interpolation, /[^"\\$]+|["$]/)),
        '"""'
      ),

    string_literal: ($) =>
      seq(
        '"',
        repeat(
          choice(
            $.escape_sequence,
            $.string_interpolation,
            token.immediate(prec(1, /[^"\\$\r\n]+/)),
            token.immediate("$")
          )
        ),
        '"'
      ),

    string_interpolation: ($) => seq("${", $._expression, "}"),

    escape_sequence: (_) =>
      token.immediate(
        seq(
          "\\",
          choice(
            /[ntr0\\"'$]/,
            /u\{[0-9a-fA-F]+\}/
          )
        )
      ),
  },
});

/**
 * @param {RuleOrLiteral} rule
 */
function commaSep1(rule) {
  return seq(rule, repeat(seq(",", rule)));
}
