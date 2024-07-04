// utils/errorHandler.js

/**
 * Handles errors by logging them differently based on the environment variable.
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

module.exports = { handleError };
