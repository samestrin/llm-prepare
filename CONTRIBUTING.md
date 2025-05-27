# LLM Translate: Contributing

We welcome contributions to LLM Translate. Whether you're fixing a bug, adding a new feature, or improving documentation, your help is appreciated. Please take a moment to review these guidelines to make the contribution process easy and effective for everyone.

## How to Contribute

1.  **Fork the Repository**
    Start by forking the main [llm-prepare repository](https://github.com/samestrin/llm-prepare) on GitHub.

2.  **Clone Your Fork**
    Clone your forked repository to your local machine:
    ```bash
    git clone https://github.com/YOUR_USERNAME/llm-prepare.git
    cd llm-prepare
    # Navigate to the frontend or backend directory as needed
    # cd frontend
    # cd backend
    ```

3.  **Create a New Branch**
    Create a descriptive branch for your changes. This helps keep your work organized and separate from the main codebase.
    ```bash
    # Navigate to the appropriate directory (frontend/ or backend/) before creating a branch
    git checkout -b feature/your-descriptive-feature-name
    # or for bug fixes:
    # git checkout -b bugfix/issue-number-or-description
    ```

4.  **Set Up Your Environment**
    Ensure you have the necessary tools installed for the part of the project you're working on.

    *   **For Frontend Development (in `frontend/` directory):**
        *   Ensure you have Node.js and npm (or yarn) installed.
        *   Install project dependencies:
            ```bash
            npm install
            # or
            # yarn install
            ```
    *   **For Backend Development (in `backend/` directory):**
        *   Ensure you have Python 3.9+ and pip installed.
        *   Create and activate a virtual environment:
            ```bash
            python3 -m venv venv
            source venv/bin/activate  # On Windows use `venv\Scripts\activate`
            ```
        *   Install project dependencies:
            ```bash
            pip install -r requirements.txt
            # Optionally, install development dependencies:
            # pip install -r requirements-dev.txt
            ```

5.  **Make Your Changes**
    Write your code, adhering to the project's coding style and conventions.
    *   Follow the Google Style Guides.
    *   Keep functions concise (aim for 50-100 lines).
    *   Minimize cognitive complexity and code duplication.
    *   Refer to the relevant linting configurations for specific rules (e.g., `eslint.config.js` for frontend, check backend project for Python linter configurations).

6.  **Test Your Changes**
    *   If you're adding new features or fixing bugs, please write tests for your changes if applicable.
    *   Ensure all existing tests pass.
    *   Run linters to check for style issues:
        *   **Frontend (in `frontend/` directory):**
            ```bash
            npm run lint
            ```
        *   **Backend (in `backend/` directory):**
            ```bash
            pytest
            # Run any other configured linters (e.g., flake8, black)
            ```

7.  **Commit Your Changes**
    Write clear, concise, and descriptive commit messages. A good commit message explains *what* change was made and *why*.
    ```bash
    git add .
    git commit -m "feat: Add new translation provider option"
    # or
    # git commit -m "fix: Correct text alignment on history page"
    ```

8.  **Push Your Branch**
    Push your changes to your forked repository on GitHub (ensure you are in the correct sub-directory if your branch is specific to frontend or backend, or push from the root):
    ```bash
    git push origin feature/your-descriptive-feature-name
    ```

9.  **Open a Pull Request (PR)**
    Go to the original `llm-prepare` repository and open a pull request from your forked branch to the `main` branch.
    *   Provide a clear title and a detailed description of your changes in the PR.
    *   Reference any relevant issues (e.g., "Closes #123").
    *   Be prepared to discuss your changes and make adjustments if requested by the maintainers.

## Coding Conventions

*   **Style:** Follow the Google Style Guides and the project's relevant linting rules (ESLint for frontend, Python linters for backend).
*   **Naming:** Use the CRUD and General Function Naming Conventions outlined in the project's development guidelines.
*   **UI (Frontend):** When working on UI components, refer to Material UI v7.1.0 documentation and the project's `style-guide.md` (if available).

## Reporting Bugs

If you find a bug, please open an issue on the GitHub repository. Include the following information:
*   A clear and descriptive title.
*   Steps to reproduce the bug.
*   What you expected to happen.
*   What actually happened (including any error messages or screenshots).
*   Your environment (e.g., browser version, operating system).

## Suggesting Enhancements

If you have an idea for a new feature or an improvement to an existing one, please open an issue to discuss it. This allows for feedback and ensures that your efforts align with the project's goals.

Thank you for contributing!