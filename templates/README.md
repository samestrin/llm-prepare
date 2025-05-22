# LLM Prepare Templates

This directory contains various prompt templates for use with `llm-prepare`. These templates are designed to be used with the `--prompt` and `--variables` CLI options, enabling you to tailor LLM interactions for specific tasks.

## Template Categories

### Multi-Variable Prompts

These templates are designed for more complex tasks and typically involve multiple input variables. They are located in the `multi-variable/` directory.

#### General
- [General Analysis](multi-variable/analysis.txt): A general-purpose analysis template using `{{model}}`, `{{task}}`, and `{{text}}` variables.

#### Coding
- [Generate Code Review Suggestions](multi-variable/coding/generate-code-review-suggestions.md): Provides suggestions for code improvement based on `{{language}}` and `{{text}}`.
- [Question and Answer (Coding)](multi-variable/coding/question-and-answer.md): Answers questions based on provided `{{language}}` code (`{{text}}`) and `{{questions_asked}}`.
- [Technical Documentation Generation](multi-variable/coding/technical-documentation-generation.md): Generates technical documentation from `{{language}}` code (`{{text}}`), optionally using details like `{{author}}`, `{{repository}}`, etc.
- [Test Generation](multi-variable/coding/test-generation.md): Generates test cases using `{{testing_tool}}` for `{{language}}` code (`{{text}}`).

#### CSV
- [Extract Named Entities (CSV)](multi-variable/csv/extract-named-entities.md): Extracts specified `{{entities_to_extract}}` from CSV data (`{{text}}`).
- [Generate Chart (Experimental)](multi-variable/csv/generate-chart.experimental.md): Generates chart specifications and DALL-E prompts from CSV data (`{{text}}`) based on `{{chart_type}}` and detailed parameters like `{{chart_title}}`, `{{x_axis_column_name}}`, etc.
- [Question and Answer (CSV)](multi-variable/csv/question-and-answer.md): Answers `{{questions_asked}}` based on provided CSV data (`{{text}}`).

### Simple Prompts

These templates are designed for straightforward, single-shot tasks, often requiring minimal variable input. They are located in the `simple/` directory.

#### README Generation
Located in `simple/README/`:
- [Basic README Generation](simple/README/basic-readme-generation.md): Generates a basic README file.
- [Backend Component README Generation](simple/README/readme-backend-component-generation.md): Generates a README for a backend component.
- [Component README Generation](simple/README/readme-component-generation.md): Generates a README for a generic component.
- [Project README Generation](simple/README/readme-project-generation.md): Generates a README for an entire project.

#### CSV Processing
Located in `simple/csv/`:
- **Database Schema Generation** (in `simple/csv/database/`)
  - [Generate MySQL CREATE TABLE](simple/csv/database/generate-mysql-create-table.md): Generates MySQL `CREATE TABLE` statement from CSV.
  - [Generate Oracle CREATE TABLE](simple/csv/database/generate-oracle-create-table.md): Generates Oracle `CREATE TABLE` statement from CSV.
  - [Generate PostgreSQL CREATE TABLE](simple/csv/database/generate-postgres-create-table.md): Generates PostgreSQL `CREATE TABLE` statement from CSV.
  - [Generate SQL Server CREATE TABLE](simple/csv/database/generate-sql-server-create-table.md): Generates SQL Server `CREATE TABLE` statement from CSV.
  - [Generate SQLite CREATE TABLE](simple/csv/database/generate-sqlite-create-table.md): Generates SQLite `CREATE TABLE` statement from CSV.
- **Data Analysis & Extraction**
  - [Extract All Named Entities (CSV)](simple/csv/extract-all-named-entities.md): Extracts common named entities from CSV data.
  - [Generate Summary (CSV)](simple/csv/generate-summary.md): Generates a summary of CSV data.
  - [Identify Missing Column Titles (CSV)](simple/csv/identify-missing-column-titles.md): Identifies potentially missing column titles in CSV data.

#### Code Commenting
Located in `simple/simple-add-comments/`:
- [C# XML Documentation](simple/simple-add-comments/csharp-xml-documentation.md): Adds C# XML documentation comments.
- [JavaScript JSDoc Comments](simple/simple-add-comments/js-jsdoc-comments.md): Adds JSDoc comments for JavaScript.
- [PHP PHPDoc Comments](simple/simple-add-comments/php-phpdoc-comments.md): Adds PHPDoc comments for PHP.
- [Python Docstrings](simple/simple-add-comments/python-docstrings-comments.md): Adds Python docstrings.
- [Ruby YARD Comments](simple/simple-add-comments/ruby-yard-comments.md): Adds YARD comments for Ruby.
- [Rust RUSTdoc Comments](simple/simple-add-comments/rust-rustdoc-comments.md): Adds RUSTdoc comments for Rust.
- [TypeScript TSDoc Comments](simple/simple-add-comments/typescript-tsdoc-comments.md): Adds TSDoc comments for TypeScript.

## Usage Example

To use a template, you can run `llm-prepare` from the command line, specifying the path to the template file and any required variables.

```bash
llm-prepare --prompt templates/multi-variable/coding/question-and-answer.md --variables "language:Python" "questions_asked:What does the main function do?,What API framework is used?" --file path/to/your/code.py

llm-prepare --prompt templates/simple/README/basic-readme-generation.md --project-path path/to/your/project
```

Refer to each template's content to understand the specific variables it accepts. The {{text}} variable is populated by llm-prepare with the content of the file(s) you are processing.

## Tested

All templates have been primarily tested with OpenAI's GPT-4o model. LLM behavior can evolve, so outputs are not guaranteed and may require review or adaptation.