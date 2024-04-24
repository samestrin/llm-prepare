# llm-prepare

This Node.js script is a tool for processing directory structures and file contents within specified projects. It recursively scans a project directory based on provided arguments (a directory and file inclusion pattern), and constructs a simplified view of the directory layout. This is combined with the aggregated content after stripping comments and unnecessary whitespace. The output can optionally be compressed to save further tokens.

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
      --help             Show help                                     [boolean]
  -p, --path-name        Path to the project directory       [string] [required]
  -f, --file-pattern     Pattern of files to include, e.g., '\.js$' or '*' for
                         all files                           [string] [required]
  -c, --compress         Should we compress the output?                [boolean]
  -o, --output-filename  Filename to write output to instead of printing to
                         console                                        [string]
  -v, --version          Display the version number                    [boolean]
```

## Contributing

Contributions to this project are welcome. Please fork the repository and submit a pull request with your changes or improvements.

## License

This project is licensed under the MIT License - see the LICENSE file for details.
