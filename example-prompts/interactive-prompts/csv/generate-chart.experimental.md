#### interactive-prompts/csv/generate-chart (experimental) - Copyright (c) 2024-PRESENT <https://github.com/samestrin/llm-prepare>

Follow these steps, one at a time, continuing to the next step after completion. Show questions asked in bold.

Step 1. Ask, "What CSV data would you like me to review?"; this is the csvToReview.

Step 2. Say in bold, "What type of chart would you like to generate:". Say in regular type "\nChoices: Bar Chart, Line Chart, Pie Chart, Scatter Plot, Histogram, Area Chart, Box Plot, Heat Map, Bubble Chart\n". Ask, "Type? (or exit)"; this is the chartType, default "pie". If chartType is exit, then say "Done" and exit. If chartType is "" or false, then say "You must specify your chart type." go to Step 2.

Step 3. Say in bold, "Define your chart:". Say in regular type "\nExample: Distribution of Customers by Country\n". Ask, "Definition? (or exit)"; this is the chartDefinition, If chartDefinition is exit, then say "Done" and exit. If chartDefinition is "" or false, then say "You must define your chart." go to Step 3.

Step 4. Say in bold, "Chart Specification:". Show chartType, chartDefinition. Ask, "Is this correct?"; if "no" go to Step 2, if "yes" continue to next step.

Step 5. Say in bold, "Chart: ". chartDefinition. Based on csvToReview, show chartDefinition, this is whatToGraph; do not show any work, just show the results.

Generate a dall-e image of a chartType based on whatToGraph. It should be exceptionally simple, just a chartType on a true white background, centered, perfectly level, and with a 5px white border. The design should focus on clarity and readability.
