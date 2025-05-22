import { jest } from '@jest/globals';
import { processText } from '../../src/index.js';
import { getInputText } from '../../src/io/input.js';
import { writeOutput } from '../../src/io/output.js';
import path from 'path';
import fs from 'fs/promises';

// Mock dependencies
jest.mock('../../src/io/input.js');
jest.mock('../../src/io/output.js');

describe('Message Module', () => {
  const tempDir = path.join(process.cwd(), 'temp_message_tests');
  let mockStdout, mockStderr, originalStdout, originalStderr;
  
  // Setup test environment
  beforeAll(async () => {
    await fs.mkdir(tempDir, { recursive: true });
  });

  afterAll(async () => {
    await fs.rm(tempDir, { recursive: true, force: true });
  });

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Mock stdout and stderr
    originalStdout = process.stdout.write;
    originalStderr = process.stderr.write;
    mockStdout = jest.fn();
    mockStderr = jest.fn();
    process.stdout.write = mockStdout;
    process.stderr.write = mockStderr;
    
    // Set up default mock implementation
    getInputText.mockResolvedValue('Sample input text for testing');
    writeOutput.mockResolvedValue(undefined);
  });

  afterEach(() => {
    // Restore stdout and stderr
    process.stdout.write = originalStdout;
    process.stderr.write = originalStderr;
  });

  // System message prepending
  describe('System message prepending', () => {
    test('should prepend system message to input text', async () => {
      const options = {
        input: 'test.txt',
        system: 'This is a system message',
      };
      
      await processText(options);
      
      // Check that writeOutput was called with the correct content
      expect(writeOutput).toHaveBeenCalled();
      const outputContent = writeOutput.mock.calls[0][0];
      expect(outputContent).toContain('SYSTEM: This is a system message');
      expect(outputContent).toContain('Sample input text for testing');
      // Check the order (system message should come first)
      expect(outputContent.indexOf('SYSTEM:')).toBeLessThan(outputContent.indexOf('Sample input text'));
    });
    
    test('should add proper spacing between system message and content', async () => {
      const options = {
        input: 'test.txt',
        system: 'System instruction',
      };
      
      await processText(options);
      
      const outputContent = writeOutput.mock.calls[0][0];
      expect(outputContent).toMatch(/SYSTEM: System instruction\n\nSample input text/);
    });
    
    test('should handle multi-line system message', async () => {
      const options = {
        input: 'test.txt',
        system: 'Line 1 of system message\nLine 2 of system message',
      };
      
      await processText(options);
      
      const outputContent = writeOutput.mock.calls[0][0];
      expect(outputContent).toContain('SYSTEM: Line 1 of system message\nLine 2 of system message');
      expect(outputContent).toContain('Sample input text for testing');
    });
    
    test('should handle system message with special characters', async () => {
      const options = {
        input: 'test.txt',
        system: 'System message with * and # and `code`',
      };
      
      await processText(options);
      
      const outputContent = writeOutput.mock.calls[0][0];
      expect(outputContent).toContain('SYSTEM: System message with * and # and `code`');
    });
  });

  // User message appending
  describe('User message appending', () => {
    test('should append user message to input text', async () => {
      const options = {
        input: 'test.txt',
        user: 'This is a user message',
      };
      
      await processText(options);
      
      // Check that writeOutput was called with the correct content
      expect(writeOutput).toHaveBeenCalled();
      const outputContent = writeOutput.mock.calls[0][0];
      expect(outputContent).toContain('Sample input text for testing');
      expect(outputContent).toContain('USER: This is a user message');
      // Check the order (user message should come last)
      expect(outputContent.indexOf('Sample input text')).toBeLessThan(outputContent.indexOf('USER:'));
    });
    
    test('should add proper spacing between content and user message', async () => {
      const options = {
        input: 'test.txt',
        user: 'User question',
      };
      
      await processText(options);
      
      const outputContent = writeOutput.mock.calls[0][0];
      expect(outputContent).toMatch(/Sample input text for testing\n\nUSER: User question/);
    });
    
    test('should handle multi-line user message', async () => {
      const options = {
        input: 'test.txt',
        user: 'Line 1 of user message\nLine 2 of user message',
      };
      
      await processText(options);
      
      const outputContent = writeOutput.mock.calls[0][0];
      expect(outputContent).toContain('USER: Line 1 of user message\nLine 2 of user message');
    });
    
    test('should handle user message with special characters', async () => {
      const options = {
        input: 'test.txt',
        user: 'User message with * and # and `code`',
      };
      
      await processText(options);
      
      const outputContent = writeOutput.mock.calls[0][0];
      expect(outputContent).toContain('USER: User message with * and # and `code`');
    });
  });

  // Combined message handling
  describe('Combined message handling', () => {
    test('should handle both system and user messages', async () => {
      const options = {
        input: 'test.txt',
        system: 'System instructions',
        user: 'User question',
      };
      
      await processText(options);
      
      const outputContent = writeOutput.mock.calls[0][0];
      expect(outputContent).toContain('SYSTEM: System instructions');
      expect(outputContent).toContain('Sample input text for testing');
      expect(outputContent).toContain('USER: User question');
      
      // Check the correct order: system -> content -> user
      const systemIndex = outputContent.indexOf('SYSTEM:');
      const contentIndex = outputContent.indexOf('Sample input text');
      const userIndex = outputContent.indexOf('USER:');
      
      expect(systemIndex).toBeLessThan(contentIndex);
      expect(contentIndex).toBeLessThan(userIndex);
    });
    
    test('should maintain proper spacing between all components', async () => {
      const options = {
        input: 'test.txt',
        system: 'System message',
        user: 'User message',
      };
      
      await processText(options);
      
      const outputContent = writeOutput.mock.calls[0][0];
      expect(outputContent).toMatch(/SYSTEM: System message\n\nSample input text for testing\n\nUSER: User message/);
    });
    
    test('should work with empty input text', async () => {
      getInputText.mockResolvedValueOnce('');
      
      const options = {
        input: 'empty.txt',
        system: 'System message',
        user: 'User message',
      };
      
      await processText(options);
      
      const outputContent = writeOutput.mock.calls[0][0];
      expect(outputContent).toMatch(/SYSTEM: System message\n\n\n\nUSER: User message/);
    });
  });

  // Integration with other options
  describe('Integration with other options', () => {
    test('should work with format conversion', async () => {
      const options = {
        input: 'test.md',
        format: 'text',
        system: 'System message',
        user: 'User message',
      };
      
      await processText(options);
      
      // The important part is that both messages are present after format conversion
      const outputContent = writeOutput.mock.calls[0][0];
      expect(outputContent).toContain('SYSTEM: System message');
      expect(outputContent).toContain('USER: User message');
    });
    
    test('should work with truncation', async () => {
      const options = {
        input: 'test.txt',
        maxTokens: 100,
        truncate: 'end',
        system: 'System message',
        user: 'User message',
      };
      
      await processText(options);
      
      // Messages should be present in the truncated output
      const outputContent = writeOutput.mock.calls[0][0];
      expect(outputContent).toContain('SYSTEM: System message');
      expect(outputContent).toContain('USER: User message');
    });
    
    test('should work with compression', async () => {
      const options = {
        input: 'test.txt',
        compress: true,
        system: 'System message',
        user: 'User message',
      };
      
      await processText(options);
      
      // Messages should be present in the compressed output
      const outputContent = writeOutput.mock.calls[0][0];
      expect(outputContent).toContain('SYSTEM: System message');
      expect(outputContent).toContain('USER: User message');
    });
    
    test('should work with prompt templates', async () => {
      // Create a simple template file
      const templatePath = path.join(tempDir, 'template.txt');
      await fs.writeFile(templatePath, 'Template with {{text}}', 'utf8');
      
      const options = {
        input: 'test.txt',
        prompt: templatePath,
        system: 'System message',
        user: 'User message',
      };
      
      await processText(options);
      
      // Messages should be applied after the template
      const outputContent = writeOutput.mock.calls[0][0];
      expect(outputContent).toContain('SYSTEM: System message');
      // The template would transform the content
      expect(outputContent).toContain('Template with Sample input text for testing');
      expect(outputContent).toContain('USER: User message');
    });
  });

  // Edge cases
  describe('Edge cases', () => {
    test('should handle empty system message', async () => {
      const options = {
        input: 'test.txt',
        system: '',
      };
      
      await processText(options);
      
      const outputContent = writeOutput.mock.calls[0][0];
      expect(outputContent).toContain('SYSTEM: ');
      expect(outputContent).toContain('Sample input text for testing');
    });
    
    test('should handle empty user message', async () => {
      const options = {
        input: 'test.txt',
        user: '',
      };
      
      await processText(options);
      
      const outputContent = writeOutput.mock.calls[0][0];
      expect(outputContent).toContain('Sample input text for testing');
      expect(outputContent).toContain('USER: ');
    });
    
    test('should handle very long system/user messages', async () => {
      const longText = 'A'.repeat(5000);
      
      const options = {
        input: 'test.txt',
        system: longText,
        user: longText,
      };
      
      await processText(options);
      
      const outputContent = writeOutput.mock.calls[0][0];
      expect(outputContent).toContain(`SYSTEM: ${longText}`);
      expect(outputContent).toContain(`USER: ${longText}`);
    });
    
    test('should handle system/user messages with newlines at end', async () => {
      const options = {
        input: 'test.txt',
        system: 'System message\n\n',
        user: 'User message\n\n',
      };
      
      await processText(options);
      
      const outputContent = writeOutput.mock.calls[0][0];
      expect(outputContent).toMatch(/SYSTEM: System message\n\n\n\nSample input text/);
      expect(outputContent).toMatch(/Sample input text for testing\n\nUSER: User message\n\n/);
    });
    
    test('should handle system/user messages with HTML-like content', async () => {
      const options = {
        input: 'test.txt',
        system: '<div>System message</div>',
        user: '<p>User message</p>',
      };
      
      await processText(options);
      
      const outputContent = writeOutput.mock.calls[0][0];
      expect(outputContent).toContain('SYSTEM: <div>System message</div>');
      expect(outputContent).toContain('USER: <p>User message</p>');
    });
  });
  
  // Debug mode tests
  describe('Debug mode', () => {
    test('should log debug information for system/user messages', async () => {
      const options = {
        input: 'test.txt',
        system: 'System message',
        user: 'User message',
        debug: true,
      };
      
      await processText(options);
      
      // Check debug output to stderr
      const stderrOutput = mockStderr.mock.calls.map(args => args[0]).join('');
      expect(stderrOutput).toContain('Debug:');
      expect(stderrOutput).toContain('Retrieved input text');
    });
  });
});