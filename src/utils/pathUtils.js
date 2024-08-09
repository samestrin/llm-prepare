const fs = require("fs-extra");
const istextorbinary = require("istextorbinary");
const { processDirectory } = require("./processDirectory");
const { processFile } = require("./processFile");
const { writeAllOutputs } = require("./outputUtils");
const { readIgnoreFiles } = require("./ignoreUtils");
const { handleError } = require("./errorHandler");

/**
 * Processes a given path, determining whether it's a directory or file.
 * @param {string} pathToProcess - The path to the file or directory.
 * @param {object} argv - Command-line arguments.
 * @param {string} layout - The current layout string being built.
 * @param {boolean} layoutIncluded - Flag indicating if layout has been included.
 * @param {array} includePaths - Array of paths to include in processing.
 * @param {RegExp} filePattern - Regular expression pattern to match files.
 * @param {array} accumulatedOutput - Array to store accumulated output from all paths.
 * @returns {Promise<void>} - A promise that resolves when processing is complete.
 */
async function processPath(
  pathToProcess,
  argv,
  layout,
  layoutIncluded,
  includePaths,
  filePattern,
  accumulatedOutput
) {
  const stats = await fs.stat(pathToProcess);

  if (stats.isDirectory()) {
    // Process directory
    const ig = await readIgnoreFiles(
      pathToProcess,
      argv["default-ignore"],
      argv
    );

    const {
      layout: updatedLayout,
      singleFileOutput,
      layoutIncluded: layoutAlreadyIncluded,
    } = await processDirectory(
      pathToProcess,
      pathToProcess,
      ig,
      0,
      [],
      filePattern,
      layout,
      argv,
      includePaths
    );

    layout = updatedLayout;
    layoutIncluded = layoutAlreadyIncluded;

    accumulatedOutput.push(...singleFileOutput);
  } else if (stats.isFile()) {
    // Process single file
    const content = await fs.readFile(pathToProcess, "utf8");
    if (!istextorbinary.isBinary(pathToProcess, content)) {
      const processedContent = await processFile(content, pathToProcess, argv);
      accumulatedOutput.push({
        path: pathToProcess,
        content: processedContent,
      });
    }
  } else {
    handleError(new Error(`Unsupported file type: ${pathToProcess}`));
  }
}

module.exports = { processPath };
