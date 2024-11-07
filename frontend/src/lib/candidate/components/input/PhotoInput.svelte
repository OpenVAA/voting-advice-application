<script lang="ts">
  import { onDestroy, onMount } from 'svelte';
  import { updatePhoto, uploadFiles } from '$lib/api/candidate';
  import { Field } from '$lib/components/common/form';
  import { Icon } from '$lib/components/icon';
  import { t } from '$lib/i18n';
  import { constants } from '$lib/utils/constants';
  import { isAbsoluteUrl } from '$lib/utils/links';
  import type { Photo } from '$lib/types/candidateAttributes';

  export let disabled: boolean = false;
  export let photo: Photo | undefined;
  export let onChange: (() => void) | undefined = undefined;

  let photoUrl = photo
    ? new URL(
        isAbsoluteUrl(photo.formats.thumbnail.url)
          ? photo.formats.thumbnail.url
          : `${constants.PUBLIC_BACKEND_URL}${photo.formats.thumbnail.url}`
      )
    : undefined;
  let imageHasChanged = false;
  let image: File | undefined;

  export const maxFileSize = 5 * 1024 * 1024; // 5 MB

  let portraitInput: HTMLInputElement | null;
  let portraitLabel: HTMLLabelElement | null;
  let portraitImage: HTMLImageElement | null;

  const labelClass = 'w-6/12 label-sm label mx-6 my-2 text-secondary';

  // function for clicking the portrait input field with space
  function handlePortraitInput(event: KeyboardEvent) {
    if (event.code === 'Space') {
      event.preventDefault(); // Prevent default behavior (e.g., scrolling the page)
      portraitInput?.click();
    }
  }

  // add an event listener to the portrait label for keyboard navigation
  onMount(() => {
    portraitLabel?.addEventListener('keydown', handlePortraitInput);
  });

  // remove the event listener on unmount
  onDestroy(() => {
    portraitLabel?.removeEventListener('keydown', handlePortraitInput);
  });

  // change the profile image, does not upload it to strapi
  function changePhoto(e: Event) {
    const target = e.target as HTMLInputElement;
    if (target.files) {
      const file = target.files[0];
      if (file && file.type.startsWith('image/') && file.size <= maxFileSize) {
        imageHasChanged = true;
        image = file;
        let reader = new FileReader();
        onChange?.();

        reader.onload = (e) => {
          photoUrl = e.target?.result ? new URL(e.target?.result?.toString()) : undefined;
        };
        reader.readAsDataURL(file);
      }
    }
  }

  // upload the current image file to strapi
  export async function uploadPhoto() {
    if (image && imageHasChanged) {
      const res = await uploadFiles([image]);

      // TODO: Deleting file disabled, because at the moment it does not work with access control
      // if (photo && res?.status === 200) {
      //   await deleteFile(photo.id);
      // }
      const uploadedPhotos: Array<Photo> = await res?.json();
      const uploadedPhoto = uploadedPhotos[0];
      await updatePhoto(uploadedPhoto);
      photo = uploadedPhoto;
      imageHasChanged = false;
    }
  }
</script>

<!--
@component
A component for selecting and uploading png/jpeg images. On upload, deletes the
image defined in the `photo` object.

### Bindable variables

- `photo`: A photo object fetched fromn strapi. See `$lib/types/candidateAttributes.ts`.

### Bindable functions

- `uploadPhoto()`: A function that deletes the image defined in `photo` and uploads the new image.
  Also updates the `photo` object.

### Properties

- `maxFileSize`: An optional property to set the max accepted file size in bytes. Defaults to 5 MB.
- `disabled`: A boolean value that indicates if the component is disabled.
- `photoChanged`: A function for letting the parent component know that the photo has changed.

### Usage

```tsx
let uploadPhoto: () => Promise<void>;
  let photo: Photo = {
    ...
  }
  <PhotoInput bind:photo bind:uploadPhoto maxFileSize={5 * 1024 * 1024}/>
```
-->

<Field customStyle={disabled ? 'height: 60px; padding-right: 0.5rem;;' : 'height: 60px; padding-right: 0;'}>
  <span class={labelClass}>
    {$t('common.candidatePortrait')}
  </span>

  <div class="flex">
    {#if disabled}
      <Icon name="locked" class="-mx-2 my-auto flex-shrink-0 px-0 text-secondary" />
    {/if}

    <!-- svelte-ignore a11y-no-noninteractive-tabindex -->
    <label bind:this={portraitLabel} id="portraitLabel" tabindex="0" for="portrait" class="cursor-pointer text-primary">
      {#if photoUrl}
        <div class="flex h-60 w-60 items-center justify-center overflow-hidden">
          <img
            bind:this={portraitImage}
            src={photoUrl.href}
            class="h-full w-full rounded-r-lg object-cover"
            alt="profile_pic_preview" />
        </div>
      {:else if !disabled}
        <div class="pr-8">
          {$t('components.photoInput.tapToAddPhoto')}
          <Icon name="photo" />
        </div>
      {/if}
    </label>
  </div>
  <input
    {disabled}
    bind:this={portraitInput}
    on:change={changePhoto}
    accept="image/jpeg, image/png"
    type="file"
    id="portrait"
    class="hidden" />
</Field>
