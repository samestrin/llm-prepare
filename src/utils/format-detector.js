/**
 * Format Detector module - Detects input format based on content analysis
 */

/**
 * Detects the format of the provided text
 * @param {string} text - Text to analyze
 * @return {string} Detected format: 'html', 'markdown', or 'text'
 */
export function detectFormat(text) {
    // Trim the text to remove leading/trailing whitespace
    const trimmedText = text.trim();
    
    // Check for HTML
    if (isHtml(trimmedText)) {
      return 'html';
    }
    
    // Check for Markdown
    if (isMarkdown(trimmedText)) {
      return 'markdown';
    }
    
    // Default to plain text
    return 'text';
  }
  
  /**
   * Checks if the text appears to be HTML
   * @param {string} text - Text to analyze
   * @return {boolean} True if the text appears to be HTML
   */
  function isHtml(text) {
    // Check for common HTML tags
    const htmlRegex = /<(html|body|div|p|h[1-6]|ul|ol|table|a|img|script|style)[>\s]/i;
    
    // Check for HTML doctype
    const doctypeRegex = /<!DOCTYPE\s+html>/i;
    
    return htmlRegex.test(text) || doctypeRegex.test(text);
  }
  
  /**
   * Checks if the text appears to be Markdown
   * @param {string} text - Text to analyze
   * @return {boolean} True if the text appears to be Markdown
   */
  function isMarkdown(text) {
    // Split text into lines for analysis
    const lines = text.split('\n');
    
    // Counter for markdown features
    let markdownFeatures = 0;
    
    // Common markdown patterns
    const headerRegex = /^#{1,6}\s+/;
    const listRegex = /^[\*\-\+]\s+/;
    const numberedListRegex = /^\d+\.\s+/;
    const blockquoteRegex = /^>\s+/;
    const codeBlockRegex = /^```/;
    const linkRegex = /\[.+?\]\(.+?\)/;
    const emphasisRegex = /(\*\*|__).+?(\*\*|__)/;
    const italicsRegex = /(\*|_).+?(\*|_)/;
    
    // Check each line for markdown features
    for (const line of lines) {
      if (headerRegex.test(line)) markdownFeatures++;
      if (listRegex.test(line)) markdownFeatures++;
      if (numberedListRegex.test(line)) markdownFeatures++;
      if (blockquoteRegex.test(line)) markdownFeatures++;
      if (codeBlockRegex.test(line)) markdownFeatures++;
      if (linkRegex.test(line)) markdownFeatures++;
      if (emphasisRegex.test(line)) markdownFeatures++;
      if (italicsRegex.test(line)) markdownFeatures++;
      
      // Early return if we've found enough markdown features
      if (markdownFeatures >= 3) {
        return true;
      }
    }
    
    // If we have at least 2 markdown features, consider it markdown
    return markdownFeatures >= 2;
  }