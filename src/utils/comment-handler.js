/**
 * Comment Handler Utility
 * 
 * Provides functionality for detecting and handling comments in different file types.
 * Supports common programming languages and their comment styles.
 */

/**
 * Get the comment pattern for a specific file type
 * @param {string} filePath - Path to the file
 * @returns {Object} Comment pattern information for the file type
 */
export function getCommentPattern(filePath) {
  const fileExtension = filePath.split('.').pop().toLowerCase();
  
  // Define comment patterns for common file types
  const patterns = {
    // C-style languages
    'js': { line: '//', block: { start: '/*', end: '*/' } },
    'ts': { line: '//', block: { start: '/*', end: '*/' } },
    'jsx': { line: '//', block: { start: '/*', end: '*/' } },
    'tsx': { line: '//', block: { start: '/*', end: '*/' } },
    'c': { line: '//', block: { start: '/*', end: '*/' } },
    'cpp': { line: '//', block: { start: '/*', end: '*/' } },
    'cs': { line: '//', block: { start: '/*', end: '*/' } },
    'java': { line: '//', block: { start: '/*', end: '*/' } },
    'go': { line: '//', block: { start: '/*', end: '*/' } },
    'swift': { line: '//', block: { start: '/*', end: '*/' } },
    'kt': { line: '//', block: { start: '/*', end: '*/' } },
    'scala': { line: '//', block: { start: '/*', end: '*/' } },
    
    // Script languages
    'py': { line: '#', block: { start: '"""', end: '"""' } },
    'rb': { line: '#', block: { start: '=begin', end: '=end' } },
    'pl': { line: '#', block: { start: '=pod', end: '=cut' } },
    'sh': { line: '#', block: null },
    'bash': { line: '#', block: null },
    'zsh': { line: '#', block: null },
    
    // Markup and template languages
    'html': { line: null, block: { start: '<!--', end: '-->' } },
    'xml': { line: null, block: { start: '<!--', end: '-->' } },
    'svg': { line: null, block: { start: '<!--', end: '-->' } },
    'php': { line: '//', block: { start: '/*', end: '*/' } },
    
    // Config files
    'json': { line: null, block: null }, // JSON doesn't support comments officially
    'yml': { line: '#', block: null },
    'yaml': { line: '#', block: null },
    'toml': { line: '#', block: null },
    'ini': { line: ';', block: null },
    
    // Other languages
    'sql': { line: '--', block: { start: '/*', end: '*/' } },
    'r': { line: '#', block: null },
    'md': { line: null, block: null }, // Markdown doesn't have traditional comments
    'css': { line: null, block: { start: '/*', end: '*/' } },
    'scss': { line: '//', block: { start: '/*', end: '*/' } },
    'less': { line: '//', block: { start: '/*', end: '*/' } },
    'rust': { line: '//', block: { start: '/*', end: '*/' } },
    'dart': { line: '//', block: { start: '/*', end: '*/' } },
  };
  
  // Default to C-style comments if extension is unknown
  return patterns[fileExtension] || { line: '//', block: { start: '/*', end: '*/' } };
}

/**
 * Get the appropriate comment style for a file header based on file type
 * @param {string} filePath - Path to the file
 * @param {string} [overrideStyle] - Optional override comment style
 * @returns {string} Comment style to use for the file header
 */
export function getFileHeaderCommentStyle(filePath, overrideStyle) {
  // If an override style is provided, use it
  if (overrideStyle) {
    return overrideStyle;
  }
  
  const fileExtension = filePath.split('.').pop().toLowerCase();
  
  // Map file extensions to appropriate comment styles
  const commentStyles = {
    // C-style languages
    'js': '//',
    'ts': '//',
    'jsx': '//',
    'tsx': '//',
    'c': '//',
    'cpp': '//',
    'cs': '//',
    'java': '//',
    'go': '//',
    'swift': '//',
    'kt': '//',
    'scala': '//',
    
    // Script languages
    'py': '#',
    'rb': '#',
    'pl': '#',
    'sh': '#',
    'bash': '#',
    'zsh': '#',
    
    // Markup and template languages
    'html': '<!--',
    'xml': '<!--',
    'svg': '<!--',
    'php': '//',
    
    // Config files
    'json': '//',  // Not standard but common in documentation
    'yml': '#',
    'yaml': '#',
    'toml': '#',
    'ini': ';',
    
    // Other languages
    'sql': '--',
    'r': '#',
    'md': '<!--',  // HTML comments work in Markdown
    'css': '/*',
    'scss': '//',
    'less': '//',
    'rust': '//',
    'dart': '//',
  };
  
  // Default to double-slash comment style if extension is unknown
  return commentStyles[fileExtension] || '//';
}

/**
 * Remove comments from a file's content
 * @param {string} content - The file content
 * @param {string} filePath - Path to the file
 * @returns {string} - Content with comments removed
 */
export function removeComments(content, filePath) {
  const pattern = getCommentPattern(filePath);
  
  // If no comment patterns defined for this file type, return content as is
  if (!pattern.line && (!pattern.block || !pattern.block.start)) {
    return content;
  }
  
  let result = content;
  
  // Remove block comments if supported by this file type
  if (pattern.block && pattern.block.start && pattern.block.end) {
    const blockCommentRegex = new RegExp(
      `${escapeRegExp(pattern.block.start)}[\\s\\S]*?${escapeRegExp(pattern.block.end)}`,
      'g'
    );
    result = result.replace(blockCommentRegex, '');
  }
  
  // Remove line comments if supported by this file type
  if (pattern.line) {
    const lineCommentRegex = new RegExp(`${escapeRegExp(pattern.line)}.*$`, 'gm');
    result = result.replace(lineCommentRegex, '');
  }
  
  // Remove any consecutive empty lines resulting from comment removal
  result = result.replace(/\n{3,}/g, '\n\n');
  
  return result;
}

/**
 * Escape special characters in a string for use in a regular expression
 * @param {string} string - String to escape
 * @returns {string} - Escaped string
 */
function escapeRegExp(string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}