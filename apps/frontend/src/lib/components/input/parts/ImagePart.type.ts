/**
 * Props for the `ImagePart` component — the hidden file input, its trigger button and the preview `Input` renders for its `image` kind.
 *
 * The part owns the hidden input's element reference and the keyboard activation of its trigger, because neither is observable outside this branch. Reading the file and validating it stays with `Input`, which is where the error state and the loading flag live.
 */
export type ImagePartProps = {
  /**
   * The id of the owning `Input`, used as the file input's id and to derive the two label ids the input's `aria-labelledby` references.
   */
  id: string;
  /**
   * The label shown beside the preview, and used as the preview image's alternative text.
   */
  label: string;
  /**
   * The current value. An `Image`-shaped object in practice; typed loosely because `Input`'s own `value` is the union across every kind and is narrowed by the branch that renders this part.
   * @default undefined
   */
  value?: unknown;
  /**
   * Whether the file is being read, which replaces the preview with a spinner. @default false
   */
  isLoading?: boolean;
  /**
   * Whether the input is disabled. @default false
   */
  disabled?: boolean;
  /**
   * If `locked`, a lock badge is shown and the preview keeps its right margin. @default false
   */
  locked?: boolean;
  /**
   * Whether to show the required badge. @default false
   */
  showRequired?: boolean;
  /**
   * Event handler triggered when a file is chosen.
   * @param event - The originating change event, whose target carries the selected file.
   */
  onChange?: (event: { currentTarget: HTMLInputElement }) => void;
};
