Expected directory structure:

File names don't matter. Their location in the directories does.

So you can add a new MAP prompt by setting it in likertPros/anyFileName.yaml
What does matter is that the promptId you set is passed onto the configuration.
See type condensationInput --> condensationOptions --> ProcessingStep.
A ProcessingStep contains the id of the prompt expected to perform the operation
(= processing step), e.g. MAP.

prompts/
|-fi/
├── REFINE/
│ ├── likertPros/
│ │ ├── initialBatchPrompt.yaml
│ │ └── refinementPrompt.yaml
│ └── likertCons/
│ ├── initialBatchPrompt.yaml
│ └── refinementPrompt.yaml
├── MAP/
│ ├── likertPros/
│ │ └── condensationPrompt.yaml
│ └── likertCons/
│ └── condensationPrompt.yaml
│
├── ITERATE_MAP/
│ ├── likertPros/
│ │ └── iterationPrompt.yaml
│ └── likertCons/
│ └── iterationPrompt.yaml
│
├── REDUCE/
│ ├── likertPros/
│ │ └── coalescingPrompt.yaml
│ └── likertCons/
│ └── coalescingPrompt.yaml
└── GROUND/
├── likertPros/
│ └── groundingPrompt.yaml
└── likertCons/
└── groundingPrompt.yaml
|
|-en/
| etc.
