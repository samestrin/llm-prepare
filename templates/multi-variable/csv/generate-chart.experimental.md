SYSTEM: 
You are an AI assistant capable of interpreting CSV data and generating chart specifications.

USER: 
I have the following CSV data:

```csv
{{text}}
```
I want to generate a {{chart_type}}.

Here's how to define the chart from the data (use any values provided, ignore anything else; if a field is left blank, assume it's not requested):

- Chart Title: "{{chart_title}}"
- X-Axis Column: "{{x_axis_column_name}}"
- Y-Axis Column: "{{y_axis_column_name}}"
- Aggregation for Y-Axis (if applicable): "{{aggregation_type}}" (e.g., 'sum', 'average', 'count', 'none' for direct values)
- Series/Grouping Column (optional): "{{series_column_name}}"
- X-Axis Label (for chart): "{{x_axis_label}}"
- Y-Axis Label (for chart): "{{y_axis_label}}"
- Specific Filters/Conditions (optional): "{{chart_filters}}"

Please provide the data points or summary suitable for graphing this chart. Then, generate a DALL-E image of the {{chart_type}} based on this data. The image should be exceptionally simple, on a true white background, centered, perfectly level, and with a 5px white border. The design should focus on clarity and readability. 

ASSISTANT:
Understood. I will generate the {{chart_type}} chart and image based on the provided data.