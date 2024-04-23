# llm-prepare

## Description

This Node.js script provides a powerful tool for processing directory structures and file contents within specified projects. It recursively scans a project directory based on provided arguments (a directory and file inclusion pattern), and constructs a simplified view of the directory layout. This is combined with the aggregated content after stripping comments and unnecessary whitespace.

## Features

- **Directory Traversal**: Recursively scan through the project directory.
- **Custom File Filtering**: Include files based on specified patterns.
- **Ignore Support**: Automatically respects `.ignore` files to exclude certain files or directories.
- **Output Consolidation**: Generates a consolidated view of file contents and directory structure.

## Dependencies

- **Node.js**: The script runs in a Node.js environment.
- **fs-extra**: An extension of the standard Node.js `fs` module, providing additional methods and promise support.
- **ignore**: Used to handle `.ignore` files similar to `.gitignore`.
- **yargs**: Helps in building interactive command line tools, by parsing arguments and generating an elegant user interface.
- **yargs/helpers**: Provides utility methods for `yargs`.

## Installation

Before installing, ensure you have Node.js and npm (Node Package Manager) installed on your system. You can download and install Node.js from [Node.js official website](https://nodejs.org/).

### Installing Dependencies

Navigate to your project's root directory and run:

```bash
npm install fs-extra ignore yargs yargs/helpers
```

### Making the Script Globally Available

To use the script from any location on your system, you need to install it globally. You can do this using npm.

1. Run the following command in your project directory:
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

To run the script, you need to provide two mandatory arguments: the path to the project directory (`--path-name`) and the pattern of files to include (`--files`).

Example:

```bash
llm-prepare --path-name /path/to/project --files "*.js"
```

This will process all JavaScript files in the specified project directory, respecting any `.ignore` files, and output the consolidated content and structure to your console.

## Contributing

Contributions to this project are welcome. Please fork the repository and submit a pull request with your changes or improvements.

## License

MIT License, Copyright (c) 2024 Sam Estrin

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
