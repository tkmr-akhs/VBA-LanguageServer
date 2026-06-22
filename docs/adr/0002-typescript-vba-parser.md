# TypeScript VBA parser

The language server will build and maintain a VBA AST inside the TypeScript server process instead of invoking DoxyVB6 or another external parser at request time. LSP features need low-latency parsing, incremental indexing, and predictable test execution, while DoxyVB6 is a Python documentation-conversion tool. The language server may reuse DoxyVB6's documented VBA comment and exported-module knowledge as reference material, but not as a runtime dependency for editor intelligence.
