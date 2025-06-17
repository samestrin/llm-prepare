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
 * @param {number|string} options.folderOutputLevel - Directory depth level for output generation or 'all' for all subdirectories
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
 * Process project by folder level, generating separate outputs for each directory at the specified depth or for all subdirectories
 * @param {string} projectPath - Root path of the project
 * @param {string[]} allFiles - List of all files in the project
 * @param {number|string} targetDepthOrAll - Target directory depth level or 'all' for all subdirectories
 * @param {Object} options - Processing options
 * @returns {Promise<Array<Object>>} - Array of objects with directory path, content, and output filename
 */
async function processByFolderLevel(projectPath, allFiles, targetDepthOrAll, options) {
  const {
    suppressLayout = false,
    includeComments = false,
    commentStyle = '//',
    debug = false,
    output
  } = options;

  // Get the output filename from the output path
  const outputFilename = path.basename(output);
  
  // Get directories based on the specified depth or 'all'
  let targetDirs = [];
  
  try {
    if (targetDepthOrAll === 'all') {
      targetDirs = getAllSubdirectories(projectPath, allFiles);
      
      if (debug) {
        console.error(`Debug: Found ${targetDirs.length} subdirectories for 'all' mode`);
        if (targetDirs.length > 0 && targetDirs.length <= 10) {
          console.error(`Debug: Target directories: ${targetDirs.join(', ')}`);
        } else if (targetDirs.length > 10) {
          console.error(`Debug: First 10 target directories: ${targetDirs.slice(0, 10).join(', ')}...`);
        }
      }
      
      if (targetDirs.length === 0) {
        console.warn(`Warning: No processable subdirectories found in ${projectPath}.`);
        return [];
      }
    } else {
      // Validate that targetDepthOrAll is a non-negative integer
      const targetDepth = parseInt(targetDepthOrAll, 10);
      if (isNaN(targetDepth) || targetDepth < 0) {
        throw new Error(`Invalid folder output level: ${targetDepthOrAll}. Must be a non-negative integer or 'all'.`);
      }
      
      // Original numeric depth behavior
      targetDirs = getDirectoriesAtDepth(projectPath, allFiles, targetDepth);
      
      if (debug) {
        console.error(`Debug: Found ${targetDirs.length} directories at depth ${targetDepth}`);
        if (targetDirs.length > 0) {
          console.error(`Debug: Target directories: ${targetDirs.join(', ')}`);
        }
      }
      
      if (targetDirs.length === 0) {
        console.warn(`Warning: No directories found at depth level ${targetDepth} in ${projectPath}.`);
        return [];
      }
    }
  } catch (error) {
    console.error(`Error identifying target directories: ${error.message}`);
    throw error; // Re-throw to allow higher-level error handling
  }
  
  // Process each target directory
  const results = [];
  let processedDirCount = 0;
  
  for (const dirPath of targetDirs) {
    try {
      // Filter files to only include those in this directory and its subdirectories
      const dirFiles = allFiles.filter(file => {
        const relativePath = path.relative(projectPath, file);
        return relativePath.startsWith(dirPath === '.' ? '' : dirPath);
      });
      
      if (dirFiles.length === 0) {
        console.warn(`Warning: No matching files found in directory: ${dirPath || 'root'}. Skipping output for this directory.`);
        continue;
      }
      
      // Generate content for this directory
      let dirContent = '';
      
      // Generate layout view for this directory if not suppressed
      if (!suppressLayout) {
        try {
          // For layout generation, we need to adjust the projectPath to be the target directory
          const fullDirPath = path.join(projectPath, dirPath);
          dirContent += generateLayoutView(fullDirPath, dirFiles) + '\n\n';
        } catch (layoutError) {
          console.warn(`Warning: Failed to generate layout for directory ${dirPath}: ${layoutError.message}`);
          // Continue without layout if it fails
        }
      }
      
      // Process each file in this directory
      for (const file of dirFiles) {
        try {
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
        } catch (fileError) {
          // Log error but continue with other files
          console.warn(`Warning: Failed to process file ${file}: ${fileError.message}`);
        }
      }
      
      // Add this directory's result to the output array
      results.push({
        directoryPath: path.join(projectPath, dirPath === '.' ? '' : dirPath),
        content: dirContent,
        outputFilename
      });
      
      processedDirCount++;
      
    } catch (dirError) {
      console.warn(`Warning: Failed to process directory ${dirPath}: ${dirError.message}`);
      // Continue with other directories
    }
  }
  
  if (debug) {
    console.error(`Debug: Successfully processed ${processedDirCount} out of ${targetDirs.length} directories`);
  }
  
  if (processedDirCount === 0 && targetDirs.length > 0) {
    console.warn(`Warning: Failed to process any directories. Check file permissions and patterns.`);
  }
  
  return results;
}

