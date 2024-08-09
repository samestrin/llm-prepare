// utils/processFile.js

const path = require("path");

/**
 * Processes the content of an individual file based on the provided command-line arguments.
 * It may remove comments, normalize spaces, and condense newlines depending on the options
 * specified. It returns the processed content of the file.
 *
 * @param {string} content - The content from the file to be processed.
 * @param {string} filePath - The path for the file to be processed.
 * @param {object} argv - Command-line arguments that may affect file processing.
 * @returns {Promise<string>} The processed content of the file.
 */
async function processFile(content, filePath, argv) {
  try {
    if (content.trim().length === 0) {
      return ""; // Return empty content for empty files
    }
    if (!argv["include-comments"]) {
      content = content.replace(/\/\*(?!.*https?:\/\/)[\s\S]*?\*\//g, ""); // Strip block comments
      content = content.replace(/\/\/(?!.*https?:\/\/).*$/gm, ""); // Strip line comments
    }
    content = content.replace(/[ \t]+/g, " "); // Collapse whitespace
    if (argv["compress"]) {
      content = content.replace(/\s+/g, " ").trim(); // Compress output
    } else {
      content = content.replace(/(?:\r\n|\r|\n){2,}/g, "\n"); // Normalize line breaks
    }

    return `
/** File: /${path.relative(
      process.cwd(),
      filePath
    )} ***************************************/
${content}
`;
  } catch (error) {
    // Handle errors while processing the file
    console.error(
      `Error processing file ${filePath}: ${error.message}`,
      error.stack
    );
    return ""; // Return an empty string in case of errors
  }
}

module.exports = { processFile };
