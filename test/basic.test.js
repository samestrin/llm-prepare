/**
 * Basic tests for LLM-Prepare
 */

import { describe, test, expect, beforeAll, afterAll } from '@jest/globals';
import { processText } from '../src/index.js';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

// Get directory name
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Test files
const testFilesDir = path.join(__dirname, 'fixtures');
const testInputFile = path.join(testFilesDir, 'input.txt');
const testOutputFile = path.join(testFilesDir, 'output.txt');
const testTemplateFile = path.join(testFilesDir, 'template.txt');

// Create test files
beforeAll(async () => {
  await fs.mkdir(testFilesDir, { recursive: true });
  
  // Create sample text file
  await fs.writeFile(testInputFile, 'This is a test document.\nIt has multiple lines.\nWe will use it for testing LLM-Prepare.');
  
  // Create template file
  await fs.writeFile(testTemplateFile, 'System: Process the following text\n\nUser: {{text}}\n\nAssistant:');
});

// Clean up test files
afterAll(async () => {
  try {
    await fs.rm(testFilesDir, { recursive: true });
  } catch (error) {
    console.error('Failed to clean up test files:', error);
  }
});

describe('LLM-Prepare basic functionality', () => {
  test('reads from file', async () => {
    const outputCapture = jest.fn();
    // Mock console.log
    const originalStdoutWrite = process.stdout.write;
    process.stdout.write = outputCapture;
    
    try {
      await processText({ input: testInputFile });
      expect(outputCapture).toHaveBeenCalled();
      
      // Get the first argument of the first call
      const output = outputCapture.mock.calls.map(call => call[0]).join('');
      expect(output).toContain('This is a test document.');
      expect(output).toContain('It has multiple lines.');
    } finally {
      // Restore console.log
      process.stdout.write = originalStdoutWrite;
    }
  });
  
  test('writes to file', async () => {
    await processText({ 
      input: testInputFile,
      output: testOutputFile
    });
    
    const outputContent = await fs.readFile(testOutputFile, 'utf8');
    expect(outputContent).toContain('This is a test document.');
  });
  
  test('applies prompt template', async () => {
    const outputCapture = jest.fn();
    // Mock console.log
    const originalStdoutWrite = process.stdout.write;
    process.stdout.write = outputCapture;
    
    try {
      await processText({ 
        input: testInputFile,
        prompt: testTemplateFile
      });
      
      // Get the first argument of the first call
      const output = outputCapture.mock.calls.map(call => call[0]).join('');
      expect(output).toContain('System: Process the following text');
      expect(output).toContain('User: This is a test document.');
    } finally {
      // Restore console.log
      process.stdout.write = originalStdoutWrite;
    }
  });
  
  test('truncates text', async () => {
    const outputCapture = jest.fn();
    // Mock console.log
    const originalStdoutWrite = process.stdout.write;
    process.stdout.write = outputCapture;
    
    try {
      await processText({ 
        input: testInputFile,
        maxTokens: 5,
        truncate: 'end'
      });
      
      // Get the first argument of the first call
      const output = outputCapture.mock.calls.map(call => call[0]).join('');
      expect(output).toContain('This is a test');
      expect(output).not.toContain('multiple lines');
    } finally {
      // Restore console.log
      process.stdout.write = originalStdoutWrite;
    }
  });
});