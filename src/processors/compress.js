/**
 * Text compression module
 * 
 * Provides functionality to compress text by removing excessive whitespace
 * while maintaining readability. This helps reduce token usage when
 * sending text to LLMs.
 */

/**
 * Compresses text by removing excessive whitespace
 * - Reduces multiple newlines to a maximum of two
 * - Removes trailing whitespace on each line
 * - Preserves indentation at the start of lines
 * 
 * @param {string} text - The text to compress
 * @returns {string} - Compressed text with reduced whitespace
 */
export function compressText(text) {
  if (!text) return text;
  
  // Step 1: Normalize line endings
  let compressed = text.replace(/\r\n/g, '\n');
  
  // Step 2: Replace more than two consecutive newlines with just two
  compressed = compressed.replace(/\n{3,}/g, '\n\n');
  
  // Step 3: Remove trailing whitespace on each line
  compressed = compressed.replace(/[ \t]+$/gm, '');
  
  // Step 4: Collapse multiple spaces to a single space (except at line start for indentation)
  compressed = compressed.replace(/([^\n\s])[ \t]{2,}/g, '$1 ');
  
  return compressed;
}