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
 * - Collapses multiple spaces within lines
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
  
  // Step 5: Preserve indentation but remove excess spaces at the beginning of lines
  compressed = compressed.replace(/^[ \t]+/gm, (match) => {
    // Convert tabs to spaces (4 spaces per tab) and normalize indentation
    const normalizedIndent = match.replace(/\t/g, '    ');
    // If indentation is more than 20 spaces, reduce it to preserve structure but save space
    if (normalizedIndent.length > 20) {
      return '    '.repeat(Math.min(5, Math.floor(normalizedIndent.length / 4)));
    }
    return normalizedIndent;
  });
  
  return compressed;
}

/**
 * Aggressively compresses text for maximum token reduction
 * This is a more aggressive version that removes most formatting
 * Use when maximum token reduction is needed and formatting is less important
 * 
 * @param {string} text - The text to compress
 * @returns {string} - Heavily compressed text
 */
export function compressTextAggressive(text) {
  if (!text) return text;
  
  // Step 1: Normalize all whitespace (collapse all whitespace sequences to a single space)
  let compressed = text.replace(/\s+/g, ' ');
  
  // Step 2: Preserve basic structure (add newlines after periods, question marks, and exclamation points)
  compressed = compressed.replace(/([.!?]) /g, '$1\n');
  
  // Step 3: Remove any leading/trailing whitespace
  compressed = compressed.trim();
  
  return compressed;
}