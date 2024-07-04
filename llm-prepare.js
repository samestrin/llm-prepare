#!/usr/bin/env node

/**
 * llm-prepare converts complex project directory structures and files into a single flat or set of flat files for AI processing using
 * ChatGPT, Claude, Gemini, Mistral, or ..?
 *
 * This Node.js tool recursively scans a project directory based on provided arguments (at least a directory and file inclusion pattern).
 * Then, it constructs a simplified layout view that includes all directories and file matches. The tool then combines the layout view with
 * the aggregated text file content of the entire project. The aggregated file content is stripped of comments and unnecessary whitespace
 * by default. Output compression is also supported to reduce token use, and llm-prepare can handle large projects by chunking the output.
 * Example prompts are included.
 *
 * Copyright (c) 2024-PRESENT Sam Estrin
 * This script is licensed under the MIT License (see LICENSE for details)
 * GitHub: https://github.com/samestrin/llm-prepare
 */

require("./src/index.js");
