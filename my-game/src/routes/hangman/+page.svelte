<script lang="ts">
    import { onMount, tick } from 'svelte';
    import { recordGameStart } from '$lib/stats';
	import { Icon } from '$lib';

    const HIGH_SCORE_STORAGE_KEY = 'sidequest:hangman:highScore';

    const wordList = [
        'JAVASCRIPT', 'TYPESCRIPT', 'SVELTE', 'PYTHON', 'PROGRAMMING',
        'DEVELOPER', 'ALGORITHM', 'DATABASE', 'FUNCTION', 'VARIABLE',
        'COMPUTER', 'KEYBOARD', 'INTERNET', 'SOFTWARE', 'HARDWARE',
        'MOUNTAIN', 'ELEPHANT', 'GUITAR', 'CHOCOLATE', 'ADVENTURE',
        'SATELLITE', 'NOTEBOOK', 'BROWSER', 'SECURITY', 'DOCUMENT',
        'WORKFLOW', 'LANGUAGE', 'SOCKET', 'STORAGE', 'MONITOR'
    ];

    const categories = {
        'Programming': [
            'SVELTE', 'PYTHON', 'ALGORITHM', 'DATABASE', 'FUNCTION', 'VARIABLE',
            'COMPILER', 'DEBUGGER', 'RECURSION', 'ITERATION', 'OBJECT', 'MODULE',
            'PACKAGE', 'API', 'ASYNC', 'PROMISE', 'HOOKS', 'POINTER', 'BINARY',
            'ENCODING', 'PARSER', 'RUNTIME', 'COMPONENT', 'INTERFACE', 'GENERIC',
            'TYPESCRIPT', 'JAVASCRIPT', 'REFACTOR', 'FRAMEWORK', 'TOOLCHAIN'
        ],
        'Technology': [
            'COMPUTER', 'KEYBOARD', 'INTERNET', 'SOFTWARE', 'HARDWARE', 'DEVELOPER',
            'SERVER', 'NETWORK', 'CLOUD', 'FIREWALL', 'ROUTER', 'PROCESSOR',
            'STORAGE', 'SENSOR', 'MONITOR', 'CIRCUIT', 'MACHINE', 'DEVICE',
            'ROBOTICS', 'SATELLITE', 'BROWSER', 'SECURITY', 'TERMINAL', 'VIRTUAL',
            'BANDWIDTH', 'WIRELESS', 'BACKUP', 'ENCRYPTION'
        ],
        'General': [
            'MOUNTAIN', 'ELEPHANT', 'GUITAR', 'CHOCOLATE', 'ADVENTURE', 'FOREST',
            'RIVER', 'CAMERA', 'SUNLIGHT', 'JOURNEY', 'LIBRARY', 'MEMORY',
            'FESTIVAL', 'HEALTH', 'COURAGE', 'OCEAN', 'DESERT', 'VILLAGE',
            'TRADITION', 'SUNRISE', 'RAINBOW', 'HARMONY', 'PARKWAY', 'GARDEN',
            'HOSPITAL', 'NOTEBOOK', 'WORKFLOW', 'TREASURE'
        ]
    };

    let selectedWord = $state('');
    let guessedLetters = $state<string[]>([]);
    let wrongGuesses = $state(0);
    let maxWrongGuesses = 6;
    let gameState = $state<'playing' | 'won' | 'lost'>('playing');
    let currentCategory = $state('');
    let selectedCategory = $state<keyof typeof categories | 'Random'>('Random');
    let highScore = $state(0);
    let hintsUsed = $state(0);
    const maxHintsPerGame = 2;
    let overlayPrimaryButton = $state<HTMLButtonElement | null>(null);

    let liveMessage = $derived(() => {
        if (gameState === 'won') {
            return `You win. Word: ${selectedWord}. ${remainingGuesses} guesses remaining.`;
        }
        if (gameState === 'lost') {
            return `Game over. The word was ${selectedWord}.`;
        }
        return '';
    });

    $effect(() => {
        if (gameState !== 'won' && gameState !== 'lost') return;
        tick().then(() => overlayPrimaryButton?.focus());
    });

    const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');

    function startNewGame() {
        recordGameStart('hangman');
        if (selectedCategory === 'Random') {
            const allWords = Object.entries(categories);
            const [category, words] = allWords[Math.floor(Math.random() * allWords.length)];
            currentCategory = category;
            selectedWord = words[Math.floor(Math.random() * words.length)];
        } else {
            currentCategory = selectedCategory;
            const words = categories[selectedCategory];
            selectedWord = words[Math.floor(Math.random() * words.length)];
        }
        // Reveal one random letter to reduce early-game frustration.
        const uniqueLetters = Array.from(new Set(selectedWord.split('')));
        const revealed = uniqueLetters.length > 0 ? uniqueLetters[Math.floor(Math.random() * uniqueLetters.length)] : '';
        guessedLetters = revealed ? [revealed] : [];
        wrongGuesses = 0;
        hintsUsed = 0;
        gameState = 'playing';
    }

    function changeCategory(category: keyof typeof categories | 'Random') {
        selectedCategory = category;
        startNewGame();
    }

    function handleKeyPress(event: KeyboardEvent) {
        const letter = event.key.toUpperCase();
        if (alphabet.includes(letter)) {
            guessLetter(letter);
        }
    }

    function guessLetter(letter: string) {
        if (gameState !== 'playing' || guessedLetters.includes(letter)) return;

        const nextGuessedLetters = [...guessedLetters, letter];
        guessedLetters = nextGuessedLetters;

        if (!selectedWord.includes(letter)) {
            wrongGuesses++;
            if (wrongGuesses >= maxWrongGuesses) {
                gameState = 'lost';
            }
        } else {
            // Check if won
            const allLettersGuessed = selectedWord.split('').every((l) => nextGuessedLetters.includes(l));
            if (allLettersGuessed) {
                const finalRemaining = Math.max(0, maxWrongGuesses - wrongGuesses);
                if (finalRemaining > highScore) {
                    highScore = finalRemaining;
                    try {
                        localStorage.setItem(HIGH_SCORE_STORAGE_KEY, String(highScore));
                    } catch {
                        // Ignore storage failures (e.g., private mode / disabled storage)
                    }
                }
                gameState = 'won';
            }
        }
    }

    function useHint() {
        if (gameState !== 'playing') return;
        if (hintsUsed >= maxHintsPerGame) return;

        const unguessedUniqueLetters = Array.from(new Set(selectedWord.split(''))).filter(
            (l) => !guessedLetters.includes(l)
        );
        if (unguessedUniqueLetters.length === 0) return;

        const revealed = unguessedUniqueLetters[Math.floor(Math.random() * unguessedUniqueLetters.length)];
        const nextGuessedLetters = [...guessedLetters, revealed];
        guessedLetters = nextGuessedLetters;
        hintsUsed++;

        // Hint reveals a letter and does not count as a wrong guess.

        const allLettersGuessed = selectedWord.split('').every((l) => nextGuessedLetters.includes(l));
        if (allLettersGuessed) {
            const finalRemaining = Math.max(0, maxWrongGuesses - wrongGuesses);
            if (finalRemaining > highScore) {
                highScore = finalRemaining;
                try {
                    localStorage.setItem(HIGH_SCORE_STORAGE_KEY, String(highScore));
                } catch {
                    // Ignore storage failures (e.g., private mode / disabled storage)
                }
            }
            gameState = 'won';
        }
    }

    function resetHighScore() {
        const confirmed = window.confirm('Reset Hangman high score?');
        if (!confirmed) return;

        highScore = 0;
        try {
            localStorage.removeItem(HIGH_SCORE_STORAGE_KEY);
        } catch {
            // Ignore storage failures (e.g., private mode / disabled storage)
        }
    }

    let displayWord = $derived(
        selectedWord.split('').map(letter => 
            guessedLetters.includes(letter) ? letter : '_'
        ).join(' ')
    );

    let remainingGuesses = $derived(maxWrongGuesses - wrongGuesses);
    let hintsLeft = $derived(Math.max(0, maxHintsPerGame - hintsUsed));

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
        startNewGame();
        window.addEventListener('keydown', handleKeyPress);
        return () => window.removeEventListener('keydown', handleKeyPress);
    });
