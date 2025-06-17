/**
 * Text truncation module
 * 
 * Provides functionality to truncate text to fit within token limits
 * using different strategies (start, end, middle).
 */

import { estimateTokenCount } from '../utils/token-counter.js';

/**
 * Truncates text to fit within a specified token limit
 * @param {string} text - The text to truncate
 * @param {number} maxTokens - Maximum number of tokens to include
 * @param {string} strategy - Truncation strategy ('start', 'end', 'middle')
 * @returns {string} - Truncated text that fits within token limit
 */
export function truncateText(text, maxTokens, strategy = 'end') {
  if (!text) return text;
  
  // Estimate current token count
  const currentTokens = estimateTokenCount(text);
  
  // If already under the limit, return unchanged
  if (currentTokens <= maxTokens) {
    return text;
  }
  
  // Validate strategy
  if (!['start', 'end', 'middle'].includes(strategy)) {
    throw new Error(`Invalid truncation strategy: ${strategy}. Must be 'start', 'end', or 'middle'`);
  }
  
  // Apply different truncation strategies
  switch (strategy) {
    case 'start':
      return truncateFromStart(text, maxTokens);
    case 'end':
      return truncateFromEnd(text, maxTokens);
    case 'middle':
      return truncateFromMiddle(text, maxTokens);
    default:
      // This should never happen due to validation above
      return truncateFromEnd(text, maxTokens);
  }
}

/**
 * Truncates text from the start, keeping the end
 * @param {string} text - Text to truncate
 * @param {number} maxTokens - Maximum token count
 * @returns {string} - Truncated text
 */
function truncateFromStart(text, maxTokens) {
  // Split into lines for more natural truncation
  const lines = text.split('\n');
  let result = '';
  let currentTokens = 0;
  
  // Add an indicator that text was truncated
  const truncationIndicator = '[...Content truncated from beginning...]\n\n';
  const indicatorTokens = estimateTokenCount(truncationIndicator);
  
  // Reserve tokens for the truncation indicator
  const targetTokens = maxTokens - indicatorTokens;
  
  // Process lines from the end to the start
  for (let i = lines.length - 1; i >= 0; i--) {
    const line = lines[i];
    const lineTokens = estimateTokenCount(line + '\n');
    
    // Check if adding this line would exceed the limit
    if (currentTokens + lineTokens <= targetTokens) {
      // Add line to the beginning of result
      result = line + (result ? '\n' + result : '');
      currentTokens += lineTokens;
    } else {
      // We can't add more lines, break
      break;
    }
  }
  
  // Add the truncation indicator at the beginning
  return truncationIndicator + result;
}

/**
 * Truncates text from the end, keeping the start
 * @param {string} text - Text to truncate
 * @param {number} maxTokens - Maximum token count
 * @returns {string} - Truncated text
 */
function truncateFromEnd(text, maxTokens) {
  // Split into lines for more natural truncation
  const lines = text.split('\n');
  let result = '';
  let currentTokens = 0;
  
  // Add an indicator that text was truncated
  const truncationIndicator = '\n\n[...Content truncated from end...]';
  const indicatorTokens = estimateTokenCount(truncationIndicator);
  
  // Reserve tokens for the truncation indicator
  const targetTokens = maxTokens - indicatorTokens;
  
  // Process lines from the start
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const lineTokens = estimateTokenCount(line + '\n');
    
    // Check if adding this line would exceed the limit
    if (currentTokens + lineTokens <= targetTokens) {
      // Add line to result
      result += (result ? '\n' : '') + line;
      currentTokens += lineTokens;
    } else {
      // We can't add more lines, break
      break;
    }
  }
  
  // Add the truncation indicator at the end
  return result + truncationIndicator;
}

/**
 * Truncates text from the middle, keeping the start and end
 * @param {string} text - Text to truncate
 * @param {number} maxTokens - Maximum token count
 * @returns {string} - Truncated text
 */
function truncateFromMiddle(text, maxTokens) {
  // Split into lines for more natural truncation
  const lines = text.split('\n');
  
  // Add an indicator that text was truncated
  const truncationIndicator = '\n\n[...Content truncated from middle...]\n\n';
  const indicatorTokens = estimateTokenCount(truncationIndicator);
  
  // If maxTokens is too small to even fit the indicator, fallback to end truncation
  if (maxTokens <= indicatorTokens) {
    return truncateFromEnd(text, maxTokens);
  }
  
  // Reserve tokens for the truncation indicator
  const targetTokens = maxTokens - indicatorTokens;
  
  // Determine how many tokens to allocate to start and end
  const startTokens = Math.floor(targetTokens / 2);
  const endTokens = targetTokens - startTokens;
  
  // Get start portion
  let startText = '';
  let currentStartTokens = 0;
  let startIndex = 0;
  
  while (startIndex < lines.length) {
    const line = lines[startIndex];
    const lineTokens = estimateTokenCount(line + '\n');
    
    if (currentStartTokens + lineTokens <= startTokens) {
      startText += (startText ? '\n' : '') + line;
      currentStartTokens += lineTokens;
      startIndex++;
    } else {
      break;
    }
  }
  
  // Get end portion
  let endText = '';
  let currentEndTokens = 0;
  let endIndex = lines.length - 1;
  
  while (endIndex >= startIndex) {
    const line = lines[endIndex];
    const lineTokens = estimateTokenCount(line + '\n');
    
    if (currentEndTokens + lineTokens <= endTokens) {
      endText = line + (endText ? '\n' + endText : '');
      currentEndTokens += lineTokens;
      endIndex--;
    } else {
      break;
    }
  }
  
  // Combine start, indicator, and end
  return startText + truncationIndicator + endText;
}