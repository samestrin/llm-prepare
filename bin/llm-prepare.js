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
    .version(packageJson.version);

  program
    .option('-i, --input <source>', 'Input source (file, url, or stdin)')
    .option('-o, --output <file>', 'Output file (defaults to stdout)')
    .option('-f, --format <format>', 'Format the input (markdown, html, text)')
    .option('-m, --max-tokens <number>', 'Maximum tokens to include', parseInt)
    .option('-p, --prompt <file>', 'Prompt template file')
    .option('-v, --variables <json>', 'JSON string of variables for the prompt template')
    .option('-t, --truncate <strategy>', 'Truncation strategy (start, end, middle)')
    .option('-r, --render', 'Render content with a browser for JavaScript-heavy sites')
    .option('-d, --debug', 'Enable debug output')
    .option('-s, --system <message>', 'System message to prepend')
    .option('-u, --user <message>', 'User message to append')
    .option('--config <filepath>', 'Path to the JSON configuration file')
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