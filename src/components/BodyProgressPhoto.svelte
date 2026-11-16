<script>
  import { onMount } from "svelte";
  import { getProgressPhotos } from "../lib/db/bodyProgressService.js";

  let { entryId } = $props();
  let photos = $state([]);
  let previewUrl = $state("");

  onMount(async () => {
    const records = await getProgressPhotos(entryId);
    photos = records.map((photo) => ({ ...photo, url: URL.createObjectURL(photo.blob) }));
    return () => photos.forEach((photo) => URL.revokeObjectURL(photo.url));
  });
</script>

{#if photos.length}
  <div class="photo-gallery" aria-label="Body progress photos">
    {#each photos as photo (photo.id)}
      <button class="photo-thumbnail" onclick={() => (previewUrl = photo.url)} aria-label="Enlarge body progress photo">
        <img src={photo.url} alt="Body progress check-in" />
        <span class="material-icons">zoom_in</span>
      </button>
    {/each}
  </div>
{/if}

{#if previewUrl}
  <div class="preview-backdrop" role="presentation" onclick={(event) => event.target === event.currentTarget && (previewUrl = "")}>
    <div class="preview" role="dialog" aria-modal="true" aria-label="Enlarged body progress photo" tabindex="-1">
      <button class="close-preview" onclick={() => (previewUrl = "")} aria-label="Close enlarged photo"
        ><span class="material-icons">close</span></button
      >
      <img src={previewUrl} alt="Enlarged body progress check-in" />
    </div>
  </div>
{/if}

<style>
  .photo-gallery {
    display: grid;
    grid-template-columns: repeat(auto-fit, 92px);
    justify-content: end;
    gap: var(--spacing-xs);
    max-width: 100%;
  }
  @media (max-width: 560px) {
    .photo-gallery {
      width: 100%;
      justify-content: start;
    }
  }
  .photo-thumbnail {
    position: relative;
    flex: 0 0 auto;
    padding: 0;
    overflow: hidden;
    border: 1px solid var(--border-color);
    border-radius: var(--radius-md);
    background: var(--bg-tertiary);
  }
  .photo-thumbnail img {
    display: block;
    width: 92px;
    height: 92px;
    object-fit: cover;
  }
  .photo-thumbnail .material-icons {
    position: absolute;
    right: 4px;
    bottom: 4px;
    padding: 3px;
    border-radius: 50%;
    background: rgba(0, 0, 0, 0.62);
    color: var(--text-primary);
    font-size: 1rem;
  }
  .preview-backdrop {
    position: fixed;
    inset: 0;
    z-index: 1200;
    display: grid;
    place-items: center;
    padding: var(--spacing-md);
    background: rgba(0, 0, 0, 0.82);
  }
  .preview {
    position: relative;
    display: grid;
    place-items: center;
    max-width: min(960px, 100%);
    max-height: 100%;
  }
  .preview img {
    display: block;
    max-width: 100%;
    max-height: calc(100vh - 2 * var(--spacing-lg));
    object-fit: contain;
    border-radius: var(--radius-md);
  }
  .close-preview {
    position: absolute;
    z-index: 1;
    top: var(--spacing-xs);
    right: var(--spacing-xs);
    width: 38px;
    height: 38px;
    padding: 0;
    border-radius: 50%;
    color: var(--text-primary);
    background: rgba(0, 0, 0, 0.72);
  }
</style>
