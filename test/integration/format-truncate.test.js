/**
 * Integration tests for format conversion and truncation together
 */

import { describe, test, expect, beforeAll, afterAll } from '@jest/globals';
import { processText } from '../../src/index.js';
import { convertFormat } from '../../src/formatters/format-converter.js';
import { truncateText } from '../../src/processors/truncate.js';
import { detectFormat } from '../../src/utils/format-detector.js';
import { estimateTokenCount } from '../../src/utils/token-counter.js';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

// Get directory name
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Test files
const testFilesDir = path.join(__dirname, '../fixtures/format-truncate');
const markdownFile = path.join(testFilesDir, 'sample.md');
const htmlFile = path.join(testFilesDir, 'sample.html');
const textFile = path.join(testFilesDir, 'sample.txt');
const outputFile = path.join(testFilesDir, 'output.txt');

// Create test files
beforeAll(async () => {
  await fs.mkdir(testFilesDir, { recursive: true });
  
  // Create sample markdown file
  await fs.writeFile(markdownFile, `# Sample Markdown Document
  
## Introduction
This is a **sample** document to test *format conversion* and truncation.

## Features
- Markdown formatting
- HTML tags
- Plain text

## Code Sample
\`\`\`javascript
function hello() {
  console.log("Hello, world!");
}
\`\`\`

## Links
[Example link](https://example.com)
`);
  
  // Create sample HTML file
  await fs.writeFile(htmlFile, `<!DOCTYPE html>
<html>
<head>
  <title>Sample HTML Document</title>
</head>
<body>
  <h1>Sample HTML Document</h1>
  
  <h2>Introduction</h2>
  <p>This is a <strong>sample</strong> document to test <em>format conversion</em> and truncation.</p>
  
  <h2>Features</h2>
  <ul>
    <li>Markdown formatting</li>
    <li>HTML tags</li>
    <li>Plain text</li>
  </ul>
  
  <h2>Code Sample</h2>
  <pre><code>function hello() {
  console.log("Hello, world!");
}</code></pre>
  
  <h2>Links</h2>
  <p><a href="https://example.com">Example link</a></p>
</body>
</html>
`);
  
  // Create sample text file
  await fs.writeFile(textFile, `SAMPLE TEXT DOCUMENT

INTRODUCTION
This is a sample document to test format conversion and truncation.

FEATURES
* Markdown formatting
* HTML tags
* Plain text

CODE SAMPLE
function hello() {
  console.log("Hello, world!");
}

LINKS
Example link: https://example.com
`);
});

// Clean up test files
afterAll(async () => {
  try {
    await fs.rm(testFilesDir, { recursive: true });
  } catch (error) {
    console.error('Failed to clean up test files:', error);
  }
});

