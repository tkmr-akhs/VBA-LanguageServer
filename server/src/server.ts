import {
  createConnection,
  CompletionItem,
  CompletionItemKind,
  Definition,
  Hover,
  InitializeParams,
  InitializeResult,
  Location,
  MarkupKind,
  ParameterInformation,
  Position,
  ProposedFeatures,
  Range,
  SignatureHelp,
  SignatureInformation,
  TextEdit,
  TextDocumentSyncKind,
  TextDocuments,
  WorkspaceEdit
} from 'vscode-languageserver/node';
import { TextDocument } from 'vscode-languageserver-textdocument';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

import { createDefaultHostCatalogManager } from './hostCatalogService';
import {
  buildVbaProject,
  getCompletions,
  getDefinition,
  getHover,
  getRenameEdits,
  getRenameTarget,
  getSignatureHelp,
  RenameEdit,
  SourceRange,
  VbaProjectFile
} from './vbaProject';

const connection = createConnection(ProposedFeatures.all);
const documents: TextDocuments<TextDocument> = new TextDocuments(TextDocument);
const hostCatalogManager = createDefaultHostCatalogManager();

void hostCatalogManager.refreshFromExcelComAsync();

connection.onInitialize((_params: InitializeParams): InitializeResult => {
  return {
    capabilities: {
      textDocumentSync: TextDocumentSyncKind.Incremental,
      completionProvider: {
        triggerCharacters: ['.', ' ']
      },
      definitionProvider: true,
      hoverProvider: true,
      renameProvider: {
        prepareProvider: true
      },
      signatureHelpProvider: {
        triggerCharacters: ['(', ',']
      }
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

connection.onPrepareRename((params): Range | undefined => {
  const document = documents.get(params.textDocument.uri);
  if (document === undefined) {
    return undefined;
  }

  const project = buildProjectForDocument(document);
  const target = getRenameTarget(project, {
    uri: document.uri,
    position: params.position
  });
  return target === undefined ? undefined : toLspRange(target.range);
});

connection.onRenameRequest((params): WorkspaceEdit => {
  const document = documents.get(params.textDocument.uri);
  if (document === undefined) {
    return {};
  }

  const project = buildProjectForDocument(document);
  const edits = getRenameEdits(
    project,
    {
      uri: document.uri,
      position: params.position
    },
    params.newName
  );

  return toWorkspaceEdit(edits);
});

connection.onHover((params): Hover | undefined => {
  const document = documents.get(params.textDocument.uri);
  if (document === undefined) {
    return undefined;
  }

  const project = buildProjectForDocument(document);
  const hover = getHover(project, {
    uri: document.uri,
    position: params.position
  });
  if (hover === undefined) {
    return undefined;
  }

  return {
    contents: {
      kind: MarkupKind.Markdown,
      value: hover.contents
    }
  };
});

connection.onSignatureHelp((params): SignatureHelp | undefined => {
  const document = documents.get(params.textDocument.uri);
  if (document === undefined) {
    return undefined;
  }

  const project = buildProjectForDocument(document);
  const signatureHelp = getSignatureHelp(project, {
    uri: document.uri,
    position: params.position
  });
  if (signatureHelp === undefined) {
    return undefined;
  }

  return {
    activeParameter: signatureHelp.activeParameter,
    activeSignature: 0,
    signatures: [
      SignatureInformation.create(
        signatureHelp.label,
        signatureHelp.documentation,
        ...signatureHelp.parameters.map((parameter) =>
          ParameterInformation.create(parameter.label, parameter.documentation)
        )
      )
    ]
  };
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

  return buildVbaProject([...files.values()], {
    hostDefinitions: hostCatalogManager.getDefinitions()
  });
}

function toLspPosition(position: Position): Position {
  return Position.create(position.line, position.character);
}

function toLspRange(range: SourceRange): Range {
  return Range.create(toLspPosition(range.start), toLspPosition(range.end));
}

function toWorkspaceEdit(edits: RenameEdit[]): WorkspaceEdit {
  const changes: NonNullable<WorkspaceEdit['changes']> = {};
  for (const edit of edits) {
    changes[edit.uri] ??= [];
    changes[edit.uri].push(TextEdit.replace(toLspRange(edit.range), edit.newText));
  }

  return { changes };
}
