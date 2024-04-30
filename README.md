# llm-prepare

[![Star on GitHub](https://img.shields.io/github/stars/samestrin/llm-prepare?style=social)](https://github.com/samestrin/llm-prepare/stargazers) [![Fork on GitHub](https://img.shields.io/github/forks/samestrin/llm-prepare?style=social)](https://github.com/samestrin/llm-prepare/network/members) [![Watch on GitHub](https://img.shields.io/github/watchers/samestrin/llm-prepare?style=social)](https://github.com/samestrin/llm-prepare/watchers)

![Version 1.0.12](https://img.shields.io/badge/Version-1.0.12-blue) [![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT) [![Built with Node.js](https://img.shields.io/badge/Built%20with-Node.js-green)](https://nodejs.org/)

**llm-prepare** converts complex project directory structures and files into a single flat or set of flat files for AI processing using ChatGPT, Claude, Gemini, Mistral, or ..?

This Node.js tool recursively scans a project directory based on provided arguments (at least a directory and file inclusion pattern). Then, it constructs a simplified layout view that includes all directories and file matches. The tool then combines the layout view with the aggregated file content of the entire project. The aggregated file content is stripped of comments and unnecessary whitespace by default. Output compression is also supported to reduce token use, and llm-prepare can handle large projects by chunking the output. Example prompts are included.

## Features

- **Layout View**: Provides an ASCII layout view of your project.
- **Directory Traversal**: Recursively scan through the project directory.
- **Custom File Filtering**: Include files based on specified patterns.
- **Ignore Support**: Automatically respects `.ignore` files to exclude specific files or directories.
- **Output Consolidation**: Generates a single flat file consolidated view of file contents and directory structure.
- **Multifile Output**: Generates multiple flat files from a consolidated view of file contents and directory structure based on a provided chunk size.
- **Optionally Remove Layout View**: Optionally remove the layout view from the output.
- **Optionally Include Comments**: Optionally include comments in the output.

## Example Prompts

- **code-review**: Interactive code review with a simulated senior software engineer.
- **readme-generation**: Interactive technical README.md generation with a simulated senior technical writer.
- **simple-add-comments**: A set of simple prompts that generate comments based on your code (C#, Javascipt, PHP, Python, Ruby, and TypeScript).
- **technical-document-generation**: Interactive technical document generation with a simulated senior technical writer.
- **test-generation**: Interactive test generation with a simulated senior software engineer and simulated QA.

The [example prompts](/example-prompts/README.md) have been tested with ChatGPT GPT-4.

## Dependencies

- **Node.js**: The script runs in a Node.js environment.
- **fs-extra**: An extension of the standard Node.js `fs` module, providing additional methods and promise support.
- **ignore**: Used to handle `.ignore` files similar to `.gitignore`.
- **open**: Opens URLs in your default browser.
- **yargs**: Helps in building interactive command line tools, by parsing arguments and generating an elegant user interface.
- **yargs/helpers**: Provides utility methods for `yargs`.

## Installation

Before installing, ensure you have Node.js and npm (Node Package Manager) installed on your system. You can download and install Node.js from [Node.js official website](https://nodejs.org/).

### Installation

To install and use llm-prepare, follow these steps:

Clone the Repository: Begin by cloning the repository containing the llm-prepare to your local machine.

```bash
git clone https://github.com/samestrin/llm-prepare/
```

Navigate to your project's root directory and run:

```bash
npm install
```

To make llm-prepare available from any location on your system, you need to install it globally. You can do this using npm.

Run the following command in your project directory:

```bash
npm link
```

This will create a global symlink to your script. Now, you can run the script using `llm-prepare` from anywhere in your terminal.

### Platform-Specific Installation Instructions

#### macOS and Linux

The provided installation steps should work as-is for both macOS and Linux platforms.

#### Windows

For Windows, ensure that Node.js is added to your PATH during the installation. The `npm link` command should also work in Windows PowerShell or Command Prompt, allowing you to run the script globally.

## Usage

To run the script, you need to provide two mandatory arguments: the path to the project directory (`--path-name`) and the pattern of files to include (`--file-pattern`).

Example:

```bash
llm-prepare --path-name "/path/to/project" --file-pattern "*.js"
```

This will process all JavaScript files in the specified project directory, respecting any `.ignore` files, and output the consolidated content and structure to your console.

## Options

```
      --help                 Show help                                 [boolean]
  -p, --path-name            Path to the project directory   [string] [required]
  -f, --file-pattern         Pattern of files to include, e.g., '\.js$' or '*'
                             for all files                   [string] [required]
  -o, --output-filename      Output filename                            [string]
  -i, --include-comments     Include comments? (Default: false)        [boolean]
  -c, --compress             Compress? (Default: false)                [boolean]
      --chunk-size           Maximum size (in kilobytes) of each file   [number]
  -s, --suppress-layout      Suppress layout in output (Default: false)[boolean]
      --default-ignore       Use a custom default ignore file           [string]
      --show-default-ignore  Show default ignore file                   [string]
      --show-prompts         Show example prompts in your browser      [boolean]
  -v, --version              Display the version number                [boolean]
```

## Contribute

Contributions to this project are welcome. Please fork the repository and submit a pull request with your changes or improvements.

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Share

[![Twitter](https://img.shields.io/badge/X-Tweet-blue)](https://twitter.com/intent/tweet?text=Check%20out%20this%20awesome%20project!&url=https://github.com/samestrin/llm-prepare) [![Facebook](https://img.shields.io/badge/Facebook-Share-blue)](https://www.facebook.com/sharer/sharer.php?u=https://github.com/samestrin/llm-prepare) [![LinkedIn](https://img.shields.io/badge/LinkedIn-Share-blue)](https://www.linkedin.com/sharing/share-offsite/?url=https://github.com/samestrin/llm-prepare)
