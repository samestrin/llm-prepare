const fs = require("fs-extra");
const path = require("path");
const istextorbinary = require("istextorbinary");
const { processFile } = require("./processFile");

// Add size tracking constants
const MAX_FILE_SIZE = 1024 * 1024 * 10; // 10MB per file
const MAX_TOTAL_SIZE = 1024 * 1024 * 200; // 200MB total size limit
const MAX_LAYOUT_SIZE = 1024 * 1024 * 10; // 10MB layout size limit

// Add debug function
function debugLog(message, argv) {
  if (argv.debug) {
    console.log(`[DEBUG] ${message}`);
  }
}

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
 * @param {object} sizeTracker - Object to track total processed size.
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
  includePaths,
  sizeTracker = { totalSize: 0, layoutSize: 0 }
) {
  let singleFileOutput = [];
  let layoutIncluded = false;
  // Create a local layout string instead of modifying the passed one
  let localLayout = "";

  // Debug current directory
  debugLog(`Processing directory: ${dir}`, argv);
  
  // Ensure includePaths is always an array
  includePaths = Array.isArray(includePaths) ? includePaths : [];
  
  // Ensure filePattern is always a RegExp
  if (!(filePattern instanceof RegExp)) {
    // Default to match all files if not provided or invalid
    filePattern = /.*/;
    debugLog(`Using default file pattern: ${filePattern}`, argv);
  }
  
  // Check layout size
  if (layout.length > MAX_LAYOUT_SIZE) {
    console.warn(`Warning: Layout size exceeds limit (${(layout.length / 1024 / 1024).toFixed(2)}MB). Truncating layout.`);
    layout = layout.substring(0, MAX_LAYOUT_SIZE) + "\n... [layout truncated due to size] ...\n";
    sizeTracker.layoutSize = layout.length;
  }

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
    
    // Debug current file/directory
    debugLog(`Processing entry: ${entryPath}`, argv);
    
    const stats = await fs.stat(entryPath);

    if (stats.isDirectory()) {
      try {
        const childResult = await processDirectory(
          entryPath,
          baseDir,
          ig,
          depth + 1,
          lastItemStack.concat(i === filteredEntries.length - 1),
          "", // Pass empty string instead of the entire layout
          argv,
          includePaths,
          sizeTracker
        );
        
        // Check if adding childResult.layout would exceed the limit
        if (localLayout.length + childResult.layout.length > MAX_LAYOUT_SIZE) {
          console.warn(`Warning: Layout for ${entryPath} is too large. Truncating.`);
          localLayout += `\n... [layout for ${path.relative(baseDir, entryPath)} truncated due to size] ...\n`;
        } else {
          localLayout += childResult.layout;
        }
        
        singleFileOutput = singleFileOutput.concat(childResult.singleFileOutput);
        layoutIncluded = childResult.layoutIncluded;
      } catch (error) {
        console.warn(`Error processing directory ${entryPath}: ${error.message}`);
        continue;
      }
    } else if (stats.isFile() && filePattern.test(entry)) {
      // Check individual file size
      if (stats.size > MAX_FILE_SIZE) {
        console.warn(`Warning: Skipping ${entryPath} - File size (${(stats.size / 1024 / 1024).toFixed(2)}MB) exceeds maximum allowed size (10MB)`);
        continue;
      }

      // Check if we're approaching the total size limit
      if (sizeTracker.totalSize > MAX_TOTAL_SIZE) {
        console.warn(`Warning: Total size limit reached (${(sizeTracker.totalSize / 1024 / 1024).toFixed(2)}MB). Remaining files will be skipped.`);
        break;
      }

      try {
        const content = await fs.readFile(entryPath, "utf8");
        if (!istextorbinary.isBinary(entryPath, content)) {
          const processedContent = await processFile(content, entryPath, argv);
          
          // Track the size of processed content
          sizeTracker.totalSize += processedContent.length;
          
          singleFileOutput.push({
            path: path.relative(baseDir, entryPath),
            content: processedContent,
          });
          
          // Add to local layout instead of the passed layout
          localLayout +=
            computePrefix(depth, lastItemStack, i, filteredEntries.length) +
            entry +
            "\n";
        }
      } catch (error) {
        console.warn(`Warning: Error processing ${entryPath}: ${error.message}`);
        continue;
      }
    }
  }
  
  // Return the local layout instead of modifying the passed one
  return { layout: localLayout, singleFileOutput, layoutIncluded };
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
