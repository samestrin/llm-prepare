import { jest } from '@jest/globals';
import { applyPromptTemplate, createPromptTemplate, listPromptTemplates } from '../../src/processors/prompt-template.js';
import fs from 'fs/promises';
import path from 'path';

describe('Prompt Template Module', () => {
  const tempDir = path.join(process.cwd(), 'temp_prompt_tests');
  let templatePath, templateContent, sampleTemplateDir;
  
  // Setup and teardown
  beforeAll(async () => {
    await fs.mkdir(tempDir, { recursive: true });
    sampleTemplateDir = path.join(tempDir, 'templates');
    await fs.mkdir(sampleTemplateDir, { recursive: true });
  });

  afterAll(async () => {
    await fs.rm(tempDir, { recursive: true, force: true });
  });

  beforeEach(() => {
    templatePath = path.join(tempDir, 'test-template.txt');
    templateContent = 'This is a template with {{text}} and another variable {{name}}';
    jest.clearAllMocks();
  });

  // Basic template usage
  describe('Basic template usage', () => {
    test('should apply template with text substitution only', async () => {
      // Create a template file
      await fs.writeFile(templatePath, 'Template with content: {{text}}', 'utf8');
      
      const inputText = 'This is the input text';
      const result = await applyPromptTemplate(inputText, templatePath);
      
      expect(result).toBe('Template with content: This is the input text');
    });
    
    test('should use content as an alias for text', async () => {
      // Create a template file
      await fs.writeFile(templatePath, 'Template with content: {{content}}', 'utf8');
      
      const inputText = 'This is the input text';
      const result = await applyPromptTemplate(inputText, templatePath);
      
      expect(result).toBe('Template with content: This is the input text');
    });
    
    test('should handle multi-line templates', async () => {
      const multilineTemplate = `# Prompt Template
      
This is the first paragraph with {{text}}

This is the second paragraph.`;
      await fs.writeFile(templatePath, multilineTemplate, 'utf8');
      
      const inputText = 'inserted content';
      const result = await applyPromptTemplate(inputText, templatePath);
      
      expect(result).toContain('# Prompt Template');
      expect(result).toContain('first paragraph with inserted content');
      expect(result).toContain('second paragraph');
    });
    
    test('should handle templates with special characters', async () => {
      const specialTemplate = `Template with special characters: 
* Item 1 - {{text}}
* Item 2 - Another item
\`\`\`code
function test() {
  return "{{text}}";
}
\`\`\``;
      await fs.writeFile(templatePath, specialTemplate, 'utf8');
      
      const inputText = 'test content';
      const result = await applyPromptTemplate(inputText, templatePath);
      
      expect(result).toContain('* Item 1 - test content');
      expect(result).toContain('return "test content";');
    });
  });

  // Variable substitution
  describe('Variable substitution', () => {
    test('should substitute multiple variables correctly', async () => {
      await fs.writeFile(templatePath, templateContent, 'utf8');
      
      const inputText = 'sample text';
      const variables = { name: 'Test User' };
      const result = await applyPromptTemplate(inputText, templatePath, variables);
      
      expect(result).toBe('This is a template with sample text and another variable Test User');
    });
    
    test('should handle whitespace in variable placeholders', async () => {
      const template = 'Template with {{ text }} and {{ name  }}';
      await fs.writeFile(templatePath, template, 'utf8');
      
      const inputText = 'test content';
      const variables = { name: 'John Doe' };
      const result = await applyPromptTemplate(inputText, templatePath, variables);
      
      expect(result).toBe('Template with test content and John Doe');
    });
    
    test('should remove undefined variables', async () => {
      const template = 'Template with {{text}} and {{undefinedVar}}';
      await fs.writeFile(templatePath, template, 'utf8');
      
      const inputText = 'test content';
      const result = await applyPromptTemplate(inputText, templatePath);
      
      expect(result).toBe('Template with test content and ');
    });
    
    test('should handle variables with special characters', async () => {
      const template = 'Template with {{text}} and {{specialVar}}';
      await fs.writeFile(templatePath, template, 'utf8');
      
      const inputText = 'test content';
      const variables = { specialVar: '<div>HTML & "Quotes"</div>' };
      const result = await applyPromptTemplate(inputText, templatePath, variables);
      
      expect(result).toBe('Template with test content and <div>HTML & "Quotes"</div>');
    });
    
    test('should handle empty variables', async () => {
      const template = 'Template with {{text}} and {{emptyVar}}';
      await fs.writeFile(templatePath, template, 'utf8');
      
      const inputText = 'test content';
      const variables = { emptyVar: '' };
      const result = await applyPromptTemplate(inputText, templatePath, variables);
      
      expect(result).toBe('Template with test content and ');
    });

    test('should handle JSON variables parsed from string', async () => {
      const template = 'Template with {{text}} and {{name}}, {{age}} years old';
      await fs.writeFile(templatePath, template, 'utf8');
      
      const inputText = 'test content';
      const variablesJson = '{"name": "John Doe", "age": 30}';
      const variables = JSON.parse(variablesJson);
      const result = await applyPromptTemplate(inputText, templatePath, variables);
      
      expect(result).toBe('Template with test content and John Doe, 30 years old');
    });
  });

  // Template management
  describe('Template management', () => {
    test('should create a new template file', async () => {
      const newTemplatePath = path.join(tempDir, 'new-template.txt');
      const newContent = 'New template with {{text}}';
      
      await createPromptTemplate(newTemplatePath, newContent);
      
      const fileContent = await fs.readFile(newTemplatePath, 'utf8');
      expect(fileContent).toBe(newContent);
    });
    
    test('should create a template file in nested directories', async () => {
      const nestedPath = path.join(tempDir, 'nested', 'subdirectory', 'template.txt');
      const content = 'Nested template content with {{text}}';
      
      await createPromptTemplate(nestedPath, content);
      
      const fileContent = await fs.readFile(nestedPath, 'utf8');
      expect(fileContent).toBe(content);
      // Verify directory was created
      const dirStats = await fs.stat(path.dirname(nestedPath));
      expect(dirStats.isDirectory()).toBe(true);
    });
    
    test('should list available templates in a directory', async () => {
      // Create sample templates
      await fs.writeFile(path.join(sampleTemplateDir, 'template1.txt'), 'Template 1', 'utf8');
      await fs.writeFile(path.join(sampleTemplateDir, 'template2.md'), 'Template 2', 'utf8');
      await fs.writeFile(path.join(sampleTemplateDir, 'template3.template'), 'Template 3', 'utf8');
      // Create a non-template file
      await fs.writeFile(path.join(sampleTemplateDir, 'not-a-template.js'), 'console.log("not a template");', 'utf8');
      
      const templates = await listPromptTemplates(sampleTemplateDir);
      
      expect(templates).toContain('template1.txt');
      expect(templates).toContain('template2.md');
      expect(templates).toContain('template3.template');
      expect(templates).not.toContain('not-a-template.js');
    });
    
    test('should return empty array when template directory does not exist', async () => {
      const nonExistentDir = path.join(tempDir, 'non-existent');
      
      const templates = await listPromptTemplates(nonExistentDir);
      
      expect(templates).toEqual([]);
    });
  });

  // Edge cases
  describe('Edge cases', () => {
    test('should throw error when template file does not exist', async () => {
      const nonExistentPath = path.join(tempDir, 'non-existent-template.txt');
      const inputText = 'test content';
      
      await expect(applyPromptTemplate(inputText, nonExistentPath))
        .rejects.toThrow('Failed to read template file');
    });
    
    test('should throw error when creating template in invalid location', async () => {
      // Test with a location that should cause an error (e.g., root directory on Unix systems)
      const invalidPath = process.platform === 'win32' 
        ? 'C:\\Windows\\System32\\restricted-template.txt'
        : '/root/restricted-template.txt';
      
      await expect(createPromptTemplate(invalidPath, 'content'))
        .rejects.toThrow('Failed to create template file');
    });
    
    test('should handle template with no variables', async () => {
      const plainTemplate = 'This is a template with no variables';
      await fs.writeFile(templatePath, plainTemplate, 'utf8');
      
      const inputText = 'ignored text';
      const result = await applyPromptTemplate(inputText, templatePath);
      
      expect(result).toBe(plainTemplate);
    });
    
    test('should handle empty template file', async () => {
      await fs.writeFile(templatePath, '', 'utf8');
      
      const inputText = 'test content';
      const result = await applyPromptTemplate(inputText, templatePath);
      
      expect(result).toBe('');
    });
    
    test('should handle very large input text', async () => {
      await fs.writeFile(templatePath, 'Large content: {{text}}', 'utf8');
      
      // Create a large string (around 1MB)
      const largeText = 'x'.repeat(1000000);
      const result = await applyPromptTemplate(largeText, templatePath);
      
      expect(result.length).toBeGreaterThan(1000000);
      expect(result).toContain('Large content:');
    });
    
    test('should handle empty input text', async () => {
      await fs.writeFile(templatePath, 'Empty content: {{text}}', 'utf8');
      
      const emptyText = '';
      const result = await applyPromptTemplate(emptyText, templatePath);
      
      expect(result).toBe('Empty content: ');
    });
    
    test('should handle null or undefined input text', async () => {
      await fs.writeFile(templatePath, 'Null content: {{text}}', 'utf8');
      
      // @ts-ignore - Testing incorrect usage
      const result = await applyPromptTemplate(null, templatePath);
      
      expect(result).toBe('Null content: ');
    });
    
    test('should handle invalid JSON for variables', async () => {
      await fs.writeFile(templatePath, 'Template with {{name}}', 'utf8');
      
      // This would be a simulation of what happens when the CLI tries to parse invalid JSON
      const parseInvalidJson = () => {
        try {
          return JSON.parse('{"name": "John", invalid json}');
        } catch (error) {
          // Return empty object as fallback
          return {};
        }
      };
      
      const variables = parseInvalidJson();
      const result = await applyPromptTemplate('ignored', templatePath, variables);
      
      // Should not have the variable replaced since parsing failed
      expect(result).toBe('Template with ');
    });
  });
  
  // Nested variables
  describe('Nested variables and complex templates', () => {
    test('should handle nested templates (variables containing other variables)', async () => {
      const template = 'Template with {{text}} and {{templateVar}}';
      await fs.writeFile(templatePath, template, 'utf8');
      
      const inputText = 'primary content';
      const variables = { 
        templateVar: 'This contains {{nestedVar}}',
        nestedVar: 'nested content'
      };
      
      // Note: The implementation doesn't support nested variable resolution
      // This test verifies the current behavior (no nested resolution)
      const result = await applyPromptTemplate(inputText, templatePath, variables);
      
      // The outer variables are replaced, but not the nested ones
      expect(result).toBe('Template with primary content and This contains {{nestedVar}}');
    });
    
    test('should handle complex templates with multiple occurrences of variables', async () => {
      const complexTemplate = `
# Template with repeated variables

First occurrence: {{text}}
Second occurrence: {{text}}
Third: {{text}}

Variables:
- Name: {{name}}
- Name again: {{name}}
- Empty: {{empty}}
      `;
      
      await fs.writeFile(templatePath, complexTemplate, 'utf8');
      
      const inputText = 'repeated content';
      const variables = { 
        name: 'Test User',
        empty: ''
      };
      
      const result = await applyPromptTemplate(inputText, templatePath, variables);
      
      expect(result).toContain('First occurrence: repeated content');
      expect(result).toContain('Second occurrence: repeated content');
      expect(result).toContain('Third: repeated content');
      expect(result).toContain('Name: Test User');
      expect(result).toContain('Name again: Test User');
      expect(result).toContain('Empty: ');
    });
  });
});