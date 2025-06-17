/**
 * Integration tests for input-output combinations in LLM-Prepare
 * 
 * These tests focus on how the input and output modules work together
 * in various scenarios, including different input sources and output destinations.
 */

import { describe, test, expect, beforeAll, afterAll, jest } from '@jest/globals';
import { getInputText } from '../../src/io/input.js';
import { writeOutput } from '../../src/io/output.js';
import { processText } from '../../src/index.js';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import http from 'http';

// Mock external modules
jest.mock('../../src/io/url-fetcher.js', () => ({
  fetchUrl: jest.fn().mockImplementation(async (url) => {
    if (url === 'http://example.com/test') {
      return 'Content from URL';
    }
    if (url === 'http://example.com/error') {
      throw new Error('Network error');
    }
    return `Content from ${url}`;
  }),
}));

jest.mock('../../src/io/browser-renderer.js', () => ({
  renderUrl: jest.fn().mockImplementation(async (url) => {
    if (url === 'http://example.com/rendered') {
      return 'Content from rendered URL';
    }
    if (url === 'http://example.com/render-error') {
      throw new Error('Rendering error');
    }
    return `Rendered content from ${url}`;
  }),
}));

// Get directory name
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Test files directory
const testFilesDir = path.join(__dirname, '../fixtures/input-output');
const testInputFile = path.join(testFilesDir, 'input.txt');
const testLargeInputFile = path.join(testFilesDir, 'large-input.txt');
const testOutputFile = path.join(testFilesDir, 'output.txt');
const nonExistentFile = path.join(testFilesDir, 'non-existent-file.txt');

// Create test files
beforeAll(async () => {
  await fs.mkdir(testFilesDir, { recursive: true });
  
  // Create sample text files
  await fs.writeFile(testInputFile, 'This is a test document.\nIt has multiple lines.\nWe will use it for testing input-output integration.');
  
  // Create a large file for chunking tests
  let largeContent = '';
  for (let i = 0; i < 1000; i++) {
    largeContent += `Line ${i}: This is a large file used for testing chunking functionality.\n`;
  }
  await fs.writeFile(testLargeInputFile, largeContent);
});

// Clean up test files
afterAll(async () => {
  try {
    await fs.rm(testFilesDir, { recursive: true });
  } catch (error) {
    console.error('Failed to clean up test files:', error);
  }
});

