<script lang="ts">
	import { onMount } from "svelte";

    let displayedText:string = $state('');
    const fullText:string = 'SideQuest';
    let fullTextDisplay:boolean = $state(false);

    let showBanner:boolean = $state(false)
    let inactivityTimer: ReturnType<typeof setInterval> | undefined;

    function resetTimer() {
        showBanner = false;
        clearInterval(inactivityTimer);
        inactivityTimer = setTimeout(()=>{
            showBanner = true;
        }, 50000);
    }


    onMount(()=>{
        let i = 0;
        const interval = setInterval(() => {
            if (i < fullText.length) {
                displayedText += fullText[i];
                i++;
            }
        }, 80);

        resetTimer();

        window.addEventListener('click', resetTimer);
        window.addEventListener('keydown', resetTimer);
        return ()=>{
            clearInterval(interval);
            clearTimeout(inactivityTimer);
            window.removeEventListener('click', resetTimer);
            window.removeEventListener('keydown', resetTimer);
        }
    });
</script>


<div class="min-w-full min-h-screen bg-[var(--sq-bg)] text-[var(--sq-text)] flex flex-col justify-center items-center gap-18">
    {#if showBanner}
        <div class="fixed top-0 left-0 w-full  flex justify-center items-center">
            <div class="text-left bg-[var(--sq-surface)] shadow-xl z-50 p-4 border-b-4 border-[var(--sq-accent)] rounded-b-lg">
                <h2 class="text-xl font-semibold">Still there buddy?</h2>
                <p>Come on, press the button!</p>
            </div>
        </div>
    {/if}
    <h1 class="text-7xl md:text-8xl [font-family:var(--sq-font-display)] font-semibold tracking-tight leading-none">{displayedText}<span class="animate-pulse">|</span></h1>
    <a href="/games" class="text-2xl px-4 py-2 bg-[var(--sq-accent)] text-[var(--sq-on-accent)] rounded-lg font-semibold transition-transform duration-1000 hover:scale-105 hover:rounded-xl cursor-pointer animate-bounce hover:bg-[var(--sq-accent-2)]">Get Started</a>

    
</div>