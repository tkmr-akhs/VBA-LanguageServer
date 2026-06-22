# VBA Language Server

VBA-LanguageServer provides editor intelligence for exported VBA source files.
This glossary defines the domain terms used when discussing language-server behavior for VBA.

## Language

**VbaProject**:
A set of exported VBA source files that belong to the same logical VBA project. For this language server, the MVP project boundary is the folder containing the active `.bas`, `.cls`, or `.frm` file, including sibling `.bas`, `.cls`, and `.frm` files in that folder.
_Avoid_: workspace, repository, package

**VbaDefinition**:
An identifiable declaration in a `VbaProject` that editor features can refer to. It includes modules, classes, forms, procedures, properties, constants, variables, parameters, enums, user-defined types, and events.
_Avoid_: symbol, item, thing

**HostDefinition**:
A definition supplied by the VBA host environment rather than by exported source files in a `VbaProject`. Excel object model members such as workbook, worksheet, and range APIs are `HostDefinition`s.
_Avoid_: built-in, standard library, external symbol

**DocumentationComment**:
A structured Doxygen-style VBA comment block attached to a `VbaDefinition` and shown by editor features such as hover and signature help regardless of public or private visibility. Plain apostrophe comments are not `DocumentationComment`s; when an implementation member has no `DocumentationComment`, it may inherit one from the interface member named by its `Implements` relationship.
_Avoid_: comment, note, description

**RenameTarget**:
A source-defined `VbaDefinition` that can be renamed inside its `VbaProject`. `HostDefinition`s, string literals, and `DocumentationComment`s are not `RenameTarget`s.
_Avoid_: renameable symbol, edit target

**NameResolution**:
The case-insensitive process of matching an identifier reference to the closest visible `VbaDefinition` or `HostDefinition`. Procedure-local definitions outrank current-module definitions, current-module definitions outrank public project definitions, and project definitions outrank host definitions; ambiguous equal-rank matches do not produce hover or go-to-definition results.
_Avoid_: lookup, binding, search

**ModuleIdentity**:
The name of an exported VBA module, class, or form as defined by `Attribute VB_Name`. The source file name is only a fallback when `Attribute VB_Name` is absent.
_Avoid_: file name, module file, path name

**TypeResolution**:
The process of matching an explicit VBA type annotation to a `VbaDefinition` or `HostDefinition` for member completion and member documentation. The MVP uses declared types from variables, parameters, procedure return types, and property return types; assignment-based inference is outside the MVP.
_Avoid_: type inference, runtime type, guessed type

**QualifiedReference**:
An identifier reference written with a qualifier, such as `ModuleIdentity.MemberName` or `variable.MemberName`. When the qualifier names a module, class, or form, only public members of that definition are visible from outside that module.
_Avoid_: dotted lookup, member access, qualified symbol

**EventReference**:
A reference to an event definition from either a `RaiseEvent` statement or a `WithEvents` handler name. The MVP resolves `RaiseEvent EventName` within the current module and resolves `WithEventsVariable_EventName` handlers through an explicit `WithEvents` variable declaration.
_Avoid_: callback, event procedure, handler lookup

**FormDesignerBlock**:
The non-code designer section of an exported `.frm` file, such as form and control property declarations. The MVP keeps it out of AST definitions and references even though the file itself belongs to the `VbaProject`.
_Avoid_: form code, form module, generated code

**ModuleMember**:
A top-level parsed member inside a VBA module, such as a procedure, property, enum, user-defined type, event, constant, variable, or declaration block. Incremental AST updates use `ModuleMember` ranges as their replacement unit.
_Avoid_: function block, top-level node, parse chunk

## Example Dialogue

Dev: "Should completion include a procedure from another folder?"
Domain Expert: "No. In the MVP, the `VbaProject` is only the active file's folder, so sibling `.bas`, `.cls`, and `.frm` files are indexed."

Dev: "Should a form module participate in rename and go to definition?"
Domain Expert: "Yes. A `.frm` file in the same folder is part of the same `VbaProject`."

Dev: "Is a `Public Enum` a definition?"
Domain Expert: "Yes. `Enum` and user-defined `Type` declarations are `VbaDefinition`s and should participate in completion, hover, rename, and go to definition."

Dev: "Is an `Event` only a declaration, or can it be referenced?"
Domain Expert: "An `Event` is a `VbaDefinition`. Event handler procedure names and `RaiseEvent` statements can both refer to it."

Dev: "Where do Excel object model completions come from?"
Domain Expert: "They are `HostDefinition`s because Excel supplies them, even when the language server stores or discovers their metadata locally."

Dev: "Can a normal apostrophe comment appear in hover?"
Domain Expert: "No. Hover and signature help use `DocumentationComment`s only, with interface documentation inherited through `Implements` when the implementation has none."

Dev: "Should a private helper with a `DocumentationComment` appear in hover?"
Domain Expert: "Yes. Visibility does not hide an attached `DocumentationComment`."

Dev: "Can `Range` be renamed?"
Domain Expert: "No. Excel object model members are `HostDefinition`s, not `RenameTarget`s."

Dev: "What happens when two public modules expose the same name?"
Domain Expert: "`NameResolution` treats equal-rank matches as ambiguous, so hover and go to definition should stay silent for that reference."

Dev: "If `Customer.cls` says `Attribute VB_Name = \"CustomerRecord\"`, what is the class name?"
Domain Expert: "The `ModuleIdentity` is `CustomerRecord`; the file name is only a fallback."

Dev: "Should `Set ws = Worksheets(1)` make `ws.` show worksheet members?"
Domain Expert: "Not in the MVP. `TypeResolution` uses explicit declarations such as `Dim ws As Worksheet`."

Dev: "Should `Constructor.New_Foo` resolve across modules?"
Domain Expert: "Yes. It is a `QualifiedReference`; after `Constructor` resolves to a `ModuleIdentity`, `New_Foo` resolves to a public member in that module."

Dev: "Does `Button_Click` resolve without reading form designer metadata?"
Domain Expert: "Only when `Button` is explicitly declared as a `WithEvents` variable. That handler name is an `EventReference` to the `Click` event on the declared type."

Dev: "Do form designer properties create completion candidates?"
Domain Expert: "No. A `FormDesignerBlock` is not parsed into `VbaDefinition`s in the MVP."

Dev: "How much source does an incremental parse replace?"
Domain Expert: "It replaces the affected `ModuleMember`, not individual expression nodes."
