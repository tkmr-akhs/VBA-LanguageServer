import {
  createConnection,
  CompletionItem,
  CompletionItemKind,
  Definition,
  InitializeParams,
  InitializeResult,
  Location,
  Position,
  ProposedFeatures,
  TextDocumentSyncKind,
  TextDocuments
} from 'vscode-languageserver/node';
import { TextDocument } from 'vscode-languageserver-textdocument';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

import { buildVbaProject, getCompletions, getDefinition, VbaProjectFile } from './vbaProject';

const connection = createConnection(ProposedFeatures.all);
const documents: TextDocuments<TextDocument> = new TextDocuments(TextDocument);

connection.onInitialize((_params: InitializeParams): InitializeResult => {
  return {
    capabilities: {
      textDocumentSync: TextDocumentSyncKind.Incremental,
      completionProvider: {
        triggerCharacters: ['.', ' ']
      },
      definitionProvider: true
    }
  };
});

connection.onInitialized((): void => {
  connection.console.log('VBA Language Server initialized.');
});

documents.onDidChangeContent((change): void => {
  connection.sendDiagnostics({
    diagnostics: [],
    uri: change.document.uri
  });
});

documents.onDidClose((event): void => {
  connection.sendDiagnostics({
    diagnostics: [],
    uri: event.document.uri
  });
});

connection.onCompletion((params): CompletionItem[] => {
  const document = documents.get(params.textDocument.uri);
  if (document === undefined) {
    return [];
  }

  const project = buildProjectForDocument(document);
  return getCompletions(project, {
    uri: document.uri,
    position: params.position
  }).map((item) => ({
    label: item.label,
    kind: CompletionItemKind.Function
  }));
});

connection.onDefinition((params): Definition | undefined => {
  const document = documents.get(params.textDocument.uri);
  if (document === undefined) {
    return undefined;
  }

  const project = buildProjectForDocument(document);
  const definition = getDefinition(project, {
    uri: document.uri,
    position: params.position
  });
  if (definition === undefined) {
    return undefined;
  }

  return Location.create(definition.uri, {
    start: toLspPosition(definition.range.start),
    end: toLspPosition(definition.range.end)
  });
});

documents.listen(connection);
connection.listen();

function buildProjectForDocument(document: TextDocument): ReturnType<typeof buildVbaProject> {
  const document_path = fileURLToPath(document.uri);
  const folder_path = path.dirname(document_path);
  const files = new Map<string, VbaProjectFile>();

  for (const file_name of fs.readdirSync(folder_path)) {
    if (!/\.(bas|cls|frm)$/i.test(file_name)) {
      continue;
    }

    const file_path = path.join(folder_path, file_name);
    const uri = pathToFileURL(file_path).toString();
    files.set(uri.toLowerCase(), {
      uri,
      text: fs.readFileSync(file_path, 'utf8')
    });
  }

  for (const open_document of documents.all()) {
    if (!open_document.uri.startsWith('file://')) {
      continue;
    }

    const open_path = fileURLToPath(open_document.uri);
    if (path.dirname(open_path).toLowerCase() !== folder_path.toLowerCase()) {
      continue;
    }

    if (!/\.(bas|cls|frm)$/i.test(open_path)) {
      continue;
    }

    files.set(open_document.uri.toLowerCase(), {
      uri: open_document.uri,
      text: open_document.getText()
    });
  }

  return buildVbaProject([...files.values()]);
}

function toLspPosition(position: Position): Position {
  return Position.create(position.line, position.character);
}
