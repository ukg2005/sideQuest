<script lang="ts">
    import { onMount, tick } from 'svelte';
    import { recordGameStart } from '$lib/stats';
	import { Icon } from '$lib';

    const BEST_TIME_STORAGE_PREFIX = 'sidequest:perfect-8:bestTimeLeft:';

    type Difficulty = 'easy' | 'medium' | 'hard' | 'impossible';
    
    const difficultySettings = {
        easy: { time: 30, tiles: 8 },
        medium: { time: 20, tiles: 8 },
        hard: { time: 20, tiles: 10 },
        impossible: { time: 15, tiles: 10 }
    };

    let selectedDifficulty = $state<Difficulty>('easy');
    let gameStarted = $state(false);
    let timeLeft = $state(30);
    let timerInterval: ReturnType<typeof setInterval> | undefined;
    let gameState = $state<'playing' | 'won' | 'lost' | null>(null);
    let showConfetti = $state(false);
    let overlayPrimaryButton = $state<HTMLButtonElement | null>(null);

    let liveMessage = $derived(() => {
        if (gameState === 'won') return `You win. Perfect-8 complete with ${dice.length} dice.`;
        if (gameState === 'lost') return `Time's up. Perfect-8 over.`;
        return '';
    });

    $effect(() => {
        if (gameState !== 'won' && gameState !== 'lost') return;
        tick().then(() => overlayPrimaryButton?.focus());
    });

    let bestTimeLeftByDifficulty = $state<Record<Difficulty, number>>({
        easy: 0,
        medium: 0,
        hard: 0,
        impossible: 0
    });

    let dice = $state(Array.from({length: 8}, (_, i) => ({
        id: i,
        value: Math.floor(Math.random() * 6) + 1,
        locked: false
    })));

    function toggleLock(index: number) {
        if (gameState !== 'playing') return;
        dice[index].locked = !dice[index].locked;
    }

    function startTimer() {
        clearInterval(timerInterval);
        timeLeft = difficultySettings[selectedDifficulty].time;
        timerInterval = setInterval(() => {
            timeLeft--;
            if (timeLeft <= 0) {
                endGame('lost');
            }
        }, 1000);
    }
    
    function setDifficulty(difficulty: Difficulty) {
        if (gameStarted) return;
        selectedDifficulty = difficulty;
        const settings = difficultySettings[difficulty];
        dice = Array.from({length: settings.tiles}, (_, i) => ({
            id: i,
            value: Math.floor(Math.random() * 6) + 1,
            locked: false
        }));
        timeLeft = settings.time;
    }

    function checkWin() {
        const firstValue = dice[0].value;
        const allMatch = dice.every(die => die.value === firstValue);
        if (allMatch && gameState === 'playing') {
            endGame('won');
        }
    }

    function endGame(result: 'won' | 'lost') {
        clearInterval(timerInterval);
        gameState = result;
        if (result === 'won') {
            const finalTimeLeft = Math.max(0, timeLeft);
            if (finalTimeLeft > bestTimeLeftByDifficulty[selectedDifficulty]) {
                bestTimeLeftByDifficulty = {
                    ...bestTimeLeftByDifficulty,
                    [selectedDifficulty]: finalTimeLeft
                };
                try {
                    localStorage.setItem(`${BEST_TIME_STORAGE_PREFIX}${selectedDifficulty}`, String(finalTimeLeft));
                } catch {
                    // Ignore storage failures (e.g., private mode / disabled storage)
                }
            }
            showConfetti = true;
            setTimeout(() => showConfetti = false, 4000);
        }
    }

    function resetBestForDifficulty() {
        const confirmed = window.confirm(`Reset Perfect-8 best time for ${selectedDifficulty}?`);
        if (!confirmed) return;

        bestTimeLeftByDifficulty = {
            ...bestTimeLeftByDifficulty,
            [selectedDifficulty]: 0
        };
        try {
            localStorage.removeItem(`${BEST_TIME_STORAGE_PREFIX}${selectedDifficulty}`);
        } catch {
            // Ignore storage failures (e.g., private mode / disabled storage)
        }
    }

    function rollDice() {
        if (gameState === 'won' || gameState === 'lost') return;
        
        dice = dice.map(die => {
            if (die.locked) {
                return die;
            }

            return {
                ...die,
                value: Math.floor(Math.random() * 6) + 1
            };
        });
        
        if (!gameStarted) {
            recordGameStart('perfect-8');
            gameStarted = true;
            gameState = 'playing';
            startTimer();
        }
        
        setTimeout(checkWin, 100);
    }

    function resetGame() {
        clearInterval(timerInterval);
        const settings = difficultySettings[selectedDifficulty];
        dice = Array.from({length: settings.tiles}, (_, i) => ({
            id: i,
            value: Math.floor(Math.random() * 6) + 1,
            locked: false
        }));
        gameStarted = false;
        gameState = null;
        timeLeft = settings.time;
        showConfetti = false;
    }

    let lockedCount = $derived(dice.filter(d => d.locked).length);
    let formattedTime = $derived(`${String(Math.floor(timeLeft / 60)).padStart(2, '0')}:${String(timeLeft % 60).padStart(2, '0')}`);
    let bestTimeLeft = $derived(bestTimeLeftByDifficulty[selectedDifficulty] ?? 0);
    let formattedBestTime = $derived(bestTimeLeft > 0 ? `${String(Math.floor(bestTimeLeft / 60)).padStart(2, '0')}:${String(bestTimeLeft % 60).padStart(2, '0')}` : '--:--');

    onMount(() => {
        try {
            const difficulties: Difficulty[] = ['easy', 'medium', 'hard', 'impossible'];
            const loaded: Record<Difficulty, number> = { easy: 0, medium: 0, hard: 0, impossible: 0 };
            for (const difficulty of difficulties) {
                const stored = localStorage.getItem(`${BEST_TIME_STORAGE_PREFIX}${difficulty}`);
                const parsed = stored ? Number.parseInt(stored, 10) : 0;
                if (Number.isFinite(parsed) && parsed > 0) {
                    loaded[difficulty] = parsed;
                }
            }
            bestTimeLeftByDifficulty = loaded;
        } catch {
            // Ignore storage failures (e.g., private mode / disabled storage)
        }
        return () => clearInterval(timerInterval);
    });
