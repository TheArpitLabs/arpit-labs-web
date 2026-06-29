/**
 * API documentation utilities
 */

export interface ApiEndpoint {
  path: string;
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  summary: string;
  description: string;
  parameters?: Array<{
    name: string;
    in: 'path' | 'query' | 'header' | 'cookie';
    required: boolean;
    schema: any;
    description: string;
  }>;
  requestBody?: {
    content: {
      'application/json': {
        schema: any;
      };
    };
    description: string;
    required: boolean;
  };
  responses: {
    [statusCode: string]: {
      description: string;
      content?: {
        'application/json': {
          schema: any;
        };
      };
    };
  };
  tags: string[];
  security?: Array<{
    [key: string]: string[];
  }>;
}

export interface ApiDocumentation {
  openapi: string;
  info: {
    title: string;
    version: string;
    description: string;
    contact?: {
      name: string;
      email: string;
    };
  };
  servers: Array<{
    url: string;
    description: string;
  }>;
  paths: Record<string, Record<string, ApiEndpoint>>;
  components: {
    schemas: Record<string, any>;
    securitySchemes: Record<string, any>;
  };
  tags: Array<{
    name: string;
    description: string;
  }>;
}

class ApiDocumentationGenerator {
  private documentation: ApiDocumentation;

  constructor() {
    this.documentation = {
      openapi: '3.0.0',
      info: {
        title: 'Axiora API',
        version: '1.0.0',
        description: 'API documentation for Axiora AI-Powered Innovation Platform',
        contact: {
          name: 'Axiora',
          email: 'contact@axiora.com',
        },
      },
      servers: [
        {
          url: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api',
          description: 'API Server',
        },
      ],
      paths: {},
      components: {
        schemas: {},
        securitySchemes: {
          bearerAuth: {
            type: 'http',
            scheme: 'bearer',
            bearerFormat: 'JWT',
          },
        },
      },
      tags: [
        { name: 'Authentication', description: 'Authentication endpoints' },
        { name: 'Projects', description: 'Project management' },
        { name: 'Users', description: 'User management' },
        { name: 'Analytics', description: 'Analytics and metrics' },
        { name: 'Admin', description: 'Administrative functions' },
      ],
    };
  }

  /**
   * Add an endpoint to documentation
   */
  addEndpoint(path: string, method: string, endpoint: ApiEndpoint): void {
    if (!this.documentation.paths[path]) {
      this.documentation.paths[path] = {};
    }
    this.documentation.paths[path][method.toLowerCase()] = endpoint;
  }

  /**
   * Add a schema definition
   */
  addSchema(name: string, schema: any): void {
    this.documentation.components.schemas[name] = schema;
  }

  /**
   * Add a tag
   */
  addTag(name: string, description: string): void {
    if (!this.documentation.tags.find(t => t.name === name)) {
      this.documentation.tags.push({ name, description });
    }
  }

  /**
   * Generate OpenAPI specification
   */
  generateOpenApiSpec(): string {
    return JSON.stringify(this.documentation, null, 2);
  }

  /**
   * Generate markdown documentation
   */
  generateMarkdown(): string {
    let markdown = `# ${this.documentation.info.title}\n\n`;
    markdown += `${this.documentation.info.description}\n\n`;
    markdown += `**Version:** ${this.documentation.info.version}\n\n`;
    markdown += `## Servers\n\n`;
    
    this.documentation.servers.forEach(server => {
      markdown += `- **${server.description}**: \`${server.url}\`\n`;
    });
    
    markdown += `\n## Authentication\n\n`;
    markdown += `This API uses JWT bearer authentication. Include your token in the Authorization header:\n\n`;
    markdown += `\`\`\`\nAuthorization: Bearer <your-token>\n\`\`\`\n\n`;
    
    markdown += `## Endpoints\n\n`;
    
    Object.entries(this.documentation.paths).forEach(([path, methods]) => {
      Object.entries(methods).forEach(([method, endpoint]: [string, any]) => {
        markdown += `### ${method.toUpperCase()} ${path}\n\n`;
        markdown += `${endpoint.summary}\n\n`;
        markdown += `${endpoint.description}\n\n`;
        
        if (endpoint.parameters && endpoint.parameters.length > 0) {
          markdown += `#### Parameters\n\n`;
          markdown += `| Name | In | Type | Required | Description |\n`;
          markdown += `|------|-----|------|----------|-------------|\n`;
          
          endpoint.parameters.forEach((param: any) => {
            markdown += `| ${param.name} | ${param.in} | ${typeof param.schema.type} | ${param.required ? 'Yes' : 'No'} | ${param.description} |\n`;
          });
          markdown += `\n`;
        }
        
        if (endpoint.requestBody) {
          markdown += `#### Request Body\n\n`;
          markdown += `\`\`\`json\n${JSON.stringify(endpoint.requestBody.content['application/json'].schema, null, 2)}\n\`\`\`\n\n`;
        }
        
        markdown += `#### Responses\n\n`;
        Object.entries(endpoint.responses).forEach(([statusCode, response]: [string, any]) => {
          markdown += `**${statusCode}**: ${response.description}\n\n`;
          
          if (response.content) {
            markdown += `\`\`\`json\n${JSON.stringify(response.content['application/json'].schema, null, 2)}\n\`\`\`\n\n`;
          }
        });
        
        markdown += `---\n\n`;
      });
    });
    
    return markdown;
  }

