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
      return ""; // Skip empty files
    }

    if (!argv["include-comments"]) {
      // Regular expression for removing block comments
      content = content.replace(/\/\*(?!.*https?:\/\/)[\s\S]*?\*\//g, "");
      // Regular expression for removing single-line comments
      content = content.replace(/\/\/(?!.*https?:\/\/).*$/gm, "");
    }

    content = content.replace(/[ \t]+/g, " "); // Normalize spaces and tabs

    if (argv["compress"]) {
      content = content.replace(/\s+/g, " ").trim(); // Compress whitespace
    } else {
      content = content.replace(/(?:\r\n|\r|\n){2,}/g, "\n"); // Condense newlines
    }

    return `
/** File: /${path.relative(
      process.cwd(),
      filePath,
    )} ***************************************/
${content}
`;
  } catch (error) {
    // Handle errors while processing the file
    console.error(`Error processing file ${filePath}: ${error.message}`);
    return ""; // Return an empty string in case of errors
  }
}

module.exports = { processFile };
