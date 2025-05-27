import { describe, test, expect, beforeAll, afterAll, jest } from '@jest/globals';
import { processProjectDirectory } from '../../src/processors/project-processor.js';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

// Get directory name
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Test directories and files
const testProjectDir = path.join(__dirname, '..', 'fixtures', 'project');
const testOutputFile = path.join(__dirname, '..', 'fixtures', 'project-output.txt');

// Create test project structure
beforeAll(async () => {
  // Create test project directory structure
  await fs.mkdir(testProjectDir, { recursive: true });
  
  // Create root level files
  await fs.writeFile(path.join(testProjectDir, 'root-file.txt'), 'This is a root level file.');
  
  // Create level 1 directory and files
  const level1Dir = path.join(testProjectDir, 'level1');
  await fs.mkdir(level1Dir, { recursive: true });
  await fs.writeFile(path.join(level1Dir, 'level1-file.txt'), 'This is a level 1 file.');
  
  // Create level 2 directory and files
  const level2Dir = path.join(testProjectDir, 'level1', 'level2');
  await fs.mkdir(level2Dir, { recursive: true });
  await fs.writeFile(path.join(level2Dir, 'level2-file.txt'), 'This is a level 2 file.');
  
  // Create another level 1 directory and files
  const anotherLevel1Dir = path.join(testProjectDir, 'another-level1');
  await fs.mkdir(anotherLevel1Dir, { recursive: true });
  await fs.writeFile(path.join(anotherLevel1Dir, 'another-level1-file.txt'), 'This is another level 1 file.');
});

// Clean up test files
afterAll(async () => {
  try {
    await fs.rm(testProjectDir, { recursive: true, force: true });
    await fs.rm(testOutputFile, { force: true }).catch(() => {});
  } catch (error) {
    console.error('Failed to clean up test files:', error);
  }
});

describe('Project Directory Processor', () => {
  test('processes a project directory with default options', async () => {
    const result = await processProjectDirectory({
      projectPath: testProjectDir,
      filePattern: '*.txt'
    });
    
    expect(result).toContain('Project structure for:');
    expect(result).toContain('root-file.txt');
    expect(result).toContain('level1-file.txt');
    expect(result).toContain('level2-file.txt');
    expect(result).toContain('another-level1-file.txt');
  });
  
  test('processes a project directory with suppressLayout option', async () => {
    const result = await processProjectDirectory({
      projectPath: testProjectDir,
      filePattern: '*.txt',
      suppressLayout: true
    });
    
    expect(result).not.toContain('Project structure for:');
    expect(result).toContain('FILE: root-file.txt');
    expect(result).toContain('This is a root level file.');
  });
  
  test('processes a project directory with includeComments option', async () => {
    // Create a file with comments
    const testFileWithComments = path.join(testProjectDir, 'file-with-comments.js');
    await fs.writeFile(testFileWithComments, '// This is a comment\nconst x = 10; // inline comment');
    
    const result = await processProjectDirectory({
      projectPath: testProjectDir,
      filePattern: '*.js',
      includeComments: true
    });
    
    expect(result).toContain('// This is a comment');
    expect(result).toContain('// inline comment');
    
    // Clean up
    await fs.unlink(testFileWithComments);
  });
  
  test('processes a project directory with custom comment style', async () => {
    const result = await processProjectDirectory({
      projectPath: testProjectDir,
      filePattern: '*.txt',
      commentStyle: '#'
    });
    
    expect(result).toContain('# FILE: root-file.txt');
  });
  
  test('throws error for non-existent project path', async () => {
    await expect(processProjectDirectory({
      projectPath: path.join(testProjectDir, 'non-existent'),
      filePattern: '*.txt'
    })).rejects.toThrow('Invalid project path');
  });
  
  test('throws error when no files match pattern', async () => {
    await expect(processProjectDirectory({
      projectPath: testProjectDir,
      filePattern: '*.non-existent-extension'
    })).rejects.toThrow('No files found matching pattern');
  });
  
  test('processes a project directory with folderOutputLevel=0', async () => {
    const results = await processProjectDirectory({
      projectPath: testProjectDir,
      filePattern: '*.txt',
      folderOutputLevel: 0,
      output: 'output.txt'
    });
    
    expect(Array.isArray(results)).toBe(true);
    expect(results.length).toBe(1);
    expect(results[0].directoryPath).toBe(testProjectDir);
    expect(results[0].outputFilename).toBe('output.txt');
    expect(results[0].content).toContain('root-file.txt');
  });
  
  test('processes a project directory with folderOutputLevel=1', async () => {
    const results = await processProjectDirectory({
      projectPath: testProjectDir,
      filePattern: '*.txt',
      folderOutputLevel: 1,
      output: 'output.txt'
    });
    
    expect(Array.isArray(results)).toBe(true);
    expect(results.length).toBe(2); // level1 and another-level1
    
    // Check that we have outputs for both level 1 directories
    const directoryPaths = results.map(r => path.basename(r.directoryPath));
    expect(directoryPaths).toContain('level1');
    expect(directoryPaths).toContain('another-level1');
  });
  
  test('processes a project directory with folderOutputLevel=all', async () => {
    const results = await processProjectDirectory({
      projectPath: testProjectDir,
      filePattern: '*.txt',
      folderOutputLevel: 'all',
      output: 'output.txt'
    });
    
    expect(Array.isArray(results)).toBe(true);
    expect(results.length).toBeGreaterThanOrEqual(3); // root, level1, level2, another-level1
    
    // Check that we have outputs for all directories
    const directoryPaths = results.map(r => r.directoryPath);
    expect(directoryPaths).toContain(testProjectDir); // root
    expect(directoryPaths.some(p => p.endsWith('level1'))).toBe(true);
    expect(directoryPaths.some(p => p.endsWith('level2'))).toBe(true);
    expect(directoryPaths.some(p => p.endsWith('another-level1'))).toBe(true);
  });
  
  test('throws error for invalid folderOutputLevel', async () => {
    await expect(processProjectDirectory({
      projectPath: testProjectDir,
      filePattern: '*.txt',
      folderOutputLevel: -1,
      output: 'output.txt'
    })).rejects.toThrow('Invalid folder output level');
  });
});