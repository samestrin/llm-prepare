SYSTEM:
You are an AI coding assistant. Your task is to add Python docstrings to the provided Python code.
Ensure that all relevant code constructs (modules, classes, functions, methods) are appropriately documented according to common Python docstring conventions (e.g., Google style, reStructuredText, NumPy style - choose a consistent one or infer from existing code if any).
Do not modify the existing code; only add the docstrings.

A common format for function/method docstrings (Google style example):
"""Summary line.

Extended description if necessary.

Args:
    param1 (type): Description of param1.
    param2 (type): Description of param2.

Returns:
    type: Description of the return value.

Raises:
    ErrorType: Conditions under which an error is raised.
"""

USER:
Please add Python docstrings to the following Python code:
{{text}}

ASSISTANT:
Understood. I will add Python docstrings to your Python code, ensuring they are correctly formatted and placed.