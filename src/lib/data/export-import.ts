/**
 * Data Export/Import Features
 * Handles exporting and importing data in various formats
 */

export type ExportFormat = 'json' | 'csv' | 'xlsx' | 'xml';

export interface ExportOptions {
  format: ExportFormat;
  filename?: string;
  includeHeaders?: boolean;
  dateFormat?: string;
  numberFormat?: string;
}

export interface ImportOptions {
  format: ExportFormat;
  validate?: boolean;
  transform?: (data: any) => any;
}

export class DataExporter {
  /**
   * Exports data to specified format
   */
  static async export<T extends Record<string, any>>(
    data: T[],
    options: ExportOptions
  ): Promise<Blob> {
    const { format, filename = 'export', includeHeaders = true } = options;

    switch (format) {
      case 'json':
        return this.exportJSON(data);
      case 'csv':
        return this.exportCSV(data, includeHeaders);
      case 'xlsx':
        return this.exportExcel(data);
      case 'xml':
        return this.exportXML(data);
      default:
        throw new Error(`Unsupported format: ${format}`);
    }
  }

  /**
   * Exports data as JSON
   */
  private static exportJSON<T>(data: T[]): Blob {
    const json = JSON.stringify(data, null, 2);
    return new Blob([json], { type: 'application/json' });
  }

  /**
   * Exports data as CSV
   */
  private static exportCSV<T extends Record<string, any>>(data: T[], includeHeaders: boolean): Blob {
    if (data.length === 0) {
      return new Blob([''], { type: 'text/csv' });
    }

    const headers = Object.keys(data[0]);
    const rows: string[] = [];

    if (includeHeaders) {
      rows.push(headers.join(','));
    }

    for (const item of data) {
      const values = headers.map((header) => {
        const value = item[header as keyof T];
        const stringValue = String(value ?? '');
        if (stringValue.includes(',') || stringValue.includes('"')) {
          return `"${stringValue.replace(/"/g, '""')}"`;
        }
        return stringValue;
      });
      rows.push(values.join(','));
    }

    const csv = rows.join('\n');
    return new Blob([csv], { type: 'text/csv' });
  }

  /**
   * Exports data as Excel (simplified)
   */
  private static exportExcel<T extends Record<string, any>>(data: T[]): Blob {
    return this.exportCSV(data, true);
  }

  /**
   * Exports data as XML
   */
  private static exportXML<T extends Record<string, any>>(data: T[]): Blob {
    const xml = this.objectToXML({ items: data }, 'root');
    return new Blob([xml], { type: 'application/xml' });
  }

  /**
   * Converts object to XML string
   */
  private static objectToXML(obj: any, rootName: string): string {
    let xml = `<?xml version="1.0" encoding="UTF-8"?>\n`;
    xml += `<${rootName}>\n`;

    for (const key in obj) {
      if (Array.isArray(obj[key])) {
        xml += `  <${key}>\n`;
        for (const item of obj[key]) {
          xml += `    <item>\n`;
          xml += this.objectToXMLNodes(item, '      ');
          xml += `    </item>\n`;
        }
        xml += `  </${key}>\n`;
      } else if (typeof obj[key] === 'object' && obj[key] !== null) {
        xml += `  <${key}>\n`;
        xml += this.objectToXMLNodes(obj[key], '    ');
        xml += `  </${key}>\n`;
      } else {
        xml += `  <${key}>${this.escapeXML(String(obj[key]))}</${key}>\n`;
      }
    }

    xml += `</${rootName}>`;
    return xml;
  }

  /**
   * Converts object properties to XML nodes
   */
  private static objectToXMLNodes(obj: any, indent: string): string {
    let xml = '';
    for (const key in obj) {
      if (typeof obj[key] === 'object' && obj[key] !== null) {
        xml += `${indent}<${key}>\n`;
        xml += this.objectToXMLNodes(obj[key], indent + '  ');
        xml += `${indent}</${key}>\n`;
      } else {
        xml += `${indent}<${key}>${this.escapeXML(String(obj[key]))}</${key}>\n`;
      }
    }
    return xml;
  }

  /**
   * Escapes XML special characters
   */
  private static escapeXML(str: string): string {
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&apos;');
  }

  /**
   * Triggers download of exported data
   */
  static download(blob: Blob, filename: string): void {
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }
}

