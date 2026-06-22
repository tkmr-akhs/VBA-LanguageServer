import type { HostDefinition } from './vbaProject';

const bundledExcelHostDefinitions: HostDefinition[] = [
  {
    name: 'Application',
    documentation: 'Represents the Microsoft Excel application.'
  },
  {
    name: 'Workbook',
    documentation: 'Represents an Excel workbook.'
  },
  {
    name: 'Worksheet',
    documentation: 'Represents an Excel worksheet.'
  },
  {
    name: 'Range',
    documentation: 'Represents a cell, row, column, selection, or block of cells.'
  }
];

export function getBundledExcelHostDefinitions(): HostDefinition[] {
  return bundledExcelHostDefinitions.map((definition) => ({ ...definition }));
}
