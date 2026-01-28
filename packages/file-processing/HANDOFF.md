# Handoff Notes

## Most Important

- Refactor to use new llm package
- No language support except english ('en')
- Text segmentation is non-deterministic & the limit [minSegmentChars, maxSegmentChars] is empirically unreliable (at least Gemini models seem to prefer semantic boundaries A LOT, even though prompt has instruction for char limits).
- PDF conversion via Gemini multimodality is unreliable for complex data, human-in-the-loop recommended
- Some splits are not semantic yet. Text is split into 10000-char chunks BEFORE semantic segmentation. This means segments that span chunk boundaries won't be semantically optimal. Either increase charsPerLLMCall or implement chunk-boundary healing, e.g. with LLMs.
- Controller pattern not implemented for
  - (a) progress updates related to pdf extraction
  - (b) aborting long ops
- Some function input params need data vs. options separation
- API boilerplate needs abstraction via utilities (the file is too long)
- Admin control panel would be helpful, so non-devs can add source documents to DBs and perform human-in-the-loop checks for LLM-automized file processing and analysis
- Refactor "embed & save" logic in the emdedDocuments.ts script when we have a Supabase DB
- Actually use extracted facts and summaries for vector search retrieval. It is expected to improve retrieval, but the semantics of what constitutes a searchable element needs to be documented carefully.
- A big need for rate limiting to support parallel processing. Current code may use parallel processing automatically. Please see 'documentAnalysis.ts' line
- IF THE CHATBOT WILL BE MODIFIED TO SUPPORT STRUCTURED RAG, THIS PACKAGE WILL BECOME RESPONSIBLE FOR METADATA ANNOTATION AND SAVING STRUCTURED DATA IN ADDITION TO SAVING UNSTRUCTURED DATA

## Some Quick Wins

- Try OpenAI or Claude for segmentation (may respect char limits better than Gemini)
- Add progress tracking to controller pattern (already implemented in analysis phase but not in PDF extraction)
- Test different charsPerLLMCall values (currently 10000, untested)
- Function input parameter definitions would benefit from a simply data vs. options separation
- Implemented fact and/or summary-based vector retrieval in addition to traditional segment-based search

## If Something Breaks

- Segmentation too long? Lower maxSegmentLength. Try another model. Change the prompt instructions to highlight the importance of respecting char limits.
- API Limits? You can try lowering the parallel processing coefficient. If this fails, avoid implementing rate limit fixes in the file-processing package. Please implement more generic logic in the llm package (or create a rate-limiting package and simply use it in llm package).

## Some Whys

- LLM-based segmentation: It is well documented in literature that semantic boundaries supersedes traditional chunking strategies for RAG quality
- Sliding window context for summaries: LLMs perform better when it has relevant context from surrounding text
- Gemini: The Gemini series is widely considered one of the best multimodal LLM releases. Using it in text segmentation was just for convinience, so that this package doesn't rely on 2 different providers. Though, given Gemini's poor performance on respecting character limits for segments, it should be investigated whether using another provider makes sense.

## Magic Numbers Explained

- 1500/1000/500 chars: Edge segments get more context, because they're missing one side. Middle segments get asymmetric context because preceding context (usually) matters more. There numbers have not been tested further. Concretely:
  - 1500 chars = context for first & last segments (edge cases)
  - 1000 chars = preceding context for middle segments
  - 500 chars = following context for middle segments
- 10000 charsPerLLMCall: Not empirically tested. If you have time, please investigate what a better magic number would be.
