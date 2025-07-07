# Argument Condensation

## Environment

Set `LLM_OPENAI_API_KEY` in root `.env` file. 

## Usage

### Run Condensation

```bash
yarn tsx runCondensation.ts
```

Configure in `runCondensation.ts` using consts:
- `condensationType`: Set to `CONDENSATION_TYPE.LIKERT.PROS` or `CONDENSATION_TYPE.LIKERT.CONS`
- `INPUT_FILE_PATH`: Path to comments file
- `nCommentsPerLikert`: Max comments per Likert value (1-5)

Automatically saves an operation tree that can be used in the following way.

Go to new_src/core/visualization and run:

```bash
python3 -m http.server 8080
```

UI will prompt you to download an operation tree. You can find one in new_src/data/operationTrees. This will show a visualization of the condensation process, including inputs and outputs of each prompt. 