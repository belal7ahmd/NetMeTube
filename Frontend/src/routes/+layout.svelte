<script>
	import './layout.css';
	import favicon from '$lib/assets/favicon.svg';

	let { children } = $props();
</script>

<header class="flex justify-evenly bg-cyan-500 rounded-full p-2 m-1 mb-7 items-center shadow-xl/30"> 
	<a href="/signup" class="bg-cyan-300 rounded-full p-2 hover:bg-cyan-400">Sign Up</a>
	<a href="/" class="text-2xl text-center">NetMeTube</a>
	<a href="/login" class="bg-cyan-300 rounded-full p-2 hover:bg-cyan-400">Login</a>
</header>

<svelte:head><link rel="icon" href={favicon} /></svelte:head>
{@render children()}
