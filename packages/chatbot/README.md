### Set-up (dev mode only)

1. 
You need to have these api keys in OpenVAA root .env:
  - OpenAI for chatbot
  - Cohere for reranking

2. 
ChromaDB has to be running. Doesn't matter when you put it up because will used only at runtime but ofc now is as good a time as any. Just note that if you do run it after upping the app, you will have to update the vector-store package used by the frontend. This is because even though the data is the exact same, Chroma creates a new sqlite config file when you set-up the vector store. So, e.g. "yarn build @openvaa/vector-store" and "docker restart openvaa-frontend-1", if you don't have automatic package reload (as of writing it exists in a different branch). 

So in packages/vector-store run:
chroma run --host 0.0.0.0 --path ./chroma-db

3. 
Then just pop a yarn dev. 

4. 
Chatbot is now usable at:

http://localhost:5173/en/chatbot/single


### Refactoring

(1) For chatbot usage metadata (cost, latency, retrieved docs, etc.), we use an ad hoc metadata collector instance. The reason is that the stream result is returned immediately, so including data in it is not possible. The metadata is used in the chatbot dev route (frontend/routes/[[lang=locale]]/chatbot/single). When using the chatbot via the voter app, the metadata is not used or saved anywhere. It would be better to save metadata (or just some parts of it) to a DB from either the chatbot package or the chat API route. 
(2) 