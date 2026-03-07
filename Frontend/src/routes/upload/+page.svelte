<script>
    import { enhance } from '$app/forms';
    
    let droppedVideo = $state(/** @type {File | null} */ (null)); // Svelte 5 state
    let droppedThumb = $state(/** @type {File | null} */ (null));

    /** @param {DragEvent} event */
    function handleVideoDrop(event) {
        event.preventDefault();
        const file = event.dataTransfer?.files[0];
        if (file?.type.startsWith('video/')) {
            droppedVideo = file;
        } else {
            alert("Please drop a video file!");
        }
    }

    /** @param {DragEvent} event */
    function handleThumbDrop(event) {
        event.preventDefault();
        const file = event.dataTransfer?.files[0];
        if (file?.type.startsWith('image/')) {
            droppedThumb = file;
        } else {
            alert("Please drop an image file!");
        }
    }
</script>

<!-- The use:enhance action handles the POST for you -->
<form 
  method="POST" 
  enctype="multipart/form-data" 
  class="flex flex-col  gap-4 p-10 rounded-3xl bg-white m-auto size-auto shadow-xl/30 w-[30%]"
  use:enhance={({ formData }) => {
    // Manually append dropped files to the form data before it sends
    if (droppedVideo) {
      formData.append('videoFile', droppedVideo);
    }
    if (droppedThumb) {
      formData.append('thumbFile', droppedThumb);
    }
  }}
  >
    <label for="title">Title:</label>
    <input type="text" name="title" class="rounded-full p-2">

    <label for="description">Description:</label>
    <textarea name="description" class="rounded-full resize-none p-5"></textarea>

    <div 
        role="button"
        tabindex="0"
        ondragover={(event) => {event.preventDefault()}}
        ondrop={handleThumbDrop}
        class="rounded-full p-5 border-slate-400 border-2 border-dashed"
    >
        {#if droppedThumb}
        <p>Ready to upload: {droppedThumb.name}</p>
        {:else}
        <p>Drag files here to upload Thumbnail</p>
        {/if}
    </div>


    <div 
        role="button"
        tabindex="0"
        ondragover={(event) => {event.preventDefault()}}
        ondrop={handleVideoDrop}
        class="rounded-full p-7 border-slate-400 border-2 border-dashed"
    >
        {#if droppedVideo}
        <p>Ready to upload: {droppedVideo.name}</p>
        {:else}
        <p>Drag files here to upload Video</p>
        {/if}
    </div>

    <button type="submit" class="rounded-full bg-cyan-300 hover:bg-cyan-400 p-1">Upload Video</button>
</form>
