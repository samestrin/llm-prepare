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
  
  // If no chunking needed, write directly to the file
  if (!chunkSize) {
    try {
      await fs.writeFile(outputPath, text, 'utf8');
    } catch (error) {
      throw new Error(`Failed to write to file ${outputPath}: ${error.message}`);
    }
    return;
  }

  // Handle chunked output
  try {
    const chunkSizeBytes = chunkSize * 1024; // Convert KB to bytes
    const totalBytes = Buffer.byteLength(text, 'utf8');
    
    // If content is smaller than chunk size, write directly
    if (totalBytes <= chunkSizeBytes) {
      await fs.writeFile(outputPath, text, 'utf8');
      return;
    }
    
    // Create multiple chunks
    const chunks = splitTextIntoChunks(text, chunkSizeBytes);
    const fileExt = path.extname(outputPath);
    const baseName = outputPath.slice(0, outputPath.length - fileExt.length);
    
    // Write each chunk to a separate file
    for (let i = 0; i < chunks.length; i++) {
      const chunkFileName = `${baseName}_part${i + 1}${fileExt}`;
      await fs.writeFile(chunkFileName, chunks[i], 'utf8');
    }
  } catch (error) {
    throw new Error(`Failed to write chunked output: ${error.message}`);
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