  /**
   * Generate TypeScript types from schemas
   */
  generateTypescriptTypes(): string {
    let types = `// Auto-generated API types\n\n`;
    
    Object.entries(this.documentation.components.schemas).forEach(([name, schema]) => {
      types += `export interface ${name} {\n`;
      this.generateTypeFromSchema(schema, 1, types);
      types += `}\n\n`;
    });
    
    return types;
  }

  /**
   * Generate TypeScript type from schema
   */
  private generateTypeFromSchema(schema: any, indent: number, output: string): string {
    const spaces = '  '.repeat(indent);
    
    if (schema.type === 'object' && schema.properties) {
      Object.entries(schema.properties).forEach(([propName, propSchema]: [string, any]) => {
        const required = schema.required?.includes(propName);
        const optional = required ? '' : '?';
        output += `${spaces}${propName}${optional}: ${this.getTypeString(propSchema)};\n`;
      });
    }
    
    return output;
  }

  /**
   * Get TypeScript type string from schema
   */
  private getTypeString(schema: any): string {
    switch (schema.type) {
      case 'string':
        return 'string';
      case 'number':
        return 'number';
      case 'integer':
        return 'number';
      case 'boolean':
        return 'boolean';
      case 'array':
        return `${this.getTypeString(schema.items)}[]`;
      case 'object':
        return 'any';
      default:
        return 'any';
    }
  }

  /**
   * Validate documentation against OpenAPI spec
   */
  validate(): {
    isValid: boolean;
    errors: string[];
  } {
    const errors: string[] = [];
    
    if (!this.documentation.openapi) {
      errors.push('Missing OpenAPI version');
    }
    
    if (!this.documentation.info.title) {
      errors.push('Missing API title');
    }
    
    if (!this.documentation.info.version) {
      errors.push('Missing API version');
    }
    
    if (Object.keys(this.documentation.paths).length === 0) {
      errors.push('No endpoints defined');
    }
    
    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  /**
   * Export documentation
   */
  export(format: 'json' | 'yaml' | 'markdown' | 'typescript'): string {
    switch (format) {
      case 'json':
        return this.generateOpenApiSpec();
      case 'markdown':
        return this.generateMarkdown();
      case 'typescript':
        return this.generateTypescriptTypes();
      case 'yaml':
        // Would need a YAML library
        return this.generateOpenApiSpec();
      default:
        return this.generateOpenApiSpec();
    }
  }
}

// Create singleton instance
const apiDocGenerator = new ApiDocumentationGenerator();

export { apiDocGenerator };

/**
 * Create endpoint documentation
 */
export function createEndpointDocumentation(config: {
  path: string;
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  summary: string;
  description: string;
  parameters?: any[];
  requestBody?: any;
  responses: any;
  tags: string[];
}): ApiEndpoint {
  return {
    path: config.path,
    method: config.method,
    summary: config.summary,
    description: config.description,
    parameters: config.parameters,
    requestBody: config.requestBody,
    responses: config.responses,
    tags: config.tags,
  };
}

/**
 * Add endpoint to documentation
 */
export function documentEndpoint(endpoint: ApiEndpoint): void {
  apiDocGenerator.addEndpoint(endpoint.path, endpoint.method, endpoint);
}

/**
 * Generate and export documentation
 */
export function generateDocumentation(format: 'json' | 'markdown' | 'typescript' = 'json'): string {
  return apiDocGenerator.export(format);
}

/**
 * Validate API documentation
 */
export function validateApiDocumentation(): {
  isValid: boolean;
  errors: string[];
} {
  return apiDocGenerator.validate();
}

/**
 * Common schema definitions
 */
export const commonSchemas = {
  User: {
    type: 'object',
    properties: {
      id: { type: 'string', format: 'uuid' },
      email: { type: 'string', format: 'email' },
      username: { type: 'string' },
      role: { type: 'string', enum: ['user', 'admin', 'moderator'] },
      createdAt: { type: 'string', format: 'date-time' },
      updatedAt: { type: 'string', format: 'date-time' },
    },
    required: ['id', 'email', 'username'],
  },

  Project: {
    type: 'object',
    properties: {
      id: { type: 'string', format: 'uuid' },
      title: { type: 'string' },
      description: { type: 'string' },
      slug: { type: 'string' },
      category: { type: 'string' },
      status: { type: 'string', enum: ['draft', 'published', 'archived'] },
      createdAt: { type: 'string', format: 'date-time' },
      updatedAt: { type: 'string', format: 'date-time' },
    },
    required: ['id', 'title', 'slug'],
  },

  Error: {
    type: 'object',
    properties: {
      code: { type: 'string' },
      message: { type: 'string' },
      details: { type: 'object' },
    },
    required: ['code', 'message'],
  },

  PaginatedResponse: {
    type: 'object',
    properties: {
      data: { type: 'array' },
      total: { type: 'number' },
      page: { type: 'number' },
      pageSize: { type: 'number' },
      totalPages: { type: 'number' },
    },
    required: ['data', 'total', 'page', 'pageSize'],
  },
};

/**
 * Register common schemas
 */
export function registerCommonSchemas(): void {
  Object.entries(commonSchemas).forEach(([name, schema]) => {
    apiDocGenerator.addSchema(name, schema);
  });
}
