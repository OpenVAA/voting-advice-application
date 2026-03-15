# Drawer

A modal dialog that looks like a drawer.

### Slots

- default: The content of the modal.

### Properties

- `title`: The title of the modal
- `isOpen`: A bindable property which is `true` when the drawer is open
- `showFloatingCloseButton`: Whether to show the floating close button. @default true
- Any valid properties of a `<ModalContainer>` component.

### Callbacks

- `onClose`: Callback for when the modal closes. Note that the modal may still be transitioning to `hidden`.
- `onOpen`: Callback for when the modal opens. Note that the modal may still be transitioning from `hidden`.

### Bindable functions

- `openModal`: Opens the modal
- `closeModal`: Closes the modal

### Accessibility

See the `<ModalContainer>` component documentation for more information.

### Usage

```tsx
<Drawer title="Drawer">
  <p>Drawer content</p>
</Drawer>
```

## Source

[frontend/src/lib/components/modal/drawer/Drawer.svelte](https://github.com/OpenVAA/voting-advice-application/blob/main/frontend/src/lib/components/modal/drawer/Drawer.svelte)

[frontend/src/lib/components/modal/drawer/Drawer.type.ts](https://github.com/OpenVAA/voting-advice-application/blob/main/frontend/src/lib/components/modal/drawer/Drawer.type.ts)
