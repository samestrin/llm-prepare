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
 * @param {string} options.filePattern - File pattern for project processing
 * @param {boolean} options.suppressLayout - Whether to suppress layout view
 * @param {boolean} options.includeComments - Whether to include comments
 * @param {string} options.commentStyle - Comment style for file headers
 * @returns {Promise<void>}
 */
export async function processText(options) {
  const { debug } = options;
  
  // Debug output
  if (debug) {
    console.error('Debug: Processing with options:', JSON.stringify(options, null, 2));
  }
  
  let processedText;
  
  // Check if processing a project directory
  if (options.projectPath) {
    // Process project directory
    processedText = await processProjectDirectory(options);
    
    if (debug) {
      console.error(`Debug: Processed project directory: ${options.projectPath}`);
      console.error(`Debug: Generated ${processedText.length} characters of content`);
    }
  } else {
    // Step 1: Get input text from source (file, URL, stdin)
    const text = await getInputText(options);
    if (debug) {
      console.error(`Debug: Retrieved input text (${text.length} characters)`);
    }
    
    // Step 2: Convert format if specified
    processedText = options.format 
      ? await convertFormat(text, options.format, options) 
      : text;
    
    if (debug) {
      console.error(`Debug: After format conversion: ${processedText.length} characters`);
    }
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
  
  // Step 7: Write output
  await writeOutput(processedText, options.output);
  
  if (debug) {
    console.error('Debug: Processing complete');
  }
}