<script lang="ts">
    import { onMount, tick } from 'svelte';
    import { recordGameStart } from '$lib/stats';
	import { Icon } from '$lib';

    const HIGH_SCORE_STORAGE_KEY = 'sidequest:color-match:highScore';

    const colors = [
        { name: 'RED', hex: '#EF4444' },
        { name: 'BLUE', hex: '#3B82F6' },
        { name: 'GREEN', hex: '#10B981' },
        { name: 'YELLOW', hex: '#FBBF24' },
        { name: 'PURPLE', hex: '#A855F7' },
        { name: 'ORANGE', hex: '#F97316' }
    ];

    type GameMode = 'name' | 'color';

    let currentColorName = $state('');
    let currentTextColor = $state('');
    let currentMode = $state<GameMode>('name');
    let score = $state(0);
    let highScore = $state(0);
    let timeLeft = $state(30);
    let gameState = $state<'ready' | 'playing' | 'ended'>('ready');
    let timerInterval: ReturnType<typeof setInterval> | undefined;
    let streak = $state(0);
    let feedback = $state('');
    let overlayPrimaryButton = $state<HTMLButtonElement | null>(null);

    let liveMessage = $derived(() => {
        if (gameState !== 'ended') return '';
        const isNewHigh = score === highScore && score > 0;
        return `Time's up. Final score ${score}.${isNewHigh ? ' New high score!' : ''}`;
    });

    $effect(() => {
        if (gameState !== 'ended') return;
        tick().then(() => overlayPrimaryButton?.focus());
    });

    function getRandomColor() {
        return colors[Math.floor(Math.random() * colors.length)];
    }

    function generateNewChallenge() {
        // Get two different colors to make it more challenging
        const colorName = getRandomColor();
        let textColor = getRandomColor();
        
        // Ensure text color is different from name (most of the time for difficulty)
        while (textColor.name === colorName.name && Math.random() > 0.3) {
            textColor = getRandomColor();
        }
        
        currentColorName = colorName.name;
        currentTextColor = textColor.hex;
        // Random mode each time
        currentMode = Math.random() > 0.5 ? 'name' : 'color';
    }

    function startGame() {
        recordGameStart('color-match');
        score = 0;
        timeLeft = 30;
        gameState = 'playing';
        streak = 0;
        feedback = '';
        generateNewChallenge();
        
        clearInterval(timerInterval);
        timerInterval = setInterval(() => {
            timeLeft--;
            if (timeLeft <= 0) {
                endGame();
            }
        }, 1000);
    }

    function endGame() {
        clearInterval(timerInterval);
        gameState = 'ended';
        if (score > highScore) {
            highScore = score;
            try {
                localStorage.setItem(HIGH_SCORE_STORAGE_KEY, String(highScore));
            } catch {

            }
        }
    }

    function handleAnswer(selectedColor: string) {
        if (gameState !== 'playing') return;

        let correct = false;
        if (currentMode === 'name') {
            correct = selectedColor === currentColorName;
        } else {
            const targetColor = colors.find(c => c.hex === currentTextColor);
            correct = selectedColor === targetColor?.name;
        }

        if (correct) {
            score++;
            streak++;
			feedback = streak >= 5 ? `${streak} Streak!` : '✓';
            setTimeout(() => feedback = '', 300);
        } else {
            streak = 0;
            feedback = '✗';
            setTimeout(() => feedback = '', 300);
        }

        generateNewChallenge();
    }

    function resetHighScore() {
        const confirmed = window.confirm('Reset Color Match high score?');
        if (!confirmed) return;

        highScore = 0;
        try {
            localStorage.removeItem(HIGH_SCORE_STORAGE_KEY);
        } catch {
            // Ignore storage failures (e.g., private mode / disabled storage)
        }
    }

    function resetGame() {
        if (gameState === 'playing') {
            const confirmed = window.confirm('Reset your current run?');
            if (!confirmed) return;
        }

        clearInterval(timerInterval);
        score = 0;
        timeLeft = 30;
        streak = 0;
        feedback = '';
        gameState = 'ready';
    }

    let formattedTime = $derived(`${String(Math.floor(timeLeft / 60)).padStart(2, '0')}:${String(timeLeft % 60).padStart(2, '0')}`);
    let instructionText = $derived(
        currentMode === 'name' 
            ? `What does the word say?`
            : `What color is the text?`
    );

    onMount(() => {
        try {
            const stored = localStorage.getItem(HIGH_SCORE_STORAGE_KEY);
            const parsed = stored ? Number.parseInt(stored, 10) : 0;
            if (Number.isFinite(parsed) && parsed > 0) {
                highScore = parsed;
            }
        } catch {
            // Ignore storage failures (e.g., private mode / disabled storage)
        }
        return () => clearInterval(timerInterval);
    });
