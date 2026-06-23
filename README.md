# VBA Language Server

VBA-LanguageServer provides editor intelligence for exported VBA source files in
Visual Studio Code.

## Host Object Model

The language server includes bundled host catalog metadata for Excel, Word,
PowerPoint, and Access. On Windows, when the selected Office application is
installed, the server can refresh host catalog metadata from COM and Type
Library information. Bundled metadata remains the portable fallback when that
refresh is unavailable.

Detailed host method signature help depends on available host catalog metadata.
When a method has `CallableSignature` metadata and the receiver type is known,
for example `Dim rng As Range` followed by `rng.Find(`, signature help shows the
known parameters and documentation. When a host method has no signature
metadata, the server leaves signature help empty instead of showing guessed
placeholders.

## Formatting

The extension provides `Format Document` for `.bas`, `.cls`, and `.frm` files.
Formatting is opt-in through normal VS Code settings; the extension does not
change user or workspace settings during activation.

To format on save for VBA files, set this extension as the language-specific
formatter and enable `editor.formatOnSave`:

```json
{
  "[vba]": {
    "editor.defaultFormatter": "tkmr-akhs.vba-language-server",
    "editor.formatOnSave": true
  }
}
```

Formatting normalizes VBA keyword and intrinsic word casing, normalizes resolved
reference casing to the matching `VbaDefinition` or `HostDefinition`, and rewrites
leading whitespace according to VBA block depth. It does not rename declarations,
edit sibling files, or rewrite comments and strings.