describe('Input and Output integration', () => {
  // Test: Read from file and write to another file
  test('reads from file and writes to another file', async () => {
    // First read the content from input file
    const content = await getInputText({ input: testInputFile });
    expect(content).toContain('This is a test document.');
    
    // Then write it to the output file
    await writeOutput(content, testOutputFile);
    
    // Verify the content was written correctly
    const outputContent = await fs.readFile(testOutputFile, 'utf8');
    expect(outputContent).toBe(content);
  });
  
  // Test: Read from URL and write to file
  test('reads from URL and writes to file', async () => {
    const url = 'http://example.com/test';
    const content = await getInputText({ input: url });
    expect(content).toBe('Content from URL');
    
    await writeOutput(content, testOutputFile);
    
    const outputContent = await fs.readFile(testOutputFile, 'utf8');
    expect(outputContent).toBe('Content from URL');
  });
  
  // Test: Read from URL with rendering and write to file
  test('reads from URL with rendering and writes to file', async () => {
    const url = 'http://example.com/rendered';
    const content = await getInputText({ input: url, render: true });
    expect(content).toBe('Content from rendered URL');
    
    await writeOutput(content, testOutputFile);
    
    const outputContent = await fs.readFile(testOutputFile, 'utf8');
    expect(outputContent).toBe('Content from rendered URL');
  });
  
  // Test: End-to-end test using processText with file input and output
  test('processes text from file to file', async () => {
    await processText({
      input: testInputFile,
      output: testOutputFile
    });
    
    const outputContent = await fs.readFile(testOutputFile, 'utf8');
    expect(outputContent).toContain('This is a test document.');
  });
  
  // Test: End-to-end test using processText with URL input and file output
  test('processes text from URL to file', async () => {
    await processText({
      input: 'http://example.com/test',
      output: testOutputFile
    });
    
    const outputContent = await fs.readFile(testOutputFile, 'utf8');
    expect(outputContent).toBe('Content from URL');
  });
  
  // Test: Chunking large files
  test('chunks large content when writing to file', async () => {
    const content = await getInputText({ input: testLargeInputFile });
    const chunkSize = 10; // 10KB chunks
    
    // Get the base name and extension for checking chunk files
    const fileExt = path.extname(testOutputFile);
    const baseName = testOutputFile.slice(0, testOutputFile.length - fileExt.length);
    
    await writeOutput(content, testOutputFile, chunkSize);
    
    // Check if at least one chunk file was created
    try {
      const chunkFileName = `${baseName}_part1${fileExt}`;
      const chunkContent = await fs.readFile(chunkFileName, 'utf8');
      expect(chunkContent.length).toBeGreaterThan(0);
      
      // Clean up chunk files
      const files = await fs.readdir(path.dirname(testOutputFile));
      for (const file of files) {
        if (file.startsWith(path.basename(baseName)) && file.includes('_part')) {
          await fs.unlink(path.join(path.dirname(testOutputFile), file));
        }
      }
    } catch (error) {
      fail(`Failed to find chunk files: ${error.message}`);
    }
  });
  
  // Test: End-to-end test with stdin input and file output by mocking stdin
  test('processes text from stdin to file', async () => {
    // Save original stdin
    const originalStdin = process.stdin;
    
    // Mock stdin as non-TTY and provide input data
    const mockStdin = {
      isTTY: false,
      [Symbol.asyncIterator]: async function* () {
        yield 'Content from standard input';
      }
    };
    
    // Replace stdin
    process.stdin = mockStdin;
    
    try {
      await processText({
        output: testOutputFile
      });
      
      const outputContent = await fs.readFile(testOutputFile, 'utf8');
      expect(outputContent).toBe('Content from standard input');
    } finally {
      // Restore stdin
      process.stdin = originalStdin;
    }
  });
  
  // Test: Error handling - Non-existent input file
  test('handles non-existent input file', async () => {
    await expect(async () => {
      await getInputText({ input: nonExistentFile });
    }).rejects.toThrow(/Failed to read file/);
  });
  
  // Test: Error handling - URL fetch error
  test('handles URL fetch error', async () => {
    await expect(async () => {
      await getInputText({ input: 'http://example.com/error' });
    }).rejects.toThrow(/Failed to fetch URL/);
  });
  
  // Test: Error handling - URL render error
  test('handles URL render error', async () => {
    await expect(async () => {
      await getInputText({ input: 'http://example.com/render-error', render: true });
    }).rejects.toThrow(/Failed to fetch URL/);
  });
  
  // Test: Error handling - Invalid output path
  test('handles invalid output path', async () => {
    const invalidPath = path.join('/non-existent-directory', 'output.txt');
    
    await expect(async () => {
      await writeOutput('Test content', invalidPath);
    }).rejects.toThrow();
  });
  
  // Test: Error handling - Invalid chunk size
  test('handles invalid chunk size', async () => {
    await expect(async () => {
      await writeOutput('Test content', testOutputFile, -5);
    }).rejects.toThrow(/Invalid chunk size/);
    
    await expect(async () => {
      await writeOutput('Test content', testOutputFile, 'not-a-number');
    }).rejects.toThrow(/Invalid chunk size/);
  });
  
  // Test: End-to-end test with stdout output by mocking stdout
  test('processes text from file to stdout', async () => {
    const mockWrite = jest.fn();
    const originalStdoutWrite = process.stdout.write;
    process.stdout.write = mockWrite;
    
    try {
      await processText({
        input: testInputFile
      });
      
      expect(mockWrite).toHaveBeenCalled();
      const outputContent = mockWrite.mock.calls.map(call => call[0]).join('');
      expect(outputContent).toContain('This is a test document.');
    } finally {
      process.stdout.write = originalStdoutWrite;
    }
  });
});