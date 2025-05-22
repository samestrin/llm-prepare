/**
 * LLM-Prepare Main Module
 * 
 * Handles orchestration of text processing operations including:
 * - Reading from different sources (files, URLs, stdin)
 * - Converting between formats (markdown, HTML, text)
 * - Truncating text based on token limits
 * - Applying prompt templates
 * - Processing project directories
 */

import { getInputText } from './io/input.js';
import { writeOutput } from './io/output.js';
import { convertFormat } from './formatters/format-converter.js';
import { truncateText } from './processors/truncate.js';
import { applyPromptTemplate } from './processors/prompt-template.js';
import { processProjectDirectory } from './processors/project-processor.js';
import { estimateTokenCount } from './utils/token-counter.js';
import { compressText } from './processors/compress.js';
import path from 'path';
import fs from 'fs/promises';

/**
 * Main function to process text based on provided options
 * @param {Object} options - Command line options
 * @param {string} options.input - Input source (file, url, or stdin)
 * @param {string} options.output - Output file (defaults to stdout)
 * @param {string} options.format - Format to convert to (markdown, html, text)
 * @param {number} options.maxTokens - Maximum tokens to include
 * @param {string} options.prompt - Prompt template file
 * @param {string} options.variables - JSON string of variables for template
 * @param {string} options.truncate - Truncation strategy (start, end, middle)
 * @param {boolean} options.render - Render content with a browser
 * @param {boolean} options.debug - Enable debug output
 * @param {string} options.system - System message to prepend
 * @param {string} options.user - User message to append
 * @param {string} options.projectPath - Path to project directory
 * @param {string[]} options.projectPaths - Array of project directory paths to process
 * @param {string} options.filePattern - File pattern for project processing
 * @param {boolean} options.suppressLayout - Whether to suppress layout view
 * @param {boolean} options.includeComments - Whether to include comments
 * @param {string} options.commentStyle - Comment style for file headers
 * @param {boolean} options.compress - Whether to compress whitespace in output
 * @param {number} options.chunkSize - Maximum size in KB for each output file
 * @param {number} options.folderOutputLevel - Directory depth level for output generation
 * @returns {Promise<void>}
 */
