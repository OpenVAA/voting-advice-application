# CategoryTag

Used to display a question category tag with the category's color.

### Properties

- `category`: The `QuestionCategory` object.
- `variant`: Whether to use an abbreviation or the full name. Default: `'full'`
- `suffix`: An optional suffix to add after the category name, e.g. '1/3'.
- `onShadedBg`: Set to `true` if using the component on a dark (`base-300`) background. Default: `false`
- Any valid attributes of a `<span>` element

### Usage

```tsx
<CategoryTag category={question.category} />
```

## Source

[frontend/src/lib/components/categoryTag/CategoryTag.svelte](https://github.com/OpenVAA/voting-advice-application/blob/main/frontend/src/lib/components/categoryTag/CategoryTag.svelte)

[frontend/src/lib/components/categoryTag/CategoryTag.type.ts](https://github.com/OpenVAA/voting-advice-application/blob/main/frontend/src/lib/components/categoryTag/CategoryTag.type.ts)
