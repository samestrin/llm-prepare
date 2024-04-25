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
  .version("v", "Display the version number", packageJson.version) // Adding version command
  .alias("v", "version").argv;

// handle filePattern RegExp
const filePattern = new RegExp(
  argv["file-pattern"] === "*"
    ? ".*"
    : convertWildcard(escapeRegExp(argv["file-pattern"]))
);

// Initialize variables
let singleFileOutput = "";
let layout = "";
let currentChunkSize = 0;
let outputFileCounter = 1;

// Main execution function
main().catch((error) => console.error(`Unhandled error: ${error.message}`));

/**
 * Functions
 */

/**
 * Main execution function, sets up the initial layout and processes the directory
 * based on provided command line arguments
 *
 * @throws {Error} Description of the error thrown when execution fails
 */

async function main() {
  try {
    const ig = await readIgnoreFiles(argv["path-name"]);
    if (!argv["suppress-layout"]) {
      layout += "/" + path.basename(argv["path-name"]) + "\n";
    }
    await processDirectory(argv["path-name"], argv["path-name"], ig);
    singleFileOutput = argv["suppress-layout"]
      ? singleFileOutput
      : layout + "\n" + singleFileOutput;

    // Final output write
    await writeOutput(singleFileOutput);
  } catch (error) {
    console.error(`Main execution error: ${error.message}`);
  }
}

/**
 * Filters out empty lines and comments from .ignore file content
 *
 * @param {string} content - The content of an ignore file
 * @returns {string} Filtered content with no empty lines or comment lines
 */

function filterIgnoreContent(content) {
  return content
    .split("\n")
    .filter(function (line) {
      return line.trim() !== "" && !line.trim().startsWith("#");
    })
    .join("\n");
}

/**
 * Reads and processes .ignore files in a directory to prepare an ignore manager
 *
 * @param {string} dir - The directory path to read ignore files from
 * @returns {object} The ignore manager with configured rules
 * @throws {Error} Description of the error thrown when reading fails
 */

async function readIgnoreFiles(dir) {
  const ig = ignore();

  ig.add(".git");
  ig.add(".gitignore");
  ig.add("vendor");
  ig.add("node_modules");
  ig.add("*.lock");
  ig.add("*.json");

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
    throw new Error(
      `Failed to read ignore files in directory ${dir}: ${error.message}`
    );
  }
  return ig;
}

/**
 * Processes a directory recursively, applying ignore rules and preparing content for output
 *
 * @param {string} dir - The current directory to process
 * @param {string} [baseDir=dir] - The base directory of the processing to maintain relative paths
 * @param {object} ig - The ignore manager with rules to apply
 * @throws {Error} Description of the error thrown when processing fails
 */

async function processDirectory(dir, baseDir = dir, ig) {
  try {
    const entries = await fs.readdir(dir);
    const notIgnoredEntries = ig.filter(entries);

    for (const entry of notIgnoredEntries) {
      const entryPath = path.join(dir, entry);
      const stats = await fs.stat(entryPath);
      if (stats.isDirectory()) {
        if (!argv["suppress-layout"]) {
          layout +=
            "│   ".repeat(
              dir.split(path.sep).length - baseDir.split(path.sep).length
            ) +
            "├── " +
            entry +
            "/\n";
        }
        await processDirectory(entryPath, baseDir, ig);
      } else if (stats.isFile() && entry.match(filePattern)) {
        let content = await fs.readFile(entryPath, "utf8");
        if (content.trim().length === 0) continue; // Skip empty files

        let fileHeader =
          "│   ".repeat(
            dir.split(path.sep).length - baseDir.split(path.sep).length
          ) +
          "└── " +
          entry +
          "\n";

        if (!argv["include-comments"]) {
          content = content.replace(/\/\/.*|\/\*[\s\S]*?\*\//g, ""); // Remove comments
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

        // Check if adding this file exceeds the chunk size, if chunk-size is set
        if (
          argv["chunk-size"] &&
          currentChunkSize + fileContent.length > argv["chunk-size"] * 1024
        ) {
          await writeOutput(singleFileOutput); // Write current output to a file
          singleFileOutput = ""; // Reset for new file
          currentChunkSize = 0; // Reset size counter
        }

        singleFileOutput += fileHeader + fileContent;
        currentChunkSize += fileHeader.length + fileContent.length;
      }
    }
  } catch (error) {
    throw new Error(`Failed to process directory ${dir}: ${error.message}`);
  }
}

/**
 * Writes processed output to a file or console based on user configuration
 *
 * @param {string} output - The content to write out
 * @throws {Error} Description of the error thrown when writing fails
 */

async function writeOutput(output) {
  if (argv.outputFilename) {
    let filename = argv.outputFilename;
    if (outputFileCounter > 1) {
      const extension = path.extname(filename);
      const baseName = filename.slice(0, -extension.length);
      filename = `${baseName}.${outputFileCounter}${extension}`;
    }
    await fs.writeFile(filename, output, "utf8");
    console.log(`Output written to ${filename}`);
    outputFileCounter++;
  } else {
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
