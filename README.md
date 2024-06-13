# llm-prepare

[![Star on GitHub](https://img.shields.io/github/stars/samestrin/llm-prepare?style=social)](https://github.com/samestrin/llm-prepare/stargazers) [![Fork on GitHub](https://img.shields.io/github/forks/samestrin/llm-prepare?style=social)](https://github.com/samestrin/llm-prepare/network/members) [![Watch on GitHub](https://img.shields.io/github/watchers/samestrin/llm-prepare?style=social)](https://github.com/samestrin/llm-prepare/watchers)

![Version 1.0.13](https://img.shields.io/badge/Version-1.0.13-blue) [![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT) [![Built with Node.js](https://img.shields.io/badge/Built%20with-Node.js-green)](https://nodejs.org/)

**llm-prepare** converts complex project directory structures and files into a single flat file or a set of flat files, facilitating processing using In-Context Learning (ICL) prompts.

This Node.js tool recursively scans a project directory based on provided arguments (at least a directory and file inclusion pattern). Then, it constructs a simplified layout view that includes all directories and file matches. The tool then combines the layout view with the aggregated text file content of the entire project. The aggregated file content is stripped of comments and unnecessary whitespace by default. Output compression is also supported to reduce token use, and llm-prepare can handle large projects by chunking the output. Example prompts are included.

## In-Context Learning (ICL)

> "While finetuning with full datasets is still a powerful option if the data vastly exceeds the context length, our results suggest that long-context ICL is an effective alternative– trading finetuning-time cost for increased inference-time compute. As the effectiveness and effiency of using very long model context lengths continues to increase, we believe long-context ICL will be a powerful tool for many tasks."
>
> ###### \- [Massive prompts can outperform fine-tuning for LLMs, researchers find](https://the-decoder.com/massive-prompts-outperform-fine-tuning-for-llms-in-new-study-researchers-find/)

In-Context Learning (ICL) allows a Large Language Model (LLM) to perform tasks by interpreting the context provided within the prompt without additional training or fine-tuning. This approach differs significantly from previous methods where models were explicitly trained on a specific task using vast datasets. Instead, ICL leverages the model's pre-trained knowledge base—a comprehensive understanding accumulated during its initial extensive training phase.

As the token size—or the amount of data that an LLM can process and generate in a single instance—has dramatically increased, the value of ICL has become even more significant. This increase in token size allows LLMs to handle longer and more complex inputs and outputs, which enhances their ability to understand and generate sophisticated text.

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

- **Code Review**: Interactive code review with a simulated senior software engineer.
- **Generate MySQL Create Table**: Generate a MySQL `CREATE TABLE` statement based on your provided CSV content.
- **Question and Answer**: Interactive question and answer session powered by your project code.
- **Readme Generation**: A simulated senior technical writer generates a README.md based on your project code.
- **Simple Add Comments**: A set of simple prompts that generate comments based on your project code (C#, Javascript, PHP, Python, Ruby, Rust, and TypeScript).
- **Technical Document Generation**: A simulated senior technical writer generates technical documentation based on your project code.
- **Test Generation**: Interactive test generation with a simulated senior software engineer and simulated QA.

###### Plus many more (_including new CSV oriented prompts_). All [example prompts](/example-prompts/README.md) have been tested with [ChatGPT GPT-4](https://chatgpt.com/).

## Dependencies

- **Node.js**: The script runs in a Node.js environment.
- **fs-extra**: An extension of the standard Node.js `fs` module, providing additional methods and promise support.
- **ignore**: Used to handle `.ignore` files similar to `.gitignore`.
- **istextorbinary**: Determines whether a given file contains text or binary data.
- **open**: Opens URLs in your default browser.
- **yargs**: Helps in building interactive command line tools, by parsing arguments and generating an elegant user interface.
- **yargs/helpers**: Provides utility methods for `yargs`.

## Installing Node.js

Before installing, ensure you have Node.js and npm (Node Package Manager) installed on your system. You can download and install Node.js from [Node.js official website](https://nodejs.org/).

## Installing llm-prepare

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

To run the script, you need to provide one mandatory argument: the path to the project directory (`--path-name` or `-p`).

### Common Usage Examples:

**Basic Usage:**
This will process all files in the specified project directory, respecting any `.ignore` files, and output the consolidated content and structure to your console.
Defaults the file pattern to "\*"

```bash
llm-prepare -p "/path/to/project"
```

or

```bash
llm-prepare --path-name "/path/to/project"
```

**Specify a File Pattern:**
This will process all JavaScript files in the specified project directory, respecting any `.ignore` files, and output the consolidated content and structure to your console.

```bash
llm-prepare -p "/path/to/project" -f "*.js"
```

**Specify an Output Filename:**
This will process all files in the specified project directory, respecting any `.ignore` files, and output the consolidated content and structure to _output.txt_.

```bash
llm-prepare -p "/path/to/project" -o "output.txt"
```

If you don't specific a filename, this will process all files in the specified project directory, respecting any `.ignore` files, and output the consolidated content and structure to _project.txt_. The filename is auto-generated based on the top level directory in the path-name variable.

```bash
llm-prepare -p "/path/to/project" -o
```

You may optionally set the **LLM_PREPARE_OUTPUT_DIR** environment variable. If the LLM_PREPARE_OUTPUT_DIR environment variable is set, the output files are written to that directory.

## Options

```
      --help                 Show help                                 [boolean]
  -p, --path-name            Path to the project directory   [string] [required]
  -f, --file-pattern         Pattern of files to include, e.g., '\.js$' or '*'
                             for all files               [string] [default: "*"]
  -o, --output-filename      Output filename                            [string]
  -i, --include-comments     Include comments? (Default: false)        [boolean]
  -c, --compress             Compress? (Default: false)                [boolean]
      --chunk-size           Maximum size (in kilobytes) of each file   [number]
  -s, --suppress-layout      Suppress layout in output (Default: false)[boolean]
      --default-ignore       Use a custom default ignore file           [string]
      --show-default-ignore  Show default ignore file                   [boolean]
      --show-prompts         Show example prompts in your browser      [boolean]
  -v, --version              Display the version number                [boolean]
```

## Contribute

Contributions to this project are welcome. Please fork the repository and submit a pull request with your changes or improvements.

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Share

[![Twitter](https://img.shields.io/badge/X-Tweet-blue)](https://twitter.com/intent/tweet?text=Check%20out%20this%20awesome%20project!&url=https://github.com/samestrin/llm-prepare) [![Facebook](https://img.shields.io/badge/Facebook-Share-blue)](https://www.facebook.com/sharer/sharer.php?u=https://github.com/samestrin/llm-prepare) [![LinkedIn](https://img.shields.io/badge/LinkedIn-Share-blue)](https://www.linkedin.com/sharing/share-offsite/?url=https://github.com/samestrin/llm-prepare)
