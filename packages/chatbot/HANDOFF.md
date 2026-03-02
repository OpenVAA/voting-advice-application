## Important Notice

Due to resource constraints, every file in the frontend code related to the chatbot has not been perused with deep analysis. Apologies if there is lacking documentation or deprecated code laying around. Luckily, the system is quite simple and it should be easy to catch any irregularities.

There is more comprehensive and up-to-date documentation about the backend code in the packages file-processing (document upload and their embedding to vector store), vector-store (the VectorStore interface and its concrete Chroma implementation) and chatbot (core logic like prompts, tools, etc.). These packages are the backbone of the system, so they have been documented first and with proper care. It is also noteworthy that the frontend does not need to be perfet as it is subject to a major revamp after a migration from Svelte 4 to 5. See details in the TODO bullet "(0)".

# TODO: Frontend

(0) Refactor to use new llm package: Vercel AI SDK 5 UI types & streaming

Current streaming and UI conversation logic like the UIMessage type is ad hoc, due to SDK 5 incompatibility with Svelte 4, which is the Svelte version at the time of writing and past development. The free Vercel AI SDK provides support for many things that have been implemented to make normal chatbot development possible - use the SDK to simplify.

NOTE: In the backend we are currently able to use ModelMessage from the Vercel AI SDK, because it does not require Svelte 4. So the issue is not ubiquitous - it relates to Svelte 4 and AI SDK 5 incompatibility, causing issues to arise in the UI, not the chatbot backend (chatbot package).

(1) Refactor chatbot widget to Tailwing

The chatbot UI widget does not conform to the convention of using Tailwind in the OpenVAA repo. It employs standard CSS styling instead. Refactor.

(2) Implement multi-language support

Currently only English is supported

(3) See chatbot package, vector-store package & file-processing package READMEs for more.

# TODO: General

(1) Remove metadata collector pattern

For chatbot usage metadata (cost, latency, retrieved docs, etc.), we use an ad hoc metadata collector instance. The reason is that the stream result is returned immediately, so including data in it is not possible. The metadata is used in the chatbot dev route (frontend/routes/[[lang=locale]]/chatbot/single). When using the chatbot via the voter app, the metadata is not used or saved anywhere. It would be better to save metadata (or just some parts of it) to a DB from either the chatbot package or the chat API route. Vercel AI SDK provides callback functions for this.

(2) Implement real data fetching logic

The chatbot currently uses mock data due to OpenVAA data limitations. The data structures needed for basic operations like storing party manifestos are not available. To the best of my knowledge, a move from Strapi to Supabase is in planning to help facilitate more complex logic for data operations. It is recommended that the chatbot is supported by multiple new functions for data retrieval once this migration is finished.

(2.1) Implement & use a ChatbotDataProvider

It's not mandatory to have a vector store as a dependency for the chatbot. It makes much more sense to have the vector store and other DB dependencies below a ChatbotDataProvider, which abstract away the source of data.

IT IS STRONGLY RECOMMENDED TO INCLUDE A STRUCTURED DB TO DRIVE MORE RELEVANT RESULTS. This will require annotating relevant segments and thus will highly impact the file-processing package.

(2.2) Implement an agentic data fetching system for maximum result relevance

(3) Choose smarter magic numbers. They are currently hardcoded and not optimized due to resource limitations in the development of this package.

[`CustomData`](./src/data/customData.type.ts)

See the top portion of [`RagService`](./src/core/rag/ragService.ts) for magic numbers.

(4) Implement chatbot state management

We only support state only for question pages, and even that state is handled ad hoc. State possibilities should be extended to all user and admin contexts pages. This would require using different system prompts dynamically.

State management also usually implements smooth transitions between pages by manipulating the conversation history to be optimal for continuing with relevant context without confusing the new chatbot which uses a different system prompt than its predecessor had.

When implementing this, also consider how to manage saving user messages. Currently, we send a message to the chatbot with relevant question page context included (if the use is from the UI and not the dev UI), but if we use this modified message in the conversation history, the user will see the raw question context that we have artificially prepended to their message. This is not desirable, so we simply "forget" user context in the conversation history, though the chatbot's immediate answer will have this relevant context.

(5) Improve retrieval reliability

The chatbot is eager to answer "simple" questions using its training data instead of using its search capabilities. I've tried to solve this by making it clear in the system prompt that it should use its RAG tool even for simple questions, just to make sure that its presumptions are correct. For fixing this, consider implementing a RAG agent, which removes the responsibility from the chatbot. It has difficulty behaving both as a researcher and a chatbot.

(6) Implement robust rate limiting to handle production usage

This is relevant to ALL llm features like question info generation (question-info) and argument condensation (argument-condensation). Creating a centralized rate limiting is essential - using the same API key in multiple locations is currently not tracked.
