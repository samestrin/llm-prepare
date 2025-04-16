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
  // Maximum safe string size (around 200MB to be safe)
  const MAX_SAFE_STRING_SIZE = 200 * 1024 * 1024;
  
  // If chunk-size is specified, use that, otherwise use auto-chunking based on MAX_SAFE_STRING_SIZE
  const chunkSizeBytes = argv["chunk-size"] 
    ? argv["chunk-size"] * 1024 
    : MAX_SAFE_STRING_SIZE;

  let currentChunk = "";
  let currentSize = 0;
  const chunks = [];
  
  // Add layout to first chunk if needed
  if (!layoutIncluded && !argv["suppress-layout"]) {
    currentChunk = layout + "\n\n";
    currentSize = currentChunk.length;
  }

  // Process each file and add to chunks
  for (const fileObj of singleFileObjOutput) {
    const content = fileObj.content;
    
    // If adding this content would exceed chunk size, start a new chunk
    if (currentSize + content.length > chunkSizeBytes) {
      chunks.push(currentChunk);
      currentChunk = "";
      currentSize = 0;
    }
    
    currentChunk += content;
    currentSize += content.length;
  }
  
  // Add the last chunk if it has content
  if (currentChunk) {
    chunks.push(currentChunk);
  }

  // Write all chunks to files
  for (let i = 0; i < chunks.length; i++) {
    await writeChunkOutput(chunks[i], i + 1, chunks.length, argv, i === 0 ? layout : "");
  }
}

/**
 * Writes a chunk of processed output to a file, or logs it to the console
 * if no filename is provided. Handles errors during the file writing process.
 *
 * @param {string} output - The content to be written.
 * @param {number} index - The index of the chunk (for file naming).
 * @param {number} totalChunks - Total number of chunks.
 * @param {object} argv - Command-line arguments that may specify the output filename and other options.
 * @param {string} layout - The directory layout to be included at the beginning of each chunk.
 */
async function writeChunkOutput(output, index, totalChunks, argv, layout) {
  let filename = argv["output-filename"];

  if (!filename) {
    // Generate filename based on directory name if -o is provided without a filename
    filename = generateOutputFilename(argv["path"]);
  }

  const extension = path.extname(filename);
  const baseName = path.basename(filename, extension);
  const indexedFilename =
    totalChunks === 1
      ? `${baseName}${extension}`
      : `${baseName}.${index}${extension}`;

  let chunkOutput = output;
  
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
    console.log(`Output written to ${fullOutputPath}${totalChunks > 1 ? ` (chunk ${index} of ${totalChunks})` : ''}`);
  } catch (error) {
    console.error(
      `Failed to write output to ${fullOutputPath}: ${error.message}`,
    );
  }
}

module.exports = { writeAllOutputs, writeChunkOutput };
