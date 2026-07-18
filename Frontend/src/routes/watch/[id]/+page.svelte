<script>
	import { page } from "$app/state";
	import VideoPlayer from "./VideoPlayer.svelte";

    let { data } = $props()

</script>

<div class="grid grid-cols-1 lg:grid-cols-12 gap-6 p-4">

    <VideoPlayer src="/api/stream/{page.params.id}" class="lg:col-span-8 bg-black rounded-lg aspect-video shadow-xl/70" videoclass="rounded-lg" selectedResolution={data.resolutions[0]} resolutionOptions={data.resolutions}></VideoPlayer>

    <section class="lg:col-span-4">
        <details class="bg-white/5 p-4 rounded-lg cursor-pointer group ">
            <summary class="list-none text-2xl font-bold flex justify-between items-center text-shadow-[0_4px_4px_rgba(0,0,0,0.3),_0_10px_20px_rgba(0,0,0,0.2)]">
                {data.title}
                <span class="text-sm text-gray-400 group-open:rotate-180 transition-transform">▼</span>
            </summary>
            <div class="mt-4 text-gray-500 whitespace-pre-wrap border-t border-white/10 pt-4 text-shadow-[0_4px_4px_rgba(0,0,0,0.3),_0_10px_20px_rgba(0,0,0,0.2)]" >
                {data.description}
            </div>

            </details>
        <div class="mt-8 opacity-50 text-sm italic">
            Comments will live here later...
        </div>      
    </section>


    <aside class="lg:col-span-4 space-y-4 ">
        <div class="h-20 bg-white/5 rounded">Recommended Video 1</div>
        <div class="h-20 bg-white/5 rounded">Recommended Video 2</div>
    </aside>

</div>