// utils/fileUtils.js

const fs = require("fs-extra");
const path = require("path");

/**
 * Generates an output filename based on the provided path name.
 *
 * @param {string} pathName - The path to the directory.
 * @returns {string} The generated filename based on the directory name.
 */
function generateOutputFilename(pathName) {
  if (!pathName) {
    throw new Error("Path name is required to generate output filename");
  }
  const baseDir = path.basename(path.resolve(pathName));
  return `${baseDir}.txt`;
}

/**
 * Checks if a specific file exists in the filesystem.
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

module.exports = { generateOutputFilename, fileExists };
