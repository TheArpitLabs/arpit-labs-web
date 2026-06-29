/**
 * API Documentation Generator
 * Automatically generates API documentation from route handlers
 */

export interface APIEndpoint {
  path: string;
  method: string;
  summary?: string;
  description?: string;
  parameters?: APIParameter[];
  requestBody?: APIRequestBody;
  responses?: APIResponse[];
  tags?: string[];
  security?: APISecurity[];
}

export interface APIParameter {
  name: string;
  in: 'path' | 'query' | 'header' | 'cookie';
  description?: string;
  required: boolean;
  schema: APISchema;
  example?: any;
}

export interface APIRequestBody {
  description?: string;
  required: boolean;
  content: Record<string, APIMediaType>;
}

export interface APIMediaType {
  schema: APISchema;
  example?: any;
}

export interface APISchema {
  type: 'string' | 'number' | 'integer' | 'boolean' | 'object' | 'array';
  format?: string;
  description?: string;
  properties?: Record<string, APISchema>;
  items?: APISchema;
  required?: string[];
  enum?: any[];
  example?: any;
}

export interface APIResponse {
  code: number;
  description: string;
  content?: Record<string, APIMediaType>;
}

export interface APISecurity {
  type: 'apiKey' | 'http' | 'oauth2' | 'openIdConnect';
  scheme?: string;
  bearerFormat?: string;
  scopes?: string[];
}

export interface APIDocumentation {
  openapi: string;
  info: APIInfo;
  servers: APIServer[];
  paths: Record<string, Record<string, APIEndpoint>>;
  components?: APIComponents;
}

export interface APIInfo {
  title: string;
  version: string;
  description?: string;
  contact?: APIContact;
  license?: APILicense;
}

export interface APIContact {
  name?: string;
  email?: string;
  url?: string;
}

export interface APILicense {
  name: string;
  url?: string;
}

export interface APIServer {
  url: string;
  description?: string;
  variables?: Record<string, APIServerVariable>;
}

export interface APIServerVariable {
  enum?: string[];
  default: string;
  description?: string;
}

export interface APIComponents {
  schemas?: Record<string, APISchema>;
  responses?: Record<string, APIResponse>;
  parameters?: Record<string, APIParameter>;
  examples?: Record<string, any>;
  securitySchemes?: Record<string, APISecurity>;
}

class APIDocumentationGenerator {
  private endpoints: APIEndpoint[] = [];
  private schemas: Record<string, APISchema> = {};
  private securitySchemes: Record<string, APISecurity> = {};

  /**
   * Registers an API endpoint
   */
  registerEndpoint(endpoint: APIEndpoint): void {
    this.endpoints.push(endpoint);
  }

  /**
   * Registers a schema
   */
  registerSchema(name: string, schema: APISchema): void {
    this.schemas[name] = schema;
  }

  /**
   * Registers a security scheme
   */
  registerSecurityScheme(name: string, scheme: APISecurity): void {
    this.securitySchemes[name] = scheme;
  }

  /**
   * Generates OpenAPI documentation
   */
  generateOpenAPI(config: {
    info: APIInfo;
    servers: APIServer[];
  }): APIDocumentation {
    const paths: Record<string, Record<string, APIEndpoint>> = {};

    for (const endpoint of this.endpoints) {
      if (!paths[endpoint.path]) {
        paths[endpoint.path] = {};
      }
      paths[endpoint.path][endpoint.method.toLowerCase()] = endpoint;
    }

    return {
      openapi: '3.0.0',
      info: config.info,
      servers: config.servers,
      paths,
      components: {
        schemas: this.schemas,
        securitySchemes: this.securitySchemes,
      },
    };
  }

