#!/usr/bin/env node

/**
 * llm-prepare converts complex project directory structures and files into a single
 * flat or set of flat files for LLM processing using AI tools like ChatGPT, Claude, Gemini,
 * Mistral, or others.
 *
 * Copyright (c) 2024-PRESENT Sam Estrin
 * This script is licensed under the MIT License (see LICENSE for details)
 * GitHub: https://github.com/samestrin/llm-prepare
 */

const fs = require("fs-extra");
const path = require("path");
const ignore = require("ignore");
const yargs = require("yargs/yargs");
const { hideBin } = require("yargs/helpers");
const packageJson = require("./package.json");
const istextorbinary = require("istextorbinary");

const yargsBuilder = yargs(hideBin(process.argv));

// Add path-name and file-pattern options conditionally
if (
  !process.argv.includes("--show-default-ignore") &&
  !process.argv.includes("--show-prompts")
) {
  yargsBuilder
    .option("path-name", {
      alias: "p",
      describe: "Path to the project directory",
      type: "string",
      demandOption: true,
    })
    .option("file-pattern", {
      alias: "f",
      describe:
        "Pattern of files to include, e.g., '\\.js$' or '*' for all files",
      type: "string",
      demandOption: true,
    });
}
yargsBuilder
  .option("output-filename", {
    alias: "o",
    describe: "Output filename",
    type: "string",
    demandOption: false,
  })
  .option("include-comments", {
    describe: "Include comments? (Default: false)",
    type: "boolean",
    demandOption: false,
    alias: "i",
  })
  .option("compress", {
    alias: "c",
    describe: "Compress? (Default: false)",
    type: "boolean",
    demandOption: false,
  })
  .option("chunk-size", {
    describe: "Maximum size (in kilobytes) of each file",
    type: "number",
    demandOption: false,
  })
  .option("suppress-layout", {
    alias: "s",
    describe: "Suppress layout in output (Default: false)",
    type: "boolean",
    demandOption: false,
  })
  .option("default-ignore", {
    describe: "Use a custom default ignore file",
    type: "string",
    demandOption: false,
  })
  .option("show-default-ignore", {
    describe: "Show default ignore file",
    type: "string",
    demandOption: false,
  })
  .option("show-prompts", {
    describe: "Show example prompts in your browser",
    type: "boolean",
    demandOption: false,
  })
  .version("v", "Display the version number", packageJson.version)
  .alias("v", "version").argv;

const argv = yargsBuilder.argv;

// Main execution function
main(argv).catch(handleError);

/**
 * Handles errors by logging them differently based on the environment variable. If no environment
 * variable is set, it logs the error to the console. If an environment variable is set, it logs both the
 * error message and its stack trace.
 *
 * @param {Error} error - The error object caught during execution.
 */
function handleError(error) {
  if (!process.env.ENV && false) {
    console.error(`Unhandled error: ${error.message}`);
  } else {
    console.log(`${error.message}`);
    console.log(`  at ${error.stack}`);
  }
}

/**
 * The core execution function of the script. Sets up the directory layout,
 * reads and processes ignore files, and initiates the processing of the
 * provided directory based on the command-line arguments.
 *
 * @param {object} argv - Command-line arguments parsed and structured.
 */
async function main(argv) {
  let layout = "";
  let layoutIncluded = false;

  if ("show-default-ignore" in argv) {
    await showDefaultIgnore();
    return;
  } else if ("show-prompts" in argv) {
    const open = (await import("open")).default;
    await open(
      "https://github.com/samestrin/llm-prepare/blob/main/example-prompts/README.md"
    );
    return;
  }

  const filePattern = new RegExp(
    argv["file-pattern"] === "*"
      ? ".*"
      : convertWildcard(escapeRegExp(argv["file-pattern"]))
  );

  const ig = await readIgnoreFiles(argv["path-name"], argv["default-ignore"]);

  // Correctly destructure the returned values
  const {
    layout: updatedLayout,
    singleFileOutput,
    layoutIncluded: layoutAlreadyIncluded,
  } = await processDirectory(
    argv["path-name"],
    argv["path-name"],
    ig,
    0,
    [],
    filePattern,
    layout,
    []
  );

  layout = updatedLayout;
  layoutIncluded = layoutAlreadyIncluded;

  // Use the returned singleFileOutput from processDirectory
  await writeAllOutputs(singleFileOutput, layout, layoutIncluded, argv);
}

/**
 * Reads and processes .ignore files (like .gitignore) within the specified directory,
 * configuring an ignore manager for filtering files and directories based on ignore rules.
 * It also handles custom default ignore files. This function throws an error if issues
 * arise while reading or processing ignore files.
 *
 * @param {string} dir - The directory to search for .ignore files.
 * @param {string} [defaultIgnorePath] - Optional path to a custom default ignore file.
 * @returns {Promise<object>} An ignore manager object with configured ignore rules.
 * @throws {Error} If there are issues reading or processing .ignore files.
 */
async function readIgnoreFiles(dir, defaultIgnorePath = false) {
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
      `Error reading or processing .defaultignore file: ${error.message}`
    );
  }

  try {
    const files = await fs.readdir(dir);
    const ignoreFiles = files.filter((file) => file.match(/\..*ignore/));
    await Promise.all(
      ignoreFiles.map(async (file) => {
        const content = await fs.readFile(path.join(dir, file), "utf8");
        ig.add(filterIgnoreContent(content));
      })
    );
  } catch (error) {
    handleError(
      `Failed to read ignore files in directory ${dir}: ${error.message}`
    );
  }
  return ig;
}

