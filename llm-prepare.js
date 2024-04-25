#!/usr/bin/env node

/**
 * llm-prepare converts complex project directory structures and files into a single
 * flat or set of flat files for LLM processing using AI tools like ChatGPT, Claude, Gemini,
 * Mistral, or ..?
 *
 * Copyright (c) 2024-PRESENT Sam Estrin <https://github.com/samestrin/llm-prepare>
 * This script is licensed under the MIT License (see LICENSE for details)
 */

const fs = require("fs-extra");
const path = require("path");
const ignore = require("ignore");
const yargs = require("yargs/yargs");
const { hideBin } = require("yargs/helpers");
const packageJson = require("./package.json");

// Set up command line arguments
const argv = yargs(hideBin(process.argv))
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
  })
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
  .version("v", "Display the version number", packageJson.version)
  .alias("v", "version").argv;

// Initialize variables
let singleFileOutput = [];
let layout = "";
let layoutIncluded = false;
let currentChunkSize = 0;
let outputFileCounter = 1;

// handle filePattern RegExp
const filePattern = new RegExp(
  argv["file-pattern"] === "*"
    ? ".*"
    : convertWildcard(escapeRegExp(argv["file-pattern"]))
);

// Main execution function
main().catch(handleError);

/**
 * Centralized error handling function
 *
 * @param {Error} error - The error object caught
 */
function handleError(error) {
  console.error(`Unhandled error: ${error.message}`);
}

/**
 * Main execution function, sets up the initial layout and processes the directory
 * based on provided command line arguments
 */
async function main() {
  const ig = await readIgnoreFiles(argv["path-name"]);
  if (!argv["suppress-layout"]) {
    // Initialize layout only if not suppressed
    layout = "/" + path.basename(argv["path-name"]) + "\n"; // Setting the initial layout
  }
  await processDirectory(argv["path-name"], argv["path-name"], ig);
  await finalizeOutput(); // Final output handling moved to a separate function
}

/**
 * Reads and processes .ignore files in a directory to prepare an ignore manager
 *
 * @param {string} dir - The directory path to read ignore files from
 * @returns {object} The ignore manager with configured rules
 */
