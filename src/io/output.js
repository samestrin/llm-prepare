/**
 * Output module - Handles writing to different destinations
 */

import fs from 'fs/promises';
import path from 'path';

/**
 * Writes output to the specified destination
 * @param {string} text - The text to write
 * @param {string|null} outputPath - Path to the output file (null for stdout)
 * @param {number|null} chunkSize - Size in KB for each output file chunk
 * @return {Promise<void>}
 */
export async function writeOutput(text, outputPath, chunkSize = null) {
  // Write to stdout if no output path specified
  if (!outputPath) {
    process.stdout.write(text);
    return;
  }
  
  // Validate parameters
  if (typeof text !== 'string') {
    throw new Error('Invalid text parameter: must be a string');
  }
  
  if (chunkSize !== null && (typeof chunkSize !== 'number' || chunkSize <= 0)) {
    throw new Error(`Invalid chunk size: ${chunkSize}. Must be a positive number.`);
  }
  
  // Ensure the output directory exists
  try {
    await fs.mkdir(path.dirname(outputPath), { recursive: true });
  } catch (error) {
    // Handle specific error codes
    if (error.code === 'EEXIST') {
      // Directory already exists, continue
    } else if (error.code === 'EACCES') {
      throw new Error(`Permission denied: Cannot create directory for ${outputPath}. Check file permissions.`);
    } else if (error.code === 'ENAMETOOLONG') {
      throw new Error(`Path too long: ${outputPath}. Try using a shorter output path.`);
    } else {
      throw new Error(`Failed to create directory for ${outputPath}: ${error.message} (${error.code})`);
    }
  }
  
  // If no chunking needed, write directly to the file
  if (!chunkSize) {
    try {
      await fs.writeFile(outputPath, text, 'utf8');
    } catch (error) {
      // Handle specific error codes
      if (error.code === 'EACCES') {
        throw new Error(`Permission denied: Cannot write to ${outputPath}. Check file permissions.`);
      } else if (error.code === 'ENOSPC') {
        throw new Error(`No space left on device: Cannot write to ${outputPath}. Free up disk space.`);
      } else if (error.code === 'ENAMETOOLONG') {
        throw new Error(`Path too long: ${outputPath}. Try using a shorter output path.`);
      } else {
        throw new Error(`Failed to write to file ${outputPath}: ${error.message} (${error.code})`);
      }
    }
    return;
  }

  // Handle chunked output with improved error handling
  try {
    const chunkSizeBytes = chunkSize * 1024; // Convert KB to bytes
    const totalBytes = Buffer.byteLength(text, 'utf8');
    
    // If content is smaller than chunk size, write directly
    if (totalBytes <= chunkSizeBytes) {
      try {
        await fs.writeFile(outputPath, text, 'utf8');
      } catch (error) {
        handleFileWriteError(error, outputPath);
      }
      return;
    }
    
    // Create multiple chunks
    const chunks = splitTextIntoChunks(text, chunkSizeBytes);
    const fileExt = path.extname(outputPath);
    const baseName = outputPath.slice(0, outputPath.length - fileExt.length);
    
    // Write each chunk to a separate file
    for (let i = 0; i < chunks.length; i++) {
      const chunkFileName = `${baseName}_part${i + 1}${fileExt}`;
      try {
        await fs.writeFile(chunkFileName, chunks[i], 'utf8');
      } catch (error) {
        throw new Error(`Failed to write chunk ${i + 1} to ${chunkFileName}: ${handleFileWriteError(error, chunkFileName, true)}`);
      }
    }
  } catch (error) {
    throw new Error(`Failed to write chunked output: ${error.message}`);
  }
}

/**
 * Helper function to handle file write errors with specific messages
 * @param {Error} error - The error object
 * @param {string} filePath - Path to the file being written
 * @param {boolean} returnMessage - Whether to return the error message instead of throwing
 * @throws {Error} - Throws an error with a specific message based on the error code
 * @returns {string} - Returns the error message if returnMessage is true
 */