/**
 * Get all subdirectories that contain files matching the patterns
 * @param {string} projectPath - Root path of the project
 * @param {string[]} allFiles - List of all files in the project
 * @returns {string[]} - Array of all subdirectory paths containing files
 */
function getAllSubdirectories(projectPath, allFiles) {
  if (!Array.isArray(allFiles) || allFiles.length === 0) {
    return [];
  }
  
  // Set to store unique directory paths
  const allDirs = new Set();
  
  try {
    // Always include the root directory if it contains files directly
    const rootFiles = allFiles.filter(file => {
      const relativePath = path.relative(projectPath, file);
      return !relativePath.includes(path.sep);
    });
    
    if (rootFiles.length > 0) {
      allDirs.add('.');
    }
    
    // Process each file to extract all directory paths
    allFiles.forEach(file => {
      try {
        const relativePath = path.relative(projectPath, file);
        const dirPath = path.dirname(relativePath);
        
        // Skip the root directory as it's already handled
        if (dirPath !== '.') {
          allDirs.add(dirPath);
          
          // Also add all parent directories
          let parentDir = dirPath;
          while (parentDir !== '.') {
            parentDir = path.dirname(parentDir);
            if (parentDir !== '.') {
              allDirs.add(parentDir);
            }
          }
        }
      } catch (error) {
        // Log but continue with other files
        console.warn(`Warning: Failed to process path for file ${file}: ${error.message}`);
      }
    });
    
    // Convert Set to Array and sort for consistent output
    return Array.from(allDirs).sort();
  } catch (error) {
    console.error(`Error identifying subdirectories: ${error.message}`);
    throw error;
  }
}

/**
 * Get directories at a specific depth level relative to the project root
 * @param {string} projectPath - Root path of the project
 * @param {string[]} allFiles - List of all files in the project
 * @param {number} targetDepth - Target directory depth level
 * @returns {string[]} - Array of directory paths at the specified depth
 */
function getDirectoriesAtDepth(projectPath, allFiles, targetDepth) {
  if (!Array.isArray(allFiles) || allFiles.length === 0) {
    return [];
  }
  
  if (typeof targetDepth !== 'number' || targetDepth < 0) {
    throw new Error(`Invalid target depth: ${targetDepth}. Must be a non-negative integer.`);
  }
  
  // Set to store unique directory paths at the target depth
  const targetDirs = new Set();
  
  try {
    // Process each file to extract directories at the target depth
    allFiles.forEach(file => {
      try {
        const relativePath = path.relative(projectPath, file);
        const pathParts = relativePath.split(path.sep);
        
        // If the file is at a depth greater than or equal to the target depth
        // we can extract the directory at the target depth
        if (pathParts.length > targetDepth) {
          // Get the directory path at the target depth
          const targetDir = pathParts.slice(0, targetDepth).join(path.sep);
          targetDirs.add(targetDir);
        }
      } catch (error) {
        // Log but continue with other files
        console.warn(`Warning: Failed to process path for file ${file}: ${error.message}`);
      }
    });
    
    // Special case: if targetDepth is 0, include the project root
    if (targetDepth === 0) {
      targetDirs.add('.');
    }
    
    // Convert Set to Array and sort for consistent output
    return Array.from(targetDirs).sort();
  } catch (error) {
    console.error(`Error identifying directories at depth ${targetDepth}: ${error.message}`);
    throw error;
  }
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