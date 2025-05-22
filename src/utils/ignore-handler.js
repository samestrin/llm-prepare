/**
 * Utility module for handling file and directory ignore patterns.
 * Provides functionality similar to .gitignore for project processing.
 */

import fs from 'fs';
import path from 'path';
import ignore from 'ignore';

/**
 * Returns a list of default patterns to ignore during project processing.
 * @return {string[]} Array of default ignore patterns.
 */
export function getDefaultIgnorePatterns() {
  return [
    // Version control
    '.git',
    '.svn',
    '.hg',
    '.bzr',
    
    // Node.js
    'node_modules',
    'npm-debug.log',
    'package-lock.json',
    'yarn.lock',
    'yarn-error.log',
    
    // Build outputs
    'dist',
    'build',
    'out',
    'target',
    'coverage',
    
    // IDE and editor files
    '.idea',
    '.vscode',
    '.DS_Store',
    '*.swp',
    '*.swo',
    'Thumbs.db',
    
    // Common binary and large files
    '*.min.js',
    '*.min.css',
    '*.map',
    '*.bundle.js',
    '*.bundle.css',
    '*.png',
    '*.jpg',
    '*.jpeg',
    '*.gif',
    '*.ico',
    '*.svg',
    '*.woff',
    '*.woff2',
    '*.ttf',
    '*.eot',
    '*.pdf',
    '*.zip',
    '*.tar',
    '*.gz',
    '*.rar',
    
    // Log files
    '*.log',
    'logs',
    
    // Environment and config files that might contain secrets
    '.env',
    '.env.*',
    '*.pem',
    '*.key'
  ];
}

/**
 * Loads ignore patterns from a .gitignore file.
 * @param {string} projectPath - Path to the project directory.
 * @return {string[]} Array of ignore patterns from .gitignore.
 */
export function loadGitignorePatterns(projectPath) {
  const gitignorePath = path.join(projectPath, '.gitignore');
  
  if (fs.existsSync(gitignorePath)) {
    try {
      const content = fs.readFileSync(gitignorePath, 'utf8');
      return content
        .split('\n')
        .filter(line => line.trim() && !line.startsWith('#'));
    } catch (error) {
      console.error(`Error reading .gitignore file: ${error.message}`);
    }
  }
  
  return [];
}

/**
 * Loads ignore patterns from a custom ignore file.
 * @param {string} filePath - Path to the custom ignore file.
 * @return {string[]} Array of ignore patterns from the custom file.
 */
export function loadCustomIgnoreFile(filePath) {
  if (fs.existsSync(filePath)) {
    try {
      const content = fs.readFileSync(filePath, 'utf8');
      return content
        .split('\n')
        .filter(line => line.trim() && !line.startsWith('#'));
    } catch (error) {
      console.error(`Error reading custom ignore file: ${error.message}`);
    }
  }
  
  return [];
}

/**
 * Parses a comma-separated string of ignore patterns.
 * @param {string} patternsString - Comma-separated ignore patterns.
 * @return {string[]} Array of ignore patterns.
 */
export function parseIgnoreString(patternsString) {
  if (!patternsString) return [];
  
  return patternsString
    .split(',')
    .map(pattern => pattern.trim())
    .filter(Boolean);
}

/**
 * Creates an ignore filter function based on combined ignore patterns.
 * @param {Object} options - Configuration options.
 * @param {string} options.projectPath - Path to the project directory.
 * @param {boolean} options.ignoreGitignore - Whether to disable .gitignore processing.
 * @param {string} options.customIgnoreString - Comma-separated custom ignore patterns.
 * @param {string} options.customIgnoreFilename - Path to a custom ignore file.
 * @param {string} options.defaultIgnore - Path to a default ignore file.
 * @return {Function} A filter function that returns true for files to ignore.
 */
export function createIgnoreFilter(options) {
  const ig = ignore();
  
  // Add default ignore patterns
  ig.add(getDefaultIgnorePatterns());
  
  // Add patterns from .gitignore if not disabled
  if (!options.ignoreGitignore && options.projectPath) {
    ig.add(loadGitignorePatterns(options.projectPath));
  }
  
  // Add patterns from custom ignore string
  if (options.customIgnoreString) {
    ig.add(parseIgnoreString(options.customIgnoreString));
  }
  
  // Add patterns from custom ignore file
  if (options.customIgnoreFilename) {
    ig.add(loadCustomIgnoreFile(options.customIgnoreFilename));
  }
  
  // Add patterns from default ignore file
  if (options.defaultIgnore) {
    ig.add(loadCustomIgnoreFile(options.defaultIgnore));
  }
  
  // Return a filter function
  return (filePath) => {
    // Convert absolute path to relative path from project root
    const relativePath = path.relative(options.projectPath || '.', filePath);
    return ig.ignores(relativePath);
  };
}