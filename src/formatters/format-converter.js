/**
 * Format Converter Module
 * 
 * Handles conversion between different text formats:
 * - HTML to plain text
 * - HTML to markdown
 * - Markdown to plain text
 * - Markdown to HTML
 */

import { htmlToText } from 'html-to-text';
import MarkdownIt from 'markdown-it';
import TurndownService from 'turndown';

// Initialize markdown parser and HTML converter
const md = new MarkdownIt();
const turndownService = new TurndownService({
  headingStyle: 'atx',
  codeBlockStyle: 'fenced'
});

/**
 * Convert text from one format to another
 * @param {string} text - Input text to convert
 * @param {string} format - Target format ('text', 'markdown', 'html')
 * @param {Object} options - Additional conversion options
 * @returns {Promise<string>} - Converted text
 */
export async function convertFormat(text, format, options = {}) {
  const { debug = false } = options;
  
  if (!text) return '';
  
  // Detect input format (best guess)
  const inputFormat = detectFormat(text);
  
  if (debug) {
    console.error(`Debug: Detected input format as '${inputFormat}'`);
    console.error(`Debug: Converting to '${format}'`);
  }
  
  // If input and output formats are the same, return original text
  if (inputFormat === format) {
    return text;
  }
  
  // Convert based on input and target formats
  switch (inputFormat) {
    case 'html':
      switch (format) {
        case 'text':
          return htmlToPlainText(text, options);
        case 'markdown':
          return htmlToMarkdown(text, options);
        default:
          throw new Error(`Unsupported conversion: ${inputFormat} to ${format}`);
      }
    
    case 'markdown':
      switch (format) {
        case 'text':
          return markdownToPlainText(text, options);
        case 'html':
          return markdownToHtml(text, options);
        default:
          throw new Error(`Unsupported conversion: ${inputFormat} to ${format}`);
      }
    
    case 'text':
      switch (format) {
        case 'html':
          // Simple wrapping with pre tag for plain text to HTML
          return `<pre>${escapeHtml(text)}</pre>`;
        case 'markdown':
          // For plain text to markdown, we just need to escape markdown special chars
          return escapeMarkdown(text);
        default:
          throw new Error(`Unsupported conversion: ${inputFormat} to ${format}`);
      }
    
    default:
      throw new Error(`Unsupported input format: ${inputFormat}`);
  }
}

/**
 * Attempt to detect the format of input text
 * @param {string} text - Text to analyze
 * @returns {string} - Detected format ('html', 'markdown', or 'text')
 */
function detectFormat(text) {
  // Check for HTML tags
  if (/<\/?[a-z][\s\S]*>/i.test(text)) {
    return 'html';
  }
  
  // Check for common markdown patterns
  const markdownPatterns = [
    /^#+\s+/m,                              // Headers
    /\[.+\]\(.+\)/,                         // Links
    /!\[.+\]\(.+\)/,                        // Images
    /^-\s+.+/m,                             // List items
    /^>\s+.+/m,                             // Blockquotes
    /`{1,3}[\s\S]*?`{1,3}/,                 // Code blocks
    /(?:\*\*|__).+(?:\*\*|__)/,             // Bold text
    /(?:\*|_).+(?:\*|_)/,                   // Italic text
    /~~.+~~/,                               // Strikethrough
    /^\|.*\|.*\|/m,                         // Tables
    /^(?:-{3,}|\*{3,}|_{3,})$/m             // Horizontal rules
  ];
  
  // If text matches any markdown patterns, consider it markdown
  if (markdownPatterns.some(pattern => pattern.test(text))) {
    return 'markdown';
  }
  
  // Default to plain text if no specific format detected
  return 'text';
}

/**
 * Convert HTML to plain text
 * @param {string} html - HTML content to convert
 * @param {Object} options - Conversion options
 * @returns {string} - Plain text version
 */
function htmlToPlainText(html, options = {}) {
  const htmlToTextOptions = {
    wordwrap: null, // Disable word wrapping
    selectors: [
      { selector: 'a', options: { hideLinkHrefIfSameAsText: true } },
      { selector: 'img', format: 'skip' }
    ]
  };
  
  return htmlToText(html, htmlToTextOptions);
}

/**
 * Convert HTML to markdown
 * @param {string} html - HTML content to convert
 * @param {Object} options - Conversion options
 * @returns {string} - Markdown version
 */
function htmlToMarkdown(html, options = {}) {
  return turndownService.turndown(html);
}

/**
 * Convert markdown to HTML
 * @param {string} markdown - Markdown content to convert
 * @param {Object} options - Conversion options
 * @returns {string} - HTML version
 */
function markdownToHtml(markdown, options = {}) {
  return md.render(markdown);
}

/**
 * Convert markdown to plain text
 * @param {string} markdown - Markdown content to convert
 * @param {Object} options - Conversion options
 * @returns {string} - Plain text version
 */
function markdownToPlainText(markdown, options = {}) {
  // First convert to HTML, then to plain text to handle all markdown elements
  const html = markdownToHtml(markdown, options);
  return htmlToPlainText(html, options);
}

/**
 * Escape HTML special characters
 * @param {string} text - Text to escape
 * @returns {string} - Escaped HTML
 */
function escapeHtml(text) {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

/**
 * Escape markdown special characters
 * @param {string} text - Text to escape
 * @returns {string} - Escaped markdown
 */
function escapeMarkdown(text) {
  return text
    .replace(/([\\`*_{}[\]()#+\-.!])/g, '\\$1');
}