import path from 'node:path';

export interface SourcePosition {
  line: number;
  character: number;
}

export interface SourceRange {
  start: SourcePosition;
  end: SourcePosition;
}

export interface VbaProjectFile {
  uri: string;
  text: string;
}

export interface CompletionEntry {
  label: string;
}

export interface CompletionRequest {
  uri: string;
  position: SourcePosition;
}

export interface DefinitionLocation {
  uri: string;
  range: SourceRange;
}

interface VbaDefinition {
  name: string;
  kind: 'function';
  visibility: 'public';
  uri: string;
  range: SourceRange;
}

interface VbaModule {
  uri: string;
  folderUri: string;
  identity: string;
  lines: string[];
  definitions: VbaDefinition[];
}

export interface VbaProject {
  modules: VbaModule[];
}

const C_IDENTIFIER_PATTERN = /[A-Za-z_][A-Za-z0-9_]*/;

export function buildVbaProject(files: VbaProjectFile[]): VbaProject {
  const modules = files
    .filter((file) => isVbaSourceUri(file.uri))
    .map((file) => parseModule(file));

  return { modules };
}

export function getCompletions(project: VbaProject, request: CompletionRequest): CompletionEntry[] {
  const current_module = findModule(project, request.uri);
  if (current_module === undefined) {
    return [];
  }

  const prefix = getIdentifierPrefix(current_module.lines, request.position).toLowerCase();
  const candidates = project.modules
    .filter((module) => module.folderUri.toLowerCase() === current_module.folderUri.toLowerCase())
    .flatMap((module) => module.definitions)
    .filter((definition) => definition.visibility === 'public')
    .filter((definition) => prefix === '' || definition.name.toLowerCase().startsWith(prefix))
    .map((definition) => ({ label: definition.name }));

  return candidates;
}

export function getModuleIdentities(project: VbaProject): string[] {
  return project.modules.map((module) => module.identity);
}

export function getDefinition(
  project: VbaProject,
  request: CompletionRequest
): DefinitionLocation | undefined {
  const current_module = findModule(project, request.uri);
  if (current_module === undefined) {
    return undefined;
  }

  const identifier = getIdentifierAt(current_module.lines, request.position);
  if (identifier === undefined) {
    return undefined;
  }

  const matches = project.modules
    .filter((module) => module.folderUri.toLowerCase() === current_module.folderUri.toLowerCase())
    .flatMap((module) => module.definitions)
    .filter((definition) => definition.visibility === 'public')
    .filter((definition) => definition.name.toLowerCase() === identifier.toLowerCase());

  if (matches.length !== 1) {
    return undefined;
  }

  return {
    uri: matches[0].uri,
    range: matches[0].range
  };
}

function parseModule(file: VbaProjectFile): VbaModule {
  const lines = file.text.split(/\r?\n/);
  const identity = parseModuleIdentity(lines) ?? fallbackModuleIdentity(file.uri);
  const definitions = parseDefinitions(file.uri, lines);

  return {
    uri: file.uri,
    folderUri: getFolderUri(file.uri),
    identity,
    lines,
    definitions
  };
}

function parseModuleIdentity(lines: string[]): string | undefined {
  for (const line of lines) {
    const match = /^\s*Attribute\s+VB_Name\s*=\s*"([^"]+)"/i.exec(line);
    if (match !== null) {
      return match[1];
    }
  }

  return undefined;
}

function parseDefinitions(uri: string, lines: string[]): VbaDefinition[] {
  const definitions: VbaDefinition[] = [];

  lines.forEach((line, line_index) => {
    const match = /^\s*Public\s+Function\s+([A-Za-z_][A-Za-z0-9_]*)\b/i.exec(line);
    if (match === null) {
      return;
    }

    const name = match[1];
    const name_start = line.indexOf(name);
    definitions.push({
      name,
      kind: 'function',
      visibility: 'public',
      uri,
      range: {
        start: { line: line_index, character: name_start },
        end: { line: line_index, character: name_start + name.length }
      }
    });
  });

  return definitions;
}

function findModule(project: VbaProject, uri: string): VbaModule | undefined {
  return project.modules.find((module) => sameUri(module.uri, uri));
}

function getIdentifierPrefix(lines: string[], position: SourcePosition): string {
  const line = lines[position.line] ?? '';
  const text_before_position = line.slice(0, position.character);
  const match = new RegExp(`${C_IDENTIFIER_PATTERN.source}$`).exec(text_before_position);

  return match?.[0] ?? '';
}

function getIdentifierAt(lines: string[], position: SourcePosition): string | undefined {
  const line = lines[position.line] ?? '';
  const identifier_pattern = new RegExp(C_IDENTIFIER_PATTERN.source, 'g');

  for (const match of line.matchAll(identifier_pattern)) {
    const start = match.index;
    const end = start + match[0].length;
    if (position.character >= start && position.character <= end) {
      return match[0];
    }
  }

  return undefined;
}

function isVbaSourceUri(uri: string): boolean {
  return /\.(bas|cls|frm)$/i.test(uriPathname(uri));
}

function fallbackModuleIdentity(uri: string): string {
  const parsed_path = uriPathname(uri);
  const file_name = path.posix.basename(parsed_path);
  const extension = path.posix.extname(file_name);

  return file_name.slice(0, file_name.length - extension.length);
}

function getFolderUri(uri: string): string {
  const parsed_path = uriPathname(uri);
  const folder_path = path.posix.dirname(parsed_path);

  return `file://${folder_path}`;
}

function uriPathname(uri: string): string {
  if (uri.startsWith('file://')) {
    return new URL(uri).pathname;
  }

  return uri;
}

function sameUri(left: string, right: string): boolean {
  return left.toLowerCase() === right.toLowerCase();
}
