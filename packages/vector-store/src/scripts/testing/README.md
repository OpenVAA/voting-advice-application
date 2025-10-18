# RAG Gater Test Suite

This directory contains a comprehensive test suite for evaluating the RAG (Retrieval Augmented Generation) gater classifier. The gater decides whether a user query requires knowledge base retrieval or can be answered without RAG.

## Purpose & Reasoning

### Why Test the Gater?

The RAG gater is a critical component that:

1. **Improves Performance**: Skipping unnecessary vector searches reduces latency for conversational queries (greetings, clarifications, etc.)
2. **Reduces Costs**: Avoids expensive embedding and retrieval operations when not needed
3. **Enhances UX**: Faster responses for simple interactions

However, incorrect gating decisions have consequences:
- **False Negatives**: Missing RAG when needed → incorrect/hallucinated answers
- **False Positives**: Using RAG unnecessarily → slower responses, wasted resources

This test suite provides quantitative metrics to evaluate gater performance and identify weaknesses.

### Test Design Philosophy

This is a **diagnostic test** using a **contingency table** (confusion matrix) approach, common in medical and ML evaluation:

- **True Positives (TP)**: Correctly identifies queries needing RAG
- **True Negatives (TN)**: Correctly identifies queries NOT needing RAG
- **False Positives (FP)**: Incorrectly triggers RAG for conversational queries
- **False Negatives (FN)**: Incorrectly skips RAG for factual queries (most dangerous)

## Files

### `gaterTestDataset.json`

**Structure**: 110 test cases with balanced distribution:

```json
{
  "id": "rag_true_0ctx_direct_factual_001",
  "expectedRAG": true,
  "category": "direct_factual",
  "contextLength": 0,
  "contextMessages": [],
  "query": "What is the EPP's stance on migration?",
  "description": "Specific policy position question"
}
```

**Distribution**:

- **Total**: 110 cases (55 RAG=true, 55 RAG=false)
- **Context lengths**: 0, 1, 2, 3, 4, 5, 6, 7, 8, 9 messages
  - 0 context: 10 cases per RAG group
  - 1 context: 5 cases per RAG group
  - 2-9 context: 5 cases each per RAG group

**Categories (RAG=true)**:
- `direct_factual`: Factual questions requiring knowledge base (policies, candidates, dates)
- `followup_factual`: Follow-up questions requiring NEW factual information
- `complex_multitopic`: Multi-party or multi-topic comparisons

**Categories (RAG=false)**:
- `conversational_social`: Greetings, thanks, acknowledgments
- `clarification_elaboration`: Requests to clarify/simplify already-provided information
- `meta_opinion`: Subjective questions (recommendations, "which is better?")
- `conversation_management`: Topic changes, navigation

**Domain**: EU 2024 European Parliament election chatbot

### `gaterTest.ts`

Test script that:

1. Loads test dataset
2. Initializes LLM provider with `gpt-5-nano` (fast, cheap model used in production)
3. Runs `isRAGRequired()` on each test case
4. Calculates performance metrics
5. Generates comprehensive report

**Metrics Calculated**:

- **Overall**: Confusion matrix + accuracy, precision, recall, F1-score
- **By Category**: Breakdown for each query category
- **By Context Length**: Performance across different conversation depths
- **Misclassifications**: Detailed list of failures with reasoning

### `gaterTestReport.json`

Generated report containing:

```json
{
  "overall": {
    "truePositive": 50,
    "trueNegative": 48,
    "falsePositive": 7,
    "falseNegative": 5,
    "accuracy": 0.89,
    "precision": 0.88,
    "recall": 0.91,
    "f1Score": 0.89,
    "total": 110
  },
  "byCategory": { ... },
  "byContextLength": { ... },
  "misclassifications": [ ... ],
  "timestamp": "2025-01-15T10:30:00.000Z"
}
```

## Usage

### Running the Test

```bash
# From project root
cd packages/vector-store

# Run with bun (faster)
bun run src/scripts/testing/gaterTest.ts

# Or with yarn/tsx
yarn tsx src/scripts/testing/gaterTest.ts
```

