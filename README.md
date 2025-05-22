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

```bash
# Install globally
npm install -g llm-prepare

# Or install locally
npm install llm-prepare
```

## Usage

```bash
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
```

## Command Line Options

| Option | Description |
|--------|-------------|
| `-i, --input <source>` | Input source (file, URL, or stdin) |
| `-o, --output <file>` | Output file (defaults to stdout) |
| `-f, --format <format>` | Format to convert to (markdown, html, text) |
| `-m, --max-tokens <number>` | Maximum tokens to include |
| `--prompt <file>` | Prompt template file |
| `--show-prompts` | Review prompts latest library online at GitHub |
| `--variables <json>` | JSON string of variables for the prompt template |
| `-t, --truncate <strategy>` | Truncation strategy (start, end, middle) |
| `-r, --render` | Render content with a browser for JavaScript-heavy sites |
| `-d, --debug` | Enable debug output |
| `-s, --system <message>` | System message to prepend |
| `-u, --user <message>` | User message to append |
| `--config <filepath>` | Path to a JSON configuration file |
| `-v, --version` | Show version number |
| `--help` | Show help |

## Template System

LLM-Prepare includes a comprehensive template system that helps you structure your prompts for various tasks. These templates are located in the `templates/` directory and are organized into categories.

### Template Categories

#### Multi-Variable Prompts
These templates are designed for complex tasks requiring multiple input variables:

- **General Analysis**: Templates for analyzing various types of content
- **Coding**: Templates for code review, documentation, testing, and Q&A
- **CSV Processing**: Templates for data extraction, visualization, and analysis

#### Simple Prompts
These templates require minimal variable input and are designed for straightforward tasks:

- **README Generation**: Templates for creating various types of README files
- **CSV Processing**: Templates for database schema generation and data analysis
- **Code Commenting**: Templates for adding documentation comments in various languages

### Using Templates

To use a template, specify the path to the template file with the `--prompt` option and provide any required variables with the `--variables` option:

```bash
# Example: Using a template for code Q&A
llm-prepare --prompt templates/multi-variable/coding/question-and-answer.md --variables "language:Python" "questions_asked:What does the main function do?" --file path/to/your/code.py

# Example: Generating a README for a project
llm-prepare --prompt templates/simple/README/basic-readme-generation.md --project-path ./my-project
```

Each template has specific variables it accepts. The `{{text}}` variable is automatically populated with the content of the file(s) you are processing.

### Template Documentation

For a complete list of available templates and their documentation, refer to the [Templates README](templates/README.md) file.

All templates have been primarily tested with OpenAI's GPT-4o model. While they should work with other capable LLMs, outputs may vary and require adaptation.

## Project Directory Processing

LLM-Prepare supports processing entire project directories, generating a consolidated view that includes both the project structure and file contents. This is particularly useful for providing context to LLMs about complex codebases.

### Basic Usage

```bash
# Process a project directory
llm-prepare -p ./my-project -o result.txt

# Use with specific file patterns
llm-prepare --project-path ./my-project --file-pattern "*.js" --output js-files-only.txt

# Process with compression to reduce token usage
llm-prepare --project-path ./my-project --compress --output compressed-project.txt
```

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

```bash
# Disable .gitignore processing
llm-prepare --project-path ./my-project --ignore-gitignore

# Use custom ignore patterns
llm-prepare --project-path ./my-project --custom-ignore-string "node_modules,*.log,temp/*"

# Use a custom ignore file
llm-prepare --project-path ./my-project --custom-ignore-filename .customignore

# Display default ignore patterns
llm-prepare --show-default-ignore
```

| Option | Description |
|--------|-------------|
| `--ignore-gitignore` | Disable processing of .gitignore files |
| `--custom-ignore-string <patterns>` | Comma-separated ignore patterns |
| `--custom-ignore-filename <filepath>` | Path to a custom ignore file |
| `--default-ignore <filepath>` | Path to a default ignore file |
| `--show-default-ignore` | Display the default ignore patterns |

### Output Chunking

For very large projects, you can split the output into multiple files based on size:

```bash
# Split output into 500KB chunks
llm-prepare --project-path ./my-project --chunk-size 500 --output project-output.txt
```

