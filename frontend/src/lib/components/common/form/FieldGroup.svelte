<div class="w-full">
  <slot name="header" field={undefined} />
  <div class="my-6 flex w-full flex-col gap-2 overflow-hidden rounded-lg">
    <slot />
  </div>
  <slot name="footer" field={undefined} />
</div>
