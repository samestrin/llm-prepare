import { describe, test, expect, beforeAll, afterAll, jest } from '@jest/globals';
import { processProjectDirectory } from '../../src/processors/project-processor.js';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

// Get directory name
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Test directories and files
const testBinaryDir = path.join(__dirname, '..', 'fixtures', 'binary-project');

// Create test project structure
beforeAll(async () => {
  // Create test project directory structure
  await fs.mkdir(testBinaryDir, { recursive: true });
  
  // Create text file
  await fs.writeFile(
    path.join(testBinaryDir, 'text-file.txt'), 
    'This is a plain text file.'
  );
  
  // Create JavaScript file
  await fs.writeFile(
    path.join(testBinaryDir, 'code-file.js'), 
    'const hello = "world"; // This is JavaScript code'
  );
  
  // Create a "binary" file (not actually binary but we'll treat it as such)
  const binaryContent = Buffer.from([0x4D, 0x5A, 0x90, 0x00, 0x03, 0x00, 0x00, 0x00, 0x04, 0x00]); // MZ header for EXE files
  await fs.writeFile(path.join(testBinaryDir, 'binary-file.exe'), binaryContent);
  
  // Create a large text file
  let largeContent = '';
  for (let i = 0; i < 1000; i++) {
    largeContent += 'This is line ' + i + ' of the large file.\n';
  }
  await fs.writeFile(path.join(testBinaryDir, 'large-file.txt'), largeContent);
});

// Clean up test files
afterAll(async () => {
  try {
    await fs.rm(testBinaryDir, { recursive: true, force: true });
  } catch (error) {
    console.error('Failed to clean up test files:', error);
  }
});

describe('Binary and Large File Handling in Project Processor', () => {
  test('excludes binary files by default', async () => {
    const result = await processProjectDirectory({
      projectPath: testBinaryDir,
      filePattern: '*.*',
      debug: true
    });
    
    // Should include text files
    expect(result).toContain('text-file.txt');
    expect(result).toContain('code-file.js');
    
    // Should include placeholder for binary file
    expect(result).toContain('binary-file.exe');
    expect(result).toContain('Binary file');
    expect(result).not.toContain('MZ'); // Binary content should not be included
  });
  
  test('excludes large files by default', async () => {
    // Set a very small max file size to ensure large-file.txt is considered large
    const result = await processProjectDirectory({
      projectPath: testBinaryDir,
      filePattern: '*.*',
      maxFileSize: 100, // 100 bytes
      debug: true
    });
    
    // Should include small text files
    expect(result).toContain('text-file.txt');
    expect(result).toContain('This is a plain text file.');
    
    // Should include placeholder for large file
    expect(result).toContain('large-file.txt');
    expect(result).toContain('Large file');
    expect(result).not.toContain('This is line 999'); // Large file content should not be included
  });
  
  test('excludes large files but includes binary placeholders when includeLargeFiles is true', async () => {
    // Set a very small max file size but enable includeLargeFiles
    const result = await processProjectDirectory({
      projectPath: testBinaryDir,
      filePattern: '*.*',
      maxFileSize: 100, // 100 bytes
      includeLargeFiles: true,
      debug: true
    });
    
    // Should include all text files including large ones
    expect(result).toContain('text-file.txt');
    expect(result).toContain('This is a plain text file.');
    expect(result).toContain('large-file.txt');
    expect(result).toContain('This is line 999'); // Large file content should be included
    
    // Should still exclude binary files
    expect(result).toContain('binary-file.exe');
    expect(result).toContain('Binary file');
    expect(result).not.toContain('MZ'); // Binary content should not be included
  });
  
  test('respects custom maxFileSize setting', async () => {
    // First with small max size
    const smallSizeResult = await processProjectDirectory({
      projectPath: testBinaryDir,
      filePattern: '*.*',
      maxFileSize: 100, // 100 bytes
      debug: true
    });
    
    // Should exclude large-file.txt
    expect(smallSizeResult).toContain('large-file.txt');
    expect(smallSizeResult).toContain('Large file');
    
    // Then with large max size
    const largeSizeResult = await processProjectDirectory({
      projectPath: testBinaryDir,
      filePattern: '*.*',
      maxFileSize: 1000000, // 1MB
      debug: true
    });
    
    // Should include large-file.txt
    expect(largeSizeResult).toContain('large-file.txt');
    expect(largeSizeResult).toContain('This is line 999'); // Large file content should be included
  });
});