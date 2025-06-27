import { describe, test, expect, jest } from '@jest/globals';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { checkIfBinary, isFileTooLarge, generatePlaceholderMessage } from '../../src/utils/file-type-handler.js';

// Get directory name
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Test directories and files
const testFixturesDir = path.join(__dirname, '..', 'fixtures', 'file-types');

describe('File Type Handler', () => {
  // Setup test files
  beforeAll(async () => {
    // Create test directory
    await fs.mkdir(testFixturesDir, { recursive: true });
    
    // Create text file
    await fs.writeFile(
      path.join(testFixturesDir, 'text-file.txt'), 
      'This is a plain text file with some content.'
    );
    
    // Create JavaScript file
    await fs.writeFile(
      path.join(testFixturesDir, 'code-file.js'), 
      'const hello = "world"; // This is JavaScript code'
    );
    
    // Create a "binary" file (not actually binary but we'll treat it as such)
    const binaryContent = Buffer.from([0xFF, 0xD8, 0xFF, 0xE0, 0x00, 0x10, 0x4A, 0x46, 0x49, 0x46]);
    await fs.writeFile(path.join(testFixturesDir, 'binary-file.jpg'), binaryContent);
    
    // Create a large text file (not actually large but we'll test with a small threshold)
    let largeContent = '';
    for (let i = 0; i < 1000; i++) {
      largeContent += 'This is line ' + i + ' of the large file.\n';
    }
    await fs.writeFile(path.join(testFixturesDir, 'large-file.txt'), largeContent);
  });
  
  // Clean up test files
  afterAll(async () => {
    try {
      await fs.rm(testFixturesDir, { recursive: true, force: true });
    } catch (error) {
      console.error('Failed to clean up test files:', error);
    }
  });
  
  test('checkIfBinary correctly identifies binary files by extension', async () => {
    // Test with common binary extensions
    expect(await checkIfBinary('image.jpg')).toBe(true);
    expect(await checkIfBinary('document.pdf')).toBe(true);
    expect(await checkIfBinary('archive.zip')).toBe(true);
    expect(await checkIfBinary('program.exe')).toBe(true);
    
    // Test with common text extensions
    expect(await checkIfBinary('script.js')).toBe(false);
    expect(await checkIfBinary('document.txt')).toBe(false);
    expect(await checkIfBinary('webpage.html')).toBe(false);
    expect(await checkIfBinary('config.json')).toBe(false);
  });
  
  test('checkIfBinary correctly identifies binary files by content', async () => {
    const textFilePath = path.join(testFixturesDir, 'text-file.txt');
    const codeFilePath = path.join(testFixturesDir, 'code-file.js');
    const binaryFilePath = path.join(testFixturesDir, 'binary-file.jpg');
    
    // Read file contents
    const textContent = await fs.readFile(textFilePath);
    const codeContent = await fs.readFile(codeFilePath);
    const binaryContent = await fs.readFile(binaryFilePath);
    
    // Test with actual file contents
    expect(await checkIfBinary('unknown.file', textContent)).toBe(false);
    expect(await checkIfBinary('unknown.file', codeContent)).toBe(false);
    expect(await checkIfBinary('unknown.file', binaryContent)).toBe(true);
  });
  
  test('isFileTooLarge correctly identifies large files', async () => {
    const smallFilePath = path.join(testFixturesDir, 'text-file.txt');
    const largeFilePath = path.join(testFixturesDir, 'large-file.txt');
    
    // Get file stats
    const smallFileStats = await fs.stat(smallFilePath);
    const largeFileStats = await fs.stat(largeFilePath);
    
    // Test with different thresholds
    const smallThreshold = 100; // 100 bytes
    const largeThreshold = 1000000; // 1MB
    
    // Small file with small threshold
    expect(isFileTooLarge(smallFileStats.size, smallThreshold)).toBe(false);
    
    // Large file with small threshold
    expect(isFileTooLarge(largeFileStats.size, smallThreshold)).toBe(true);
    
    // Small file with large threshold
    expect(isFileTooLarge(smallFileStats.size, largeThreshold)).toBe(false);
    
    // Large file with large threshold
    expect(isFileTooLarge(largeFileStats.size, largeThreshold)).toBe(false);
  });
  
  test('generatePlaceholderMessage creates appropriate messages', () => {
    // Test binary file message
    const binaryMessage = generatePlaceholderMessage('test.jpg', true, false, 0);
    expect(binaryMessage).toContain('Binary file');
    expect(binaryMessage).toContain('test.jpg');
    
    // Test large file message
    const largeFileSize = 10 * 1024 * 1024; // 10MB
    const largeMessage = generatePlaceholderMessage('large.txt', false, true, largeFileSize);
    expect(largeMessage).toContain('Large file');
    expect(largeMessage).toContain('large.txt');
    expect(largeMessage).toContain('10MB');
  });
});