/**
 * File Type Handler Utility
 * 
 * Provides functionality for detecting binary files and handling large files.
 * Uses the istextorbinary library for accurate binary file detection.
 */

import fs from 'fs';
import path from 'path';
import { isBinary } from 'istextorbinary';
import { getFileHeaderCommentStyle } from './comment-handler.js';

// Default maximum file size in bytes (5MB)
const DEFAULT_MAX_FILE_SIZE = 5 * 1024 * 1024;

/**
 * Checks if a file is binary using the istextorbinary library
 * @param {string} filePath - Path to the file
 * @param {Buffer} [content] - Optional file content for content-based detection
 * @returns {Promise<boolean>} True if the file is binary, false otherwise
 */
export async function checkIfBinary(filePath, content) {
  try {
    // Common binary file extensions
    const binaryExtensions = [
      '.exe', '.bin', '.obj', '.dll', '.so', '.dylib',
      '.jpg', '.jpeg', '.png', '.gif', '.bmp', '.ico', '.tif', '.tiff',
      '.pdf', '.doc', '.docx', '.ppt', '.pptx', '.xls', '.xlsx',
      '.zip', '.rar', '.tar', '.gz', '.7z',
      '.mp3', '.mp4', '.avi', '.mov', '.flv', '.wmv',
      '.ttf', '.otf', '.woff', '.woff2'
    ];
    
    // Check extension first
    const ext = path.extname(filePath).toLowerCase();
    if (binaryExtensions.includes(ext)) {
      return true;
    }
    
    // If content is provided, use it for detection
    if (content) {
      return isBinary(null, content);
    }
    
    // If extension check is inconclusive and no content provided, use istextorbinary
    if (isBinary(filePath)) {
      return true;
    }
    
    // If still inconclusive, read a small chunk of the file
    // to determine if it's binary based on content
    const fd = await fs.promises.open(filePath, 'r');
    const buffer = Buffer.alloc(4096); // Read first 4KB
    
    try {
      const { bytesRead } = await fd.read(buffer, 0, 4096, 0);
      if (bytesRead > 0) {
        const chunk = buffer.slice(0, bytesRead);
        return isBinary(null, chunk);
      }
      return false; // Empty file, treat as text
    } finally {
      await fd.close();
    }
  } catch (error) {
    console.error(`Error checking if file is binary: ${error.message}`);
    return false; // Default to text if there's an error
  }
}

/**
 * Checks if a file exceeds the maximum size limit
 * @param {number} fileSize - Size of the file in bytes
 * @param {number} maxSize - Maximum file size in bytes (default: 5MB)
 * @returns {boolean} True if the file is too large, false otherwise
 */
export function isFileTooLarge(fileSize, maxSize = DEFAULT_MAX_FILE_SIZE) {
  return fileSize > maxSize;
}

/**
 * Generates a placeholder message for binary or large files
 * @param {string} filePath - Path to the file
 * @param {boolean} isBinary - Whether the file is binary
 * @param {boolean} isLarge - Whether the file is too large
 * @param {number} fileSize - Size of the file in bytes (for large files)
 * @param {string} [commentStyle] - Optional override comment style
 * @returns {string} Placeholder message
 */
export function generatePlaceholderMessage(filePath, isBinary, isLarge, fileSize = 0, commentStyle = null) {
  const fileName = path.basename(filePath);
  const fileSizeFormatted = formatFileSize(fileSize);
  const headerCommentStyle = commentStyle || getFileHeaderCommentStyle(filePath);
  
  if (isBinary && isLarge) {
    return `${headerCommentStyle} ${fileName}\n<Binary and large file (${fileSizeFormatted}) was not included>\n`;
  } else if (isBinary) {
    return `${headerCommentStyle} ${fileName}\n<Binary file was not included>\n`;
  } else if (isLarge) {
    return `${headerCommentStyle} ${fileName}\n<Large file (${fileSizeFormatted}) was not included>\n`;
  }
  
  return null; // Not a binary or large file
}

/**
 * Formats file size in bytes to a human-readable format
 * @param {number} bytes - File size in bytes
 * @returns {string} Formatted file size (e.g., "5MB")
 */
function formatFileSize(bytes) {
  if (bytes === 0) return '0B';
  
  const units = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  
  return Math.round(bytes / Math.pow(1024, i)) + units[i];
}