This will generate files like `project-output_part1.txt`, `project-output_part2.txt`, etc., if the total size exceeds the specified chunk size.

### Configuration File

Project processing options can also be specified in a configuration file:

```json
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
```

```bash
# Use with a configuration file
llm-prepare --config my-config.json
```

### Example: Processing a React Project

```bash
# Process a React project, focusing on source code
llm-prepare --project-path ./my-react-app --file-pattern "*.js,*.jsx,*.css" --custom-ignore-string "node_modules,build,public" --output react-codebase.txt
```

This command will:
1. Process all JavaScript, JSX, and CSS files in the project
2. Exclude node_modules, build, and public directories
3. Generate a consolidated file with the project structure and code content

## Prompt Templates

Prompt templates support variable substitution using `{{variable}}` syntax. The input text is automatically available as `{{text}}` or `{{content}}`.

Example template:

```
SYSTEM: You are a {{model}} AI assistant that is an expert in {{task}}.

USER: {{text}}

A:
```

## Configuration Files

Configuration files allow you to store frequently used settings in a JSON file, making it easier to reuse complex configurations.

### Example Configuration File

```json
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
```

Command-line arguments will override any settings in the configuration file. This provides flexibility to use a base configuration and adjust specific settings as needed for each run.

To use a configuration file:

```bash
llm-prepare --config my-config.json
```

You can also combine the configuration file with additional command-line arguments:

```bash
llm-prepare --config my-config.json --input new-file.txt --max-tokens 2000
```

## Programmatic API

```javascript
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
```

## In-Context Learning (ICL)

> "While finetuning with full datasets is still a powerful option if the data vastly exceeds the context length, our results suggest that long-context ICL is an effective alternative– trading finetuning-time cost for increased inference-time compute. As the effectiveness and efficiency of using very long model context lengths continues to increase, we believe long-context ICL will be a powerful tool for many tasks."
>
> ###### \- [Massive prompts can outperform fine-tuning for LLMs, researchers find](https://the-decoder.com/massive-prompts-outperform-fine-tuning-for-llms-in-new-study-researchers-find/)

In-Context Learning (ICL) allows a Large Language Model (LLM) to perform tasks by interpreting the context provided within the prompt without additional training or fine-tuning. This approach differs significantly from previous methods where models were explicitly trained on a specific task using vast datasets. Instead, ICL leverages the model's pre-trained knowledge base—a comprehensive understanding accumulated during its initial extensive training phase.

As the token size—or the amount of data that an LLM can process and generate in a single instance—has dramatically increased, the value of ICL has become even more significant. This increase in token size allows LLMs to handle longer and more complex inputs and outputs, which enhances their ability to understand and generate sophisticated text.

## In-Context Learning (ICL) Prompts

In-Context Learning (ICL) prompts guide a large language model (LLM) in performing tasks by providing relevant context within the input prompt. These prompts typically include examples, instructions, or patterns that help the model understand how to generate appropriate responses. Here are some characteristics and examples of ICL prompts:

### Characteristics of ICL Prompts:

- **Contextual Examples**: Provide examples within the prompt to demonstrate the desired output format.
- **Detailed Instructions**: Offer clear and detailed instructions on how to process the input and generate the output.
- **Patterns and Templates**: Use patterns or templates that the model can follow to ensure consistency in the responses.
- **Relevant Data**: Include any necessary data or background information that helps the model understand the context of the task.
- **Incremental Guidance**: Sometimes, step-by-step guidance is included to lead the model through complex tasks.

## Contribute

Contributions to this project are welcome. Please fork the repository and submit a pull request with your changes or improvements.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Share

[![Twitter](https://img.shields.io/badge/X-Tweet-blue)](https://twitter.com/intent/tweet?text=Check%20out%20this%20awesome%20project!&url=https://github.com/samestrin/llm-prepare) [![Facebook](https://img.shields.io/badge/Facebook-Share-blue)](https://www.facebook.com/sharer/sharer.php?u=https://github.com/samestrin/llm-prepare) [![LinkedIn](https://img.shields.io/badge/LinkedIn-Share-blue)](https://www.linkedin.com/sharing/share-offsite/?url=https://github.com/samestrin/llm-prepare)