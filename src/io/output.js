/**
 * Output module - Handles writing to different destinations
 */

import fs from 'fs/promises';

/**
 * Writes output to the specified destination
 * @param {string} text - The text to write
 * @param {string|null} outputPath - Path to the output file (null for stdout)
 * @return {Promise<void>}
 */
export async function writeOutput(text, outputPath) {
  // Write to stdout if no output path specified
  if (!outputPath) {
    process.stdout.write(text);
    return;
  }
  
  // Write to file
  try {
    await fs.writeFile(outputPath, text, 'utf8');
  } catch (error) {
    throw new Error(`Failed to write to file ${outputPath}: ${error.message}`);
  }
}