# @openvaa/file-processing

Document processing pipeline for converting PDFs and .txt files into semantically segmented, and holistically analyzed content, summarized and fact-extracted, ready for vector storage. More complex search operations like fact-based search can be easily implemented. 

## Usage

The package exports two main functions: processPdf and processText. You can either use them standalone or utilize the following batch processing scripts. The scripts are is highly recommended before a file processing UI. 

### Batch Processing Scripts

1. Process Documents
Processes all documents in src/documents/step0_raw/ (both PDF and TXT files - others not supported yet):

```bash
cd packages/file-processing
bun run src/scripts/processDocuments.ts
```

Input: Files in step0_raw/ (supports subdirectories automatically)
Output:
step1_segmented/: Human-readable segmented text (for convinience, not for programmatic use)
step2_processed/: Full JSON with analysis and metadata

2. Embed Documents
Creates vector embeddings and stores them in the ChromaDB vector store.

Note: Move files from step2_processed/ to step3_embeddingQueue/ before running embeddings.
Note 2: Make sure collection name matches the one you want to use, for e.g. the chatbot

```bash
cd packages/file-processing
bun run src/scripts/embedDocuments.ts
```

Input: JSON files from step3_embeddingQueue/
Output: Segments stored in ChromaDB collection

### Processing Stages

#### Stage 1: PDF Conversion (PDF-only, otherwise skip to stage 2)
- Converts PDF to markdown using Gemini's multimodal capabilities.
- Tries to preserve structure, tables, and formatting but is unreliable. Human-in-the-loop recommended but not implemented yet. 

#### Stage 2: Text Segmentation
- Splits text into semantic chunks
- Respects paragraph and section boundaries
- Configurable min/max segment lengths (IMPORTANT: non-deterministic & empirically unreliable)
- Note: semantic chunking is not performed for the whole document. Thus, we do split un-semantically at a few parts. In the future, it is recommended that these splits be semantic as well. 

#### Stage 3: Document Analysis
- Extracts document metadata (title, author, date, etc.)
- Generates summaries for each segment
- Extracts standalone facts
- Enriches segments with source metadata (though the data is normalized when in transmission)

###
```typescript
import { processText } from '@openvaa/file-processing';
import { LLMProvider } from '@openvaa/llm-refactor';
import { BaseController } from '@openvaa/core';

const llmProvider = new LLMProvider({  
  provider: 'google',  
  apiKey: process.env.LLM_GEMINI_API_KEY,  
  modelConfig: {    
    primary: 'gemini-2.5-flash-preview-09-2025',    
    fallback: 'gemini-2.5-pro'  
}});

const result = await processText({  
  text: markdownContent,  
  llmProvider,  
  documentId: 'my-doc',  
  runId: `pipeline_${Date.now()}`,  
  controller: new BaseController()
});

// Access results
console.log(result.data.segments);           
// Array of segments with analysis
console.log(result.data.metadata);           
// Document metadata
console.log(`Cost: $${result.llmMetrics.costs.total}`);
console.log(`Segments: ${result.data.segments.length}`);
```

Processing PDF Documents
```typescript
import { processPdf } from '@openvaa/file-processing';
import * as fs from 'fs';

const pdfBuffer = fs.readFileSync('document.pdf'); // 
const result = await processPdf({  
  pdfBuffer,  
  apiKey: 'your-api-key',  
  model: 'gemini-2.5-pro',  
  originalFileName: 'document.pdf',  
  llmProvider,  
  documentId: 'my-pdf-doc',  
  runId: `pipeline_${Date.now()}`,  
  controller: new BaseController()
});
// PDF-specific: access extracted markdown
console.log(result.data.extractedText);
```

## Some Extra Details

### Data Normalization
Source segments have 2 different data formats for resource optimization (normalization). A SourceSegment does not include metadata but SegmentWithMetadata does. When storing the segments we enrich (denormalize) the segments with source metadata. During data transmission we send the source metadata just once - obviously it's the same for every segment derived from a single source. 

### Prompts System
Prompts are stored as YAML files in src/prompts/ and loaded dynamically. This allows easy customization without code changes.

### Controller Pattern
The Controller parameter allows for cancellation of long-running operations, useful in interactive applications. It is not, as of writing, capable of sending abort calls to cloud providers that provide LLM access. 