export class DataImporter {
  /**
   * Imports data from file
   */
  static async import<T>(
    file: File,
    options: ImportOptions
  ): Promise<T[]> {
    const { format, validate = true, transform } = options;

    const content = await file.text();

    switch (format) {
      case 'json':
        return this.importJSON(content, validate, transform);
      case 'csv':
        return this.importCSV(content, validate, transform);
      case 'xlsx':
        return this.importExcel(content, validate, transform);
      case 'xml':
        return this.importXML(content, validate, transform);
      default:
        throw new Error(`Unsupported format: ${format}`);
    }
  }

  /**
   * Imports JSON data
   */
  private static async importJSON<T>(
    content: string,
    validate: boolean,
    transform?: (data: any) => any
  ): Promise<T[]> {
    try {
      const data = JSON.parse(content);
      const array = Array.isArray(data) ? data : [data];

      if (validate) {
        this.validateData(array);
      }

      return transform ? array.map(transform) : array;
    } catch (error) {
      throw new Error('Invalid JSON format');
    }
  }

  /**
   * Imports CSV data
   */
  private static async importCSV<T>(
    content: string,
    validate: boolean,
    transform?: (data: any) => any
  ): Promise<T[]> {
    const lines = content.split('\n').filter((line) => line.trim());
    if (lines.length === 0) return [];

    const headers = lines[0].split(',').map((h) => h.trim().replace(/"/g, ''));
    const data: any[] = [];

    for (let i = 1; i < lines.length; i++) {
      const values = this.parseCSVLine(lines[i]);
      const item: any = {};

      headers.forEach((header, index) => {
        item[header] = values[index] || '';
      });

      data.push(item);
    }

    if (validate) {
      this.validateData(data);
    }

    return transform ? data.map(transform) : data;
  }

  /**
   * Parses a CSV line handling quoted values
   */
  private static parseCSVLine(line: string): string[] {
    const result: string[] = [];
    let current = '';
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      const nextChar = line[i + 1];

      if (char === '"') {
        if (inQuotes && nextChar === '"') {
          current += '"';
          i++;
        } else {
          inQuotes = !inQuotes;
        }
      } else if (char === ',' && !inQuotes) {
        result.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }

    result.push(current.trim());
    return result;
  }

  /**
   * Imports Excel data (simplified)
   */
  private static async importExcel<T>(
    content: string,
    validate: boolean,
    transform?: (data: any) => any
  ): Promise<T[]> {
    return this.importCSV(content, validate, transform);
  }

  /**
   * Imports XML data
   */
  private static async importXML<T>(
    content: string,
    validate: boolean,
    transform?: (data: any) => any
  ): Promise<T[]> {
    try {
      const parser = new DOMParser();
      const xmlDoc = parser.parseFromString(content, 'text/xml');
      const items = xmlDoc.getElementsByTagName('item');

      const data: any[] = [];
      for (let i = 0; i < items.length; i++) {
        const item: any = {};
        const children = items[i].children;

        for (let j = 0; j < children.length; j++) {
          item[children[j].tagName] = children[j].textContent;
        }

        data.push(item);
      }

      if (validate) {
        this.validateData(data);
      }

      return transform ? data.map(transform) : data;
    } catch (error) {
      throw new Error('Invalid XML format');
    }
  }

  /**
   * Validates imported data
   */
  private static validateData(data: any[]): void {
    if (!Array.isArray(data)) {
      throw new Error('Data must be an array');
    }

    if (data.length === 0) {
      throw new Error('Data is empty');
    }
  }
}

/**
 * Exports data and triggers download
 */
export async function exportData<T extends Record<string, any>>(
  data: T[],
  options: ExportOptions
): Promise<void> {
  const blob = await DataExporter.export(data, options);
  const filename = options.filename || `export.${options.format}`;
  DataExporter.download(blob, filename);
}

/**
 * Imports data from file
 */
export async function importData<T>(
  file: File,
  options: ImportOptions
): Promise<T[]> {
  return DataImporter.import(file, options);
}

/**
 * Detects file format from extension
 */
export function detectFileFormat(filename: string): ExportFormat {
  const ext = filename.split('.').pop()?.toLowerCase();
  
  switch (ext) {
    case 'json':
      return 'json';
    case 'csv':
      return 'csv';
    case 'xlsx':
    case 'xls':
      return 'xlsx';
    case 'xml':
      return 'xml';
    default:
      return 'json';
  }
}
