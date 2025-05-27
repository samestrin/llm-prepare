import { describe, test, expect, beforeAll, afterAll, jest } from '@jest/globals';
import { exec } from 'child_process';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

// Get directory name
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Path to CLI script
const cliPath = path.join(__dirname, '..', 'bin', 'llm-prepare.js');

// Test files and directories
const testFilesDir = path.join(__dirname, 'fixtures', 'cli');
const testInputFile = path.join(testFilesDir, 'input.txt');
const testOutputFile = path.join(testFilesDir, 'output.txt');
const testConfigFile = path.join(testFilesDir, 'config.json');
const testProjectDir = path.join(testFilesDir, 'project');

// Mock the 'open' package
jest.mock('open', () => {
  return {
    __esModule: true,
    default: jest.fn().mockResolvedValue(undefined)
  };
});

// Create test files
beforeAll(async () => {
  await fs.mkdir(testFilesDir, { recursive: true });
  await fs.mkdir(testProjectDir, { recursive: true });
  
  // Create sample text file
  await fs.writeFile(testInputFile, 'This is a test document.\nIt has multiple lines.\nWe will use it for testing LLM-Prepare.');
  
  // Create config file
  await fs.writeFile(testConfigFile, JSON.stringify({
    "args": {
      "compress": true,
      "maxTokens": 100
    },
    "include": [testProjectDir]
  }));
  
  // Create project files
  await fs.writeFile(path.join(testProjectDir, 'file1.txt'), 'This is file 1.');
  await fs.writeFile(path.join(testProjectDir, 'file2.txt'), 'This is file 2.');
});

// Clean up test files
afterAll(async () => {
  try {
    await fs.rm(testFilesDir, { recursive: true });
  } catch (error) {
    console.error('Failed to clean up test files:', error);
  }
});

// Helper function to run CLI commands
function runCli(args) {
  return new Promise((resolve, reject) => {
    exec(`node ${cliPath} ${args}`, (error, stdout, stderr) => {
      if (error && !stderr.includes('Debug:')) {
        reject(error);
        return;
      }
      resolve({ stdout, stderr });
    });
  });
}

describe('LLM-Prepare CLI', () => {
  test('displays version with -v option', async () => {
    const { stdout } = await runCli('-v');
    expect(stdout).toMatch(/\d+\.\d+\.\d+/);
  });
  
  test('processes input file with -i option', async () => {
    const { stdout } = await runCli(`-i ${testInputFile}`);
    expect(stdout).toContain('This is a test document.');
  });
  
  test('writes output to file with -o option', async () => {
    await runCli(`-i ${testInputFile} -o ${testOutputFile}`);
    const outputContent = await fs.readFile(testOutputFile, 'utf8');
    expect(outputContent).toContain('This is a test document.');
  });
  
  test('truncates text with -m and -t options', async () => {
    const { stdout } = await runCli(`-i ${testInputFile} -m 5 -t end`);
    expect(stdout).toContain('This is a test');
    expect(stdout).not.toContain('multiple lines');
  });
  
  test('compresses text with -c option', async () => {
    const { stdout } = await runCli(`-i ${testInputFile} -c`);
    expect(stdout).not.toContain('\n\n'); // No double newlines
  });
  
  test('adds system message with -s option', async () => {
    const { stdout } = await runCli(`-i ${testInputFile} -s "System message"`);
    expect(stdout).toContain('SYSTEM: System message');
  });
  
  test('adds user message with -u option', async () => {
    const { stdout } = await runCli(`-i ${testInputFile} -u "User message"`);
    expect(stdout).toContain('USER: User message');
  });
  
  test('processes project directory with -p option', async () => {
    const { stdout } = await runCli(`-p ${testProjectDir}`);
    expect(stdout).toContain('Project structure for:');
    expect(stdout).toContain('file1.txt');
    expect(stdout).toContain('file2.txt');
  });
  
  test('suppresses layout with --no-layout option', async () => {
    const { stdout } = await runCli(`-p ${testProjectDir} --no-layout`);
    expect(stdout).not.toContain('Project structure for:');
    expect(stdout).toContain('FILE: file1.txt');
  });
  
  test('uses config file with --config option', async () => {
    const { stdout } = await runCli(`--config ${testConfigFile}`);
    expect(stdout).toContain('file1.txt');
    expect(stdout).toContain('file2.txt');
  });
  
  test('shows debug output with -d option', async () => {
    const { stderr } = await runCli(`-i ${testInputFile} -d`);
    expect(stderr).toContain('Debug:');
  });
  
  test('processes with folder output level', async () => {
    // Create a temporary output directory
    const outputDir = path.join(testFilesDir, 'output');
    await fs.mkdir(outputDir, { recursive: true });
    const outputFile = path.join(outputDir, 'output.txt');
    
    await runCli(`-p ${testProjectDir} -o ${outputFile} --folder-output-level 0`);
    
    // Check that the output file exists
    const stats = await fs.stat(outputFile);
    expect(stats.isFile()).toBe(true);
    
    // Clean up
    await fs.rm(outputDir, { recursive: true });
  });
  
  test('shows error for invalid folder output level', async () => {
    try {
      await runCli(`-p ${testProjectDir} -o ${testOutputFile} --folder-output-level -1`);
      // If we get here, the command didn't fail as expected
      expect(true).toBe(false);
    } catch (error) {
      expect(error.message).toContain('Error');
    }
  });
  
  test('shows error when folder output level is used without output file', async () => {
    try {
      await runCli(`-p ${testProjectDir} --folder-output-level 1`);
      // If we get here, the command didn't fail as expected
      expect(true).toBe(false);
    } catch (error) {
      expect(error.message).toContain('Error');
    }
  });

  // New tests for utility commands (section 5 of testing plan)
  test('displays default ignore patterns with --show-default-ignore option', async () => {
    const { stdout } = await runCli('--show-default-ignore');
    
    // Verify the output contains the header and some common ignore patterns
    expect(stdout).toContain('Default ignore patterns:');
    expect(stdout).toContain('node_modules');
    expect(stdout).toContain('.git');
    expect(stdout).toContain('.DS_Store');
    
    // Verify the command exits after showing patterns (no further processing)
    expect(stdout).not.toContain('Processing');
  });
  
  test('opens templates documentation with --show-templates option', async () => {
    // Import the mocked open function
    const open = (await import('open')).default;
    
    await runCli('--show-templates');
    
    // Verify the open function was called with the correct URL
    expect(open).toHaveBeenCalledWith('https://github.com/samestrin/llm-prepare/blob/main/templates/README.md');
    
    // Verify the output message
    const { stdout } = await runCli('--show-templates');
    expect(stdout).toContain('Opening templates documentation in your browser...');
  });
});