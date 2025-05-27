/**
 * Integration tests for prompt templates with compression functionality
 * 
 * Tests that verify prompt templates and text compression work together correctly
 */

import { jest } from '@jest/globals';
import { compressText, compressTextAggressive } from '../../src/processors/compress.js';
import { applyPromptTemplate } from '../../src/processors/prompt-template.js';
import fs from 'fs/promises';
import path from 'path';
import { processText } from '../../src/index.js';

// Setup test directory and files
const testDir = path.join(process.cwd(), 'temp_prompt_compression_tests');
const templateDir = path.join(testDir, 'templates');
const inputDir = path.join(testDir, 'input');
const outputDir = path.join(testDir, 'output');

describe('Prompt Template with Compression Integration', () => {
  // Setup and teardown for test files
  beforeAll(async () => {
    // Create test directories
    await fs.mkdir(testDir, { recursive: true });
    await fs.mkdir(templateDir, { recursive: true });
    await fs.mkdir(inputDir, { recursive: true });
    await fs.mkdir(outputDir, { recursive: true });
    
    // Create test template files
    await fs.writeFile(
      path.join(templateDir, 'simple.txt'),
      'SYSTEM: Process the following text\n\nUSER: {{text}}\n\nASSISTANT:'
    );
    
    await fs.writeFile(
      path.join(templateDir, 'complex.txt'),
      'SYSTEM: You are a helpful assistant that summarizes code.\n\n' +
      'USER: Please summarize this {{language}} code:\n\n```{{language}}\n{{text}}\n```\n\n' +
      'ASSISTANT:'
    );
    
    // Create test input files with excessive whitespace
    await fs.writeFile(
      path.join(inputDir, 'simple.txt'),
      'This is a test document.\n\n\n\n' +
      'It has   multiple    spaces    and     excessive      newlines.\n\n\n\n\n' +
      'We will use it for testing    compression     with    templates.'
    );
    
    await fs.writeFile(
      path.join(inputDir, 'code.js'),
      '/**\n * Example JavaScript function\n */\n\n\n' +
      'function    testFunction(param1,     param2)    {\n' +
      '    // This is a comment with    extra   spaces\n' +
      '    const   result    =    param1    +    param2;\n\n\n' +
      '    return     result;\n' +
      '}\n\n\n\n' +
      'console.log(    testFunction(1,    2)   );'
    );
  });
  
  afterAll(async () => {
    await fs.rm(testDir, { recursive: true, force: true });
  });
  
  beforeEach(() => {
    jest.clearAllMocks();
  });
  
  // Direct function tests
  describe('Direct function integration', () => {
    test('should correctly compress text before applying template', async () => {
      // Read test files
      const inputText = await fs.readFile(path.join(inputDir, 'simple.txt'), 'utf8');
      const templatePath = path.join(templateDir, 'simple.txt');
      
      // First compress the text
      const compressedText = compressText(inputText);
      
      // Then apply the template to the compressed text
      const result = await applyPromptTemplate(compressedText, templatePath);
      
      // Verify compression worked
      expect(compressedText).not.toContain('\n\n\n');
      expect(compressedText).not.toContain('    '); // Multiple spaces
      
      // Verify template was applied correctly
      expect(result).toContain('SYSTEM: Process the following text');
      expect(result).toContain('USER:');
      expect(result).toContain('This is a test document.');
      expect(result).toContain('ASSISTANT:');
      
      // Verify compressed content is in the template
      expect(result).not.toContain('\n\n\n\n');
      expect(result).not.toContain('multiple    spaces');
    });
    
    test('should handle code formatting in templates with compressed text', async () => {
      // Read code file
      const codeText = await fs.readFile(path.join(inputDir, 'code.js'), 'utf8');
      const templatePath = path.join(templateDir, 'complex.txt');
      
      // First compress the code
      const compressedCode = compressText(codeText);
      
      // Then apply the template with variables
      const result = await applyPromptTemplate(compressedCode, templatePath, {
        language: 'javascript'
      });
      
      // Verify compression worked
      expect(compressedCode).not.toContain('\n\n\n');
      expect(compressedCode).not.toContain('    =    '); // Multiple spaces around operators
      
      // Verify template was applied correctly with variables
      expect(result).toContain('SYSTEM: You are a helpful assistant');
      expect(result).toContain('USER: Please summarize this javascript code:');
      expect(result).toContain('```javascript');
      expect(result).toContain('function testFunction');
      expect(result).toContain('ASSISTANT:');
      
      // Verify compressed content is in the template
      expect(result).not.toContain('function    testFunction');
      expect(result).not.toContain('const   result    =    param1');
    });
    
    test('should apply aggressive compression before template', async () => {
      // Read test file
      const inputText = await fs.readFile(path.join(inputDir, 'simple.txt'), 'utf8');
      const templatePath = path.join(templateDir, 'simple.txt');
      
      // Apply aggressive compression
      const compressedText = compressTextAggressive(inputText);
      
      // Then apply the template
      const result = await applyPromptTemplate(compressedText, templatePath);
      
      // Verify aggressive compression worked (all newlines collapsed)
      expect(compressedText).not.toContain('\n\n');
      expect(compressedText).not.toContain('   ');
      
      // Check that sentences are separated by newlines in aggressive mode
      expect(compressedText).toContain('document.\nIt has');
      
      // Verify template was applied correctly
      expect(result).toContain('SYSTEM: Process the following text');
      expect(result).toContain('USER:');
      expect(result).toContain('This is a test document.');
      expect(result).toContain('ASSISTANT:');
    });
  });
  
  // CLI process integration tests
  describe('processText integration', () => {
    // Standard mocking pattern for stdout/stderr to capture output
    let stdoutMock, stderrMock;
    
    beforeEach(() => {
      // Mock stdout and stderr
      stdoutMock = jest.spyOn(process.stdout, 'write').mockImplementation(() => true);
      stderrMock = jest.spyOn(process.stderr, 'write').mockImplementation(() => true);
    });
    
    afterEach(() => {
      // Restore stdout and stderr
      stdoutMock.mockRestore();
      stderrMock.mockRestore();
    });
    
    test('should process input with both prompt template and compression', async () => {
      const outputFile = path.join(outputDir, 'compressed-template-output.txt');
      
      // Call processText with both template and compression options
      await processText({
        input: path.join(inputDir, 'simple.txt'),
        output: outputFile,
        prompt: path.join(templateDir, 'simple.txt'),
        compress: true
      });
      
      // Read the output file
      const outputContent = await fs.readFile(outputFile, 'utf8');
      
      // Verify compression and template were both applied
      expect(outputContent).toContain('SYSTEM: Process the following text');
      expect(outputContent).toContain('USER:');
      expect(outputContent).toContain('This is a test document.');
      expect(outputContent).toContain('ASSISTANT:');
      
      // Verify compression worked
      expect(outputContent).not.toContain('multiple    spaces');
      expect(outputContent).not.toContain('\n\n\n');
    });
    
    test('should handle code with template and compression via CLI', async () => {
      const outputFile = path.join(outputDir, 'compressed-code-template.txt');
      
      // Call processText with code file, template, variables and compression
      await processText({
        input: path.join(inputDir, 'code.js'),
        output: outputFile,
        prompt: path.join(templateDir, 'complex.txt'),
        variables: JSON.stringify({ language: 'javascript' }),
        compress: true
      });
      
      // Read the output file
      const outputContent = await fs.readFile(outputFile, 'utf8');
      
      // Verify template with variables was applied
      expect(outputContent).toContain('SYSTEM: You are a helpful assistant');
      expect(outputContent).toContain('USER: Please summarize this javascript code:');
      expect(outputContent).toContain('```javascript');
      expect(outputContent).toContain('function testFunction');
      
      // Verify compression worked
      expect(outputContent).not.toContain('function    testFunction');
      expect(outputContent).not.toContain('const   result    =    param1');
    });
    
    test('should output to stdout when no output file is specified', async () => {
      // Call processText with prompt and compression but no output file
      await processText({
        input: path.join(inputDir, 'simple.txt'),
        prompt: path.join(templateDir, 'simple.txt'),
        compress: true
      });
      
      // Get stdout content
      const stdoutContent = stdoutMock.mock.calls
        .map(args => args[0])
        .join('');
      
      // Verify compression and template were both applied
      expect(stdoutContent).toContain('SYSTEM: Process the following text');
      expect(stdoutContent).toContain('USER:');
      expect(stdoutContent).toContain('This is a test document.');
      expect(stdoutContent).not.toContain('multiple    spaces');
    });
    
    test('should debug output compression and template information when debug is enabled', async () => {
      // Call processText with prompt, compression and debug enabled
      await processText({
        input: path.join(inputDir, 'simple.txt'),
        prompt: path.join(templateDir, 'simple.txt'),
        compress: true,
        debug: true
      });
      
      // Get stderr content where debug messages are sent
      const stderrContent = stderrMock.mock.calls
        .map(args => args[0])
        .join('');
      
      // Verify debug messages
      expect(stderrContent).toContain('Debug: Processing with options');
      expect(stderrContent).toContain('compress');
      expect(stderrContent).toContain('prompt');
    });
  });
  
  // Edge cases and error handling
  describe('Edge cases and error handling', () => {
    test('should handle empty input with template and compression', async () => {
      // Create empty input file
      const emptyFilePath = path.join(inputDir, 'empty.txt');
      await fs.writeFile(emptyFilePath, '');
      
      const templatePath = path.join(templateDir, 'simple.txt');
      
      // Process empty input
      const outputFile = path.join(outputDir, 'empty-result.txt');
      await processText({
        input: emptyFilePath,
        output: outputFile,
        prompt: templatePath,
        compress: true
      });
      
      // Read the output
      const outputContent = await fs.readFile(outputFile, 'utf8');
      
      // Verify template was applied to empty content
      expect(outputContent).toContain('SYSTEM: Process the following text');
      expect(outputContent).toContain('USER:');
      expect(outputContent).toContain('ASSISTANT:');
    });
    
    test('should handle non-existent template file gracefully', async () => {
      const nonExistentTemplate = path.join(templateDir, 'does-not-exist.txt');
      const outputFile = path.join(outputDir, 'error-output.txt');
      
      // Mock console.error to capture error messages
      const consoleErrorMock = jest.spyOn(console, 'error').mockImplementation(() => {});
      
      // Process with non-existent template
      await processText({
        input: path.join(inputDir, 'simple.txt'),
        output: outputFile,
        prompt: nonExistentTemplate,
        compress: true
      });
      
      // Verify error was logged
      expect(consoleErrorMock).toHaveBeenCalled();
      expect(consoleErrorMock.mock.calls[0][0]).toContain('Error applying prompt template');
      
      // Clean up mock
      consoleErrorMock.mockRestore();
    });
    
    test('should handle invalid JSON variables with compression', async () => {
      const outputFile = path.join(outputDir, 'invalid-vars-output.txt');
      
      // Mock console.error to capture error messages
      const consoleErrorMock = jest.spyOn(console, 'error').mockImplementation(() => {});
      
      // Process with invalid JSON variables
      await processText({
        input: path.join(inputDir, 'code.js'),
        output: outputFile,
        prompt: path.join(templateDir, 'complex.txt'),
        variables: '{invalid:json}', // Invalid JSON
        compress: true
      });
      
      // Verify error was logged
      expect(consoleErrorMock).toHaveBeenCalled();
      
      // Clean up mock
      consoleErrorMock.mockRestore();
      
      // Check that processing continued with compression despite template error
      const outputContent = await fs.readFile(outputFile, 'utf8');
      expect(outputContent).not.toContain('function    testFunction');
    });
  });
});