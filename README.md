# LLM-Prepare

[![Star on GitHub](https://img.shields.io/github/stars/samestrin/llm-prepare?style=social)](https://github.com/samestrin/llm-prepare/stargazers) [![Fork on GitHub](https://img.shields.io/github/forks/samestrin/llm-prepare?style=social)](https://github.com/samestrin/llm-prepare/network/members) [![Watch on GitHub](https://img.shields.io/github/watchers/samestrin/llm-prepare?style=social)](https://github.com/samestrin/llm-prepare/watchers)

![Version 2.0](https://img.shields.io/badge/Version-2.0-blue) [![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT) [![Built with Node.js](https://img.shields.io/badge/Built%20with-Node.js-green)](https://nodejs.org/)

A modern Node.js utility to prepare text for LLM consumption - handles truncation, prompt formatting, and preprocessing from various sources.

## Features

- Read from files, URLs, or standard input
- Convert between formats (Markdown, HTML, plain text)
- Apply prompt templates with variable substitution
- Truncate text to fit token limits with different strategies
- Render JavaScript-heavy websites using Puppeteer
- Add system/user messages for chat-based LLMs
- Support for configuration files for repeated usage patterns

## Installation

"""bash
# Install globally
npm install -g llm-prepare

# Or install locally
npm install llm-prepare
"""

## Usage

"""bash
# Basic usage
llm-prepare --input example.txt --output result.txt

# Format conversion
llm-prepare --input webpage.html --format markdown --output result.md

# Truncation
llm-prepare --input document.txt --max-tokens 1000 --truncate end

# Use with prompt template
llm-prepare --input data.txt --prompt templates/analysis.txt --variables '{"model": "gpt-4", "task": "summarize"}'

# Process URLs with JavaScript rendering
llm-prepare --input https://example.com --render --format text

# Use system and user messages
llm-prepare --input content.txt --system "Analyze the following text:" --user "What are the key points?"

# Read from stdin and pipe output
cat file.txt | llm-prepare --format markdown | tee output.md

# Use a configuration file for repeated settings
llm-prepare --config config.json
"""

## Command Line Options

| Option | Description |
|--------|-------------|
| `-i, --input <source>` | Input source (file, URL, or stdin) |
| `-o, --output <file>` | Output file (defaults to stdout) |
| `-f, --format <format>` | Format to convert to (markdown, html, text) |
| `-m, --max-tokens <number>` | Maximum tokens to include |
| `-p, --prompt <file>` | Prompt template file |
| `-v, --variables <json>` | JSON string of variables for the prompt template |
| `-t, --truncate <strategy>` | Truncation strategy (start, end, middle) |
| `-r, --render` | Render content with a browser for JavaScript-heavy sites |
| `-d, --debug` | Enable debug output |
| `-s, --system <message>` | System message to prepend |
| `-u, --user <message>` | User message to append |
| `--config <filepath>` | Path to a JSON configuration file |
| `--version` | Show version number |
| `--help` | Show help |

## Project Directory Processing

LLM-Prepare supports processing entire project directories, generating a consolidated view that includes both the project structure and file contents. This is particularly useful for providing context to LLMs about complex codebases.

### Basic Usage

"""bash
# Process a project directory
llm-prepare --project-path ./my-project --output result.txt

# Use with specific file patterns
llm-prepare --project-path ./my-project --file-pattern "*.js" --output js-files-only.txt

# Process with compression to reduce token usage
llm-prepare --project-path ./my-project --compress --output compressed-project.txt
"""

### Project Processing Options

| Option | Description |
|--------|-------------|
| `-p, --project-path <directoryPath>` | Path to the project directory to process |
| `--file-pattern <pattern>` | Glob pattern for matching files (default: "*") |
| `--no-layout` | Suppress the ASCII layout view of the project structure |
| `--include-comments` | Include comments in the output (default: false) |
| `--comment-style <style>` | Comment style for file headers (default: "//") |
| `-c, --compress` | Compress output by removing excessive whitespace |
| `--chunk-size <kilobytes>` | Maximum size in KB for each output file | 

### Ignore File Support

LLM-Prepare respects `.gitignore` files by default and offers additional options for customizing which files to include or exclude:

"""bash
# Disable .gitignore processing
llm-prepare --project-path ./my-project --ignore-gitignore

# Use custom ignore patterns
llm-prepare --project-path ./my-project --custom-ignore-string "node_modules,*.log,temp/*"

# Use a custom ignore file
llm-prepare --project-path ./my-project --custom-ignore-filename .customignore

# Display default ignore patterns
llm-prepare --show-default-ignore
"""

| Option | Description |
|--------|-------------|
| `--ignore-gitignore` | Disable processing of .gitignore files |
| `--custom-ignore-string <patterns>` | Comma-separated ignore patterns |
| `--custom-ignore-filename <filepath>` | Path to a custom ignore file |
| `--default-ignore <filepath>` | Path to a default ignore file |
| `--show-default-ignore` | Display the default ignore patterns |

### Output Chunking

For very large projects, you can split the output into multiple files based on size:

"""bash
# Split output into 500KB chunks
llm-prepare --project-path ./my-project --chunk-size 500 --output project-output.txt
"""

This will generate files like `project-output_part1.txt`, `project-output_part2.txt`, etc., if the total size exceeds the specified chunk size.

### Configuration File

Project processing options can also be specified in a configuration file:

"""json
{
  "args": {
    "project-path": "./src",
    "file-pattern": "*.js",
    "include-comments": true,
    "compress": true,
    "chunk-size": 1000
  },
  "include": ["./src/", "./lib/"]
}
"""

"""bash
# Use with a configuration file
llm-prepare --config my-config.json
"""

### Example: Processing a React Project

"""bash
# Process a React project, focusing on source code
llm-prepare --project-path ./my-react-app --file-pattern "*.js,*.jsx,*.css" --custom-ignore-string "node_modules,build,public" --output react-codebase.txt
"""

This command will:
1. Process all JavaScript, JSX, and CSS files in the project
2. Exclude node_modules, build, and public directories
3. Generate a consolidated file with the project structure and code content

## Prompt Templates

Prompt templates support variable substitution using `{{variable}}` syntax. The input text is automatically available as `{{text}}` or `{{content}}`.

Example template:

"""
SYSTEM: You are a {{model}} AI assistant that is an expert in {{task}}.

USER: {{text}}

A:
"""

## Configuration Files

Configuration files allow you to store frequently used settings in a JSON file, making it easier to reuse complex configurations.

### Example Configuration File

"""json
{
  "args": {
    "output": "result.txt",
    "format": "markdown",
    "max-tokens": 1000,
    "truncate": "end",
    "system": "You are a helpful assistant",
    "render": true
  }
}
"""

Command-line arguments will override any settings in the configuration file. This provides flexibility to use a base configuration and adjust specific settings as needed for each run.

To use a configuration file:

"""bash
llm-prepare --config my-config.json
"""

You can also combine the configuration file with additional command-line arguments:

"""bash
llm-prepare --config my-config.json --input new-file.txt --max-tokens 2000
"""

## Programmatic API

"""javascript
import { processText } from 'llm-prepare';

// Process text with options
const options = {
  input: 'file.txt',
  format: 'markdown',
  maxTokens: 2000,
  truncate: 'end',
  debug: true
};

processText(options)
  .then(() => console.log('Processing complete'))
  .catch(err => console.error('Error:', err));
"""

## License

MIT
