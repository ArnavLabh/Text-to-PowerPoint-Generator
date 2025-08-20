# Text-to-PowerPoint-Generator

## How It Works

### Parsing and Mapping Input Text to Slides
When a user submits text (markdown, prose, or bulk content), the app uses an LLM (via the user’s API key) to analyze and segment the input into logical slide sections. The LLM is prompted to identify slide titles, bullet points, and content structure, ensuring that each slide covers a coherent topic or subtopic. Optional user guidance (e.g., “turn into an investor pitch deck”) is included in the prompt to influence tone, structure, and slide count. The result is a dynamic mapping of the input text to an appropriate number of slides, with each slide’s content clearly defined.

### Applying Visual Style and Assets from the Template
If a PowerPoint template or presentation (.pptx/.potx) is uploaded, the app uses the `python-pptx` library to extract and reuse the template’s layouts, color schemes, fonts, and embedded images. For each generated slide, the app selects the most suitable layout from the template, applies the corresponding styles, and copies over any relevant images or design elements. This ensures the output presentation closely matches the look and feel of the original template, maintaining brand consistency and visual appeal. No new images are generated; only assets from the uploaded template are reused.

The final .pptx file is generated on the server and made available for download, preserving both the content structure and the visual identity of the chosen template.