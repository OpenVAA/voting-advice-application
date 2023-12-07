# Building the data API between the frontend and Strapi or other backend solution

A design principle of the OpenVAA framework is to make its functionalities (or modules) as independent of each other as possible. For connecting the SvelteKit frontend to the Strapi backend, this means we want to abstract the interface between the two so that any read and write calls from the frontend use functions and data types that are agnostic of the backend.

The relevant Typescript `interface` is not yet defined for the Voter App, but you can have a look at the API calls it uses in [`/src/lib/api/getData.ts`](../../frontend/src/lib/api/getData.ts), for example:

```ts
getElection({
  electionId?: string
}): Promise<ElectionProps>;
```

The functions the Candidate App uses for making further read calls and write calls should follow a similar logic, where any specifics to Strapi are handled inside the functions and their outputs are properties that can be consumed by the frontend.

[In the future](https://github.com/OpenVAA/voting-advice-application/issues/249), the current `getData.ts` will be refactored so that this will be a Strapi-specific implementation of a `GetData` interface, which will follow among similar lines (although it will probably be a ’data provider’ object exposing these methods). Also, another abstraction layer may be created separating an abstract representation of the data objects, such as a `Candidate`, from the `CandidateProps` which are Svelte-specific.