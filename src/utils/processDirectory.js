// utils/processDirectory.js

const fs = require("fs-extra");
const path = require("path");
const istextorbinary = require("istextorbinary");
const { processFile } = require("./processFile");

/**
 * Processes the directory and its subdirectories recursively to build a flat file
 * output and a directory layout. It filters entries based on ignore rules and constructs
 * an ASCII layout of the directory structure. It returns an object containing the layout for
 * this directory and the file contents.
 *
 * @param {string} dir - The current directory to process.
 * @param {string} baseDir - The base directory for relative path calculations.
 * @param {object} ig - The ignore manager object with configured ignore rules.
 * @param {number} depth - The current depth in the directory structure.
 * @param {Array} lastItemStack - A stack indicating if the current directory is the last in its level.
 * @param {RegExp} filePattern - The pattern to filter files that need to be processed.
 * @param {boolean} layoutIncluded - Indicates if the layout has already been added.
 * @returns {Promise<object>} An object containing the layout for this directory and the file contents.
 */
async function processDirectory(
  dir,
  baseDir,
  ig,
  depth,
  lastItemStack,
  filePattern,
  layoutIncluded,
) {
  let layout = depth === 0 && !layoutIncluded ? `/${baseDir}\n` : "";
  let singleFileOutput = [];
  const entries = await fs.readdir(dir);
  const notIgnoredEntries = ig.filter(entries).sort();

  for (let i = 0; i < notIgnoredEntries.length; i++) {
    const entry = notIgnoredEntries[i];
    const entryPath = path.join(dir, entry);
    const stats = await fs.stat(entryPath);

    let prefix = computePrefix(
      depth,
      lastItemStack,
      i,
      notIgnoredEntries.length,
    );

    if (stats.isDirectory()) {
      const childResult = await processDirectory(
        entryPath,
        baseDir,
        ig,
        depth + 1,
        lastItemStack.concat(i === notIgnoredEntries.length - 1),
        filePattern,
        layoutIncluded,
      );

      layout += prefix + entry + "/\n" + childResult.layout;
      singleFileOutput = singleFileOutput.concat(childResult.singleFileOutput);
      layoutIncluded = childResult.layoutIncluded;
    } else if (stats.isFile() && filePattern.test(entry)) {
      let fileContent = await fs.readFile(entryPath, "utf-8");
      if (!istextorbinary.isBinary(entryPath, fileContent)) {
        const content = await processFile(fileContent, entryPath, argv);

        singleFileOutput.push({
          path: path.relative(baseDir, entryPath),
          content: content,
        });
        layout += prefix + entry + "\n";
      }
    }
  }

  return { layout, singleFileOutput, layoutIncluded };
}

/**
 * Computes the prefix for directory entries in the layout based on the current depth
 * and the last item status at each depth. It generates a prefix string that represents
 * the hierarchical structure of directories.
 *
 * @param {number} depth - The current depth in the directory tree.
 * @param {Array} lastItemStack - Tracks if the current item is the last at each depth.
 * @param {number} currentIndex - The index of the current item in the entries array.
 * @param {number} totalEntries - The total number of entries in the directory.
 * @returns {string} The computed prefix for the directory entry.
 */
function computePrefix(depth, lastItemStack, currentIndex, totalEntries) {
  let prefix = "";
  for (let j = 0; j < depth; j++) {
    prefix += lastItemStack[j] ? "    " : "│   ";
  }
  prefix += currentIndex === totalEntries - 1 ? "└── " : "├── ";
  return prefix;
}

module.exports = { processDirectory };
