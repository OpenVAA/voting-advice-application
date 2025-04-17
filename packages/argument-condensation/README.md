# Argument Condensation

// Stub of a README.md

Tis but a TypeScript package for condensing multiple comments into distinct arguments using LLMs. Can be used in VAAs for extracting information from a large amount people. Expects an array of strings.

## Features

- Groups similar comments into distinct arguments
- Maintains references to source comments
- Supports Finnish and English languages
- Processes comments in configurable batches
- Exports to multiple formats (TXT, JSON, CSV)
- Built-in error handling and retry logic

## Limitations

- Maximum comment length: 2000 characters
- Maximum topic length: 200 characters
- Maximum batch size: 200 comments
- Maximum prompt length: 30000 characters
