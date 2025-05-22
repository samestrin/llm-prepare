# LLM-Prepare

[![Star on GitHub](https://img.shields.io/github/stars/samestrin/llm-prepare?style=social)](https://github.com/samestrin/llm-prepare/stargazers) [![Fork on GitHub](https://img.shields.io/github/forks/samestrin/llm-prepare?style=social)](https://github.com/samestrin/llm-prepare/network/members) [![Watch on GitHub](https://img.shields.io/github/watchers/samestrin/llm-prepare?style=social)](https://github.com/samestrin/llm-prepare/watchers)

![Version 2.0](https://img.shields.io/badge/Version-2.0-blue) [![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT) [![Built with Node.js](https://img.shields.io/badge/Built%20with-Node.js-green)](https://nodejs.org/)

**llm-prepare** is a Node.js tool that converts complex project directory structures and files into a single flat file or set of flat files, facilitating processing using In-Context Learning (ICL) prompts. It also offers additional features for text preprocessing from various sources, format conversion, and prompt templating.

### What is In-Context Learning (ICL)

In-Context Learning (ICL) enables a model to perform tasks by interpreting context provided within a prompt, eliminating the need for additional training or fine-tuning.

[Learn more about In-Context Learning (ICL)](#in-context-learning-icl)

## Installation

```bash
# Install globally
npm install -g llm-prepare

# Or install locally
npm install llm-prepare
```

## Core Feature: Project Directory Processing

LLM-Prepare excels at processing entire project directories, generating a consolidated view that includes both the project structure and file contents. This is particularly useful for providing comprehensive context to LLMs about complex codebases, enabling tasks like code analysis, documentation generation, and Q&A.

Key capabilities for project processing include:
- **Layout View**: Provides an ASCII layout view of your project.
- **Directory Traversal**: Recursively scans through the project directory.
- **Custom File Filtering**: Includes files based on specified patterns.
- **Ignore Support**: Automatically respects `.gitignore` files and allows custom ignore rules.
- **Output Consolidation**: Generates a single flat file or multiple chunked files from the consolidated view.
- **Comment Handling**: Optionally include or exclude comments from the output.
- **Compression**: Reduces output size by removing unnecessary whitespace, optimizing for token limits.

### Basic Usage (Project Processing)

```bash
# Process a project directory and output to console
llm-prepare -p ./my-project

# Process a project directory and save to a file
llm-prepare --project-path ./my-project -o result.txt

# Use with specific file patterns (e.g., only JavaScript files)
llm-prepare --project-path ./my-project --file-pattern "*.js" --output js-files-only.txt

# Process with compression to reduce token usage
llm-prepare --project-path ./my-project --compress --output compressed-project.txt

# Generate separate output files for each direct subdirectory
llm-prepare --project-path ./my-project --output summary.txt --folder-output-level 1

# Generate output files for all subdirectories
llm-prepare --project-path ./my-project --output summary.txt --folder-output-level all
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
| `--chunk-size <kilobytes>` | Maximum size in KB for each output file (creates multiple files if needed) |
| `--folder-output-level <depth>` | Generate output files at the specified directory depth level or for all subdirectories (number or "all") |

### Per-Folder Output Generation

The `--folder-output-level` option allows you to generate separate output files for each directory at a specified depth within your project or for all subdirectories. This is particularly useful for large, complex projects where you want to create more focused documentation or context files.

```bash
# Generate output files for each direct subdirectory (depth 1)
llm-prepare --project-path ./my-project --output readme.md --folder-output-level 1

# Generate output files at the project root level (depth 0)
llm-prepare --project-path ./my-project --output summary.txt --folder-output-level 0

# Generate output files for subdirectories two levels deep
llm-prepare --project-path ./my-project --output module-docs.txt --folder-output-level 2

# Generate output files for all subdirectories in the project
llm-prepare --project-path ./my-project --output project-summary.md --folder-output-level all
```

When using `--folder-output-level`:
- The `-o, --output` option is required and specifies the filename to use for each generated file.
- Each output file contains only the content from its directory and subdirectories.
- The project layout view is generated per directory (unless `--no-layout` is specified).
- All other processing options (like `--file-pattern`, `--include-comments`, etc.) are applied to each directory's content.
- If no directories exist at the specified depth, a warning is displayed and no files are generated.
- When using `all` as the value, an output file is generated for every subdirectory (including the root if it contains files) that has processable content.

This feature is particularly useful for:
- Creating separate README files for each module in a large project.
- Generating focused context files for LLMs to analyze specific parts of a codebase.
- Breaking down large projects into manageable chunks for documentation or analysis.
- Creating comprehensive documentation for all components of a complex project structure.

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
| `--default-ignore <filepath>` | Path to a default ignore file (overrides built-in defaults) |
| `--show-default-ignore` | Display the default ignore patterns |


## Additional Capabilities and General Usage

Beyond project processing, LLM-Prepare offers a versatile set of tools for preparing text from various sources:

- **Read from Diverse Inputs**: Process text from local files, URLs, or standard input (stdin).
- **Format Conversion**: Convert content between Markdown, HTML, and plain text.
- **Text Truncation**: Intelligently truncate text to meet specific token limits using strategies like 'start', 'end', or 'middle'.
- **JavaScript Rendering**: Fetch and render content from JavaScript-heavy websites using Puppeteer.
- **Prompt Templating**: Apply predefined or custom prompt templates with dynamic variable substitution.
- **Chat Message Formatting**: Prepend system messages and append user messages for chat-based LLM interactions.
- **Configuration Files**: Use JSON configuration files for complex or repeated command setups.

### General Usage Examples

```bash
# Basic file input and output
llm-prepare -i example.txt -o result.txt

# Format conversion (HTML to Markdown)
llm-prepare --input webpage.html --format markdown --output result.md

# Truncation to a token limit
llm-prepare --input document.txt --max-tokens 1000 --truncate end

# Use with a prompt template
llm-prepare --input data.txt --prompt templates/analysis.txt --variables '{"model": "gpt-4", "task": "summarize"}'

# Process URLs with JavaScript rendering
llm-prepare --input https://example.com --render --format text

# Use system and user messages for chat prompts
llm-prepare --input content.txt --system "Analyze the following text:" --user "What are the key points?"

# Read from stdin and pipe output
cat file.txt | llm-prepare --format markdown | tee output.md

# Use a configuration file for repeated settings
llm-prepare --config path/to/your/config.json
```

## Command Line Options

| Option | Description |
|--------|-------------|
| `-p, --project-path <directoryPath>` | Path to the project directory to process |
| `--file-pattern <pattern>` | Glob pattern for matching files (default: "*") |
| `--no-layout` | Suppress the ASCII layout view of the project structure |
| `--include-comments` | Include comments in the output (default: false) |
| `--comment-style <style>` | Comment style for file headers (default: "//") |
| `-c, --compress` | Compress output by removing excessive whitespace (useful for project processing) |
| `--chunk-size <kilobytes>` | Maximum size in KB for each output file (creates multiple files if needed) |
| `--folder-output-level <depth>` | Generate output files at the specified directory depth level or for all subdirectories (number or "all") |
| `--ignore-gitignore` | Disable processing of .gitignore files |
| `--custom-ignore-string <patterns>` | Comma-separated ignore patterns |
| `--custom-ignore-filename <filepath>` | Path to a custom ignore file |
| `--default-ignore <filepath>` | Path to a default ignore file (overrides built-in defaults) |
| `--show-default-ignore` | Display the default ignore patterns |
| `-i, --input <source>` | Input source (file, URL, or stdin for general text processing) |
| `-o, --output <file>` | Output file (defaults to stdout) |
| `-f, --format <format>` | Format to convert to (markdown, html, text) |
| `-m, --max-tokens <number>` | Maximum tokens to include |
| `--prompt <file>` | Prompt template file |
| `--variables <json>` | JSON string of variables for the prompt template |
| `-t, --truncate <strategy>` | Truncation strategy (start, end, middle) |
| `-r, --render` | Render content with a browser for JavaScript-heavy sites |
| `-s, --system <message>` | System message to prepend |
| `-u, --user <message>` | User message to append |
| `--config <filepath>` | Path to a JSON configuration file |
| `--show-templates` | Show available templates in your browser (opens GitHub) |
| `-d, --debug` | Enable debug output |
| `-v, --version` | Show version number |
| `--help` | Show help |

## Configuration System

LLM-Prepare supports JSON configuration files to predefine command-line arguments and specify multiple project directories for processing. This is useful for complex or repeated command setups.

To run the script with a config file:

```bash
llm-prepare -c path/to/your/config.json

llm-prepare --config path/to/your/config.json
```

### Configuration File Structure
A configuration file can contain two main keys: args and include .

- args : An object where keys are command-line options (long form, without leading dashes) and values are their settings. For example, "output": "result.txt" is equivalent to --output result.txt .
- include : An array of strings, where each string is a path to a project directory that should be processed.

### Example `config.json` file:

```json
{
	"args": {
		"output-filename": "output.txt",
		"compress": true
	},
	"include": ["./src/", "./lib/"]
}
```

### Processing Multiple Directories with include

The include array allows you to specify multiple project directories. LLM-Prepare will process each directory listed in this array.

- Combined with -p, --project-path : If you also use the -p (or --project-path ) command-line option, the path specified via CLI will be processed in addition to all paths listed in the include array.
- Path Resolution : Paths in the include array are resolved relative to the location of the configuration file.
- Invalid Paths : If a path in the include array is invalid or inaccessible, a warning will be issued, and llm-prepare will continue processing the other valid paths.

### Output Behavior with Multiple Projects

When multiple project directories are processed (either through include , -p , or a combination):

- Single File Output (Default or -o <filename> ) :
  
  - The content (including file structures and file contents) from all specified project directories is aggregated.
  - If layout view is enabled (default), a combined layout representing all processed projects will be generated, followed by the concatenated content of all files.
  - This aggregated content is then written to a single output file or to standard output.

- Folder-Level Output ( --folder-output-level <depth|all> ) :
  
  - LLM-Prepare processes all specified project directories first.
  - It then identifies all unique directories at the specified folderOutputLevel across all processed projects.
  - For each such unique directory path, a single output file is generated. This file will contain the consolidated content (layout and file data) from that specific directory, sourced from any of the input projects that contain a directory at that path.
  - For example, if your config includes projectA and projectB , and both have a src/components subdirectory, and you use --folder-output-level 2 -o component_summary.md , the output file src/components/component_summary.md (relative to your output directory or CWD) would contain aggregated content from both projectA/src/components and projectB/src/components .
  - The -o, --output <filename> option is used to determine the name of the file created within each output folder.

All other processing options (e.g., --compress , --include-comments , --file-pattern , prompt templating) are applied to the content sourced from all projects. For instance, ignore patterns ( .gitignore , custom ignores) are resolved relative to each respective project path they originate from.

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
# Example: Using a template for code Q&A with project context
llm-prepare --project-path ./my-python-project --prompt templates/multi-variable/coding/question-and-answer.md --variables '{"language":"Python", "questions_asked":"What does the main function do?"}'

# Example: Generating a README for a project using a template
llm-prepare --project-path ./my-project --prompt templates/simple/README/basic-readme-generation.md

# Example: Using a template with general input
llm-prepare --input api_spec.json --prompt templates/multi-variable/general/summarize-and-explain.md --variables '{"topic":"API Specification"}'
```

Each template has specific variables it accepts. The `{{text}}` variable is automatically populated with the content of the file(s) or project you are processing.

### Template Documentation

For a complete list of available templates and their documentation, refer to the [Templates README](templates/README.md) file.

All templates have been primarily tested with OpenAI's GPT-4o model. While they should work with other capable LLMs, outputs may vary and require adaptation.

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
