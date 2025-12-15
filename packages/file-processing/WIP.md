# Notes

- No language support except english ('en')
- Text segmentation is non-deterministic & the limit [minSegmentChars, maxSegmentChars] is empirically unreliable (at least Gemini models seem to prefer semantic boundaries A LOT, even though prompt has instruction for char limits). 
- PDF conversion via Gemini multimodality is unreliable for complex data, human-in-the-loop recommended
- Some splits are not semantic yet (we don't currently give the whole text for LLM to segment, rather we give some 10000 chars or similar)
- Controller pattern not implemented for 
  - (a) progress updates related to pdf extraction 
  - (b) aborting long ops
- Some type definitions need data vs. options separation (albeit this is not crucial)
- API boilerplate needs abstraction via utilities (the file is too long)
- Admin control panel would be helpful, so non-devs can add source documents to DBs and perform human-in-the-loop checks for LLM-automized file processing and analysis
- Refactor saving logic when we have Supabase 