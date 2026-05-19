# InfoAnswer

Used to display a possibly wrapped entity's answer to an info question. Depending on the question type it is rendered as a `<span>`, `<ol>` or `<a>` element.

### Properties

- `answer`: The possibly missing answer to the question.
- `question`: The info question object.
- `format`: How to format the answer. Default: `'default'`
  - `default`: use the same format as in `<EntityDetails>`.
  - `tag`: format the answers as a pill or tag. Nb. links are always rendered as tags.
- Any valid common attributes of an HTML element.

### Usage

```tsx
<InfoAnswer answer={candidate.getAnswer(question)} {question}/>
```

## Source

[frontend/src/lib/components/infoAnswer/InfoAnswer.svelte](https://github.com/OpenVAA/voting-advice-application/blob/main/frontend/src/lib/components/infoAnswer/InfoAnswer.svelte)

[frontend/src/lib/components/infoAnswer/InfoAnswer.type.ts](https://github.com/OpenVAA/voting-advice-application/blob/main/frontend/src/lib/components/infoAnswer/InfoAnswer.type.ts)