describe('Format conversion with truncation', () => {
  test('correctly detects file formats', async () => {
    const mdContent = await fs.readFile(markdownFile, 'utf8');
    const htmlContent = await fs.readFile(htmlFile, 'utf8');
    const textContent = await fs.readFile(textFile, 'utf8');
    
    expect(detectFormat(mdContent)).toBe('markdown');
    expect(detectFormat(htmlContent)).toBe('html');
    expect(detectFormat(textContent)).toBe('text');
  });
  
  test('converts markdown to text and then truncates from end', async () => {
    const outputCapture = jest.fn();
    const originalStdoutWrite = process.stdout.write;
    process.stdout.write = outputCapture;
    
    try {
      await processText({
        input: markdownFile,
        format: 'text',
        maxTokens: 20,
        truncate: 'end'
      });
      
      const output = outputCapture.mock.calls.map(call => call[0]).join('');
      
      // Should contain start content but not end content
      expect(output).toContain('SAMPLE MARKDOWN DOCUMENT');
      expect(output).toContain('INTRODUCTION');
      expect(output).not.toContain('LINKS');
      expect(output).not.toContain('Example link');
      
      // Should contain truncation indicator
      expect(output).toContain('[...Content truncated from end...]');
      
      // Check token count is approximately what we expect
      expect(estimateTokenCount(output)).toBeLessThanOrEqual(25); // Allow small buffer for truncation message
    } finally {
      process.stdout.write = originalStdoutWrite;
    }
  });
  
  test('converts HTML to markdown and then truncates from start', async () => {
    await processText({
      input: htmlFile,
      format: 'markdown',
      maxTokens: 25,
      truncate: 'start',
      output: outputFile
    });
    
    const outputContent = await fs.readFile(outputFile, 'utf8');
    
    // Should contain end content but not start content
    expect(outputContent).not.toContain('# Sample HTML Document');
    expect(outputContent).not.toContain('## Introduction');
    expect(outputContent).toContain('## Links');
    expect(outputContent).toContain('[Example link](https://example.com)');
    
    // Should contain truncation indicator
    expect(outputContent).toContain('[...Content truncated from beginning...]');
    
    // Check token count is approximately what we expect
    expect(estimateTokenCount(outputContent)).toBeLessThanOrEqual(30); // Allow small buffer for truncation message
  });
  
  test('converts text to HTML and then truncates from middle', async () => {
    const outputCapture = jest.fn();
    const originalStdoutWrite = process.stdout.write;
    process.stdout.write = outputCapture;
    
    try {
      await processText({
        input: textFile,
        format: 'html',
        maxTokens: 30,
        truncate: 'middle'
      });
      
      const output = outputCapture.mock.calls.map(call => call[0]).join('');
      
      // Should contain both start and end content
      expect(output).toContain('<pre>SAMPLE TEXT DOCUMENT');
      expect(output).toContain('LINKS');
      expect(output).toContain('Example link');
      
      // Should contain truncation indicator
      expect(output).toContain('[...Content truncated from middle...]');
      
      // Should not contain middle content
      expect(output).not.toContain('CODE SAMPLE');
      
      // Check token count is approximately what we expect
      expect(estimateTokenCount(output)).toBeLessThanOrEqual(35); // Allow small buffer for truncation message
    } finally {
      process.stdout.write = originalStdoutWrite;
    }
  });
  
  test('handles format conversion then truncation in a single command', async () => {
    // First perform conversion and truncation separately
    const mdContent = await fs.readFile(markdownFile, 'utf8');
    const converted = await convertFormat(mdContent, 'html');
    const truncated = truncateText(converted, 25, 'end');
    
    // Then perform the same operation using processText
    const outputCapture = jest.fn();
    const originalStdoutWrite = process.stdout.write;
    process.stdout.write = outputCapture;
    
    try {
      await processText({
        input: markdownFile,
        format: 'html',
        maxTokens: 25,
        truncate: 'end'
      });
      
      const output = outputCapture.mock.calls.map(call => call[0]).join('');
      
      // Both should have similar token counts
      const separateCount = estimateTokenCount(truncated);
      const combinedCount = estimateTokenCount(output);
      
      expect(Math.abs(separateCount - combinedCount)).toBeLessThanOrEqual(5);
      
      // Both should have truncation indicators
      expect(truncated).toContain('[...Content truncated from end...]');
      expect(output).toContain('[...Content truncated from end...]');
    } finally {
      process.stdout.write = originalStdoutWrite;
    }
  });
  
  test('handles invalid format with valid truncation', async () => {
    // Should throw error for invalid format but not for truncation
    await expect(processText({
      input: markdownFile,
      format: 'invalid-format',
      maxTokens: 20,
      truncate: 'end'
    })).rejects.toThrow('Unsupported conversion');
  });
  
  test('handles valid format with invalid truncation', async () => {
    // Should throw error for invalid truncation strategy
    await expect(processText({
      input: markdownFile,
      format: 'text',
      maxTokens: 20,
      truncate: 'invalid-strategy'
    })).rejects.toThrow('Invalid truncation strategy');
  });
  
  test('preserves formatting structure after truncation', async () => {
    await processText({
      input: htmlFile,
      format: 'markdown',
      maxTokens: 40,
      truncate: 'end',
      output: outputFile
    });
    
    const outputContent = await fs.readFile(outputFile, 'utf8');
    
    // Check if headings are still formatted correctly
    expect(outputContent).toMatch(/^# /m); // Should have at least one heading
    
    // Check if bold formatting is preserved
    expect(outputContent).toMatch(/\*\*sample\*\*/); 
    
    // Verify markdown structure is intact
    expect(detectFormat(outputContent)).toBe('markdown');
  });
});