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

### Run Meta-Evaluation

Meta-evaluation is the process of analyzing how well evaluators perform output quality evaluation. Test cases are defined so that a human has evaluated the output already and we are looking at how well the evaluator aligns with the human evals. 

(1) Define output evaluators in evaluation/evaluators
(2) Define test cases in evaluation/metaEvaluation/testData/likertPros/fi (and testData/likertCons/fi)
(3) Run meta-evaluation using yarn tsx

```bash
yarn tsx evaluation/metaEvaluation/runMetaEvaluationCLI.ts fi
```

The script will automatically load the evaluators (excluding the stub and abstract evaluator) and give you analytics on each evaluator's performance to help you improve and choose the best one.
