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
/** The label rendered inside an input row, in small caps. */
export const inputLabelClass = 'label-sm label pointer-events-none min-w-[4rem] mx-md my-2 px-0 text-secondary';
/** The wrapper holding the input element itself and any trailing badges or buttons. */
export const inputAndIconContainerClass = 'flex grow justify-end items-center pr-8';
/** The `input` element itself. */
export const inputClass =
  'input input-sm input-ghost grow justify-end px-0 text-end w-full disabled:border-none disabled:bg-[var(--inputBgColor)] disabled:text-neutral';
/** The `select` element itself. */
export const selectClass =
  'select select-sm grow text-end w-full !bg-transparent disabled:border-none disabled:bg-[var(--inputBgColor)]';
/** The `textarea` element itself. */
export const textareaClass =
  'textarea bg-[var(--inputBgColor)] resize-none px-md py-sm !outline-none disabled:bg-[var(--inputBgColor)] disabled:text-neutral';
