/**
 * API Response Transformation
 * Transforms API responses for different formats and versions
 */

export interface TransformOptions {
  format?: 'json' | 'xml' | 'csv' | 'yaml';
  version?: string;
  fields?: string[];
  excludeFields?: string[];
  renameFields?: Record<string, string>;
  dateFormat?: string;
  numberFormat?: 'plain' | 'locale';
  pretty?: boolean;
}

export interface TransformResult {
  data: any;
  format: string;
  contentType: string;
}

class ResponseTransformer {
  /**
   * Transforms data based on options
   */
  transform(data: any, options: TransformOptions = {}): TransformResult {
    const {
      format = 'json',
      pretty = true,
    } = options;

    let transformedData = this.applyFieldTransforms(data, options);

    switch (format) {
      case 'json':
        return {
          data: this.toJSON(transformedData, pretty),
          format: 'json',
          contentType: 'application/json',
        };
      case 'xml':
        return {
          data: this.toXML(transformedData),
          format: 'xml',
          contentType: 'application/xml',
        };
      case 'csv':
        return {
          data: this.toCSV(transformedData),
          format: 'csv',
          contentType: 'text/csv',
        };
      case 'yaml':
        return {
          data: this.toYAML(transformedData),
          format: 'yaml',
          contentType: 'text/yaml',
        };
      default:
        return {
          data: this.toJSON(transformedData, pretty),
          format: 'json',
          contentType: 'application/json',
        };
    }
  }

  /**
   * Applies field transformations
   */
  private applyFieldTransforms(data: any, options: TransformOptions): any {
    let result = data;

    // Filter fields
    if (options.fields) {
      result = this.filterFields(result, options.fields);
    }

    // Exclude fields
    if (options.excludeFields) {
      result = this.excludeFields(result, options.excludeFields);
    }

    // Rename fields
    if (options.renameFields) {
      result = this.renameFields(result, options.renameFields);
    }

    // Format dates
    if (options.dateFormat) {
      result = this.formatDates(result, options.dateFormat);
    }

    // Format numbers
    if (options.numberFormat === 'locale') {
      result = this.formatNumbers(result);
    }

    return result;
  }

  /**
   * Filters to specific fields
   */
  private filterFields(data: any, fields: string[]): any {
    if (Array.isArray(data)) {
      return data.map(item => this.filterFields(item, fields));
    }

    if (typeof data === 'object' && data !== null) {
      const result: any = {};
      for (const field of fields) {
        if (field in data) {
          result[field] = data[field];
        }
      }
      return result;
    }

    return data;
  }

  /**
   * Excludes specific fields
   */
  private excludeFields(data: any, excludeFields: string[]): any {
    if (Array.isArray(data)) {
      return data.map(item => this.excludeFields(item, excludeFields));
    }

    if (typeof data === 'object' && data !== null) {
      const result: any = {};
      for (const [key, value] of Object.entries(data)) {
        if (!excludeFields.includes(key)) {
          result[key] = value;
        }
      }
      return result;
    }

    return data;
  }

  /**
   * Renames fields
   */
  private renameFields(data: any, renameMap: Record<string, string>): any {
    if (Array.isArray(data)) {
      return data.map(item => this.renameFields(item, renameMap));
    }

    if (typeof data === 'object' && data !== null) {
      const result: any = {};
      for (const [key, value] of Object.entries(data)) {
        const newKey = renameMap[key] || key;
        result[newKey] = typeof value === 'object' ? this.renameFields(value, renameMap) : value;
      }
      return result;
    }

    return data;
  }

  /**
   * Formats dates
   */
  private formatDates(data: any, format: string): any {
    if (Array.isArray(data)) {
      return data.map(item => this.formatDates(item, format));
    }

    if (typeof data === 'object' && data !== null) {
      const result: any = {};
      for (const [key, value] of Object.entries(data)) {
        if (value instanceof Date) {
          result[key] = this.formatDate(value, format);
        } else if (typeof value === 'object') {
          result[key] = this.formatDates(value, format);
        } else {
          result[key] = value;
        }
      }
      return result;
    }

    return data;
  }

