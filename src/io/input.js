/**
 * Input module - Handles reading from different sources
 */

import fs from 'fs/promises';
import { Readable } from 'stream';
import { fetchUrl } from './url-fetcher.js';
import { renderUrl } from './browser-renderer.js';

/**
 * Reads from standard input
 * @return {Promise<string>} The text from stdin
 */
async function getStdin() {
  let result = '';
  const stdin = process.stdin;
  
  // If stdin is not a TTY, read from it
  if (!stdin.isTTY) {
    for await (const chunk of stdin) {
      result += chunk;
    }
    return result;
  }
  
  // Otherwise, return empty string
  return '';
}

/**
 * Reads from a file
 * @param {string} filePath - Path to the file
 * @return {Promise<string>} The text from the file
 */
async function getFile(filePath) {
  try {
    return await fs.readFile(filePath, 'utf8');
  } catch (error) {
    throw new Error(`Failed to read file ${filePath}: ${error.message}`);
  }
}

/**
 * Reads from a URL
 * @param {string} url - The URL to fetch
 * @param {Object} options - Options object
 * @param {boolean} options.render - Whether to use browser rendering
 * @return {Promise<string>} The text from the URL
 */
async function getUrl(url, options = {}) {
  try {
    if (options.render) {
      return await renderUrl(url);
    } else {
      return await fetchUrl(url);
    }
  } catch (error) {
    throw new Error(`Failed to fetch URL ${url}: ${error.message}`);
  }
}

/**
 * Gets text from the specified input source
 * @param {Object} options - Options object
 * @param {string} options.input - Input source (file, URL, or stdin)
 * @param {boolean} options.render - Whether to use browser rendering for URLs
 * @return {Promise<string>} The text from the input source
 */
export async function getInputText(options) {
  const { input, render } = options;
  
  // No input specified, try to read from stdin
  if (!input) {
    return await getStdin();
  }
  
  // Input is a URL
  if (input.startsWith('http://') || input.startsWith('https://')) {
    return await getUrl(input, { render });
  }
  
  // Input is a file
  return await getFile(input);
}