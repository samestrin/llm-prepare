#!/usr/bin/env node

const fs = require('fs-extra');
const path = require('path');
const ignore = require('ignore');
const yargs = require('yargs/yargs');
const { hideBin } = require('yargs/helpers');

// Set up command line arguments
const argv = yargs(hideBin(process.argv))
  .option('path-name', {
    alias: 'p',
    describe: 'Path to the project directory',
    type: 'string',
    demandOption: true
  })
  .option('files', {
    alias: 'f',
    describe: 'Pattern of files to include',
    type: 'string',
    demandOption: true
  })
  .argv;

// Variables to hold content and layout
let singleFileOutput = '';
let layout = '';

/**
 * Reads .ignore files from a given directory and constructs an ignore object to manage ignored files.
 *
 * @param {string} dir - Directory to search for .ignore files
 * @returns {Promise<ignore>} The ignore object with the loaded ignore rules
 * @throws {Error} If reading from the directory fails
 *
 * @example
 * readIgnoreFiles('/path/to/dir').then(ig => console.log('Ignore object created'));
 */
async function readIgnoreFiles(dir) {
  try {
    const ig = ignore();
    const ignoreFiles = await fs.readdir(dir);
    ignoreFiles.filter(file => file.endsWith('.ignore')).forEach(file => {
      const ignoreContent = fs.readFileSync(path.join(dir, file)).toString();
      ig.add(ignoreContent.split('\n'));
    });
    return ig;
  } catch (error) {
    throw new Error('Failed to read ignore files: ' + error.message);
  }
}

/**
 * Recursively processes directories to build a file layout and accumulate file contents based on specified file patterns.
 *
 * @param {string} dir - Directory to process
 * @param {string} [baseDir=dir] - Base directory for relative path calculations
 * @returns {Promise<void>}
 * @throws {Error} If directory traversal or file operations fail
 *
 * @example
 * processDirectory('/path/to/project', '/path/to').catch(console.error);
 */
async function processDirectory(dir, baseDir = dir) {
  try {
    const ig = await readIgnoreFiles(dir);
    const entries = await fs.readdir(dir);
    const ignoredEntries = ig.filter(entries);
    for (const entry of ignoredEntries) {
      const entryPath = path.join(dir, entry);
      const stats = await fs.stat(entryPath);
      if (stats.isDirectory()) {
        layout += '│   '.repeat(dir.split(path.sep).length - baseDir.split(path.sep).length) + '├── ' + entry + '/\n';
        await processDirectory(entryPath, baseDir);
      } else if (stats.isFile() && entry.match(argv.files)) {
        layout += '│   '.repeat(dir.split(path.sep).length - baseDir.split(path.sep).length) + '└── ' + entry + '\n';
        let content = await fs.readFile(entryPath, 'utf8');
        content = content.replace(/\/\/.*|\/\*[\s\S]*?\*\//g, ''); // Remove JS comments
        content = content.replace(/\s+/g, ' '); // Reduce whitespace
        singleFileOutput += `// File: ${path.relative(baseDir, entryPath)}\n` + content + '\n\n';
      }
    }
  } catch (error) {
    throw new Error('Failed to process directory: ' + error.message);
  }
}

/**
 * Main function to initiate directory processing based on command line arguments.
 *
 * @returns {Promise<void>}
 * @throws {Error} If the main process fails
 *
 * @example
 * main().catch(console.error);
 */
async function main() {
  try {
    layout += '/' + path.basename(argv['path-name']) + '\n';
    await processDirectory(argv['path-name']);
    singleFileOutput = layout + singleFileOutput;
    console.log(singleFileOutput);
  } catch (error) {
    console.error('Error during main execution: ' + error.message);
  }
}

main().catch(console.error);
