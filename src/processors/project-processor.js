/**
 * Project Directory Processor
 * 
 * Handles recursive directory traversal and content aggregation from project directories.
 * Supports file pattern matching, comment handling, and layout view generation.
 */

import fs from 'fs/promises';
import path from 'path';
import { globSync } from 'glob';
import { removeComments, getFileHeaderCommentStyle } from '../utils/comment-handler.js';

/**
 * Process a project directory and aggregate content from matching files
 * @param {Object} options - Processing options
 * @param {string} options.projectPath - Path to the project directory
 * @param {string} options.filePattern - Glob pattern for matching files (default: '*')
 * @param {boolean} options.suppressLayout - Whether to suppress the ASCII layout view
 * @param {boolean} options.includeComments - Whether to include comments in output
 * @param {string} options.commentStyle - Style for file headers in output
 * @param {boolean} options.debug - Enable debug output
 * @returns {Promise<string>} - Aggregated content from matching files
 */
export async function processProjectDirectory(options) {
  const {
    projectPath,
    filePattern = '*',
    suppressLayout = false, 
    includeComments = false,
    commentStyle = '//',
    debug = false
  } = options;

  if (debug) {
    console.error(`Debug: Processing project directory: ${projectPath}`);
    console.error(`Debug: File pattern: ${filePattern}`);
  }

  // Verify the project path exists
  try {
    const stats = await fs.stat(projectPath);
    if (!stats.isDirectory()) {
      throw new Error(`Project path is not a directory: ${projectPath}`);
    }
  } catch (error) {
    throw new Error(`Invalid project path: ${error.message}`);
  }

  // Find all matching files using glob pattern
  const globPattern = path.join(projectPath, '**', filePattern);
  const files = globSync(globPattern, { 
    dot: true,
    nodir: true,
    ignore: ['**/node_modules/**', '**/.git/**'] // Default ignores
  });

  if (debug) {
    console.error(`Debug: Found ${files.length} matching files`);
  }

  if (files.length === 0) {
    throw new Error(`No files found matching pattern: ${filePattern} in ${projectPath}`);
  }

  // Generate ASCII layout view if not suppressed
  let output = '';
  if (!suppressLayout) {
    output += generateLayoutView(projectPath, files) + '\n\n';
  }

  // Process each file and aggregate content
  for (const file of files) {
    const relativePath = path.relative(projectPath, file);
    const content = await fs.readFile(file, 'utf8');
    
    // Process content based on options (handle comments)
    const processedContent = includeComments 
      ? content 
      : removeComments(content, file);
    
    // Get dynamic comment style for file header based on file type
    const headerCommentStyle = commentStyle || getFileHeaderCommentStyle(file);
    
    // Add file header with the appropriate comment style
    output += `${headerCommentStyle} FILE: ${relativePath}\n`;
    output += processedContent + '\n\n';
  }

  return output;
}

/**
 * Generate an ASCII layout view of the project structure
 * @param {string} projectPath - Root path of the project
 * @param {string[]} files - List of files to include in the layout
 * @returns {string} - ASCII layout representation
 */
function generateLayoutView(projectPath, files) {
  const layout = [`Project structure for: ${path.basename(projectPath)}`, '```'];
  
  // Create a map of directories and their files
  const dirMap = new Map();
  
  // Process all files to build the directory structure
  files.forEach(file => {
    const relativePath = path.relative(projectPath, file);
    const dirName = path.dirname(relativePath);
    
    if (dirName === '.') {
      // Root level files
      if (!dirMap.has('.')) {
        dirMap.set('.', []);
      }
      dirMap.get('.').push(path.basename(file));
    } else {
      // Nested files
      if (!dirMap.has(dirName)) {
        dirMap.set(dirName, []);
        
        // Ensure parent directories exist in the map
        let parent = dirName;
        while (parent !== '.') {
          parent = path.dirname(parent);
          if (!dirMap.has(parent)) {
            dirMap.set(parent, []);
          }
        }
      }
      dirMap.get(dirName).push(path.basename(file));
    }
  });
  
  // Sort directories to ensure consistent output
  const sortedDirs = Array.from(dirMap.keys()).sort();
  
  // Build the ASCII tree
  sortedDirs.forEach(dir => {
    if (dir === '.') {
      dirMap.get(dir).sort().forEach(file => {
        layout.push(`├── ${file}`);
      });
    } else {
      const depth = dir.split(path.sep).length;
      const indent = '│   '.repeat(depth - 1);
      const dirName = path.basename(dir);
      
      layout.push(`${indent}├── ${dirName}/`);
      
      dirMap.get(dir).sort().forEach(file => {
        layout.push(`${indent}│   ├── ${file}`);
      });
    }
  });
  
  layout.push('```');
  return layout.join('\n');
}