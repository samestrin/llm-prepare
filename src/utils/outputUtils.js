// utils/outputUtils.js

const fs = require("fs-extra");
const path = require("path");
const { generateOutputFilename } = require("./fileUtils");

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
  argv,
) {
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

    if (currentOutput) {
      chunks.push(currentOutput.trim());
    }

    for (let i = 0; i < chunks.length; i++) {
      await writeChunkOutput(chunks[i], i + 1, argv, layout);
    }
  } else {
    if (!layoutIncluded && !argv["suppress-layout"]) {
      singleFileOutput.unshift(layout + "\n");
      layoutIncluded = true;
    }

    await writeChunkOutput(singleFileOutput.join("\n"), 1, argv, "");
  }
}

/**
 * Writes a chunk of processed output to a file, or logs it to the console
 * if no filename is provided. Handles errors during the file writing process.
 *
 * @param {string} output - The content to be written.
 * @param {number} index - The index of the chunk (for file naming).
 * @param {object} argv - Command-line arguments that may specify the output filename and other options.
 * @param {string} layout - The directory layout to be included at the beginning of each chunk.
 */
async function writeChunkOutput(output, index, argv, layout) {
  let filename = argv["output-filename"];

  if (!filename) {
    // Generate filename based on directory name if -o is provided without a filename
    filename = generateOutputFilename(argv["path"]);
  }

  const extension = path.extname(filename);
  const baseName = path.basename(filename, extension);
  const indexedFilename =
    index === 1
      ? `${baseName}${extension}`
      : `${baseName}.${index}${extension}`;

  let chunkOutput;
  if (index === 1) {
    chunkOutput = layout + "\n\n" + output;
  } else {
    chunkOutput = output;
  }

  const outputDir = process.env.LLM_PREPARE_OUTPUT_DIR;
  let fullOutputPath;

  if (outputDir) {
    await fs.ensureDir(outputDir);
    fullOutputPath = path.join(outputDir, indexedFilename);
  } else {
    fullOutputPath = indexedFilename;
  }

  try {
    await fs.writeFile(fullOutputPath, chunkOutput.trim(), "utf8");
    console.log(`Output written to ${fullOutputPath}`);
  } catch (error) {
    console.error(
      `Failed to write output to ${fullOutputPath}: ${error.message}`,
    );
  }
}

module.exports = { writeAllOutputs, writeChunkOutput };
