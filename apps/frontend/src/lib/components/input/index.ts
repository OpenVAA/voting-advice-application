// NB. the `parts` subdirectory is deliberately absent from this barrel: its four components are the extracted complex branches of `Input` and are implementation detail, not public API. The sibling `questions` package exports every component because they are all public; the asymmetry here is intentional. The reasoning is written out in the README beside those components.
export { default as Input } from './Input.svelte';
export * from './Input.type';
export { default as InputGroup } from './InputGroup.svelte';
export * from './InputGroup.type';
export { default as PreviewAllInputs } from './PreviewAllInputs.svelte';
export * from './PreviewAllInputs.type';
export { default as QuestionInput } from './QuestionInput.svelte';
export * from './QuestionInput.type';
export * from './shared';
