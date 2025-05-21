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
