### Quick Start for Developers

Want to understand the system quickly?

flowVisualized.png provides an LLM-generated visualization of the system. It is very helpful to start out with that to grasp the system design E2E. 

You can use the chatbot either through once you have completed the [setup](#set-up):
- **Questions page** (voter app): `http://localhost:5173/en/questions`
- **Development UI** (standalone): `http://localhost:5173/en/chatbot/single`

And here is a quickstart for understanding internals:
1. **Start here:** Read `src/controller/chatbotController.ts` to see the main flow
2. **Understand capabilities:** Check `src/defaultConfig/chatbotSkills.ts` (NOTE: these capabilities are not up-to-date, because the vector store does not have all the data we used during development! SKILLS DEPEND ON WHAT DATA EXISTS)
3. **See RAG in action:** Look at `src/core/rag/ragService.ts` for retrieval logic (NOTE: needs a lot of improvement, implementing agentic search is recommended)
4. **Customize behavior:** Edit `src/prompts/systemPrompt.yaml` for personality/instructions
5. **Tune relevance:** Adjust `MIN_RERANK_SCORE` in `ragService.ts` if results are too strict/loose
6. **Automate testing** See `src/scripts/chatbotTests.ts`. Add tests according to the examples. Run tests with `bun run src/scripts/chatbotTests.ts`

**Architecture Pattern:** Tool-based RAG (not automatic RAG)
- LLM decides when to search
- Supports multiple tools (search, party lookup, future: more data and better data hierarchies for wider base of information)
- See HANDOFF.md for planned improvements (agentic RAG, data provider abstraction)

**Quick Flow:**
1. User sends message → `ChatbotController` orchestrates the request
2. `ChatEngine` streams LLM response with access to tools
3. LLM invokes `vectorSearchForElectionInfo` tool when it needs factual information
4. `RAGService` retrieves relevant context from vector store (with optional Cohere reranking)
5. LLM uses retrieved context to formulate informed response

### Configuration & Skills

**Chatbot Capabilities** (`src/defaultConfig/chatbotSkills.ts`):
The chatbot is configured to:
- Find information about EU elections and parties
- Explain party policies and histories
- Help understand EU institutions and election theory
- Convert vague interests into concrete questions
- Engage empathetically with users about their feelings
- Answer election statistics and general EU questions

!! IMPORTANT !!
SOME OF THESE TASKS WILL FAIL BECAUSE THE VECTOR STORE DOES NOT INCLUDE INFORMATION FOR ALL OF THESE INFORMATION CAPABILITIES.

**Configuration** (`src/defaultConfig/config.ts`):
Central configuration provides:
- **Vector Store:** Knowledge base for RAG retrieval
- **LLM Providers:** Different models for routing, reformulation, and chat
- **Onboarding Messages:** Localized welcome messages

**RAG Tuning** (`src/core/rag/ragService.ts`):
Key parameters (magic numbers, see HANDOFF.md TODO #3):
- `TOP_K_FROM_VECTOR_SEARCH` - Initial retrieval size
- `N_SEGMENTS_TO_RETURN`- Max context segments to LLM
- `MIN_RERANK_SCORE` - Relevance threshold (adjust if "No context found" errors)

**System Prompt** (`src/prompts/systemPrompt.yaml`):
Defines chatbot personality, skills, and behavior guidelines

### Set-up

1. Set environment variables in OpenVAA root `.env`:
You need to have these api keys in OpenVAA root .env:
  - `OPENAI_API_KEY` for chat and embedding 
  - `COHERE_API_KEY` for reranking

2.  Start ChromaDB (in `packages/vector-store`):
chroma run --host 0.0.0.0 --path ./chroma-db

If you run this after upping the app (not recommended), you will have to update the vector-store package instance used by the app. This is because even though the data in the vector store is the exact same, Chroma creates a new sqlite config file every time you set-up a vector store. 

So, "yarn build @openvaa/vector-store" and "docker restart openvaa-frontend-1" (if you don't have automatic package reload, as of writing it exists in a different branch). 

3. Run
yarn dev (from root)

4. Access the development chatbot UI at: `http://localhost:5173/en/chatbot/single`

### Refactoring

Please see HANDOFF.md

### Exports
The package has two entry points:

@openvaa/chatbot Browser-safe	
@openvaa/chatbot/server	Server-only

Reasoning: If Vite's aggressive dependency graph traversal encounters an export file, where any of the file's exports has a Chroma dependency, it will fail, because it can't resolve Chroma. 

### Common Issues

(1) No context found
- There is currently a 0.75 (on scale = [0,1]) threshold for relevance, where the relevance is given by Cohere's reranking model
- Either lower the threshold or add more relevant source material to the RAG system using the file-processing package