  /**
   * Formats a single date
   */
  private formatDate(date: Date, format: string): string {
    // Simple date formatting (in production, use a library like date-fns)
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const seconds = String(date.getSeconds()).padStart(2, '0');

    return format
      .replace('YYYY', String(year))
      .replace('MM', month)
      .replace('DD', day)
      .replace('HH', hours)
      .replace('mm', minutes)
      .replace('ss', seconds);
  }

  /**
   * Formats numbers
   */
  private formatNumbers(data: any): any {
    if (Array.isArray(data)) {
      return data.map(item => this.formatNumbers(item));
    }

    if (typeof data === 'object' && data !== null) {
      const result: any = {};
      for (const [key, value] of Object.entries(data)) {
        if (typeof value === 'number') {
          result[key] = value.toLocaleString();
        } else if (typeof value === 'object') {
          result[key] = this.formatNumbers(value);
        } else {
          result[key] = value;
        }
      }
      return result;
    }

    return data;
  }

  /**
   * Converts to JSON
   */
  private toJSON(data: any, pretty: boolean): string {
    return JSON.stringify(data, null, pretty ? 2 : 0);
  }

  /**
   * Converts to XML
   */
  private toXML(data: any): string {
    return this.objectToXML(data, 'root');
  }

  /**
   * Converts object to XML string
   */
  private objectToXML(obj: any, rootName: string): string {
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
  private objectToXMLNodes(obj: any, indent: string): string {
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
  private escapeXML(str: string): string {
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&apos;');
  }

  /**
   * Converts to CSV
   */
  private toCSV(data: any): string {
    if (!Array.isArray(data) || data.length === 0) {
      return '';
    }

    const headers = Object.keys(data[0]);
    const rows: string[] = [];

    rows.push(headers.join(','));

    for (const item of data) {
      const values = headers.map(header => {
        const value = item[header];
        const stringValue = String(value ?? '');
        if (stringValue.includes(',') || stringValue.includes('"')) {
          return `"${stringValue.replace(/"/g, '""')}"`;
        }
        return stringValue;
      });
      rows.push(values.join(','));
    }

    return rows.join('\n');
  }

  /**
   * Converts to YAML
   */
  private toYAML(data: any): string {
    return this.objectToYAML(data, 0);
  }

  /**
   * Converts object to YAML string
   */
  private objectToYAML(obj: any, indent: number): string {
    const spaces = '  '.repeat(indent);

    if (Array.isArray(obj)) {
      return obj.map(item => {
        if (typeof item === 'object' && item !== null) {
          return `${spaces}-\n${this.objectToYAML(item, indent + 1)}`;
        }
        return `${spaces}- ${item}`;
      }).join('\n');
    }

    if (typeof obj === 'object' && obj !== null) {
      return Object.entries(obj)
        .map(([key, value]) => {
          if (typeof value === 'object' && value !== null) {
            return `${spaces}${key}:\n${this.objectToYAML(value, indent + 1)}`;
          }
          return `${spaces}${key}: ${value}`;
        })
        .join('\n');
    }

    return String(obj);
  }
}

// Create singleton instance
const responseTransformer = new ResponseTransformer();

/**
 * Transforms data
 */
export function transformResponse(data: any, options?: TransformOptions): TransformResult {
  return responseTransformer.transform(data, options);
}

/**
 * Transforms to JSON
 */
export function transformToJSON(data: any, pretty?: boolean): string {
  return responseTransformer.transform(data, { format: 'json', pretty }).data;
}

/**
 * Transforms to XML
 */
export function transformToXML(data: any): string {
  return responseTransformer.transform(data, { format: 'xml' }).data;
}

/**
 * Transforms to CSV
 */
export function transformToCSV(data: any): string {
  return responseTransformer.transform(data, { format: 'csv' }).data;
}

/**
 * Transforms to YAML
 */
export function transformToYAML(data: any): string {
  return responseTransformer.transform(data, { format: 'yaml' }).data;
}

export default responseTransformer;
