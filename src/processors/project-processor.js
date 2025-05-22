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
 * @param {number} options.folderOutputLevel - Directory depth level for output generation
 * @param {string} options.output - Output filename
 * @returns {Promise<string|Array<Object>>} - Aggregated content from matching files or array of folder outputs
 */
export async function processProjectDirectory(options) {
  const {
    projectPath,
    filePattern = '*',
    suppressLayout = false, 
    includeComments = false,
    commentStyle = '//',
    debug = false,
    folderOutputLevel,
    output
  } = options;

  if (debug) {
    console.error(`Debug: Processing project directory: ${projectPath}`);
    console.error(`Debug: File pattern: ${filePattern}`);
    if (folderOutputLevel !== undefined) {
      console.error(`Debug: Folder output level: ${folderOutputLevel}`);
    }
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

  // If folderOutputLevel is defined, process each target directory separately
  if (folderOutputLevel !== undefined) {
    return processByFolderLevel(projectPath, files, folderOutputLevel, options);
  }

  // Standard processing for single output
  // Generate ASCII layout view if not suppressed
  let singleOutput = '';
  if (!suppressLayout) {
    singleOutput += generateLayoutView(projectPath, files) + '\n\n';
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
    singleOutput += `${headerCommentStyle} FILE: ${relativePath}\n`;
    singleOutput += processedContent + '\n\n';
  }

  return singleOutput;
}

/**
 * Process project by folder level, generating separate outputs for each directory at the specified depth
 * @param {string} projectPath - Root path of the project
 * @param {string[]} allFiles - List of all files in the project
 * @param {number} targetDepth - Target directory depth level
 * @param {Object} options - Processing options
 * @returns {Promise<Array<Object>>} - Array of objects with directory path, content, and output filename
 */
async function processByFolderLevel(projectPath, allFiles, targetDepth, options) {
  const {
    suppressLayout = false,
    includeComments = false,
    commentStyle = '//',
    debug = false,
    output
  } = options;

  // Get the output filename from the output path
  const outputFilename = path.basename(output);
  
  // Get directories at the specified depth
  const targetDirs = getDirectoriesAtDepth(projectPath, allFiles, targetDepth);
  
  if (debug) {
    console.error(`Debug: Found ${targetDirs.length} directories at depth ${targetDepth}`);
    console.error(`Debug: Target directories: ${targetDirs.join(', ')}`);
  }
  
  if (targetDirs.length === 0) {
    console.warn(`Warning: No directories found at depth level ${targetDepth}`);
    return [];
  }
  
  // Process each target directory
  const results = [];
  
  for (const dirPath of targetDirs) {
    // Filter files to only include those in this directory and its subdirectories
    const dirFiles = allFiles.filter(file => {
      const relativePath = path.relative(projectPath, file);
      return relativePath.startsWith(dirPath);
    });
    
    if (dirFiles.length === 0) {
      if (debug) {
        console.warn(`Warning: No matching files found in directory: ${dirPath}`);
      }
      continue;
    }
    
    // Generate content for this directory
    let dirContent = '';
    
    // Generate layout view for this directory if not suppressed
    if (!suppressLayout) {
      // For layout generation, we need to adjust the projectPath to be the target directory
      const fullDirPath = path.join(projectPath, dirPath);
      dirContent += generateLayoutView(fullDirPath, dirFiles) + '\n\n';
    }
    
    // Process each file in this directory
    for (const file of dirFiles) {
      const relativePath = path.relative(projectPath, file);
      const content = await fs.readFile(file, 'utf8');
      
      // Process content based on options (handle comments)
      const processedContent = includeComments 
        ? content 
        : removeComments(content, file);
      
      // Get dynamic comment style for file header based on file type
      const headerCommentStyle = commentStyle || getFileHeaderCommentStyle(file);
      
      // Add file header with the appropriate comment style
      dirContent += `${headerCommentStyle} FILE: ${relativePath}\n`;
      dirContent += processedContent + '\n\n';
    }
    
    // Add this directory's result to the output array
    results.push({
      directoryPath: path.join(projectPath, dirPath),
      content: dirContent,
      outputFilename
    });
  }
  
  return results;
}

/**
 * Get directories at a specific depth level relative to the project root
 * @param {string} projectPath - Root path of the project
 * @param {string[]} allFiles - List of all files in the project
 * @param {number} targetDepth - Target directory depth level
 * @returns {string[]} - Array of directory paths at the specified depth
 */
function getDirectoriesAtDepth(projectPath, allFiles, targetDepth) {
  // Set to store unique directory paths at the target depth
  const targetDirs = new Set();
  
  // Process each file to extract directories at the target depth
  allFiles.forEach(file => {
    const relativePath = path.relative(projectPath, file);
    const pathParts = relativePath.split(path.sep);
    
    // If the file is at a depth greater than or equal to the target depth
    // we can extract the directory at the target depth
    if (pathParts.length > targetDepth) {
      // Get the directory path at the target depth
      const targetDir = pathParts.slice(0, targetDepth).join(path.sep);
      targetDirs.add(targetDir);
    }
  });
  
  // Special case: if targetDepth is 0, include the project root
  if (targetDepth === 0) {
    targetDirs.add('.');
  }
  
  // Convert Set to Array and sort for consistent output
  return Array.from(targetDirs).sort();
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