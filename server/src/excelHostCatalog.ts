import type { HostDefinition } from './vbaProject';

const bundledExcelHostDefinitions: HostDefinition[] = [
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
];

export function getBundledExcelHostDefinitions(): HostDefinition[] {
  return bundledExcelHostDefinitions.map(cloneHostDefinition);
}

function cloneHostDefinition(definition: HostDefinition): HostDefinition {
  return {
    ...definition,
    members: definition.members?.map(cloneHostDefinition)
  };
}
