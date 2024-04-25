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

// Helper function to escape special characters in regex and convert wildcard * to .*
const escapeRegExp = (string) => string.replace(/[.+?^${}()|[\]\\]/g, "\\$&");
const convertWildcard = (pattern) => pattern.replace(/\*/g, ".*");

const filePattern = new RegExp(
  argv["file-pattern"] === "*"
    ? ".*"
    : convertWildcard(escapeRegExp(argv["file-pattern"]))
);
const compress = argv.compress;
let singleFileOutput = ""; // Declare singleFileOutput at the top level
let layout = "";
let currentChunkSize = 0;

// Improved: Ignore empty lines and comments in ignore files
const filterIgnoreContent = (content) => {
  return content
    .split("\n")
    .filter((line) => line.trim() !== "" && !line.trim().startsWith("#"))
    .join("\n");
};

// Updated readIgnoreFiles function to handle .gitignore better
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

// Updated processDirectory to handle layout suppression and file chunking
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

        if (compress) {
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

// Helper to write output to file or console
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

// Main execution function with initial layout setup
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

let outputFileCounter = 1; // Initialize file counter for output chunks
main().catch((error) => console.error(`Unhandled error: ${error.message}`));
