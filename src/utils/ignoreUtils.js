const ignore = require("ignore");
const fs = require("fs-extra");
const path = require("path");
const { handleError } = require("./errorHandler");
const { fileExists } = require("./fileUtils");

/**
 * Reads and processes .ignore files within the specified directory,
 * configuring an ignore manager for filtering files and directories based on ignore rules.
 *
 * @param {string} dir - The directory to search for .ignore files.
 * @param {string} [defaultIgnorePath] - Optional path to a custom default ignore file.
 * @param {object} argv - Command-line arguments that might affect ignore rules.
 * @returns {Promise<object>} An ignore manager object with configured ignore rules.
 */
async function readIgnoreFiles(dir, defaultIgnorePath = false, argv) {
  const ig = ignore();

  if (!defaultIgnorePath)
    defaultIgnorePath = path.join(__dirname, ".defaultignore");

  // Attempt to load .defaultignore with specific error handling
  try {
    if (await fileExists(defaultIgnorePath)) {
      const defaultIgnoreContent = await fs.readFile(defaultIgnorePath, "utf8");
      ig.add(filterIgnoreContent(defaultIgnoreContent));
    }
  } catch (error) {
    handleError(
      `Error reading or processing .defaultignore file: ${error.message}`,
    );
  }

  // Attempt to load .gitignore with specific error handling if not ignored
  if (!argv["ignore-gitignore"]) {
    const gitIgnorePath = path.join(dir, ".gitignore");
    try {
      if (await fileExists(gitIgnorePath)) {
        const gitIgnoreContent = await fs.readFile(gitIgnorePath, "utf8");
        ig.add(filterIgnoreContent(gitIgnoreContent));
      }
    } catch (error) {
      handleError(
        `Error reading or processing .gitignore file: ${error.message}`,
      );
    }
  }

  try {
    const files = await fs.readdir(dir);
    // Filter out .gitignore from the list of files to prevent double processing
    const ignoreFiles = files.filter(
      (file) => file.match(/\..*ignore/) && file !== ".gitignore",
    );
    await Promise.all(
      ignoreFiles.map(async (file) => {
        const content = await fs.readFile(path.join(dir, file), "utf8");
        ig.add(filterIgnoreContent(content));
      }),
    );
  } catch (error) {
    handleError(
      `Failed to read ignore files in directory ${dir}: ${error.message}`,
    );
  }

  // Add custom ignore patterns from the command line arguments
  if (argv["custom-ignore-string"]) {
    const patterns = argv["custom-ignore-string"]
      .split(",")
      .map((pattern) => pattern.trim());
    ig.add(patterns);
  }

  if (argv["custom-ignore-filename"]) {
    try {
      const customIgnoreContent = await fs.readFile(
        argv["custom-ignore-filename"],
        "utf8",
      );
      ig.add(filterIgnoreContent(customIgnoreContent));
    } catch (error) {
      handleError(
        `Failed to read custom ignore file ${argv["custom-ignore-filename"]}: ${error.message}`,
      );
    }
  }

  return ig;
}

/**
 * Filters out empty lines and comments from .ignore file content, preparing it for
 * processing.
 *
 * @param {string} content - The content of an ignore file.
 * @returns {string} Filtered content suitable for further processing.
 */
function filterIgnoreContent(content) {
  return content
    .split("\n")
    .filter((line) => line.trim() !== "" && !line.startsWith("#"))
    .join("\n");
}

/**
 * Shows the contents of the default ignore file configured in the system.
 * This function reads the content of the specified default ignore file and prints it to the console.
 *
 * @returns {Promise<void>} A promise that resolves when the operation is complete.
 * @throws {Error} If there is an error reading the default ignore file.
 */
async function showDefaultIgnore() {
  const defaultIgnorePath =
    argv["default-ignore"] || path.join(__dirname, ".defaultignore");
  try {
    const defaultIgnoreContent = await fs.readFile(defaultIgnorePath, "utf8");
    console.log(defaultIgnoreContent);
  } catch (error) {
    handleError(`Error reading default ignore file: ${error.message}`);
  }
}

module.exports = { readIgnoreFiles, filterIgnoreContent, showDefaultIgnore };
