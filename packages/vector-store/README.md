### Current Architecture

Base abstraction: VectorStore

Three separate vector stores:
- segments = the actual text excerpts from the source material
- summaries = summaries of segment
- facts = standalone facts from segments

Why three vector stores?

(1) Reasoning for Vector Store Facts
Segments are often multiple, even a dozen, sentences long. This causes facts like "The population of Ristiina is 4867" to not be embedded as is. A fuzzy search for "What is the population of Ristiina?" may fail, because the information has been embedded with other information. 

(2) Reasoning for Vector Store Summaries 
The idea behind is help fuzzy search results be more aligned with complex questions like "How does the EU work?". A segment may contain a header "How the EU works" or it may not. A summary, though, is very likely to contain an explicit mention "The segment 

### Refactor Plan

This implementation is extremely customized, created rapidly to enable holistic chatbot development. Consequently, the heuristic ideas behind the customized architecture have not been validated mathematically due to limited time and resources. When moving to another vector store implementation, it is recommended that you either (a) build it without the ad hoc vector stores (facts, summaries) or (b) validate that this implementation is more precise than a general one. 

In either case, it makes sense to not use a MultiVectorStore defined here but simply a VectorStore class. This improves flexibility of usage and the DX.

