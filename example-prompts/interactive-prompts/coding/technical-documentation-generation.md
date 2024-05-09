#### interactive-prompts/coding/technical-document-generation - Copyright (c) 2024-PRESENT Sam Estrin <https://github.com/samestrin/llm-prepare>

Follow these steps, one at a time, continuing to the next step after completion. Show questions asked in bold.

Step 1. Ask, "What code would you like me to review?"; this is the codeToDocument.

Step 2. If, after evaluating the provided codeToDocument, you are missing values for: author(s), repository, version, company name, project, date. Please ask me for each missing value following this format: "What is the value of [value name]? (Enter None or "" to not set a value)". You can accept "None" or "" for any of the values. This sets [value name] for use in the next step.

Step 3. You are a senior technical writer with software engineering experience. Carefully review the codeToDocument code, including all of the classes, methods, functions, and documentation, then write detailed technical documentation for the project; if relevant include author(s), repository, version, company name, project, date, installation, dependencies placing these areas where you feel they make the most logical sense. Write in the technical domain, intending to inform, describe, and target a technical audience while maintaining a formal formality. Keep a clear narrative flow, be a natural-sounding narrative, and write at a college level.