export async function processText(options) {
  const { debug } = options;
  
  // Debug output
  if (debug) {
    console.error('Debug: Processing with options:', JSON.stringify(options, null, 2));
  }
  
  // Check if processing project directories
  if (options.projectPaths && options.projectPaths.length > 0) {
    // Process multiple project directories
    if (debug) {
      console.error(`Debug: Processing multiple project directories (${options.projectPaths.length})`);
    }
    
    let combinedResult = '';
    let folderResults = [];
    
    // Process each project path
    for (const projectPath of options.projectPaths) {
      if (debug) {
        console.error(`Debug: Processing project directory: ${projectPath}`);
      }
      
      // Create a copy of options with the current project path
      const pathOptions = { ...options, projectPath };
      
      // Process this project directory
      const result = await processProjectDirectory(pathOptions);
      
      // Handle per-folder output mode
      if (options.folderOutputLevel !== undefined) {
        if (Array.isArray(result)) {
          folderResults = folderResults.concat(result);
        }
      } else if (typeof result === 'string') {
        // For standard output, concatenate the results
        if (combinedResult) {
          combinedResult += '\n\n';
        }
        combinedResult += result;
      }
    }
    
    // Handle per-folder output mode
    if (options.folderOutputLevel !== undefined) {
      if (debug) {
        console.error(`Debug: Processing in per-folder mode at level ${options.folderOutputLevel}`);
      }
      
      try {
        // Result is an array of { directoryPath, content, outputFilename } objects
        if (folderResults.length === 0) {
          console.warn(`Warning: No directories found at depth level ${options.folderOutputLevel} or no files to process.`);
          return;
        }
        
        let successCount = 0;
        
        // Process each folder's content
        for (const item of folderResults) {
          try {
            let processedContent = item.content;
            
            // Apply prompt template if specified
            if (options.prompt) {
              try {
                const variables = options.variables 
                  ? JSON.parse(options.variables) 
                  : {};
                
                processedContent = await applyPromptTemplate(processedContent, options.prompt, variables);
                
                if (debug) {
                  console.error(`Debug: After applying prompt template for ${item.directoryPath}: ${processedContent.length} characters`);
                }
              } catch (templateError) {
                console.error(`Error applying prompt template for ${item.directoryPath}: ${templateError.message}`);
                // Continue with unprocessed content
              }
            }
            
            // Add system message if specified
            if (options.system) {
              processedContent = `SYSTEM: ${options.system}\n\n${processedContent}`;
            }
            
            // Add user message if specified
            if (options.user) {
              processedContent = `${processedContent}\n\nUSER: ${options.user}`;
            }
            
            // Truncate text if max tokens specified
            if (options.maxTokens) {
              try {
                const strategy = options.truncate || 'end';
                const beforeTokens = estimateTokenCount(processedContent);
                
                processedContent = truncateText(
                  processedContent, 
                  options.maxTokens, 
                  strategy
                );
                
                const afterTokens = estimateTokenCount(processedContent);
                
                if (debug) {
                  console.error(`Debug: Truncated ${item.directoryPath} from ~${beforeTokens} to ~${afterTokens} tokens`);
                }
              } catch (truncateError) {
                console.error(`Error truncating content for ${item.directoryPath}: ${truncateError.message}`);
                // Continue with untruncated content
              }
            }
            
            // Compress text if compress option is specified
            if (options.compress) {
              try {
                const beforeLength = processedContent.length;
                processedContent = compressText(processedContent);
                
                if (debug) {
                  console.error(`Debug: Compressed ${item.directoryPath} from ${beforeLength} to ${processedContent.length} characters`);
                }
              } catch (compressError) {
                console.error(`Error compressing content for ${item.directoryPath}: ${compressError.message}`);
                // Continue with uncompressed content
              }
            }
            
            // Construct full output path
            const fullOutputPath = path.join(item.directoryPath, item.outputFilename);
            
            // Ensure the directory exists before writing
            try {
              await fs.mkdir(path.dirname(fullOutputPath), { recursive: true });
            } catch (mkdirError) {
              if (mkdirError.code === 'EEXIST') {
                // Directory already exists, continue
              } else if (mkdirError.code === 'EACCES') {
                throw new Error(`Permission denied: Cannot create directory for ${fullOutputPath}. Check file permissions.`);
              } else if (mkdirError.code === 'ENAMETOOLONG') {
                throw new Error(`Path too long: ${fullOutputPath}. Try using a shorter output path.`);
              } else {
                throw new Error(`Failed to create directory for ${fullOutputPath}: ${mkdirError.message} (${mkdirError.code})`);
              }
            }
            
            // Write output
            try {
              await writeOutput(processedContent, fullOutputPath, options.chunkSize);
              
              if (debug) {
                console.error(`Debug: Wrote output to ${fullOutputPath}`);
              }
              
              successCount++;
            } catch (writeError) {
              console.error(`Error writing output to ${fullOutputPath}: ${writeError.message}`);
            }
          } catch (itemError) {
            console.error(`Error processing output for directory ${item.directoryPath}: ${itemError.message}`);
            // Continue with other directories
          }
        }
        
        if (successCount === 0) {
          console.error(`Error: Failed to generate any output files. Check permissions and disk space.`);
        } else if (successCount < folderResults.length) {
          console.warn(`Warning: Successfully generated ${successCount} out of ${folderResults.length} output files.`);
        } else if (debug) {
          console.error(`Debug: Successfully generated all ${successCount} output files.`);
        }
        
        return;
      } catch (error) {
        console.error(`Error in per-folder output mode: ${error.message}`);
        throw error;
      }
    } else if (combinedResult) {
      // Process the combined result for standard output
      let processedText = combinedResult;
      
      // Apply prompt template if specified
      if (options.prompt) {
        try {
          const variables = options.variables 
            ? JSON.parse(options.variables) 
            : {};
          
          processedText = await applyPromptTemplate(processedText, options.prompt, variables);
          
          if (debug) {
            console.error(`Debug: After applying prompt template: ${processedText.length} characters`);
          }
        } catch (templateError) {
          console.error(`Error applying prompt template: ${templateError.message}`);
          // Continue with unprocessed content
        }
      }
      
      // Add system message if specified
      if (options.system) {
        processedText = `SYSTEM: ${options.system}\n\n${processedText}`;
      }
      
      // Add user message if specified
      if (options.user) {
        processedText = `${processedText}\n\nUSER: ${options.user}`;
      }
      
      // Truncate text if max tokens specified
      if (options.maxTokens) {
        try {
          const strategy = options.truncate || 'end';
          const beforeTokens = estimateTokenCount(processedText);
          
          processedText = truncateText(
            processedText, 
            options.maxTokens, 
            strategy
          );
          
          const afterTokens = estimateTokenCount(processedText);
          
          if (debug) {
            console.error(`Debug: Truncated from ~${beforeTokens} to ~${afterTokens} tokens`);
          }
        } catch (truncateError) {
          console.error(`Error truncating content: ${truncateError.message}`);
          // Continue with untruncated content
        }
      }
      
      // Compress text if compress option is specified
      if (options.compress) {
        try {
          const beforeLength = processedText.length;
          processedText = compressText(processedText);
          
          if (debug) {
            console.error(`Debug: Compressed from ${beforeLength} to ${processedText.length} characters`);
          }
        } catch (compressError) {
          console.error(`Error compressing content: ${compressError.message}`);
          // Continue with uncompressed content
        }
      }
      
      // Write output
      await writeOutput(processedText, options.output, options.chunkSize);
      
      if (debug) {
        console.error('Debug: Processing complete');
        if (options.chunkSize && options.output) {
          const textSizeKB = Math.round(Buffer.byteLength(processedText, 'utf8') / 1024);
          if (textSizeKB > options.chunkSize) {
            const numChunks = Math.ceil(textSizeKB / options.chunkSize);
            console.error(`Debug: Output split into ${numChunks} chunks based on ${options.chunkSize}KB limit`);
          }
        }
      }
    }
  } else if (options.projectPath) {
    // Process a single project directory (backward compatibility)
    const result = await processProjectDirectory(options);
    
    // Handle per-folder output mode
    if (options.folderOutputLevel !== undefined) {
      if (debug) {
        console.error(`Debug: Processing in per-folder mode at level ${options.folderOutputLevel}`);
      }
      
      try {
        // Result is an array of { directoryPath, content, outputFilename } objects
        if (Array.isArray(result)) {
          if (result.length === 0) {
            console.warn(`Warning: No directories found at depth level ${options.folderOutputLevel} or no files to process.`);
            return;
          }
          
          let successCount = 0;
          
          // Process each folder's content
          for (const item of result) {
            try {
              let processedContent = item.content;
              
              // Apply prompt template if specified
              if (options.prompt) {
                try {
                  const variables = options.variables 
                    ? JSON.parse(options.variables) 
                    : {};
                  
                  processedContent = await applyPromptTemplate(processedContent, options.prompt, variables);
                  
                  if (debug) {
                    console.error(`Debug: After applying prompt template for ${item.directoryPath}: ${processedContent.length} characters`);
                  }
                } catch (templateError) {
                  console.error(`Error applying prompt template for ${item.directoryPath}: ${templateError.message}`);
                  // Continue with unprocessed content
                }
              }
              
              // Add system message if specified
              if (options.system) {
                processedContent = `SYSTEM: ${options.system}\n\n${processedContent}`;
              }
              
              // Add user message if specified
              if (options.user) {
                processedContent = `${processedContent}\n\nUSER: ${options.user}`;
              }
              
              // Truncate text if max tokens specified
              if (options.maxTokens) {
                try {
                  const strategy = options.truncate || 'end';
                  const beforeTokens = estimateTokenCount(processedContent);
                  
                  processedContent = truncateText(
                    processedContent, 
                    options.maxTokens, 
                    strategy
                  );
                  
                  const afterTokens = estimateTokenCount(processedContent);
                  
                  if (debug) {
                    console.error(`Debug: Truncated ${item.directoryPath} from ~${beforeTokens} to ~${afterTokens} tokens`);
                  }
                } catch (truncateError) {
                  console.error(`Error truncating content for ${item.directoryPath}: ${truncateError.message}`);
                  // Continue with untruncated content
                }
              }
              
              // Compress text if compress option is specified
              if (options.compress) {
                try {
                  const beforeLength = processedContent.length;
                  processedContent = compressText(processedContent);
                  
                  if (debug) {
                    console.error(`Debug: Compressed ${item.directoryPath} from ${beforeLength} to ${processedContent.length} characters`);
                  }
                } catch (compressError) {
                  console.error(`Error compressing content for ${item.directoryPath}: ${compressError.message}`);
                  // Continue with uncompressed content
                }
              }
              
              // Construct full output path
              const fullOutputPath = path.join(item.directoryPath, item.outputFilename);
              
              // Ensure the directory exists before writing
              try {
                await fs.mkdir(path.dirname(fullOutputPath), { recursive: true });
              } catch (mkdirError) {
                if (mkdirError.code === 'EEXIST') {
                  // Directory already exists, continue
                } else if (mkdirError.code === 'EACCES') {
                  throw new Error(`Permission denied: Cannot create directory for ${fullOutputPath}. Check file permissions.`);
                } else if (mkdirError.code === 'ENAMETOOLONG') {
                  throw new Error(`Path too long: ${fullOutputPath}. Try using a shorter output path.`);
                } else {
                  throw new Error(`Failed to create directory for ${fullOutputPath}: ${mkdirError.message} (${mkdirError.code})`);
                }
              }
              
              // Write output
              try {
                await writeOutput(processedContent, fullOutputPath, options.chunkSize);
                
                if (debug) {
                  console.error(`Debug: Wrote output to ${fullOutputPath}`);
                }
                
                successCount++;
              } catch (writeError) {
                console.error(`Error writing output to ${fullOutputPath}: ${writeError.message}`);
              }
            } catch (itemError) {
              console.error(`Error processing output for directory ${item.directoryPath}: ${itemError.message}`);
              // Continue with other directories
            }
          }
          
          if (successCount === 0) {
            console.error(`Error: Failed to generate any output files. Check permissions and disk space.`);
          } else if (successCount < result.length) {
            console.warn(`Warning: Successfully generated ${successCount} out of ${result.length} output files.`);
          } else if (debug) {
            console.error(`Debug: Successfully generated all ${successCount} output files.`);
          }
        } else {
          throw new Error('Expected array result from processProjectDirectory when using folderOutputLevel');
        }
        return;
      } catch (error) {
        console.error(`Error in per-folder output mode: ${error.message}`);
        throw error;
      }
    }
    
    if (debug) {
      console.error(`Debug: Completed processing ${result.length} directories at depth level ${options.folderOutputLevel}`);
    }
  } else {
    // Standard input processing (not project directory)
    // Step 1: Get input text from source (file, URL, stdin)
    const text = await getInputText(options);
    if (debug) {
      console.error(`Debug: Retrieved input text (${text.length} characters)`);
    }
    
    // Step 2: Convert format if specified
    let processedText = options.format 
      ? await convertFormat(text, options.format, options) 
      : text;
    
    if (debug) {
      console.error(`Debug: After format conversion: ${processedText.length} characters`);
    }
    
    // Step 3: Apply prompt template if specified
    if (options.prompt) {
      const variables = options.variables 
        ? JSON.parse(options.variables) 
        : {};
      
      processedText = await applyPromptTemplate(processedText, options.prompt, variables);
      
      if (debug) {
        console.error(`Debug: After applying prompt template: ${processedText.length} characters`);
      }
    }
    
    // Step 4: Add system message if specified
    if (options.system) {
      processedText = `SYSTEM: ${options.system}\n\n${processedText}`;
    }
    
    // Step 5: Add user message if specified
    if (options.user) {
      processedText = `${processedText}\n\nUSER: ${options.user}`;
    }
    
    // Step 6: Truncate text if max tokens specified
    if (options.maxTokens) {
      const strategy = options.truncate || 'end';
      const beforeTokens = estimateTokenCount(processedText);
      
      processedText = truncateText(
        processedText, 
        options.maxTokens, 
        strategy
      );
      
      const afterTokens = estimateTokenCount(processedText);
      
      if (debug) {
        console.error(`Debug: Truncated from ~${beforeTokens} to ~${afterTokens} tokens`);
      }
    }
    
    // Step 7: Compress text if compress option is specified
    if (options.compress) {
      const beforeLength = processedText.length;
      processedText = compressText(processedText);
      
      if (debug) {
        console.error(`Debug: Compressed from ${beforeLength} to ${processedText.length} characters`);
      }
    }
    
    // Step 8: Write output
    await writeOutput(processedText, options.output, options.chunkSize);
    
    if (debug) {
      console.error('Debug: Processing complete');
      if (options.chunkSize && options.output) {
        const textSizeKB = Math.round(Buffer.byteLength(processedText, 'utf8') / 1024);
        if (textSizeKB > options.chunkSize) {
          const numChunks = Math.ceil(textSizeKB / options.chunkSize);
          console.error(`Debug: Output split into ${numChunks} chunks based on ${options.chunkSize}KB limit`);
        }
      }
    }
  }
}