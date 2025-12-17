# Chatbot

## Important Notice

Due to resource constraints, every file in the frontend code related to the chatbot has not been perused with deep analysis. Apologies if there is lacking documentation or deprecated code laying around. Luckily, the system is quite simple and it should be easy to catch any irregularities. 

There is more comprehensive and up-to-date documentation about the backend code in the packages file-processing (document upload and their embedding to vector store), vector-store (the VectorStore interface and its concrete Chroma implementation) and chatbot (core logic like prompts, tools, etc.). These packages are the backbone of the system, so they have been documented first and with proper care. It is also noteworthy that the frontend does not need to be perfet as it is subject to a major revamp after a migration from Svelte 4 to 5. See details in the TODO bullet "(0)".  

## TODO
(0) Refactor to use Vercel AI SDK 5 UI types & streaming

Current streaming and UI conversation logic like the UIMessage type is ad hoc, due to SDK 5 incompatibility with Svelte 4, which is the Svelte version at the time of writing and past development. The free Vercel AI SDK provides support for many things that have been implemented to make normal chatbot development possible - use the SDK to simplify. 

NOTE: In the backend we are currently able to use ModelMessage from the Vercel AI SDK, because it does not require Svelte 4. So the issue is not ubiquitous - it relates to Svelte 4 and AI SDK 5 incompatibility, causing issues to arise in the UI, not the chatbot backend (chatbot package).

(1) Refactor chatbot widget to Tailwing

The chatbot UI widget does not conform to the convention of using Tailwind in the OpenVAA repo. It employs standard CSS styling instead. Refactor. 

(2) Implement multi-language support

Currently only English is supported