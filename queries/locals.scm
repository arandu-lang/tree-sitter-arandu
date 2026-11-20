; Scopes
(function_declaration) @local.scope
(block) @local.scope
(for_statement) @local.scope
(while_statement) @local.scope
(if_statement) @local.scope
(match_arm) @local.scope
(lambda_expression) @local.scope

; Definitions
(regular_parameter
  name: (identifier) @local.definition.parameter)

(lambda_parameter
  name: (identifier) @local.definition.parameter)

(binding_item
  name: (identifier) @local.definition.var)

(for_binding
  name: (identifier) @local.definition.var)

(function_declaration
  name: (identifier) @local.definition.function)

(const_declaration
  name: (_) @local.definition.constant)

(struct_declaration
  name: (type_identifier) @local.definition.type)

(enum_declaration
  name: (type_identifier) @local.definition.type)

(interface_declaration
  name: (type_identifier) @local.definition.type)

(type_alias_declaration
  name: (type_identifier) @local.definition.type)

; References
(identifier) @local.reference
