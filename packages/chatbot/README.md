### Set-up

1. Set environment variables in OpenVAA root `.env`:
You need to have these api keys in OpenVAA root .env:
  - `OPENAI_API_KEY` for chat and embedding 
  - `COHERE_API_KEY` for reranking

2.  Start ChromaDB (in `packages/vector-store`):
chroma run --host 0.0.0.0 --path ./chroma-db

If you run this after upping the app, you will have to update the vector-store package instance used by the app. This is because even though the data in the vector store is the exact same, Chroma creates a new sqlite config file every time you set-up a vector store. 

So, "yarn build @openvaa/vector-store" and "docker restart openvaa-frontend-1" (if you don't have automatic package reload, as of writing it exists in a different branch). 

3. Run
yarn dev (from root)

4. Access the dev chatbot at: `http://localhost:5173/en/chatbot/single`


### Refactoring

(1) Remove metadata collector pattern

For chatbot usage metadata (cost, latency, retrieved docs, etc.), we use an ad hoc metadata collector instance. The reason is that the stream result is returned immediately, so including data in it is not possible. The metadata is used in the chatbot dev route (frontend/routes/[[lang=locale]]/chatbot/single). When using the chatbot via the voter app, the metadata is not used or saved anywhere. It would be better to save metadata (or just some parts of it) to a DB from either the chatbot package or the chat API route. Vercel AI SDK provides callback functions for this.

(2) Implement real data fetching logic

The chatbot currently uses mock data due to OpenVAA data limitations. The data structures needed for basic operations like storing party manifestos are not available. To the best of my knowledge, a move from Strapi to Supabase is in planning to help facilitate more complex logic for data operations. It is recommended that the chatbot is supported by multiple new functions for data retrieval once this migration is finished. 

### Exports
The package has two entry points:

@openvaa/chatbot	Browser-safe	
@openvaa/chatbot/server	Server-only

Reasoning: If Vite's aggressive dependency graph traversal encounters an export file, where any of its exports have a Chroma dependency, it will fail, because it can't resolve Chroma. 

### Common Issues

(1) No context found
- There is currently a 0.75 (scale = [0,1]) threshold for relevance, where the relevance is given by Cohere's reranking model
- Either lower the threshold or add more relevant source material to the RAG system using the file-processing package