</script>

<style>
    @keyframes fadeIn {
        from { opacity: 0; }
        to { opacity: 1; }
    }
    
    .animate-fadeIn {
        animation: fadeIn 0.3s ease-out;
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
                <h2 class="text-4xl font-semibold text-[var(--sq-text)] mb-2">You Win!</h2>
                <p class="text-[var(--sq-text)] mb-2 text-2xl font-semibold">{selectedWord}</p>
                <p class="text-[var(--sq-muted)] mb-6">You guessed it with {remainingGuesses} {remainingGuesses === 1 ? 'guess' : 'guesses'} left!</p>
                {#if highScore > 0}
                    <p class="text-[var(--sq-muted)] mb-6">Best: <span class="font-semibold text-[var(--sq-text)]">{highScore}</span> remaining</p>
                {/if}
                <button bind:this={overlayPrimaryButton} onclick={startNewGame} class="bg-[var(--sq-accent)] text-[var(--sq-on-accent)] px-8 py-3 rounded-full font-semibold hover:bg-[var(--sq-accent-2)] transition-colors shadow-lg cursor-pointer">
                    Play Again
                </button>
            </div>
        </div>
    {/if}

    {#if gameState === 'lost'}
        <div class="fixed inset-0 bg-black/50 flex justify-center items-center z-40 backdrop-blur-sm animate-fadeIn" role="dialog" aria-modal="true" aria-label="Game over">
            <div class="bg-[var(--sq-surface)] p-10 rounded-3xl shadow-2xl text-center border-2 border-[var(--sq-border)]">
				<div class="mb-4 flex justify-center" aria-hidden="true">
					<Icon name="x-circle" class="w-14 h-14 text-[var(--sq-danger)]" />
				</div>
                <h2 class="text-4xl font-semibold text-[var(--sq-text)] mb-2">Game Over!</h2>
                <p class="text-[var(--sq-muted)] mb-2">The word was:</p>
                <p class="text-2xl font-semibold text-[var(--sq-text)] mb-6">{selectedWord}</p>
                <button bind:this={overlayPrimaryButton} onclick={startNewGame} class="bg-[var(--sq-accent)] text-[var(--sq-on-accent)] px-8 py-3 rounded-full font-semibold hover:bg-[var(--sq-accent-2)] transition-colors shadow-lg cursor-pointer">
                    Try Again
                </button>
            </div>
        </div>
    {/if}

    <header class="flex flex-col items-center gap-3">
        <div class="flex gap-3 justify-center items-center">
            <h1 class="text-4xl sm:text-5xl font-medium">Hangman</h1>
            <div class="relative group">
                <span class="w-6 h-6 bg-[var(--sq-surface)] text-[var(--sq-text)] font-semibold rounded-full flex justify-center items-center cursor-pointer shadow-md border border-[var(--sq-border)] transition-transform group-hover:scale-110">?</span>
                <div class="pointer-events-none absolute top-full left-1/2 -translate-x-1/2 mt-3 w-64 bg-[var(--sq-surface)] text-[var(--sq-text)] text-sm leading-relaxed rounded-xl shadow-xl border border-[var(--sq-border)] opacity-0 translate-y-2 group-hover:opacity-100 group-hover:translate-y-0 transition-all z-10">
                    <p class="p-4">Guess the hidden word by selecting letters. You have 6 wrong guesses before you lose!</p>
                </div>
            </div>
        </div>
    </header>

    <main class="w-full flex flex-col items-center gap-6">
		<div class="flex flex-wrap justify-center gap-2 bg-[var(--sq-surface)] p-2 rounded-xl shadow-lg border border-[var(--sq-border)]">
			<button type="button" onclick={() => changeCategory('Random')} class="{selectedCategory === 'Random' ? 'sq-btn sq-btn--primary' : 'sq-btn'}">
				Random
			</button>
			<button type="button" onclick={() => changeCategory('Programming')} class="{selectedCategory === 'Programming' ? 'sq-btn sq-btn--primary' : 'sq-btn'}">
				Programming
			</button>
			<button type="button" onclick={() => changeCategory('Technology')} class="{selectedCategory === 'Technology' ? 'sq-btn sq-btn--primary' : 'sq-btn'}">
				Technology
			</button>
			<button type="button" onclick={() => changeCategory('General')} class="{selectedCategory === 'General' ? 'sq-btn sq-btn--primary' : 'sq-btn'}">
				General
			</button>
		</div>
        <!-- Game Board -->
		<div class="w-full max-w-2xl sq-card flex flex-col gap-6 p-5 sm:p-8">
            <!-- Hangman Drawing -->
            <div class="flex justify-center">
                <div class="relative w-48 h-64 border-2 border-[var(--sq-border)] rounded-lg bg-[var(--sq-surface-2)]">
                    <svg viewBox="0 0 200 250" class="w-full h-full">
                        <!-- Gallows -->
                        <line x1="20" y1="230" x2="180" y2="230" stroke="#8B4513" stroke-width="4"/>
                        <line x1="50" y1="230" x2="50" y2="20" stroke="#8B4513" stroke-width="4"/>
                        <line x1="50" y1="20" x2="130" y2="20" stroke="#8B4513" stroke-width="4"/>
                        <line x1="130" y1="20" x2="130" y2="50" stroke="#8B4513" stroke-width="4"/>
                        
                        <!-- Head -->
                        {#if wrongGuesses >= 1}
                            <circle cx="130" cy="70" r="20" stroke="black" stroke-width="3" fill="none"/>
                        {/if}
                        
                        <!-- Body -->
                        {#if wrongGuesses >= 2}
                            <line x1="130" y1="90" x2="130" y2="150" stroke="black" stroke-width="3"/>
                        {/if}
                        
                        <!-- Left Arm -->
                        {#if wrongGuesses >= 3}
                            <line x1="130" y1="110" x2="100" y2="130" stroke="black" stroke-width="3"/>
                        {/if}
                        
                        <!-- Right Arm -->
                        {#if wrongGuesses >= 4}
                            <line x1="130" y1="110" x2="160" y2="130" stroke="black" stroke-width="3"/>
                        {/if}
                        
                        <!-- Left Leg -->
                        {#if wrongGuesses >= 5}
                            <line x1="130" y1="150" x2="110" y2="190" stroke="black" stroke-width="3"/>
                        {/if}
                        
                        <!-- Right Leg -->
                        {#if wrongGuesses >= 6}
                            <line x1="130" y1="150" x2="150" y2="190" stroke="black" stroke-width="3"/>
                        {/if}
                    </svg>
                </div>
            </div>

            <!-- Status -->
            <div class="flex flex-wrap gap-x-6 gap-y-2 justify-between items-center">
                <div class="text-lg font-medium text-[var(--sq-muted)]">
                    Wrong: <span class="text-[var(--sq-accent)]">{wrongGuesses} / {maxWrongGuesses}</span>
                </div>
                <div class="text-lg font-medium text-[var(--sq-muted)]">
                    Remaining: <span class="text-[var(--sq-text)]">{remainingGuesses}</span>
                </div>
                <div class="text-lg font-medium text-[var(--sq-muted)]">
                    Hints: <span class="text-[var(--sq-text)]">{hintsLeft}</span>
                </div>
                <div class="text-lg font-medium text-[var(--sq-muted)]">
                    Best: <span class="text-[var(--sq-text)]">{highScore}</span>
                </div>
            </div>

            <!-- Word Display -->
            <div class="text-center py-8 bg-[var(--sq-surface-2)] rounded-xl border border-[var(--sq-border)]">
                <p class="text-5xl font-semibold tracking-widest text-[var(--sq-text)] mb-4">
                    {displayWord}
                </p>
                <p class="text-sm text-[var(--sq-muted-2)] italic">Type any letter on your keyboard to guess</p>
            </div>

            <!-- Reset Button -->
			<div class="w-full flex flex-col sm:flex-row gap-3">
				<button type="button" onclick={startNewGame} class="sq-btn sq-btn--primary w-full sm:flex-1">
					Reset
				</button>
				<button
					type="button"
					onclick={useHint}
					disabled={gameState !== 'playing' || hintsLeft <= 0}
					class="sq-btn w-full sm:w-auto {hintsLeft <= 0 || gameState !== 'playing' ? 'opacity-60 cursor-not-allowed' : ''}">
					Hint
				</button>
				{#if highScore > 0}
					<button type="button" onclick={resetHighScore} class="sq-btn w-full sm:w-auto">
						Reset Best
					</button>
				{/if}
			</div>
        </div>
    </main>
</div>
