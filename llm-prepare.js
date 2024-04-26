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

// Initialize variables
let singleFileOutput = [];
let layout = "";
let layoutIncluded = false;
let currentChunkSize = 0;
let filePattern = "";

if (argv["file-pattern"]) {
  // Handle filePattern RegExp
  filePattern = new RegExp(
    argv["file-pattern"] === "*"
      ? ".*"
      : convertWildcard(escapeRegExp(argv["file-pattern"]))
  );
}
// Main execution function
main().catch(handleError);

/**
 * Centralized error handling function
 *
 * @param {Error} error - The error object caught
 */
function handleError(error) {
  if (!process.env.ENV) {
    console.error(`Unhandled error: ${error.message}`);
  } else {
    console.log(`${error.message}`);
    console.log(`  at ${error.stack}`);
  }
}

/**
 * The core execution function of the script. Sets up the directory layout,
 * reads and processes ignore files, and initiates the processing of the
 * provided directory.
 */
async function main() {
  // check for non-recursive actions

  if (argv["show-default-ignore"]) {
    await showDefaultIgnore();
    return;
  } else if (argv["show-prompts"]) {
    const open = (await import("open")).default;
    await open(
      "https://github.com/samestrin/llm-prepare/tree/main/example-prompts"
    );
    return;
  }

  const defaultIgnorePath =
    argv["default-ignore"] || path.join(__dirname, ".defaultignore");
  const ig = await readIgnoreFiles(argv["path-name"], defaultIgnorePath);
  if (!argv["suppress-layout"]) {
    // Initialize layout only if not suppressed
    layout = "/" + path.basename(argv["path-name"]) + "\n"; // Setting the initial layout
  }

  await processDirectory(argv["path-name"], argv["path-name"], ig);
  await writeAllOutputs(); // handle final output differently
}

/**
 * Reads and processes .ignore files (like .gitignore) within the specified directory,
 * configuring an ignore manager for filtering files and directories.
 *
 * @param {string} dir - The directory to search for .ignore files.
 * @returns {object} An ignore manager object with configured ignore rules.
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
 * Show the contents of the default ignore file.
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
 * Recursively processes a directory, applying ignore rules, building a layout,
 * and preparing file content for output.
 *
 * @param {string} dir - The current directory to process
 * @param {string} [baseDir=dir] - The base directory for relative paths
 * @param {object} ig - The ignore manager for applying file/directory exclusions
 * @param {number} [depth=0] - The current depth in the directory tree
 * @param {Array} lastItemStack - Tracks if the current item is the last at each depth
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

      singleFileOutput.push(fileContent);
    }
  }
}

/**
 * Handles output writing, including chunking data (if configured) and managing
 * the inclusion of the directory layout.
 */
async function writeAllOutputs() {
  // Check if chunking is necessary

  if (argv["chunk-size"]) {
    let currentOutput = "";
    let accumulatedSize = 0;
    const chunks = [];

    await addLayout();

    // Break the output into chunks
    for (const content of singleFileOutput) {
      if (accumulatedSize + content.length > argv["chunk-size"] * 1024) {
        chunks.push(currentOutput);
        currentOutput = "";
        accumulatedSize = 0;
      }
      currentOutput += content;
      accumulatedSize += content.length;
    }
    if (currentOutput) {
      chunks.push(currentOutput);
    }

    // Write chunks in reverse if layout needs to be in the first
    for (let i = chunks.length - 1; i >= 0; i--) {
      await writeChunkOutput(chunks[i].trim(), i + 1);
    }
  } else {
    // No chunking, just write everything
    await writeChunkOutput(layout + singleFileOutput.join("\n"), 1);
  }
}

/**
 * Writes a chunk of processed output to a file, or logs it to the console
 * if no filename is provided.  Handles errors during the file writing process.
 *
 * @param {string} output - The content to be written.
 * @param {number} index -  The index of the chunk (for file naming).
 */
async function writeChunkOutput(output, index) {
  let filename = argv["output-filename"];
  if (!filename) {
    console.log("Error: No filename provided."); // If no filename provided, output to console
  } else {
    const extension = path.extname(filename);
    const baseName = path.basename(filename, extension);
    const indexedFilename =
      index === 1
        ? `${baseName}${extension}`
        : `${baseName}.${index}${extension}`;

    await fs.writeFile(indexedFilename, output, "utf8");
    console.log(`Output written to ${indexedFilename}`);
  }
}

/**
 * Prepends the directory layout to the output buffer if it's not already included
 * and if the layout is not suppressed by the user. Ensures the layout is only
 * added once.
 */
async function addLayout() {
  // Handle the layout display for single files
  if (!layoutIncluded && !argv["suppress-layout"]) {
    singleFileOutput.unshift(layout); // Prepend layout if not already included
    currentChunkSize += layout.length;
    layoutIncluded = true; // Set flag to avoid duplicating the layout
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