function handleFileWriteError(error, filePath, returnMessage = false) {
  let message;
  
  switch (error.code) {
    case 'EACCES':
      message = `Permission denied: Cannot write to ${filePath}. Check file permissions.`;
      break;
    case 'ENOSPC':
      message = `No space left on device: Cannot write to ${filePath}. Free up disk space.`;
      break;
    case 'ENAMETOOLONG':
      message = `Path too long: ${filePath}. Try using a shorter output path.`;
      break;
    case 'EISDIR':
      message = `Cannot write to ${filePath} because it is a directory. Specify a file path instead.`;
      break;
    case 'ENOENT':
      message = `Cannot write to ${filePath} because a component of the path does not exist.`;
      break;
    default:
      message = `Failed to write to file ${filePath}: ${error.message} (${error.code})`;
  }
  
  if (returnMessage) {
    return message;
  } else {
    throw new Error(message);
  }
}

/**
 * Splits text into chunks that don't exceed the specified byte size
 * Tries to make intelligent splits at paragraph or sentence boundaries when possible
 * @param {string} text - The text to split
 * @param {number} maxBytes - Maximum byte size for each chunk
 * @return {string[]} Array of text chunks
 */
function splitTextIntoChunks(text, maxBytes) {
  const chunks = [];
  let currentChunk = '';
  let currentChunkBytes = 0;
  
  // Split by paragraphs first (empty lines)
  const paragraphs = text.split(/\n\s*\n/);
  
  for (const paragraph of paragraphs) {
    const paragraphBytes = Buffer.byteLength(paragraph, 'utf8');
    
    // If a single paragraph is larger than max chunk size, we need to split it further
    if (paragraphBytes > maxBytes) {
      // If current chunk has content, save it first
      if (currentChunkBytes > 0) {
        chunks.push(currentChunk);
        currentChunk = '';
        currentChunkBytes = 0;
      }
      
      // Split the paragraph into sentences
      const sentences = paragraph.split(/(?<=[.!?])\s+/);
      
      for (const sentence of sentences) {
        const sentenceBytes = Buffer.byteLength(sentence, 'utf8');
        
        // If a single sentence is larger than chunk size, we have to split arbitrarily
        if (sentenceBytes > maxBytes) {
          // Process the large sentence by breaking it into smaller pieces
          let remainingSentence = sentence;
          
          while (remainingSentence.length > 0) {
            // Calculate how much of the sentence we can fit
            let bytesToTake = maxBytes;
            let textToTake = remainingSentence.slice(0, Math.floor(maxBytes / 2)); // Start with a conservative estimate
            
            // Expand until we can't fit more
            while (Buffer.byteLength(textToTake, 'utf8') < maxBytes && 
                  textToTake.length < remainingSentence.length) {
              textToTake = remainingSentence.slice(0, textToTake.length + 1);
            }
            
            // If we went over, back off by one character
            if (Buffer.byteLength(textToTake, 'utf8') > maxBytes) {
              textToTake = remainingSentence.slice(0, textToTake.length - 1);
            }
            
            chunks.push(textToTake);
            remainingSentence = remainingSentence.slice(textToTake.length);
          }
        } else if (currentChunkBytes + sentenceBytes + 2 > maxBytes) { // +2 for newline
          // Current sentence doesn't fit in the chunk, store current chunk and start a new one
          chunks.push(currentChunk);
          currentChunk = sentence;
          currentChunkBytes = sentenceBytes;
        } else {
          // Add sentence to current chunk
          if (currentChunkBytes > 0) {
            currentChunk += ' ' + sentence;
            currentChunkBytes += sentenceBytes + 1; // +1 for space
          } else {
            currentChunk = sentence;
            currentChunkBytes = sentenceBytes;
          }
        }
      }
    } else if (currentChunkBytes + paragraphBytes + 2 > maxBytes) { // +2 for newline
      // Current paragraph doesn't fit in the chunk, store current chunk and start a new one
      chunks.push(currentChunk);
      currentChunk = paragraph;
      currentChunkBytes = paragraphBytes;
    } else {
      // Add paragraph to current chunk
      if (currentChunkBytes > 0) {
        currentChunk += '\n\n' + paragraph;
        currentChunkBytes += paragraphBytes + 2; // +2 for newlines
      } else {
        currentChunk = paragraph;
        currentChunkBytes = paragraphBytes;
      }
    }
  }
  
  // Add the last chunk if it has content
  if (currentChunkBytes > 0) {
    chunks.push(currentChunk);
  }
  
  return chunks;
}