/**
 * Prompt Template module - Handles template processing and variable substitution
 */

import fs from 'fs/promises';
import path from 'path';

/**
 * Applies a prompt template to the given text
 * @param {string} text - The input text to include in the template
 * @param {string} templatePath - Path to the template file
 * @param {Object} variables - Variables to substitute in the template
 * @return {Promise<string>} The processed text with template applied
 */
export async function applyPromptTemplate(text, templatePath, variables = {}) {
  // Read the template file
  let template;
  try {
    template = await fs.readFile(templatePath, 'utf8');
  } catch (error) {
    throw new Error(`Failed to read template file: ${error.message}`);
  }
  
  // Combine variables with the text
  const allVariables = {
    ...variables,
    text: text,
    content: text, // Alias for text
  };
  
  // Process the template
  return processTemplate(template, allVariables);
}

/**
 * Processes a template with variable substitution
 * @param {string} template - Template string with placeholders
 * @param {Object} variables - Variables to substitute
 * @return {string} Processed template
 */
function processTemplate(template, variables) {
  // Replace variables in the format {{variable}}
  return template.replace(/\{\{([^}]+)\}\}/g, (match, variableName) => {
    const trimmedName = variableName.trim();
    
    // Check if the variable exists
    if (Object.prototype.hasOwnProperty.call(variables, trimmedName)) {
      return variables[trimmedName];
    }
    
    // Return the original placeholder if variable not found
    return match;
  });
}

/**
 * Creates a new prompt template file
 * @param {string} templatePath - Path to save the template
 * @param {string} templateContent - Template content
 * @return {Promise<void>}
 */
export async function createPromptTemplate(templatePath, templateContent) {
  try {
    // Ensure directory exists
    const dir = path.dirname(templatePath);
    await fs.mkdir(dir, { recursive: true });
    
    // Write template file
    await fs.writeFile(templatePath, templateContent, 'utf8');
  } catch (error) {
    throw new Error(`Failed to create template file: ${error.message}`);
  }
}

/**
 * Lists available prompt templates in the templates directory
 * @param {string} templatesDir - Directory containing templates
 * @return {Promise<Array<string>>} List of template names
 */
export async function listPromptTemplates(templatesDir) {
  try {
    const files = await fs.readdir(templatesDir);
    return files.filter(file => {
      return file.endsWith('.txt') || file.endsWith('.md') || file.endsWith('.template');
    });
  } catch (error) {
    // If directory doesn't exist or can't be read, return empty array
    return [];
  }
}