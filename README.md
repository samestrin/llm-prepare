# llm-prepare

**llm-prepare** converts complex project directory structures and file contents into a single flat or set of flat files for LLM processing by tools like ChatGPT, Claude, Gemini, or Mistral.

This Nodes.js tool recursively scans a project directory based on provided arguments (at least a directory and file inclusion pattern). Then, it constructs a simplified layout view that includes all directories and file matches. The tool then combines the layout view with the aggregated file content of the entire project. The aggregated file content is stripped of comments and unnecessary whitespace by default. Output compression is also supported to reduce token use. It can handle large projects by chunking the output.

## Features

- **Layout View**: Provides a layout view of your project.
- **Directory Traversal**: Recursively scan through the project directory.
- **Custom File Filtering**: Include files based on specified patterns.
- **Ignore Support**: Automatically respects `.ignore` files to exclude specific files or directories.
- **Output Consolidation**: Generates a single flat file consolidated view of file contents and directory structure.
- **Multifile Output**: Generates multiple flat files from a consolidated view of file contents and directory structure based on a provided chunk size.
- **Optionally Remove Layout View**: Optionally remove the layout view from the output.
- **Optionally Include Comments**: Optionally include comments in the output.

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
      --help              Show help                                    [boolean]
  -p, --path-name         Path to the project directory      [string] [required]
  -f, --file-pattern      Pattern of files to include, e.g., '\.js$' or '*' for
                          all files                          [string] [required]
  -o, --output-filename   Output filename                               [string]
  -i, --include-comments  Include comments? (Default: false)           [boolean]
  -c, --compress          Compress? (Default: false)                   [boolean]
      --chunk-size        Maximum size (in kilobytes) of each file      [number]
  -s, --suppress-layout   Suppress layout in output (Default: false)   [boolean]
  -v, --version           Display the version number                   [boolean]
```

## Contributing

Contributions to this project are welcome. Please fork the repository and submit a pull request with your changes or improvements.

## License

This project is licensed under the MIT License - see the LICENSE file for details.