/**
 * Filters out empty lines and comments from .ignore file content, preparing it for
 * processing. It returns the filtered content with no empty lines or comment lines.
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
 * Shows the contents of the default ignore file configured in the system. This function
 * reads the content of the specified default ignore file and prints it to the console.
 *
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

/**
 * Checks if a specific file exists in the filesystem using the fs.access method. This method
 * is used to determine if the file is accessible, which indirectly checks if the file exists
 * without opening it. It returns true if the file exists and false otherwise.
 *
 * @param {string} filePath - The full path to the file whose existence needs to be checked.
 * @returns {Promise<boolean>} True if the file exists, false otherwise.
 */
async function fileExists(filePath) {
  try {
    await fs.access(filePath, fs.constants.F_OK);
    return true; // File exists
  } catch (error) {
    return false; // File does not exist
  }
}

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
  layoutIncluded
) {
  let layout = depth === 0 && !layoutIncluded ? `/${argv["path-name"]}\n` : "";
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
      notIgnoredEntries.length
    );

    if (stats.isDirectory()) {
      const childResult = await processDirectory(
        entryPath,
        baseDir,
        ig,
        depth + 1,
        lastItemStack.concat(i === notIgnoredEntries.length - 1),
        filePattern,
        layoutIncluded
      );

      layout += prefix + entry + "/\n" + childResult.layout;
      singleFileOutput = singleFileOutput.concat(childResult.singleFileOutput);
      layoutIncluded = childResult.layoutIncluded;
    } else if (stats.isFile() && filePattern.test(entry)) {
      // Read the content of the file
      let fileContent = await fs.readFile(entryPath, "utf-8");
      if (!istextorbinary.isBinary(entryPath, fileContent)) {
        // Process the file content
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
    // Perform any necessary transformations on the content based on command-line arguments

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
      filePath
    )} ***************************************/
${content}
`;
  } catch (error) {
    // Handle errors while reading the file
    console.error(`Error processing file ${filePath}: ${error.message}`);
    return ""; // Return an empty string in case of errors
  }
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

/**
 * Handles output writing, including chunking data (if configured) and managing
 * the inclusion of the directory layout.
 *
 * @param {Array} singleFileObjOutput - Array of file contents to be written.
 * @param {string} layout - The directory layout to be included in the output.
 * @param {boolean} layoutIncluded - Indicates whether the layout has already been added.
 * @param {object} argv - Command-line arguments that might affect output handling.
 */
async function writeAllOutputs(
  singleFileObjOutput,
  layout,
  layoutIncluded,
  argv
) {
  // process singleFileOutput

  let singleFileOutput = singleFileObjOutput.map((item) => item.content);

  if (argv["chunk-size"]) {
    let currentOutput = "";
    let accumulatedSize = 0;
    const chunks = [];

    for (const content of singleFileOutput) {
      if (accumulatedSize + content.length > argv["chunk-size"] * 1024) {
        chunks.push(currentOutput.trim());
        currentOutput = "";
        accumulatedSize = layout.length;
      }
      currentOutput += content;
      accumulatedSize += content.length;
    }

    // Push the last chunk if any content remains
    if (currentOutput) {
      chunks.push(currentOutput.trim());
    }

    // Write each chunk to output
    for (let i = 0; i < chunks.length; i++) {
      await writeChunkOutput(chunks[i], i + 1, argv, layout);
    }
  } else {
    // Manage layout only once at the start if not suppressed
    if (!layoutIncluded && !argv["suppress-layout"]) {
      singleFileOutput.unshift(layout + "\n");
      layoutIncluded = true;
    }

    // For non-chunked output, directly write everything
    await writeChunkOutput(singleFileOutput.join("\n"), 1, argv, "");
  }
}

/**
 * Writes a chunk of processed output to a file, or logs it to the console
 * if no filename is provided. Handles errors during the file writing process. It includes
 * the layout at the beginning of the first chunk if specified.
 *
 * @param {string} output - The content to be written.
 * @param {number} index - The index of the chunk (for file naming).
 * @param {object} argv - Command-line arguments that may specify the output filename and other options.
 * @param {string} layout - The directory layout to be included at the beginning of each chunk.
 */
async function writeChunkOutput(output, index, argv, layout) {
  let filename = argv["output-filename"];
  if (!filename) {
    console.log("Error: No filename provided."); // If no filename provided, output to console
  } else {
    // Determine the full filename for the output, appending the chunk index if needed.
    const extension = path.extname(filename);
    const baseName = path.basename(filename, extension);
    const indexedFilename =
      index === 1
        ? `${baseName}${extension}`
        : `${baseName}.${index}${extension}`;

    // Include layout at the beginning of each chunk
    if (index === 1) {
      chunkOutput = layout + "\n\n" + output;
    } else {
      chunkOutput = output;
    }
    // Write the output to the determined filename and log the result.
    try {
      await fs.writeFile(indexedFilename, chunkOutput.trim(), "utf8");
      console.log(`Output written to ${indexedFilename}`);
    } catch (error) {
      console.error(
        `Failed to write output to ${indexedFilename}: ${error.message}`
      );
    }
  }
}

/**
 * Escapes special characters in a string to safely use it as a regular expression
 *
 * @param {string} string - The string to escape
 * @returns {string} The escaped string
 */
function escapeRegExp(string) {
  return string.replace(/[.+?^${}()|[\]\\]/g, "\\$&");
}

/**
 * Converts wildcard characters in a string to a regex-compatible format
 *
 * @param {string} pattern - The string pattern containing wildcards
 * @returns {string} The string with wildcards converted to regular expression wildcards
 */
function convertWildcard(pattern) {
  return pattern.replace(/\*/g, ".*");
}
