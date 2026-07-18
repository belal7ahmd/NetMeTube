<script>
	import { untrack } from "svelte";

    let { src, selectedResolution=420, class:className = '', videoclass= '', resolutionOptions=[1080, 720, 420, 360, 144] } = $props()

    // svelte-ignore state_referenced_locally
    let reactiveSrc = $derived(src + "?resolution=" + selectedResolution.toString())

    ///** @type {HTMLVideoElement} */
    let videoElement = $state()

    let duration = $state(0);
    let videoTime = $state(0)
    let pastVideoTime = $state(0)

    let paused = $state(true)

    $effect(() => {
        // make effect run when res changes
        selectedResolution; 

        untrack(() => {
            if (videoElement) {
                // Capture the time before the new src takes over
                pastVideoTime = videoTime;
                // Force the video to reload the new derivedSrc
                videoElement.load();
                //console.log(videoTime)
            }
        });
    })
</script>

<section class="{className} relative">
    <video bind:this={videoElement} 
        bind:currentTime={videoTime} 
        bind:paused={paused} 
        bind:duration={duration} 
        onloadedmetadata={(event) => {
            videoElement.currentTime = pastVideoTime
            console.log(pastVideoTime)
            }} 
        src={reactiveSrc} 
        class="{videoclass} w-full h-full relative"
    >
        <track kind="captions">
    </video>

    <button class="absolute inset-0 grid grid-cols-12 w-full h-full z-2 cursor-default p-3" onclick={() => {
        paused = !paused
        }} aria-label=" ">
        
        <input 
            type="range" 
            min="0" 
            max={duration || 100} 
            bind:value={videoTime} 
            class="col-span-12 w-full bg-transparent cursor-pointer z-10  row-start-10 row-end-10"
            onclick={(e) => e.stopPropagation()}
        />

        <select bind:value={selectedResolution} onclick={(e) => e.stopPropagation()} class="justify-evenly bg-teal-100 rounded-full p-1 items-center">
            {#each resolutionOptions.sort((a,b) => {return parseInt(a) - parseInt(b)}) as option}
                <option>{option}</option>
            {/each}
        </select>

    </button>

</section>