**Requirements**:
- `OPENAI_API_KEY` environment variable must be set
- Internet connection for API calls
- ~2-3 minutes runtime (110 LLM calls with gpt-5-nano)

### Interpreting Results

#### Overall Metrics

**Accuracy**: Overall correctness rate
- Target: >90% for production use

**Precision**: Of queries marked "needs RAG", how many actually need it?
- Low precision = wasted resources (too many false positives)

**Recall**: Of queries that need RAG, how many were caught?
- Low recall = incorrect answers (missed factual queries)
- **Most critical metric** - false negatives cause hallucinations

**F1 Score**: Harmonic mean of precision and recall
- Balances both concerns

#### By Category Analysis

Identifies systematic weaknesses:
- Low recall in `followup_factual`? → Gater struggles with context-dependent factual follow-ups
- Low precision in `clarification_elaboration`? → Over-triggering RAG for simple clarifications

#### By Context Length Analysis

Shows how conversation depth affects performance:
- Poor performance at 0 context? → Baseline classification issues
- Degrading performance at 5+ context? → Context tracking problems

#### Misclassifications

Each misclassification shows:
- Test case ID and category
- Expected vs predicted decision
- Actual query and description
- Context length

Use this to identify patterns and edge cases.

## Modifying the Test Suite

### Adding Test Cases

Edit `gaterTestDataset.json`:

```json
{
  "id": "rag_true_2ctx_your_category_001",
  "expectedRAG": true,
  "category": "your_category",
  "contextLength": 2,
  "contextMessages": [
    "Previous user message 1",
    "Previous user message 2"
  ],
  "query": "Your test query here",
  "description": "What this tests"
}
```

**Guidelines**:
- Keep balanced distribution (50/50 RAG=true/false)
- Use realistic EU 2024 election domain queries
- Include edge cases and ambiguous queries
- Maintain category diversity

### Adjusting the Model

To test with a different model, edit `gaterTest.ts`:

```typescript
const gater = new LLMProvider({
  provider: 'openai',
  apiKey,
  modelConfig: { primary: 'gpt-4o-mini' } // Change here
});

// And update the isRAGRequired call
const predictedRAG = await isRAGRequired({
  messages,
  provider: gater,
  modelConfig: { primary: 'gpt-4o-mini' } // And here
});
```

## Performance Targets

Based on chatbot requirements:

| Metric | Target | Rationale |
|--------|--------|-----------|
| Accuracy | >90% | Overall reliability threshold |
| Recall | >95% | False negatives cause hallucinations (critical) |
| Precision | >85% | Some false positives acceptable (just slower) |
| F1 Score | >90% | Balanced performance |

**Priority**: Recall > Precision (better to over-retrieve than miss factual queries)

## Troubleshooting

**"OPENAI_API_KEY environment variable is required"**
- Set the API key: `export OPENAI_API_KEY=your_key_here`

**"Temperature setting not supported"**
- Warning only, safe to ignore (gpt-5-nano doesn't support temperature parameter)

**Test runs slowly**
- Expected: ~110 API calls take 2-3 minutes
- Use `gpt-5-nano` for faster/cheaper testing

**High false negative rate**
- Check prompt in `/packages/vector-store/src/core/prompts/isRAGRequired.yaml`
- Review misclassified cases for patterns
- Consider adding examples to prompt

## Integration with CI/CD

To run in automated testing:

```bash
# Set threshold
REQUIRED_ACCURACY=0.90

# Run test and parse results
bun run src/scripts/testing/gaterTest.ts

# Check report
node -e "
  const report = require('./src/scripts/testing/gaterTestReport.json');
  if (report.overall.accuracy < $REQUIRED_ACCURACY) {
    console.error('Gater accuracy below threshold!');
    process.exit(1);
  }
"
```

## References

- Gater implementation: `/packages/vector-store/src/core/utils/isRAGRequired.ts`
- Gater prompt: `/packages/vector-store/src/core/prompts/isRAGRequired.yaml`
- Production usage: `/frontend/src/routes/[[lang=locale]]/api/chat/+server.ts`
