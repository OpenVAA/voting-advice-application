/**
 * Shared constants between the `Input` and `InputGroup` components and the `Input` parts in `./parts`.
 *
 * The element classes below were private to `Input.svelte` until its four complex markup branches were extracted into parts. Both sides need them — the parts render the extracted branches, `Input` still renders the two single-element branches inline — so they live here rather than being duplicated or threaded through as props.
 */
export const iconBadgeClass = 'my-auto flex-shrink-0';
export const infoClass = 'm-md small-info';
export const joinGap = 'gap-xs';
export const outsideLabelClass = 'font-bold text-secondary mx-md mb-8 mt-lg';

/** The row wrapping a single-line input together with its label and badges. */
export const inputContainerClass =
  'flex min-h-touch items-center justify-between gap-2 overflow-hidden rounded-lg bg-[var(--inputBgColor)]';
/**
 * The label rendered inside an input row, in small caps. A row has to hold a label of any length beside its control, so the label wraps between words, as every `.label` does by the project's rule in `app.css`. The row gives the label the width of its text on one line whenever the control keeps its minimum width beside it (see {@link inputAndIconContainerClass}); only a longer label wraps. A single word is never broken: the label keeps a minimum width, and a one-word label would otherwise lose its last letter to a second line when the control is at its narrowest.
 */
export const inputLabelClass = 'label-sm label pointer-events-none min-w-[4rem] mx-md my-2 px-0 text-secondary';
/**
 * The wrapper holding the input element itself and any trailing badges or buttons. It asks for no width of its own and takes whatever the label leaves, down to the minimum width of what it holds: the label is given its one-line width first, and shrinks only once the control is at that minimum. A wrapper that asked for its contents' width would have an input's default width, with any button beside it, squeeze a label that fits onto a second line.
 */
export const inputAndIconContainerClass = 'flex flex-1 justify-end items-center pr-8';
/** The `input` element itself. It keeps a minimum width beside a long label and any button that follows it. */
export const inputClass =
  'input input-sm input-ghost grow px-0 text-start w-full min-w-xxl disabled:border-none disabled:bg-[var(--inputBgColor)] disabled:text-neutral';
/** The `select` element itself. It keeps a minimum width beside a long label. */
export const selectClass =
  'select select-sm grow text-start w-full min-w-xxl !bg-transparent disabled:border-none disabled:bg-[var(--inputBgColor)]';
/** The `textarea` element itself. */
export const textareaClass =
  'textarea bg-[var(--inputBgColor)] resize-none px-md py-sm !outline-none disabled:bg-[var(--inputBgColor)] disabled:text-neutral';
