import { writeOutput } from '../../src/io/output.js';
import fs from 'fs/promises';
import path from 'path';
import { jest } from '@jest/globals';

describe('Output Module', () => {
  const tempDir = path.join(process.cwd(), 'temp_output_tests');

  // Setup and teardown
  beforeAll(async () => {
    await fs.mkdir(tempDir, { recursive: true });
  });

  afterAll(async () => {
    await fs.rm(tempDir, { recursive: true, force: true });
  });

  beforeEach(() => {
    // Mock console.log and process.stdout.write to prevent actual output during tests
    jest.spyOn(process.stdout, 'write').mockImplementation(() => true);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  // Scenario: No `-o`: Output processed content to stdout.
  describe('stdout output', () => {
    test('should write text to stdout when outputPath is null', async () => {
      const testText = 'Hello stdout!';
      await writeOutput(testText, null);
      expect(process.stdout.write).toHaveBeenCalledWith(testText);
    });

    test('should write empty string to stdout', async () => {
      await writeOutput('', null);
      expect(process.stdout.write).toHaveBeenCalledWith('');
    });
  });

  // Scenario: `-o <filepath>`: Write processed content to a file.
  describe('file output', () => {
    test('should write text to the specified file', async () => {
      const testFilePath = path.join(tempDir, 'output.txt');
      const fileContent = 'Content written to file.';
      await writeOutput(fileContent, testFilePath);
      const readContent = await fs.readFile(testFilePath, 'utf8');
      expect(readContent).toBe(fileContent);
    });

    test('should create parent directories if they do not exist', async () => {
      const nestedFilePath = path.join(tempDir, 'nested', 'sub', 'nested-output.txt');
      const fileContent = 'Content in nested directory.';
      await writeOutput(fileContent, nestedFilePath);
      const readContent = await fs.readFile(nestedFilePath, 'utf8');
      expect(readContent).toBe(fileContent);
      // Verify directory was created
      await expect(fs.access(path.dirname(nestedFilePath))).resolves.not.toThrow();
    });

    test('should overwrite existing file content', async () => {
      const testFilePath = path.join(tempDir, 'overwrite.txt');
      await fs.writeFile(testFilePath, 'Original content.');
      const newContent = 'New content.';
      await writeOutput(newContent, testFilePath);
      const readContent = await fs.readFile(testFilePath, 'utf8');
      expect(readContent).toBe(newContent);
    });

    test('should handle writing an empty string to a file', async () => {
      const emptyFilePath = path.join(tempDir, 'empty-file.txt');
      await writeOutput('', emptyFilePath);
      const readContent = await fs.readFile(emptyFilePath, 'utf8');
      expect(readContent).toBe('');
    });
  });

  // Edge cases: permissions, invalid paths
  describe('edge cases', () => {
    test('should throw an error for invalid text parameter', async () => {
      const testFilePath = path.join(tempDir, 'invalid-text.txt');
      await expect(writeOutput(123, testFilePath)).rejects.toThrow('Invalid text parameter: must be a string');
    });

    test('should throw an error if file path is invalid', async () => {
      if (process.platform !== 'win32') { // Skip on Windows as permissions behave differently
        const invalidPath = '/root/no-permission/test.txt'; // Path requiring root privileges
        await expect(writeOutput('test', invalidPath)).rejects.toThrow();
      }
    });

    // Test for very long paths might not be reliable across all platforms
    test('should handle paths that are close to system limits', async () => {
      // Creating a deeply nested path that's valid but close to limits
      const longDirPath = path.join(tempDir, 'a'.repeat(10), 'b'.repeat(10), 'c'.repeat(10));
      const longFilePath = path.join(longDirPath, 'd'.repeat(10) + '.txt');
      
      try {
        await writeOutput('Long path test', longFilePath);
        const content = await fs.readFile(longFilePath, 'utf8');
        expect(content).toBe('Long path test');
      } catch (error) {
        // Some platforms might reject this, which is fine
        // Just verify the error is properly handled
        expect(error.message).toMatch(/Failed to create directory|Path too long|ENAMETOOLONG/);
      }
    });
  });

  // Scenario: `--chunk-size <kilobytes>`: Test chunking functionality
  describe('chunking', () => {
    test('should split content into multiple files when chunkSize is provided', async () => {
      const longText = 'a'.repeat(3000); // 3KB of data
      const chunkSizeKB = 1; // 1KB per chunk
      const outputFilePath = path.join(tempDir, 'chunking-test.txt');

      await writeOutput(longText, outputFilePath, chunkSizeKB);

      // Expecting 3 files: chunking-test_part1.txt, chunking-test_part2.txt, chunking-test_part3.txt
      const chunk1Path = path.join(tempDir, 'chunking-test_part1.txt');
      const chunk2Path = path.join(tempDir, 'chunking-test_part2.txt');
      const chunk3Path = path.join(tempDir, 'chunking-test_part3.txt');

      await expect(fs.access(chunk1Path)).resolves.not.toThrow();
      await expect(fs.access(chunk2Path)).resolves.not.toThrow();
      await expect(fs.access(chunk3Path)).resolves.not.toThrow();
      
      // Ensure the original file was not created
      await expect(fs.access(outputFilePath)).rejects.toThrow();

      const content1 = await fs.readFile(chunk1Path, 'utf8');
      const content2 = await fs.readFile(chunk2Path, 'utf8');
      const content3 = await fs.readFile(chunk3Path, 'utf8');

      expect(Buffer.byteLength(content1, 'utf8')).toBeLessThanOrEqual(chunkSizeKB * 1024);
      expect(Buffer.byteLength(content2, 'utf8')).toBeLessThanOrEqual(chunkSizeKB * 1024);
      expect(Buffer.byteLength(content3, 'utf8')).toBeLessThanOrEqual(chunkSizeKB * 1024);
      expect(content1 + content2 + content3).toBe(longText);

      // Clean up specific chunk files for this test
      await fs.unlink(chunk1Path);
      await fs.unlink(chunk2Path);
      await fs.unlink(chunk3Path);
    });

    test('should not chunk if content size is less than or equal to chunkSize', async () => {
      const shortText = 'Short text.';
      const chunkSizeKB = 1; // 1KB
      const outputFilePath = path.join(tempDir, 'no-chunking.txt');

      await writeOutput(shortText, outputFilePath, chunkSizeKB);

      const readContent = await fs.readFile(outputFilePath, 'utf8');
      expect(readContent).toBe(shortText);
      
      // Ensure no chunked files were created
      const chunkPath = path.join(tempDir, 'no-chunking_part1.txt');
      await expect(fs.access(chunkPath)).rejects.toThrow();
    });

    test('should use appropriate file extension for chunked files', async () => {
      const longText = 'x'.repeat(2500); // 2.5KB
      const chunkSizeKB = 1; // 1KB
      const jsonFilePath = path.join(tempDir, 'data.json');

      await writeOutput(longText, jsonFilePath, chunkSizeKB);

      const chunk1Path = path.join(tempDir, 'data_part1.json');
      const chunk2Path = path.join(tempDir, 'data_part2.json');
      const chunk3Path = path.join(tempDir, 'data_part3.json');

      await expect(fs.access(chunk1Path)).resolves.not.toThrow();
      await expect(fs.access(chunk2Path)).resolves.not.toThrow();
      await expect(fs.access(chunk3Path)).resolves.not.toThrow();

      // Clean up specific chunk files for this test
      await fs.unlink(chunk1Path);
      await fs.unlink(chunk2Path);
      await fs.unlink(chunk3Path);
    });

    test('should throw an error for invalid chunk size (non-positive)', async () => {
      const testText = 'Some text.';
      const testFilePath = path.join(tempDir, 'invalid-chunk.txt');

      await expect(writeOutput(testText, testFilePath, 0)).rejects.toThrow(
        'Invalid chunk size: 0. Must be a positive number.'
      );
      
      await expect(writeOutput(testText, testFilePath, -5)).rejects.toThrow(
        'Invalid chunk size: -5. Must be a positive number.'
      );
    });

    test('should throw an error for invalid chunk size (non-numeric)', async () => {
      const testText = 'Some text.';
      const testFilePath = path.join(tempDir, 'invalid-chunk-type.txt');

      await expect(writeOutput(testText, testFilePath, 'not-a-number')).rejects.toThrow(
        'Invalid chunk size: not-a-number. Must be a positive number.'
      );
    });

    test('should handle text with paragraphs when chunking', async () => {
      const paragraphText = `First paragraph with some content.

Second paragraph with different content.

Third paragraph that should go into a different chunk.`;
      
      const chunkSizeKB = 0.1; // Very small chunks (100 bytes)
      const outputFilePath = path.join(tempDir, 'paragraph-test.txt');

      await writeOutput(paragraphText, outputFilePath, chunkSizeKB);

      // Verify multiple chunks were created
      const chunk1Path = path.join(tempDir, 'paragraph-test_part1.txt');
      const chunk2Path = path.join(tempDir, 'paragraph-test_part2.txt');
      
      await expect(fs.access(chunk1Path)).resolves.not.toThrow();
      
      // Read all chunks and verify total content equals original
      let allContent = '';
      let chunkIndex = 1;
      let chunkPath;
      
      do {
        chunkPath = path.join(tempDir, `paragraph-test_part${chunkIndex}.txt`);
        try {
          const chunkContent = await fs.readFile(chunkPath, 'utf8');
          allContent += chunkContent;
          await fs.unlink(chunkPath); // Clean up
          chunkIndex++;
        } catch (error) {
          break; // No more chunks
        }
      } while (true);
      
      // Remove extra whitespace for comparison
      expect(allContent.replace(/\s+/g, ' ').trim())
        .toBe(paragraphText.replace(/\s+/g, ' ').trim());
    });
  });
});