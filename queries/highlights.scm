; Comments
(line_comment) @comment
(block_comment) @comment

; Literals
(integer_literal) @number
(float_literal) @number.float
(boolean_literal) @boolean
(nil_literal) @constant.builtin
(char_literal) @character
(byte_char_literal) @character
(string_literal) @string
(multiline_string_literal) @string
(raw_string_literal) @string
(byte_string_literal) @string
(c_string_literal) @string
(escape_sequence) @string.escape

; String interpolation
(string_interpolation
  "${" @punctuation.special
  "}" @punctuation.special)

; Attributes
(attribute
  "@" @attribute
  name: (_) @attribute)

(layout_expression
  [
    "@sizeOf"
    "@alignOf"
  ] @function.builtin)

; Types
(primitive_type) @type.builtin
(type_identifier) @type

; Declarations
(function_declaration
  name: (identifier) @function)

(function_signature
  name: (identifier) @function)

(struct_declaration
  name: (type_identifier) @type.definition)

(enum_declaration
  name: (type_identifier) @type.definition)

(enum_variant
  name: (type_identifier) @constructor)

(interface_declaration
  name: (type_identifier) @type.definition)

(type_alias_declaration
  name: (type_identifier) @type.definition)

(const_declaration
  name: (_) @constant)

(field_declaration
  name: (identifier) @property)

(regular_parameter
  name: (identifier) @variable.parameter)

(lambda_parameter
  name: (identifier) @variable.parameter)

(binding_item
  name: (identifier) @variable)

(for_binding
  name: (identifier) @variable)

; Expressions
(call_expression
  function: (identifier) @function.call)

(call_expression
  function: (field_expression
    field: (identifier) @function.method.call))

(field_expression
  field: (identifier) @property)

(struct_field_init
  name: (identifier) @property)

(self_expression) @variable.builtin
(self_parameter "self" @variable.builtin)

; Modules & Imports
(module_declaration
  path: (module_path) @module)

(import_declaration
  source: (module_path) @module)

(from_import_declaration
  source: (module_path) @module)

(use_declaration
  path: (module_path) @module)

; Keywords
[
  "if"
  "else"
  "match"
  "guard"
] @keyword.conditional

[
  "for"
  "in"
  "while"
] @keyword.repeat

(break_statement) @keyword.repeat
(continue_statement) @keyword.repeat

[
  "return"
] @keyword.return

[
  "func"
] @keyword.function

[
  "struct"
  "enum"
  "interface"
  "type"
  "impl"
  "sealed"
] @keyword.type

[
  "module"
  "import"
  "from"
  "use"
  "as"
] @keyword.import

[
  "public"
  "internal"
  "private"
  "extern"
  "mut"
  "own"
  "ref"
  "shared"
  "ptr"
  "const"
  "async"
  "await"
  "unsafe"
  "comptime"
  "move"
] @keyword.modifier

[
  "let"
  "set"
  "where"
  "is"
  "catch"
  "defer"
  "errdefer"
  "alloc"
  "free"
] @keyword

; Operators
[
  "+"
  "-"
  "*"
  "/"
  "%"
  "&"
  "|"
  "^"
  "~"
  "<<"
  ">>"
  "&&"
  "||"
  "!"
  "=="
  "!="
  "<"
  "<="
  ">"
  ">="
  "="
  "+="
  "-="
  "*="
  "/="
  "%="
  "&="
  "|="
  "^="
  "<<="
  ">>="
  "=>"
  "->"
  ".."
  "..="
  "|>"
  "??"
  "?."
  "?["
  "?"
  "&mut"
] @operator

; Punctuation
[
  "("
  ")"
  "["
  "]"
  "{"
  "}"
] @punctuation.bracket

[
  ","
  "."
  ":"
  ";"
  "..."
] @punctuation.delimiter
