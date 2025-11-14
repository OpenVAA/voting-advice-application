1. 
You need to have these api keys in OpenVAA root .env:
  - OpenAI for chatbot
  - Cohere for reranking

2. 
ChromaDB has to be running. Doesn't matter when you put it up because will used only at runtime but ofc now is as good a time as any. 

in packages/vector-store run:
chroma run --host 0.0.0.0 --path ./chroma-db

3. 
Then just pop a yarn dev. 

4. 
Chatbot is now usable at:

http://localhost:5173/en/chatbot/single