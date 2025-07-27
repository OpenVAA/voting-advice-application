Expected directory structure:

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
|    etc.

The filenames are currently hardcoded in the condenser.
