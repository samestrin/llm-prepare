import { jest } from '@jest/globals';
import { compressText, compressTextAggressive } from '../../src/processors/compress.js';
import { processText } from '../../src/index.js';
import { getInputText } from '../../src/io/input.js';
import { writeOutput } from '../../src/io/output.js';
import fs from 'fs/promises';
import path from 'path';

// Mock dependencies
jest.mock('../../src/io/input.js');
jest.mock('../../src/io/output.js');

describe('Compression Module', () => {
  // Setup test environment
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Default mock implementations
    getInputText.mockResolvedValue('Sample input text for testing');
    writeOutput.mockResolvedValue(undefined);
  });

  // Basic compression
  describe('Basic compression', () => {
    test('should reduce multiple newlines to a maximum of two', () => {
      const text = 'Line 1\n\n\n\nLine 2\n\n\n\n\nLine 3';
      const result = compressText(text);
      
      expect(result).toBe('Line 1\n\nLine 2\n\nLine 3');
    });
    
    test('should remove trailing whitespace on each line', () => {
      const text = 'Line 1   \nLine 2\t\t\nLine 3  \t  ';
      const result = compressText(text);
      
      expect(result).toBe('Line 1\nLine 2\nLine 3');
    });
    
    test('should collapse multiple spaces within lines', () => {
      const text = 'This  has    multiple     spaces';
      const result = compressText(text);
      
      expect(result).toBe('This has multiple spaces');
    });
    
    test('should preserve a single space after punctuation', () => {
      const text = 'Hello, world. This is a test.';
      const result = compressText(text);
      
      expect(result).toBe('Hello, world. This is a test.');
    });
    
    test('should normalize CRLF line endings to LF', () => {
      const text = 'Line 1\r\nLine 2\r\nLine 3';
      const result = compressText(text);
      
      expect(result).toBe('Line 1\nLine 2\nLine 3');
      expect(result).not.toContain('\r');
    });
    
    test('should not modify already minimal whitespace', () => {
      const text = 'Already\nMinimal\nWhitespace';
      const result = compressText(text);
      
      expect(result).toBe(text);
    });
  });

  // Whitespace handling
  describe('Whitespace handling', () => {
    test('should preserve indentation at the start of lines', () => {
      const text = '  Indented line 1\n    Indented line 2\n      Indented line 3';
      const result = compressText(text);
      
      expect(result).toBe('  Indented line 1\n    Indented line 2\n      Indented line 3');
    });
    
    test('should normalize indentation with tabs', () => {
      const text = '\tTabbed line\n\t\tDouble tabbed\n\t\t\tTriple tabbed';
      const result = compressText(text);
      
      // Tabs should be preserved or converted to spaces based on implementation
      expect(result).toContain('Tabbed line');
      expect(result).toContain('Double tabbed');
      expect(result).toContain('Triple tabbed');
    });
    
    test('should reduce excessive indentation', () => {
      // Create a line with 30 spaces of indentation
      const text = ' '.repeat(30) + 'Excessive indentation';
      const result = compressText(text);
      
      // Should be reduced to a more reasonable indentation
      expect(result.length).toBeLessThan(text.length);
      expect(result.trim()).toBe('Excessive indentation');
    });
    
    test('should handle mixed tabs and spaces in indentation', () => {
      const text = ' \t Mixed\t  indentation';
      const result = compressText(text);
      
      // Should normalize the mixed indentation
      expect(result).toContain('Mixed');
      expect(result).toContain('indentation');
    });
  });

  // Aggressive compression
  describe('Aggressive compression', () => {
    test('should collapse all whitespace sequences to a single space', () => {
      const text = 'Line 1\n\nLine 2\t\tWith tabs  and spaces\n\n\nLine 3';
      const result = compressTextAggressive(text);
      
      // All whitespace should be normalized to single spaces
      expect(result).not.toContain('\n');
      expect(result).not.toContain('\t');
      expect(result).not.toMatch(/\s{2,}/);
    });
    
    test('should add newlines after sentence-ending punctuation', () => {
      const text = 'Sentence one. Sentence two! Sentence three? Sentence four.';
      const result = compressTextAggressive(text);
      
      // Should add newlines after periods, exclamation points, and question marks
      expect(result).toContain('Sentence one.\nSentence two!\nSentence three?\nSentence four.');
    });
    
    test('should remove leading and trailing whitespace', () => {
      const text = '  \n\t Starting and ending with whitespace \n  ';
      const result = compressTextAggressive(text);
      
      // Should trim the text
      expect(result.charAt(0)).not.toBe(' ');
      expect(result.charAt(0)).not.toBe('\n');
      expect(result.charAt(0)).not.toBe('\t');
      expect(result.charAt(result.length - 1)).not.toBe(' ');
      expect(result.charAt(result.length - 1)).not.toBe('\n');
    });
    
    test('should significantly reduce the size of the text', () => {
      const text = `
        This is a multi-line text
        with various types of whitespace.
        
        It has empty lines,
          indentation,
            and other spacing   that   should be    compressed.
      `;
      
      const result = compressTextAggressive(text);
      const compressionRatio = result.length / text.length;
      
      // Should achieve at least a 30% reduction in size
      expect(compressionRatio).toBeLessThan(0.7);
    });
  });

  // Edge cases
  describe('Edge cases', () => {
    test('should handle empty input gracefully', () => {
      expect(compressText('')).toBe('');
      expect(compressTextAggressive('')).toBe('');
    });
    
    test('should handle null or undefined input', () => {
      expect(compressText(null)).toBe(null);
      expect(compressText(undefined)).toBe(undefined);
      expect(compressTextAggressive(null)).toBe(null);
      expect(compressTextAggressive(undefined)).toBe(undefined);
    });
    
    test('should handle input with only whitespace', () => {
      const text = '   \n\n\t\t  \n  ';
      
      expect(compressText(text)).toBe('');
      expect(compressTextAggressive(text)).toBe('');
    });
    
    test('should handle very large input text', () => {
      // Create a large string (around 100KB)
      const repeatedText = 'This is a test line with some whitespace   and\n\n\nmultiple newlines.\n'.repeat(1000);
      
      // Should not throw errors for large inputs
      expect(() => compressText(repeatedText)).not.toThrow();
      expect(() => compressTextAggressive(repeatedText)).not.toThrow();
      
      // Compressed text should be smaller
      const compressed = compressText(repeatedText);
      expect(compressed.length).toBeLessThan(repeatedText.length);
      
      const compressedAggressive = compressTextAggressive(repeatedText);
      expect(compressedAggressive.length).toBeLessThan(repeatedText.length);
    });
    
    test('should handle special characters', () => {
      const text = 'Text with special characters: é, ñ, 漢字, емайл, etc.';
      
      // Should preserve special characters
      const compressed = compressText(text);
      expect(compressed).toContain('é');
      expect(compressed).toContain('ñ');
      expect(compressed).toContain('漢字');
      expect(compressed).toContain('емайл');
    });
  });

  // Code formatting preservation
  describe('Code formatting preservation', () => {
    test('should maintain reasonable code formatting', () => {
      const code = `function example() {
  // This is a comment
  const x = 1;
    
  if (x > 0) {
    console.log("Positive");
  } else {
    console.log("Non-positive");
  }
    
  return x;
}`;
      
      const result = compressText(code);
      
      // Should preserve important code formatting
      expect(result).toContain('function example()');
      expect(result).toContain('// This is a comment');
      expect(result).toMatch(/if \(x > 0\) \{/);
      expect(result).toMatch(/return x;/);
    });
    
    test('should maintain code block indentation pattern', () => {
      const code = `if (condition) {
  statement1;
  statement2;
  if (nestedCondition) {
    nestedStatement1;
    nestedStatement2;
  }
  statement3;
}`;
      
      const result = compressText(code);
      
      // Check that indentation pattern is preserved
      const lines = result.split('\n');
      expect(lines[0]).toBe('if (condition) {');
      expect(lines[1].startsWith('  ')).toBe(true);
      expect(lines[2].startsWith('  ')).toBe(true);
      expect(lines[3].startsWith('  ')).toBe(true);
      expect(lines[4].startsWith('    ')).toBe(true);
    });
  });

  // Integration with the application
  describe('Integration with CLI options', () => {
    test('should apply compression when -c option is used', async () => {
      // Set up test data with excessive whitespace
      const inputText = 'Line 1   \n\n\n\nLine 2  \t \n\n\nLine 3    with    spaces';
      getInputText.mockResolvedValueOnce(inputText);
      
      // Call process with compress option
      await processText({ input: 'test.txt', compress: true });
      
      // Check that compression was applied
      expect(writeOutput).toHaveBeenCalled();
      const compressedOutput = writeOutput.mock.calls[0][0];
      
      // Compressed text should not have more than two consecutive newlines
      expect(compressedOutput).not.toMatch(/\n{3,}/);
      // Should not have trailing whitespace
      expect(compressedOutput).not.toMatch(/[ \t]+$/m);
      // Should not have multiple spaces
      expect(compressedOutput).not.toMatch(/[^\s][ ]{2,}/);
    });
    
    test('should apply compression with format conversion', async () => {
      const markdownText = `# Heading

This   has   multiple    spaces.

And    multiple   

newlines.`;
      getInputText.mockResolvedValueOnce(markdownText);
      
      // Call process with compress and format options
      await processText({ 
        input: 'test.md',
        compress: true,
        format: 'html'
      });
      
      // Check that output was written
      expect(writeOutput).toHaveBeenCalled();
      const output = writeOutput.mock.calls[0][0];
      
      // Output should be HTML but also compressed
      expect(output).toContain('<h1>');
      expect(output).not.toMatch(/\n{3,}/);
    });
    
    test('should apply compression with truncation', async () => {
      const longText = 'This is a long text.\n\n\n'.repeat(100);
      getInputText.mockResolvedValueOnce(longText);
      
      // Call process with compress and maxTokens options
      await processText({ 
        input: 'test.txt',
        compress: true,
        maxTokens: 50,
        truncate: 'end'
      });
      
      // Check that output was written
      expect(writeOutput).toHaveBeenCalled();
      const output = writeOutput.mock.calls[0][0];
      
      // Output should be compressed (no excessive newlines)
      expect(output).not.toMatch(/\n{3,}/);
      
      // Output should be truncated (shorter than input)
      expect(output.length).toBeLessThan(longText.length);
    });
    
    test('should apply compression with system and user messages', async () => {
      const text = 'Sample    text   with   extra   spaces\n\n\n\n';
      getInputText.mockResolvedValueOnce(text);
      
      // Call process with compress and message options
      await processText({
        input: 'test.txt',
        compress: true,
        system: 'System   message',
        user: 'User   message'
      });
      
      // Check that output was written
      expect(writeOutput).toHaveBeenCalled();
      const output = writeOutput.mock.calls[0][0];
      
      // Output should contain system and user messages
      expect(output).toContain('SYSTEM:');
      expect(output).toContain('USER:');
      
      // Output should be compressed (no excessive spaces or newlines)
      expect(output).not.toMatch(/\s{3,}/);
      expect(output).not.toMatch(/\n{3,}/);
    });
  });
  
  // Performance considerations
  describe('Performance considerations', () => {
    test('should handle compression of very large texts efficiently', () => {
      // Create a large text (1MB+)
      const largeText = 'Line with spaces   and\n\n\nnewlines.   '.repeat(50000);
      
      // Measure execution time
      const startTime = process.hrtime();
      compressText(largeText);
      const [seconds, nanoseconds] = process.hrtime(startTime);
      const executionTimeMs = (seconds * 1000) + (nanoseconds / 1000000);
      
      // Performance will vary by system, but shouldn't take more than a few seconds
      // This is a soft assertion - mainly to detect major performance regressions
      console.log(`Compression of 1MB+ text took ${executionTimeMs.toFixed(2)}ms`);
      
      // If compression takes more than 10 seconds, it's likely there's a performance issue
      expect(executionTimeMs).toBeLessThan(10000);
    });
  });
});