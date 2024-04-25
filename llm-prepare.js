#!/usr/bin/env node
const fs = require("fs-extra");
const path = require("path");
const ignore = require("ignore");
const yargs = require("yargs/yargs");
const { hideBin } = require("yargs/helpers");
const packageJson = require("./package.json"); // Assuming package.json is in the same directory as your script

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

  .option("output-filename", {
    alias: "o",
    describe: "Filename to write output to instead of printing to console",
    type: "string",
    demandOption: false,
  })
  .version("v", "Display the version number", packageJson.version) // Adding version command
  .alias("v", "version").argv;

// Safely escape special characters and convert wildcard * to .*
const escapeRegExp = (string) => string.replace(/[.+?^${}()|[\]\\]/g, "\\$&");
const convertWildcard = (pattern) => pattern.replace(/\*/g, ".*");

const filePattern = new RegExp(
  argv.filePattern === "*"
    ? ".*"
    : convertWildcard(escapeRegExp(argv.filePattern))
);
const compress = argv.compress;
let singleFileOutput = ""; // Declare singleFileOutput at the top level
let layout = "";

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
  ig.add("vendor"); // Ignore vendor directory
  ig.add("node_modules"); // Ignore vendor directory
  ig.add("*.lock"); // Ignore *.lock files
  ig.add("*.json"); // Ignore *.json files

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
        let content = await fs.readFile(entryPath, "utf8");
        if (content.trim().length === 0) continue; // Skip empty files

        layout +=
          "│   ".repeat(
            dir.split(path.sep).length - baseDir.split(path.sep).length
          ) +
          "└── " +
          entry +
          "\n";

        if (!argv.includeComments) {
          content = content.replace(/\/\/.*|\/\*[\s\S]*?\*\//g, ""); // Remove comments
        }

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

    if (argv.outputFilename) {
      await fs.writeFile(argv.outputFilename, singleFileOutput, "utf8");
      console.log(`Output written to ${argv.outputFilename}`);
    } else {
      console.log(singleFileOutput);
    }
  } catch (error) {
    console.error(`Main execution error: ${error.message}`);
  }
}

main().catch((error) => console.error(`Unhandled error: ${error.message}`));