</script>

<style>
    @keyframes fall {
        to {
            transform: translateY(100vh) rotate(360deg);
        }
    }
    
    @keyframes fadeIn {
        from {
            opacity: 0;
        }
        to {
            opacity: 1;
        }
    }
    
    @keyframes shake {
        0%, 100% { transform: translateX(0); }
        10%, 30%, 50%, 70%, 90% { transform: translateX(-10px); }
        20%, 40%, 60%, 80% { transform: translateX(10px); }
    }
    
    .animate-fadeIn {
        animation: fadeIn 0.3s ease-out;
    }
    
    .animate-shake {
        animation: shake 0.5s ease-in-out;
    }
</style>


<div class="w-full min-h-screen bg-[var(--sq-bg)] text-[var(--sq-text)] flex flex-col items-center gap-8 relative overflow-hidden px-4 sm:px-6 py-8">
    <div class="sr-only" aria-live="polite" role="status">{liveMessage}</div>

    <!-- Win/Loss Overlay -->
    {#if gameState === 'won'}
        <div class="fixed inset-0 bg-black/50 flex justify-center items-center z-40 backdrop-blur-sm animate-fadeIn" role="dialog" aria-modal="true" aria-label="You win">
            <div class="bg-[var(--sq-surface)] p-10 rounded-3xl shadow-2xl text-center border-2 border-[var(--sq-border)]">
				<div class="mb-4 flex justify-center" aria-hidden="true">
					<Icon name="sparkles" class="w-14 h-14 text-[var(--sq-accent)]" />
				</div>
                <h2 class="text-4xl font-bold text-[var(--sq-text)] mb-2">Perfect!</h2>
                <p class="text-[var(--sq-muted)] mb-6">You matched all {dice.length} dice in time!</p>
                <button bind:this={overlayPrimaryButton} onclick={resetGame} class="bg-[var(--sq-accent)] text-[var(--sq-on-accent)] px-8 py-3 rounded-full font-bold hover:bg-[var(--sq-accent-2)] transition-colors shadow-lg cursor-pointer">
                    Play Again
                </button>
            </div>
        </div>
    {/if}

    {#if gameState === 'lost'}
        <div class="fixed inset-0 bg-black/50 flex justify-center items-center z-40 backdrop-blur-sm animate-fadeIn" role="dialog" aria-modal="true" aria-label="Game over">
            <div class="bg-[var(--sq-surface)] p-10 rounded-3xl shadow-2xl text-center animate-shake border-2 border-[var(--sq-border)]">
				<div class="mb-4 flex justify-center" aria-hidden="true">
					<Icon name="clock" class="w-14 h-14 text-[var(--sq-danger)]" />
				</div>
                <h2 class="text-4xl font-bold text-[var(--sq-text)] mb-2">Time's Up!</h2>
                <p class="text-[var(--sq-muted)] mb-6">You didn't match all the dice in time.</p>
                <button bind:this={overlayPrimaryButton} onclick={resetGame} class="bg-[var(--sq-accent)] text-[var(--sq-on-accent)] px-8 py-3 rounded-full font-bold hover:bg-[var(--sq-accent-2)] transition-colors">
                    Try Again
                </button>
            </div>
        </div>
    {/if}

    <header class="flex flex-col items-center gap-4">
        <div class="flex gap-3 justify-center">
            <h1 class="text-4xl sm:text-5xl font-semibold">Perfect-8</h1>
            <details class="relative">
                <summary
                    aria-label="How to play"
                    class="list-none w-7 h-7 bg-[var(--sq-surface)] text-[var(--sq-text)] font-semibold rounded-full flex justify-center items-center cursor-pointer shadow-md border border-[var(--sq-border)] select-none">
                    ?
                </summary>
                <div class="absolute top-full left-1/2 -translate-x-1/2 mt-3 w-64 max-w-[90vw] bg-[var(--sq-surface)] text-[var(--sq-text)] text-sm leading-relaxed rounded-xl shadow-xl border border-[var(--sq-border)] z-10">
                    <p class="p-4">Lock any dice showing the number you want, then roll until all match before the timer hits zero.</p>
                </div>
            </details>
        </div>
        
    </header>
    <main class="w-full flex flex-col items-center gap-4">
        <!-- Difficulty Selector -->
        {#if !gameStarted}
            <div class="flex flex-col items-center gap-3">
                <div class="flex flex-wrap justify-center gap-2 bg-[var(--sq-surface)] p-2 rounded-xl shadow-lg border border-[var(--sq-border)]">
					<button type="button" onclick={() => setDifficulty('easy')} class="{selectedDifficulty === 'easy' ? 'sq-btn sq-btn--primary' : 'sq-btn'}">Easy</button>
					<button type="button" onclick={() => setDifficulty('medium')} class="{selectedDifficulty === 'medium' ? 'sq-btn sq-btn--primary' : 'sq-btn'}">Medium</button>
					<button type="button" onclick={() => setDifficulty('hard')} class="{selectedDifficulty === 'hard' ? 'sq-btn sq-btn--primary' : 'sq-btn'}">Hard</button>
					<button type="button" onclick={() => setDifficulty('impossible')} class="{selectedDifficulty === 'impossible' ? 'sq-btn sq-btn--primary' : 'sq-btn'}">Impossible</button>
                </div>
                <div class="flex items-center gap-4">
                    <p class="text-sm font-medium text-[var(--sq-muted)]">Best: <span class="text-[var(--sq-text)]">{formattedBestTime}</span></p>
                    {#if bestTimeLeft > 0}
                        <button
                            type="button"
                            onclick={resetBestForDifficulty}
                            class="sq-btn">
                            Reset Best
                        </button>
                    {/if}
                </div>
            </div>
        {/if}
        
         <!-- game board -->
		  <div class="w-full max-w-md bg-[var(--sq-surface)] rounded-2xl shadow-2xl overflow-hidden border border-[var(--sq-card-border)] flex flex-col gap-6 justify-center items-center p-6">
            <!-- header row: timer / title -->
			<div class="w-full flex flex-wrap gap-x-6 gap-y-2 justify-between items-center">
                <div class="text-sm text-[var(--sq-muted)]">Time: <span class="font-semibold {timeLeft <= 5 && gameState === 'playing' ? 'text-[var(--sq-accent)] animate-pulse' : 'text-[var(--sq-text)]'}">{formattedTime}</span></div>
                <div class="text-sm text-[var(--sq-muted)]">Locked: <span class="font-semibold text-[var(--sq-text)]">{lockedCount}</span></div>
                <div class="text-sm text-[var(--sq-muted)]">Best: <span class="font-semibold text-[var(--sq-text)]">{formattedBestTime}</span></div>
            </div>

            <div class="flex flex-col gap-3">
                {#if dice.length === 8}
                    <section class="flex gap-3">
                        {#each dice.slice(0, 4) as die, i}
                            <button 
                                onclick={() => toggleLock(i)}
                                class="relative bg-[var(--sq-surface)] text-[var(--sq-text)] w-14 h-14 md:w-16 md:h-16 flex justify-center items-center cursor-pointer rounded-lg shadow-md border-2 transition-all text-xl
                                {die.locked ? 'border-[var(--sq-accent)] bg-[var(--sq-surface-2)]' : 'border-transparent hover:border-[var(--sq-accent)]'}">
                                {die.value}
                            </button>
                        {/each}
                    </section>
                    
                    <section class="flex gap-3">
                        {#each dice.slice(4, 8) as die, i}
                            <button 
                                onclick={() => toggleLock(i + 4)}
                                class="relative bg-[var(--sq-surface)] text-[var(--sq-text)] w-14 h-14 md:w-16 md:h-16 flex justify-center items-center cursor-pointer rounded-lg shadow-md border-2 transition-all text-xl
                                {die.locked ? 'border-[var(--sq-accent)] bg-[var(--sq-surface-2)]' : 'border-transparent hover:border-[var(--sq-accent)]'}">
                                {die.value}
                            </button>
                        {/each}
                    </section>
                {:else}
                    <section class="flex gap-3">
                        {#each dice.slice(0, 5) as die, i}
                            <button 
                                onclick={() => toggleLock(i)}
                                class="relative bg-[var(--sq-surface)] text-[var(--sq-text)] w-14 h-14 md:w-16 md:h-16 flex justify-center items-center cursor-pointer rounded-lg shadow-md border-2 transition-all text-xl
                                {die.locked ? 'border-[var(--sq-accent)] bg-[var(--sq-surface-2)]' : 'border-transparent hover:border-[var(--sq-accent)]'}">
                                {die.value}
                            </button>
                        {/each}
                    </section>
                    
                    <section class="flex gap-3">
                        {#each dice.slice(5, 10) as die, i}
                            <button 
                                onclick={() => toggleLock(i + 5)}
                                class="relative bg-[var(--sq-surface)] text-[var(--sq-text)] w-14 h-14 md:w-16 md:h-16 flex justify-center items-center cursor-pointer rounded-lg shadow-md border-2 transition-all text-xl
                                {die.locked ? 'border-[var(--sq-accent)] bg-[var(--sq-surface-2)]' : 'border-transparent hover:border-[var(--sq-accent)]'}">
                                {die.value}
                            </button>
                        {/each}
                    </section>
                {/if}
            </div>

            <!-- controls -->
            <div class="w-full flex justify-center gap-3">
                <button type="button" onclick={rollDice} class="sq-btn sq-btn--primary px-6 py-3">{#if !gameStarted}
                    Start
                {:else}
                    Roll
                {/if}</button>
				<button type="button" onclick={resetGame} aria-label="Reset game" class="sq-btn" title="Reset">
                    <svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px" fill="currentColor"><path d="M480-80q-75 0-140.5-28.5t-114-77q-48.5-48.5-77-114T120-440h80q0 117 81.5 198.5T480-160q117 0 198.5-81.5T760-440q0-117-81.5-198.5T480-720h-6l62 62-56 58-160-160 160-160 56 58-62 62h6q75 0 140.5 28.5t114 77q48.5 48.5 77 114T840-440q0 75-28.5 140.5t-77 114q-48.5 48.5-114 77T480-80Z"/></svg>
                </button>
            </div>
         </div>
    </main>
</div>