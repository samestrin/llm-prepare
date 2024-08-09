const fs = require("fs-extra");
const path = require("path");
const istextorbinary = require("istextorbinary");
const { processFile } = require("./processFile");

/**
 * Recursively processes a directory and its contents.
 * @param {string} dir - The directory to process.
 * @param {string} baseDir - The base directory for relative paths.
 * @param {object} ig - Ignore rules object.
 * @param {number} depth - Current depth in the directory tree.
 * @param {array} lastItemStack - Stack of last items to properly format the layout.
 * @param {RegExp} filePattern - Regex pattern to match files.
 * @param {string} layout - Current layout string being built.
 * @param {object} argv - Command-line arguments.
 * @param {array} includePaths - Array of paths to include in processing.
 * @returns {object} - Updated layout, file output, and layout included flag.
 */
async function processDirectory(
  dir,
  baseDir,
  ig,
  depth,
  lastItemStack,
  filePattern,
  layout,
  argv,
  includePaths
) {
  let singleFileOutput = [];
  let layoutIncluded = false;

  const entries = await fs.readdir(dir);
  const relativePaths = entries.map((entry) =>
    path.relative(baseDir, path.join(dir, entry))
  );

  // Filter entries by ignore rules and include paths
  const filteredEntries = entries
    .filter(
      (entry, index) =>
        !ig.ignores(relativePaths[index]) &&
        (includePaths.length === 0 ||
          isIncludedPath(relativePaths[index], includePaths, baseDir))
    )
    .sort();

  for (let i = 0; i < filteredEntries.length; i++) {
    const entry = filteredEntries[i];
    const entryPath = path.join(dir, entry);
    const stats = await fs.stat(entryPath);

    if (stats.isDirectory()) {
      const childResult = await processDirectory(
        entryPath,
        baseDir,
        ig,
        depth + 1,
        lastItemStack.concat(i === filteredEntries.length - 1),
        filePattern,
        layout,
        argv,
        includePaths
      );
      layout += childResult.layout;
      singleFileOutput = singleFileOutput.concat(childResult.singleFileOutput);
      layoutIncluded = childResult.layoutIncluded;
    } else if (stats.isFile() && filePattern.test(entry)) {
      const content = await fs.readFile(entryPath, "utf8");
      if (!istextorbinary.isBinary(entryPath, content)) {
        const processedContent = await processFile(content, entryPath, argv);
        singleFileOutput.push({
          path: path.relative(baseDir, entryPath),
          content: processedContent,
        });
        layout +=
          computePrefix(depth, lastItemStack, i, filteredEntries.length) +
          entry +
          "\n";
      }
    }
  }
  return { layout, singleFileOutput, layoutIncluded };
}

/**
 * Computes the prefix for the current directory or file, depending on its depth and position.
 * @param {number} depth - Current depth in the directory structure.
 * @param {array} lastItemStack - Stack of last items in each directory level.
 * @param {number} currentIndex - Index of the current item in the directory.
 * @param {number} totalEntries - Total number of entries in the current directory.
 * @returns {string} Prefix string for layout visualization.
 */
function computePrefix(depth, lastItemStack, currentIndex, totalEntries) {
  let prefix = "";
  for (let j = 0; j < depth; j++) {
    prefix += lastItemStack[j] ? "    " : "│   ";
  }
  prefix += currentIndex === totalEntries - 1 ? "└── " : "├── ";
  return prefix;
}

/**
 * Checks if a given file path is within the specified include paths.
 * @param {string} filePath - File path to check.
 * @param {array} includePaths - Array of paths to include in processing.
 * @param {string} baseDir - The base directory to resolve relative paths.
 * @returns {boolean} True if the file is within the include paths, otherwise false.
 */
function isIncludedPath(filePath, includePaths, baseDir) {
  // Convert filePath to an absolute path
  const absoluteFilePath = path.resolve(baseDir, filePath);
  console.log(`Checking if ${absoluteFilePath} is included in `, includePaths);

  // Normalize paths for comparison
  const normalizedFilePath = path.normalize(absoluteFilePath);

  return includePaths.some((includePath) => {
    const normalizedIncludePath = path.normalize(includePath);

    // If the include path is a directory, check if the filePath starts with it
    if (fs.statSync(includePath).isDirectory()) {
      return normalizedFilePath.startsWith(normalizedIncludePath);
    }

    // If the include path is a file, check for exact match
    return normalizedFilePath === normalizedIncludePath;
  });
}

module.exports = { processDirectory };