  /**
   * Generates Markdown documentation
   */
  generateMarkdown(config: { info: APIInfo; servers: APIServer[] }): string {
    let markdown = `# ${config.info.title}\n\n`;
    
    if (config.info.description) {
      markdown += `${config.info.description}\n\n`;
    }

    markdown += `**Version:** ${config.info.version}\n\n`;

    if (config.servers.length > 0) {
      markdown += `## Servers\n\n`;
      for (const server of config.servers) {
        markdown += `- **${server.url}**`;
        if (server.description) {
          markdown += ` - ${server.description}`;
        }
        markdown += `\n`;
      }
      markdown += `\n`;
    }

    // Group endpoints by tags
    const groupedByTag = this.groupEndpointsByTag();

    for (const [tag, endpoints] of Object.entries(groupedByTag)) {
      markdown += `## ${tag}\n\n`;

      for (const endpoint of endpoints) {
        markdown += `### ${endpoint.method.toUpperCase()} ${endpoint.path}\n\n`;

        if (endpoint.summary) {
          markdown += `${endpoint.summary}\n\n`;
        }

        if (endpoint.description) {
          markdown += `${endpoint.description}\n\n`;
        }

        if (endpoint.parameters && endpoint.parameters.length > 0) {
          markdown += `#### Parameters\n\n`;
          markdown += `| Name | In | Type | Required | Description |\n`;
          markdown += `|------|----|----|----------|------------|\n`;

          for (const param of endpoint.parameters) {
            markdown += `| ${param.name} | ${param.in} | ${param.schema.type} | ${param.required ? 'Yes' : 'No'} | ${param.description || ''} |\n`;
          }
          markdown += `\n`;
        }

        if (endpoint.requestBody) {
          markdown += `#### Request Body\n\n`;
          for (const [contentType, mediaType] of Object.entries(endpoint.requestBody.content)) {
            markdown += `**Content-Type:** ${contentType}\n\n`;
            markdown += `\`\`\`json\n`;
            markdown += JSON.stringify(mediaType.example || mediaType.schema, null, 2);
            markdown += `\n\`\`\`\n\n`;
          }
        }

        if (endpoint.responses && endpoint.responses.length > 0) {
          markdown += `#### Responses\n\n`;
          for (const response of endpoint.responses) {
            markdown += `**${response.code}** - ${response.description}\n\n`;
            if (response.content) {
              for (const [contentType, mediaType] of Object.entries(response.content)) {
                markdown += `Content-Type: ${contentType}\n\n`;
                if (mediaType.example) {
                  markdown += `\`\`\`json\n`;
                  markdown += JSON.stringify(mediaType.example, null, 2);
                  markdown += `\n\`\`\`\n\n`;
                }
              }
            }
          }
        }

        markdown += `---\n\n`;
      }
    }

    return markdown;
  }

  /**
   * Groups endpoints by tags
   */
  private groupEndpointsByTag(): Record<string, APIEndpoint[]> {
    const grouped: Record<string, APIEndpoint[]> = {};

    for (const endpoint of this.endpoints) {
      const tags = endpoint.tags || ['General'];
      for (const tag of tags) {
        if (!grouped[tag]) {
          grouped[tag] = [];
        }
        grouped[tag].push(endpoint);
      }
    }

    return grouped;
  }

  /**
   * Validates endpoint configuration
   */
  validateEndpoint(endpoint: APIEndpoint): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!endpoint.path) {
      errors.push('Path is required');
    }

    if (!endpoint.method) {
      errors.push('Method is required');
    }

    if (endpoint.parameters) {
      for (const param of endpoint.parameters) {
        if (!param.name) {
          errors.push('Parameter name is required');
        }
        if (!param.in) {
          errors.push('Parameter location (in) is required');
        }
        if (!param.schema) {
          errors.push('Parameter schema is required');
        }
      }
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  /**
   * Clears all registered data
   */
  clear(): void {
    this.endpoints = [];
    this.schemas = {};
    this.securitySchemes = {};
  }

  /**
   * Gets all registered endpoints
   */
  getEndpoints(): APIEndpoint[] {
    return [...this.endpoints];
  }

  /**
   * Gets all registered schemas
   */
  getSchemas(): Record<string, APISchema> {
    return { ...this.schemas };
  }
}

// Create singleton instance
const docGenerator = new APIDocumentationGenerator();

/**
 * Registers an API endpoint
 */
export function registerAPIEndpoint(endpoint: APIEndpoint): void {
  docGenerator.registerEndpoint(endpoint);
}

/**
 * Registers a schema
 */
export function registerAPISchema(name: string, schema: APISchema): void {
  docGenerator.registerSchema(name, schema);
}

/**
 * Registers a security scheme
 */
export function registerAPISecurityScheme(name: string, scheme: APISecurity): void {
  docGenerator.registerSecurityScheme(name, scheme);
}

/**
 * Generates OpenAPI documentation
 */
export function generateOpenAPIDocumentation(config: {
  info: APIInfo;
  servers: APIServer[];
}): APIDocumentation {
  return docGenerator.generateOpenAPI(config);
}

/**
 * Generates Markdown documentation
 */
export function generateAPIMarkdown(config: {
  info: APIInfo;
  servers: APIServer[];
}): string {
  return docGenerator.generateMarkdown(config);
}

/**
 * Validates endpoint configuration
 */
export function validateAPIEndpoint(endpoint: APIEndpoint): {
  valid: boolean;
  errors: string[];
} {
  return docGenerator.validateEndpoint(endpoint);
}

/**
 * Clears all registered data
 */
export function clearAPIDocumentation(): void {
  docGenerator.clear();
}

/**
 * Gets all registered endpoints
 */
export function getAPIEndpoints(): APIEndpoint[] {
  return docGenerator.getEndpoints();
}

/**
 * Gets all registered schemas
 */
export function getAPISchemas(): Record<string, APISchema> {
  return docGenerator.getSchemas();
}

export default docGenerator;
