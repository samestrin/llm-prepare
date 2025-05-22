import { describe, test, expect } from '@jest/globals';
import { loadConfigFile, mergeArguments } from '../src/utils/config.js';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

// Get directory name
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const testConfigDir = path.join(__dirname, 'fixtures', 'config');

describe('Config file utilities', () => {

  describe('loadConfigFile', () => {
    test('loads valid config file', async () => {
      const validConfigPath = path.join(testConfigDir, 'valid-config.json');
      await fs.writeFile(validConfigPath, JSON.stringify({
        "args": {
            "output-filename": "output.txt",
            "compress": true
        },
        "include": ["./src/", "./lib/"]
    }));

      const config = await loadConfigFile(validConfigPath);
      expect(config).toEqual({ test: 'value' });

      // Clean up
      await fs.unlink(validConfigPath);
    });

    test('throws error for invalid JSON', async () => {
      const invalidConfigPath = path.join(testConfigDir, 'invalid-config.json');
      await fs.writeFile(invalidConfigPath, '{ invalid: json }');

      await expect(loadConfigFile(invalidConfigPath)).rejects.toThrow('Failed to load or parse config file');
      await fs.unlink(invalidConfigPath);
    });

    test('throws error for non-existent file', async () => {
      const nonExistentPath = path.join(testConfigDir, 'non-existent.json');
      await expect(loadConfigFile(nonExistentPath)).rejects.toThrow('Failed to load or parse config file');
    });

    test('throws error for empty file', async () => {
      const emptyConfigPath = path.join(testConfigDir, 'empty-config.json');
      await fs.writeFile(emptyConfigPath, '');

      await expect(loadConfigFile(emptyConfigPath)).rejects.toThrow('Failed to load or parse config file');
      await fs.unlink(emptyConfigPath);
    });
  });

  describe('mergeArguments', () => {
    test('merges config args with no CLI args', () => {
      const cliArgs = {};
      const configArgs = { args: { output: 'output.txt', compress: true } };

      const merged = mergeArguments(cliArgs, configArgs);
      expect(merged).toEqual({ output: 'output.txt', compress: true });
    });

    test('CLI args override config args', () => {
      const cliArgs = { output: 'cli-output.txt' };
      const configArgs = { args: { output: 'config-output.txt' } };

      const merged = mergeArguments(cliArgs, configArgs);
      expect(merged).toEqual({ output: 'cli-output.txt' });
    });

    test('preserves include array from config', () => {
      const cliArgs = { output: 'output.txt' };
      const configArgs = {
        args: { compress: true },
        include: ['path1', 'path2']
      };

      const merged = mergeArguments(cliArgs, configArgs);
      expect(merged).toEqual({
        output: 'output.txt',
        compress: true,
        include: ['path1', 'path2']
      });
    });

    test('returns empty object for empty args', () => {
      const merged = mergeArguments({}, {});
      expect(merged).toEqual({});
    });
  });
});