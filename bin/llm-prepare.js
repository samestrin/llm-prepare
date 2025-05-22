#!/usr/bin/env node

import { program } from 'commander';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { processText } from '../src/index.js';
import { loadConfigFile, mergeArguments } from '../src/utils/config.js';

// Load environment variables
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const packagePath = path.join(__dirname, '../package.json');
const packageJson = JSON.parse(fs.readFileSync(packagePath, 'utf8'));

/**
 * Configure and run the CLI program
 */
async function runCli() {
  program
    .name('llm-prepare')
    .description('A utility to prepare text for LLM consumption')
    .version(packageJson.version, '-v, --version');

  program
    .option('-i, --input <source>', 'Input source (file, url, or stdin)')
    .option('-o, --output <file>', 'Output file (defaults to stdout)')
    .option('-f, --format <format>', 'Format the input (markdown, html, text)')
    .option('-m, --max-tokens <number>', 'Maximum tokens to include', parseInt)
    .option('--prompt <file>', 'Prompt template file')
    .option('--variables <json>', 'JSON string of variables for the prompt template')
    .option('-t, --truncate <strategy>', 'Truncation strategy (start, end, middle)')
    .option('-r, --render', 'Render content with a browser for JavaScript-heavy sites')
    .option('-d, --debug', 'Enable debug output')
    .option('-s, --system <message>', 'System message to prepend')
    .option('-u, --user <message>', 'User message to append')
    .option('-c, --compress', 'Compress output by removing excessive whitespace')
    .option('--config <filepath>', 'Path to the JSON configuration file')
    .option('-p, --project-path <directoryPath>', 'Path to the project directory to process')
    .option('--file-pattern <pattern>', 'Glob pattern for matching files (default: *)')
    .option('--no-layout', 'Suppress the ASCII layout view of the project structure')
    .option('--include-comments', 'Include comments in the output (default: false)')
    .option('--comment-style <style>', 'Comment style for file headers (default: //)')
    .option('--ignore-gitignore', 'Disable processing of .gitignore files')
    .option('--custom-ignore-string <patterns>', 'Comma-separated ignore patterns')
    .option('--custom-ignore-filename <filepath>', 'Path to a custom ignore file')
    .option('--default-ignore <filepath>', 'Path to a default ignore file')
    .option('--show-default-ignore', 'Display the default ignore patterns')
    .option('--show-templates', 'Show available templates in your browser')
    .option('--chunk-size <kilobytes>', 'Maximum size in KB for each output file (creates multiple files if needed)', parseInt)
    .option('--folder-output-level <depth>', 'Generate output files at the specified directory depth level or for all subdirectories (number or "all")')
    .parse(process.argv);

  let options = program.opts();
  
  // If config option is provided, load and merge the config with CLI options
  if (options.config) {
    try {
      const configOptions = await loadConfigFile(options.config);
      options = mergeArguments(options, configOptions);
      
      if (options.debug) {
        console.error('Debug: Loaded configuration from:', options.config);
      }
    } catch (error) {
      console.error(`Error loading config file: ${error.message}`);
      if (options.debug) {
        console.error(error.stack);
      }
      process.exit(1);
    }
  }
  
  // Validate folder-output-level option
  if (options.folderOutputLevel !== undefined) {
    // Check if output option is provided
    if (!options.output) {
      console.error('Error: When using --folder-output-level, the -o, --output option is required to specify the output filename.');
      process.exit(1);
    }
    
    // Handle both numeric and 'all' values for folderOutputLevel
    if (options.folderOutputLevel !== 'all') {
      // Parse as integer if not 'all'
      options.folderOutputLevel = parseInt(options.folderOutputLevel, 10);
      
      // Ensure folderOutputLevel is a non-negative integer
      if (isNaN(options.folderOutputLevel) || options.folderOutputLevel < 0) {
        console.error('Error: --folder-output-level must be a non-negative integer or "all".');
        process.exit(1);
      }
    }
  }
  
  // Display default ignore patterns if requested
  if (options.showDefaultIgnore) {
    const { getDefaultIgnorePatterns } = await import('../src/utils/ignore-handler.js');
    console.log('Default ignore patterns:');
    console.log(getDefaultIgnorePatterns().join('\n'));
    process.exit(0);
  }
  
  // Show templates in browser if requested
  if (options.showTemplates) {
    try {
      const open = (await import('open')).default;
      await open('https://github.com/samestrin/llm-prepare/blob/main/templates/README.md');
      console.log('Opening templates documentation in your browser...');
      process.exit(0);
    } catch (error) {
      console.error('Error opening browser:', error.message);
      if (options.debug) {
        console.error(error.stack);
      }
      process.exit(1);
    }
  }
  
  // Run the main processing with the merged options
  processText(options)
    .catch((error) => {
      console.error('Error:', error.message);
      if (options.debug) {
        console.error(error.stack);
      }
      process.exit(1);
    });
}

runCli();