async function readIgnoreFiles(dir) {
  const ig = ignore();
  const defaultIgnorePath = path.join(__dirname, ".defaultignore");

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
 * Filters out empty lines and comments from .ignore file content.
 *
 * This function is intended to process the content of ignore files such as .gitignore,
 * .dockerignore, etc. It removes all lines that are either empty or start with a '#',
 * which are considered comments in many ignore file formats.
 *
 * @param {string} content - The content of an ignore file
 * @returns {string} Filtered content with no empty lines or comment lines
 */
function filterIgnoreContent(content) {
  return content
    .split("\n")
    .filter((line) => line.trim() !== "" && !line.startsWith("#"))
    .join("\n");
}

/**
 * Checks if a specific file exists in the filesystem.
 *
 * This function uses the fs.access method to determine if the file is accessible,
 * which indirectly checks if the file exists without opening it. This method is preferred
 * for checking file existence without manipulating the file itself.
 *
 * @param {string} filePath - The full path to the file whose existence needs to be checked.
 * @returns {Promise<boolean>} A promise that resolves to true if the file exists, false if it does not.
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
 * Processes a directory recursively, applying ignore rules and preparing content for output
 * while generating an ASCII layout of the directory structure.
 *
 * @param {string} dir - The current directory to process
 * @param {string} [baseDir=dir] - The base directory of the processing to maintain relative paths
 * @param {object} ig - The ignore manager with rules to apply
 * @param {number} [depth=0] - The current depth in the directory tree
 * @param {Array} lastItemStack - Tracks if the current item is the last in each directory level
 */
async function processDirectory(
  dir,
  baseDir = dir,
  ig,
  depth = 0,
  lastItemStack = []
) {
  const dirExists = await fs.pathExists(dir);
  if (!dirExists) {
    console.error(`Directory does not exist: ${dir}`);
    return; // Exit if directory does not exist
  }

  const entries = await fs.readdir(dir);
  const notIgnoredEntries = ig.filter(entries).sort(); // Sort for consistent output

  // Update lastItemStack for current depth
  lastItemStack[depth] = false; // Reset current depth status

  // Process each entry in the directory
  for (let i = 0; i < notIgnoredEntries.length; i++) {
    lastItemStack[depth] = i === notIgnoredEntries.length - 1; // Update last item status at current depth

    const entry = notIgnoredEntries[i];
    const entryPath = path.join(dir, entry);
    const stats = await fs.stat(entryPath);

    // Build prefix with adjusted layout for last items
    let prefix = "";
    for (let j = 0; j <= depth; j++) {
      if (j == depth) {
        // Current depth, decide based on lastItemStack
        prefix += lastItemStack[j] ? "└── " : "├── ";
      } else {
        prefix += lastItemStack[j] ? "    " : "│   ";
      }
    }

    if (stats.isDirectory()) {
      // Append directory to layout
      layout += prefix + entry + "/\n";
      // Recursive call to process subdirectory

      await processDirectory(entryPath, baseDir, ig, depth + 1, lastItemStack);
    } else if (stats.isFile() && filePattern.test(entry)) {
      // Append file to layout
      layout += prefix + entry + "\n";

      let content = await fs.readFile(entryPath, "utf8");
      if (content.trim().length === 0) continue; // Skip empty files

      if (!argv["include-comments"]) {
        content = content.replace(/\/\*[\s\S]*?\*\//g, ""); // Remove block comments
        content = content.replace(/\/\/.*$/gm, ""); // Remove single-line comments
      }

      content = content.replace(/[ \t]+/g, " "); // Normalize spaces and tabs

      if (argv["compress"]) {
        content = content.replace(/\s+/g, " ").trim(); // Compress whitespace
      } else {
        content = content.replace(/(?:\r\n|\r|\n){2,}/g, "\n"); // Condense newlines
      }

      let fileContent =
        `

/** File: ${path.relative(
          baseDir,
          entryPath
        )} ***************************************/

` +
        content +
        "\n";

      // Handle output logic based on chunk size, if specified
      if (
        argv["chunk-size"] &&
        currentChunkSize + fileContent.length > argv["chunk-size"] * 1024
      ) {
        await writeOutput(singleFileOutput.join(""));
        singleFileOutput = [];
        currentChunkSize = 0;
      }

      singleFileOutput.push(fileContent);
      currentChunkSize += fileContent.length;
    }
  }
}

/**
 * Manages layout display in output and finalizes writing to the output destination.
 */
async function finalizeOutput() {
  if (singleFileOutput.length > 0) {
    // Ensure there's content to write
    let finalOutput = singleFileOutput.join("\n");
    await writeOutput(finalOutput);
    singleFileOutput = []; // Clear buffer after writing
    currentChunkSize = 0;
  }
}

/**
 * Writes processed output to a file or console based on user configuration.
 * Includes error handling to catch and report any issues during the file write process.
 *
 * @param {string} output - The content to write out.
 */
async function writeOutput(output) {
  if (!layoutIncluded && !argv["suppress-layout"]) {
    output = layout + "\n" + output; // Prepend layout if not already included
    layoutIncluded = true; // Set flag to avoid duplicating the layout
  }

  if (
    argv["chunk-size"] &&
    currentChunkSize + output.length > argv["chunk-size"] * 1024
  ) {
    // If chunk size is specified and current chunk + new output exceeds it, write current chunk
    await writeChunkOutput(singleFileOutput.join(""));
    singleFileOutput = [output]; // Start new chunk with current output
    currentChunkSize = output.length; // Reset chunk size counter
  } else {
    // If no chunk size is specified, add output to buffer

    singleFileOutput.push(output);
    currentChunkSize += output.length; // Update current chunk size

    if (!argv["chunk-size"]) {
      // If no chunking, write all at once at the end
      await writeChunkOutput(singleFileOutput.join(""));
      singleFileOutput = []; // Clear buffer after writing
      currentChunkSize = 0;
    }
  }
}

/**
 * Writes chunked processed output to a file or console based on user configuration.
 * Includes error handling to catch and report any issues during the file write process.
 *
 * @param {string} output - The content to write out.
 */
async function writeChunkOutput(output) {
  if (argv["output-filename"]) {
    // Construct filename for output
    let filename = argv["output-filename"];
    if (outputFileCounter > 1) {
      const extension = path.extname(filename);
      const baseName = filename.slice(0, -extension.length);
      filename = `${baseName}.${outputFileCounter}${extension}`;
    }
    await fs.writeFile(filename, output, "utf8");
    console.log(`Output written to ${filename}`);
    outputFileCounter++; // Increment for next chunk
  } else {
    // If no filename provided, output to console
    console.log(output);
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
