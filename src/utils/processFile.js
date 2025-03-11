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
      return "";
    }

    const getCommentStyle = (filePath, explicitType = null) => {
      if (explicitType) return COMMENT_STYLES[explicitType] || COMMENT_STYLES.default;
      
      const ext = path.extname(filePath).toLowerCase();
      switch (ext) {
        // Triple quote languages
        case '.py':
        case '.gyp':
          return { start: '"""', end: '"""' };

        // HTML-style comments
        case '.html':
        case '.htm':
        case '.xml':
        case '.svg':
        case '.vue':
        case '.jsx':
        case '.tsx':
        case '.hbs':
        case '.ejs':
          return { start: '<!--', end: '-->' };

        // Hash style comments
        case '.rb':
        case '.py':  // Python also supports #
        case '.pl':  // Perl
        case '.pm':
        case '.sh':
        case '.bash':
        case '.zsh':
        case '.fish':
        case '.yaml':
        case '.yml':
        case '.conf':
        case '.toml':
        case '.ini':
        case '.gitignore':
        case '.dockerignore':
        case '.env':
        case '.r':
        case '.tcl':
        case '.mk':
        case '.makefile':
        case '.rake':
          return { start: '#', end: '' };

        // Double dash comments
        case '.sql':
        case '.plsql':
        case '.hql':
        case '.lua':
        case '.erl':
        case '.hrl':
          return { start: '--', end: '' };

        // Block comment style /* */
        case '.js':
        case '.jsx':
        case '.ts':
        case '.tsx':
        case '.css':
        case '.scss':
        case '.less':
        case '.php':
        case '.java':
        case '.c':
        case '.h':
        case '.cpp':
        case '.hpp':
        case '.cc':
        case '.cxx':
        case '.cs':
        case '.go':
        case '.swift':
        case '.scala':
        case '.kt':
        case '.kts':
        case '.rs':
        case '.sass':
        case '.m':  // Objective-C
        case '.mm': // Objective-C++
        default:
          return { start: '/*', end: '*/' };
      }
    };
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

    const commentStyle = getCommentStyle(filePath, argv["comment-style"]);
    const relativePath = path.relative(process.cwd(), filePath);
    const separator = "=".repeat(20);
    
    let header;
    if (commentStyle.end) {
      header = `\n${commentStyle.start} File: /${relativePath} ${separator} ${commentStyle.end}\n`;
    } else {
      header = `\n${commentStyle.start} File: /${relativePath} ${separator} ${commentStyle.start}\n`;
    }

    return `${header}${content}`;
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
