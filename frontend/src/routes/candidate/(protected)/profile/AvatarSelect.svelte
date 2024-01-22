<script lang="ts">
  import Field from '$lib/components/common/form/Field.svelte';
  import Icon from '$lib/components/icon/Icon.svelte';
  import {onDestroy, onMount} from 'svelte';
  import {_} from 'svelte-i18n';
  import {constants} from '$lib/utils/constants';
  import {authContext} from '$lib/utils/authenticationStore';
  import {get} from 'svelte/store';
  import type {Photo} from '$lib/types/candidateAttributes';

  export let photo: Photo | undefined;
  $: photoUrl = photo ? constants.PUBLIC_BACKEND_URL + photo.formats.thumbnail.url : null;
  let imageHasChanged = false;

  const maxFileSize = 5 * 1024 * 1024; // 5 MB
  const token = get(authContext.token);

  let portraitInput: HTMLInputElement | null;
  let portraitLabel: HTMLLabelElement | null;
  let portraitImage: HTMLImageElement | null;

  const labelClass = 'w-6/12 label-sm label mx-6 my-2 text-secondary';

  // function for clicking the portrait input field with space
  const handlePortraitInput = (event: KeyboardEvent) => {
    if (event.code === 'Space') {
      event.preventDefault(); // Prevent default behavior (e.g., scrolling the page)
      portraitInput?.click();
    }
  };

  // add an event listener to the portrait label for keyboard navigation
  onMount(() => {
    portraitLabel?.addEventListener('keydown', handlePortraitInput);
  });

  // remove the event listener on unmount
  onDestroy(() => {
    portraitLabel?.removeEventListener('keydown', handlePortraitInput);
  });

  let image: File | undefined;

  // change the profile image, does not upload it to strapi
  const changePhoto = (e: Event) => {
    const target = e.target as HTMLInputElement;
    if (target.files) {
      const file = target.files[0];
      if (file && file.type.startsWith('image/') && file.size <= maxFileSize) {
        imageHasChanged = true;
        image = file;
        let reader = new FileReader();

        reader.onload = (e) => {
          if (portraitImage && e.target && e.target.result) {
            portraitImage.src = e.target.result.toString();
          }
        };
        reader.readAsDataURL(file);
      }
    }
  };

  // upload the current image file to strapi
  export const uploadPhoto = async () => {
    if (image && imageHasChanged) {
      const formData = new FormData();
      formData.append('files', image);

      const postResponse = await fetch(constants.PUBLIC_BACKEND_URL + '/api/upload/', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`
        },
        body: formData
      });

      // if photo is already defined and upload was succesful,
      // delete the old photo
      if (photo && postResponse.status === 200) {
        await fetch(constants.PUBLIC_BACKEND_URL + `/api/upload/files/${photo.id}`, {
          method: 'DELETE',
          headers: {
            Authorization: `Bearer ${token}`
          }
        });
      }
      const PostResJSON: Photo[] = await postResponse.json();
      photo = PostResJSON[0];
      imageHasChanged = false;
    }
  };
</script>

<Field customStyle="height: 60px; padding-right: 0;">
  <span class={labelClass}>
    {$_('candidateApp.basicInfo.fields.portrait')}
  </span>
  <!-- svelte-ignore a11y-no-noninteractive-tabindex -->
  <label
    bind:this={portraitLabel}
    id="portraitLabel"
    tabindex="0"
    for="portrait"
    class="cursor-pointer text-primary">
    {#if photo}
      <div class="flex h-60 w-60 items-center justify-center overflow-hidden">
        <img
          bind:this={portraitImage}
          src={photoUrl}
          class="h-full w-full rounded-r-lg object-cover"
          alt="profile_pic_preview" />
      </div>
    {:else}
      <div class="pr-8">
        {$_('candidateApp.basicInfo.tapToAddPhoto')}
        <Icon name="photo" />
      </div>
    {/if}
  </label>
  <input
    bind:this={portraitInput}
    on:change={changePhoto}
    accept="image/jpeg, image/png"
    type="file"
    id="portrait"
    placeholder="PLACEHOLDER"
    class="hidden" />
</Field>
