import { getInputText } from '../../src/io/input.js';
import fs from 'fs/promises';
import path from 'path';
// Mock necessary modules to control their behavior during tests
jest.mock('../../src/io/url-fetcher.js');
jest.mock('../../src/io/browser-renderer.js');
import { fetchUrl } from '../../src/io/url-fetcher.js';
import { renderUrl } from '../../src/io/browser-renderer.js';

// Mock process.stdin for getStdin tests without actually handling streams directly
// This is a common pattern when you want to control stdin behavior for Jest
const mockProcessStdin = () => {
    let _buffer = '';
    const mockStdin = new (require('stream').Readable)({
        read() {} // eslint-disable-line no-empty-function
    });
    mockStdin.push = jest.fn((chunk) => {
        if (chunk === null) {
            _buffer = ''; // Clear buffer on null to simulate end of stream
        } else {
            _buffer += chunk.toString();
        }
        return true;
    });
    mockStdin.setEncoding = jest.fn();
    mockStdin.isTTY = false; // Default to non-TTY for piped input
    mockStdin.on = jest.fn((event, handler) => {
      if (event === 'data') {
        process.nextTick(() => {
          if (_buffer) {
            handler(_buffer);
            _buffer = '';
          }
        });
      } else if (event === 'end') {
        process.nextTick(() => handler());
      }
    });

    Object.defineProperty(process, 'stdin', {
        value: mockStdin,
        writable: true,
        configurable: true,
    });
    return mockStdin;
};

describe('getInputText', () => {
  const tempDir = path.join(process.cwd(), 'temp_test_files');

  beforeAll(async () => {
    await fs.mkdir(tempDir, { recursive: true });
  });

  afterAll(async () => {
    await fs.rm(tempDir, { recursive: true, force: true });
  });

  beforeEach(() => {
    // Clear all mocks and reset them to their original implementation
    jest.clearAllMocks();
    jest.restoreAllMocks();
    // Ensure stdin is reset before each test
    mockProcessStdin();
  });

  // Scenario: `-i <filepath>`: Read content from a local file.
  test('should read content from a local file', async () => {
    const testFilePath = path.join(tempDir, 'local-file.txt');
    const fileContent = 'Content from local file.';
    await fs.writeFile(testFilePath, fileContent);

    const result = await getInputText({ input: testFilePath });
    expect(result).toBe(fileContent);
  });

  test('should throw an error for a non-existent local file', async () => {
    const nonExistentPath = path.join(tempDir, 'non-existent.txt');
    await expect(getInputText({ input: nonExistentPath })).rejects.toThrow(
      `Failed to read file ${nonExistentPath}`
    );
  });

  test('should handle empty local file', async () => {
    const emptyFilePath = path.join(tempDir, 'empty-file.txt');
    await fs.writeFile(emptyFilePath, '');
    const result = await getInputText({ input: emptyFilePath });
    expect(result).toBe('');
  });
  
  // Scenario: `-i <url>`: Fetch content from a URL.
  test('should fetch content from a URL without rendering', async () => {
    const testUrl = 'http://example.com/data';
    const urlContent = 'Content from URL.';
    fetchUrl.mockResolvedValue(urlContent);

    const result = await getInputText({ input: testUrl });
    expect(result).toBe(urlContent);
    expect(fetchUrl).toHaveBeenCalledWith(testUrl);
    expect(renderUrl).not.toHaveBeenCalled();
  });

  test('should fetch content from a URL with rendering when options.render is true', async () => {
    const testUrl = 'http://example.com/rendered';
    const renderedContent = 'Rendered Content from URL.';
    renderUrl.mockResolvedValue(renderedContent);

    const result = await getInputText({ input: testUrl, render: true });
    expect(result).toBe(renderedContent);
    expect(renderUrl).toHaveBeenCalledWith(testUrl);
    expect(fetchUrl).not.toHaveBeenCalled();
  });

  test('should throw an error for a failed URL fetch', async () => {
    const testUrl = 'http://example.com/bad-url';
    fetchUrl.mockRejectedValue(new Error('Network Error'));

    await expect(getInputText({ input: testUrl })).rejects.toThrow(
      `Failed to fetch URL ${testUrl}`
    );
  });

  // Scenario: `-i stdin`: Read content from standard input (piped).
  test('should read content from stdin when no input option is provided', async () => {
    const stdinContent = 'Hello from stdin!';
    // Simulate stdin data
    const stdinMock = process.stdin;
    stdinMock.isTTY = false; // Important for getStdin to read from it
    stdinMock.on.mock.calls.forEach(([event, handler]) => {
      if (event === 'data') {
        handler(Buffer.from(stdinContent));
      } else if (event === 'end') {
        handler();
      }
    });

    const result = await getInputText({});
    expect(result).toBe(stdinContent);
  });

  test('should return empty string if stdin is a TTY and no input is provided', async () => {
    const stdinMock = process.stdin;
    stdinMock.isTTY = true;
    const result = await getInputText({});
    expect(result).toBe('');
  });

  test('should return empty string if stdin is empty', async () => {
    const stdinMock = process.stdin;
    stdinMock.isTTY = false;
    // Simulate an immediate end to stdin without data
    stdinMock.on.mock.calls.forEach(([event, handler]) => {
      if (event === 'end') {
        handler();
      }
    });
    const result = await getInputText({});
    expect(result).toBe('');
  });
});