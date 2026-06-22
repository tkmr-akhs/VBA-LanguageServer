import type { HostApplication, HostDefinition } from './vbaProject';

export const C_DEFAULT_MAIN_HOST_APPLICATION: HostApplication = 'excel';

export interface HostApplicationSelectionOptions {
  mainHostApplication?: HostApplication;
}

const bundledHostDefinitionsByApplication: Record<HostApplication, HostDefinition[]> = {
  excel: [
    {
      name: 'Application',
      kind: 'class',
      documentation: 'Represents the Microsoft Excel application.',
      members: [
        { name: 'ActiveWorkbook', kind: 'property', documentation: 'Returns the active workbook.' },
        { name: 'ActiveSheet', kind: 'property', documentation: 'Returns the active sheet.' },
        { name: 'Workbooks', kind: 'property', documentation: 'Returns the Workbooks collection.' }
      ]
    },
    {
      name: 'Workbook',
      kind: 'class',
      documentation: 'Represents an Excel workbook.',
      members: [
        { name: 'Name', kind: 'property', documentation: 'Returns the workbook name.' },
        { name: 'Worksheets', kind: 'property', documentation: 'Returns the Worksheets collection.' }
      ]
    },
    {
      name: 'Worksheet',
      kind: 'class',
      documentation: 'Represents an Excel worksheet.',
      members: [
        { name: 'Name', kind: 'property', documentation: 'Returns the worksheet name.' },
        { name: 'Range', kind: 'function', documentation: 'Returns a Range object.' },
        { name: 'Cells', kind: 'property', documentation: 'Returns the Cells collection.' }
      ]
    },
    {
      name: 'Range',
      kind: 'class',
      documentation: 'Represents a cell, row, column, selection, or block of cells.',
      members: [
        { name: 'Address', kind: 'property', documentation: 'Returns the range address.' },
        { name: 'Value', kind: 'property', documentation: 'Returns or sets the range value.' },
        { name: 'Value2', kind: 'property', documentation: 'Returns or sets the range value without Currency and Date data types.' }
      ]
    }
  ],
  word: [
    {
      name: 'Application',
      kind: 'class',
      documentation: 'Represents the Microsoft Word application.',
      members: [
        { name: 'ActiveDocument', kind: 'property', documentation: 'Returns the active document.' },
        { name: 'Documents', kind: 'property', documentation: 'Returns the Documents collection.' },
        { name: 'Selection', kind: 'property', documentation: 'Returns the current selection.' }
      ]
    },
    {
      name: 'Document',
      kind: 'class',
      documentation: 'Represents a Word document.',
      members: [
        { name: 'Name', kind: 'property', documentation: 'Returns the document name.' },
        { name: 'Range', kind: 'function', documentation: 'Returns a Range object.' }
      ]
    },
    {
      name: 'Range',
      kind: 'class',
      documentation: 'Represents a contiguous area in a Word document.',
      members: [
        { name: 'Text', kind: 'property', documentation: 'Returns or sets the range text.' },
        { name: 'Start', kind: 'property', documentation: 'Returns or sets the starting character position.' },
        { name: 'End', kind: 'property', documentation: 'Returns or sets the ending character position.' }
      ]
    },
    {
      name: 'Selection',
      kind: 'class',
      documentation: 'Represents the current selection in Word.',
      members: [
        { name: 'Text', kind: 'property', documentation: 'Returns or sets the selected text.' },
        { name: 'Range', kind: 'property', documentation: 'Returns the selection range.' }
      ]
    }
  ]
};

export function getBundledHostDefinitions(options: HostApplicationSelectionOptions = {}): HostDefinition[] {
  const main_host_application = options.mainHostApplication ?? C_DEFAULT_MAIN_HOST_APPLICATION;
  return getBundledHostDefinitionsForApplication(main_host_application);
}

export function getBundledHostDefinitionsForApplication(hostApplication: HostApplication): HostDefinition[] {
  return cloneHostDefinitionsWithApplication(
    bundledHostDefinitionsByApplication[hostApplication],
    hostApplication
  );
}

export function getBundledExcelHostDefinitions(): HostDefinition[] {
  return getBundledHostDefinitionsForApplication('excel');
}

export function getBundledWordHostDefinitions(): HostDefinition[] {
  return getBundledHostDefinitionsForApplication('word');
}

export function formatHostApplicationName(hostApplication: HostApplication): string {
  switch (hostApplication) {
    case 'excel':
      return 'Excel';
    case 'word':
      return 'Word';
  }
}

function cloneHostDefinitionsWithApplication(
  definitions: HostDefinition[],
  hostApplication: HostApplication
): HostDefinition[] {
  return definitions.map((definition) => cloneHostDefinitionWithApplication(definition, hostApplication));
}

function cloneHostDefinitionWithApplication(
  definition: HostDefinition,
  hostApplication: HostApplication
): HostDefinition {
  return {
    ...definition,
    hostApplication,
    members: definition.members?.map((member) =>
      cloneHostDefinitionWithApplication(member, hostApplication)
    )
  };
}