</script>

<style>
    @keyframes fadeIn {
        from { opacity: 0; }
        to { opacity: 1; }
    }
    
    @keyframes pulse {
        0%, 100% { transform: scale(1); }
        50% { transform: scale(1.05); }
    }
    
    .animate-fadeIn {
        animation: fadeIn 0.3s ease-out;
    }
    
    .animate-pulse-custom {
        animation: pulse 0.3s ease-in-out;
    }
</style>

<div class="w-full min-h-screen bg-[var(--sq-bg)] text-[var(--sq-text)] flex flex-col items-center gap-8 relative py-8 px-4 sm:px-6">
	<div class="sr-only" aria-live="polite" role="status">{liveMessage}</div>
    <!-- Game Over Overlay -->
    {#if gameState === 'ended'}
        <div class="fixed inset-0 bg-black/50 flex justify-center items-center z-40 backdrop-blur-sm animate-fadeIn" role="dialog" aria-modal="true" aria-label="Game over">
            <div class="sq-card p-6 sm:p-10 text-center">
                
                <h2 class="text-4xl font-semibold text-[var(--sq-text)] mb-2">Time's Up!</h2>
                <p class="mb-2 text-5xl font-bold text-[var(--sq-accent)]">{score}</p>
                <p class="text-[var(--sq-muted)] mb-2">Final Score</p>
                {#if score === highScore && score > 0}
					<p class="text-[var(--sq-accent)] font-semibold mb-4 inline-flex items-center justify-center gap-2">
						<Icon name="trophy" class="w-5 h-5" />
						New High Score!
					</p>
                {/if}
                <button bind:this={overlayPrimaryButton} onclick={startGame} class="sq-btn sq-btn--primary px-8 py-3 text-base sm:text-lg">
                    Play Again
                </button>
            </div>
        </div>
    {/if}

    <header class="flex flex-col items-center gap-3">
        <div class="flex gap-3 justify-center items-center">
            <h1 class="text-4xl sm:text-5xl font-medium">Color Match</h1>
            <details class="relative">
                <summary
                    aria-label="How to play"
                    class="list-none w-7 h-7 bg-[var(--sq-surface)] text-[var(--sq-text)] font-semibold rounded-full flex justify-center items-center cursor-pointer shadow-md border border-[var(--sq-border)] select-none">
                    ?
                </summary>
                <div class="absolute top-full left-1/2 -translate-x-1/2 mt-3 w-80 max-w-[90vw] bg-[var(--sq-surface)] text-[var(--sq-text)] text-sm leading-relaxed rounded-xl shadow-xl border border-[var(--sq-border)] z-10">
                    <p class="p-4">Read the instruction carefully! Sometimes click the color NAME, sometimes click the text COLOR. Don't get confused!</p>
                </div>
            </details>
        </div>
    </header>

    <main class="w-full flex flex-col items-center gap-6">
        {#if gameState === 'ready'}
            <!-- Start Screen -->
            <div class="w-full max-w-2xl sq-card flex flex-col gap-6 p-6 sm:p-9 items-center">
                
                <h2 class="text-3xl font-semibold text-[var(--sq-text)] mb-2">Ready to Play?</h2>
                <p class="text-[var(--sq-muted)] text-center max-w-md">
                    You'll see a colored word. Sometimes you need to click the word itself, sometimes the color it's displayed in. Stay focused!
                </p>
                <div class="bg-[var(--sq-surface-2)] p-4 rounded-lg border border-[var(--sq-border)]">
                    <p class="text-sm text-[var(--sq-text)] mb-2"><strong>Example 1:</strong> "Click the word: RED" → Click RED button</p>
                    <p class="text-sm text-[var(--sq-text)]"><strong>Example 2:</strong> "Click the color: BLUE" → Click the button that matches the text color</p>
                </div>
                <button onclick={startGame} class="sq-btn sq-btn--primary px-10 py-4 text-lg sm:text-xl rounded-full">
                    Start Game
                </button>
                {#if highScore > 0}
                    <div class="flex flex-col items-center gap-2">
                        <p class="text-[var(--sq-muted)]">High Score: <span class="font-semibold text-[var(--sq-accent)]">{highScore}</span></p>
                        <button type="button" onclick={resetHighScore} class="sq-btn">
                            Reset High Score
                        </button>
                    </div>
                {/if}
            </div>
        {:else}
            <!-- Game Board -->
            <div class="w-full max-w-2xl sq-card flex flex-col gap-6 p-5 sm:p-8">
                <!-- Stats -->
                <div class="flex flex-wrap gap-x-6 gap-y-2 justify-between items-center">
                    <div class="text-lg font-medium text-[var(--sq-muted)]">
                        Score: <span class="text-[var(--sq-accent)] text-2xl">{score}</span>
                    </div>
                    <div class="text-lg font-medium text-[var(--sq-muted)]">
                        Time: <span class="text-[var(--sq-text)] {timeLeft <= 5 ? 'text-[var(--sq-accent)] animate-pulse' : ''}">{formattedTime}</span>
                    </div>
                    <div class="text-lg font-medium text-[var(--sq-muted)]">
                        Best: <span class="text-[var(--sq-text)]">{highScore}</span>
                    </div>
                </div>

                <!-- Instruction -->
                <div class="bg-[var(--sq-surface-2)] p-4 rounded-xl border border-[var(--sq-border)] text-center">
                    <p class="text-base sm:text-xl font-semibold text-[var(--sq-text)]">{instructionText}</p>
                </div>

                <!-- Color Display -->
                <div class="bg-[var(--sq-surface-2)] px-4 py-10 sm:p-12 rounded-xl flex justify-center items-center relative min-h-[160px] sm:min-h-[200px] border border-[var(--sq-border)]">
                    <p class="text-[clamp(2.75rem,11vw,6rem)] leading-none font-semibold transition-colors duration-200 text-center break-words" style="color: {currentTextColor}">
                        {currentColorName}
                    </p>
                    {#if feedback}
                        <div class="absolute inset-0 flex items-center justify-center">
                            <span class="text-[clamp(3.25rem,15vw,7rem)] leading-none {feedback.includes('✗') ? 'text-red-500' : 'text-green-500'} animate-pulse-custom">
                                {feedback}
                            </span>
                        </div>
                    {/if}
                </div>

                <!-- Color Buttons -->
                <div class="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4">
                    {#each colors as color}
                        <button
                            onclick={() => handleAnswer(color.name)}
                            class="py-4 sm:py-6 rounded-xl font-semibold text-base sm:text-xl text-white shadow-lg hover:scale-105 transition-transform cursor-pointer border-2 border-[var(--sq-card-border)] hover:border-[var(--sq-border)]"
                            style="background-color: {color.hex}">
                            {color.name}
                        </button>
                    {/each}
                </div>

                {#if streak >= 5}
                    <div class="text-center">
						<p class="text-2xl font-bold text-orange-500 animate-pulse inline-flex items-center justify-center gap-2">
							<Icon name="flame" class="w-6 h-6" />
							{streak} Streak!
							<Icon name="flame" class="w-6 h-6" />
						</p>
                    </div>
                {/if}

                <div class="flex flex-col sm:flex-row gap-3 justify-end">
                    <button type="button" onclick={resetGame} class="sq-btn w-full sm:w-auto">
                        Reset
                    </button>
                    {#if highScore > 0}
                        <button type="button" onclick={resetHighScore} class="sq-btn w-full sm:w-auto">
                            Reset Best
                        </button>
                    {/if}
                </div>
            </div>
        {/if}
    </main>
</div>
