# openvaa/argument-condensation 

WHAT?
A condensation algorithm used for finding pros and cons of a political decision.

WHY?
To inform VAA users so they can reason for themselves and answer the questions accordingly.  

HOW?
Using AI, specifically chatbots. 


## Example Usage

```typescript
import { CONDENSATION_TYPE, getLanguageConfig, processComments } from '@openvaa/argument-condensation';
import { OpenAIProvider } from '@openvaa/llm'; // inherits LLMProvider

// OpenVAA's way to communicate with LLMs 
const llmProvider = new OpenAIProvider({
  model: 'gpt-4o-mini',
  apiKey: 'your-api-key-here'
});

// Configure the main class with provider & language of choice
condenser = new Condenser({ llmProvider, languageConfig: LanguageConfigs.en });

const comments = [
      'Increasing the minimum wage would help reduce poverty and inequality',
      'Higher minimum wages could force small businesses to lay off workers'
];

const result = await condenser.processComments({ comments, topic: 'Should the minimum wage be increased?' });
console.log(result) // see the arguments 
```

## Limitations
Speed
  - not parallelized = slow 
  - ≈ few minutes per few hundred comments 
  - t_processing ≈ n_comments / batch_size(default=30) * t_per_llm_call + some extra processing time (diminishing w.r.t. formula)
Hallucinations
  - is instructed to create 10ish arguments --> may hallucinate extra arguments to fulfill this requirement
  - no evaluation loop
Quality
  - may not fully capture nuance of the arguments 
  - using a smarted model (e.g. reasoning model) helps but slows the process down 5-10x

## Configuration Options
  - llmProvider
  - language
  - batchSize = 30
  - condensationType = CONDENSATION_TYPE.General
