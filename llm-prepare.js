#!/usr/bin/env node
const fs = require("fs-extra");
const path = require("path");
const ignore = require("ignore");
const yargs = require("yargs/yargs");
const { hideBin } = require("yargs/helpers");

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
  .option("compress", {
    alias: "c",
    describe: "Should we compress the output?",
    type: "boolean",
    demandOption: false,
  }).argv;

// Compile file pattern only once
const filePattern = new RegExp(
  argv["file-pattern"] === "*" ? ".*" : argv["file-pattern"]
);
const compress = argv.compress;

/**
 * Reads ignore files from the specified directory and constructs an ignore object.
 * This function adds default ignores for .git and .gitignore files.
 *
 * @param {string} dir - The directory from which to read ignore files.
 * @returns {Promise<ignore>} The constructed ignore object with added rules.
 * @throws {Error} If reading the directory or files fails.
 */

async function readIgnoreFiles(dir) {
  const ig = ignore();
  ig.add(".git"); // Ignore .git folder
  ig.add(".gitignore"); // Ignore .gitignore file
  try {
    const files = await fs.readdir(dir);
    const ignoreFiles = files.filter((file) => file.match(/\..*ignore/));
    await Promise.all(
      ignoreFiles.map(async (file) => {
        const content = await fs.readFile(path.join(dir, file), "utf8");
        ig.add(content);
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
 * Processes the directory for files matching the pattern and constructs an output string.
 *
 * @param {string} dir - Current directory to process.
 * @param {string} baseDir - Base directory to maintain relative path structure.
 * @param {ignore} ig - Ignore object to filter directory entries.
 * @returns {Promise<void>}
 * @throws {Error} If processing the directory fails.
 */

async function processDirectory(dir, baseDir = dir, ig) {
  try {
    const entries = await fs.readdir(dir);
    const notIgnoredEntries = ig.filter(entries);

    for (const entry of notIgnoredEntries) {
      const entryPath = path.join(dir, entry);
      const stats = await fs.stat(entryPath);
      if (stats.isDirectory()) {
        layout +=
          "│   ".repeat(
            dir.split(path.sep).length - baseDir.split(path.sep).length
          ) +
          "├── " +
          entry +
          "/\n";
        await processDirectory(entryPath, baseDir, ig);
      } else if (stats.isFile() && entry.match(filePattern)) {
        layout +=
          "│   ".repeat(
            dir.split(path.sep).length - baseDir.split(path.sep).length
          ) +
          "└── " +
          entry +
          "\n";
        let content = await fs.readFile(entryPath, "utf8");
        content = content.replace(/\/\/.*|\/\*[\s\S]*?\*\//g, ""); // Remove comments
        content = content.replace(/[ \t]+/g, " "); // Normalize spaces and tabs to single space

        if (compress) {
          content = content.replace(/\s+/g, " ").trim(); // Normalize whitespace
        } else {
          content = content.replace(/(?:\r\n|\r|\n){2,}/g, "\n"); // Condense multiple newlines to a single newline}
        }
        singleFileOutput +=
          `

/** File: ${path.relative(
            baseDir,
            entryPath
          )} ***************************************/

` +
          content +
          "\n";
      }
    }
  } catch (error) {
    throw new Error(`Failed to process directory ${dir}: ${error.message}`);
  }
}

/**
 * Main function to execute the directory processing.
 */

async function main() {
  try {
    const ig = await readIgnoreFiles(argv["path-name"]);
    layout += "/" + path.basename(argv["path-name"]) + "\n";
    await processDirectory(argv["path-name"], argv["path-name"], ig);
    singleFileOutput = layout + "\n" + singleFileOutput;
    console.log(singleFileOutput);
  } catch (error) {
    console.error(`Main execution error: ${error.message}`);
  }
}

main().catch((error) => console.error(`Unhandled error: ${error.message}`));
