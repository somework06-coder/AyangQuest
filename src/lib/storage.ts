import { Game } from '@/types';

const STORAGE_KEY = 'ayang_quest_games';

export function generateGameId(): string {
    return Math.random().toString(36).substring(2, 10) + Date.now().toString(36);
}

// Compress image by resizing if too large
export function compressImage(base64: string, maxWidth: number = 400): Promise<string> {
    return new Promise((resolve) => {
        // If not a base64 image, return as-is
        if (!base64.startsWith('data:image')) {
            resolve(base64);
            return;
        }

        const img = new Image();
        img.onload = () => {
            const canvas = document.createElement('canvas');
            let width = img.width;
            let height = img.height;

            // Only resize if larger than maxWidth
            if (width > maxWidth) {
                height = (height * maxWidth) / width;
                width = maxWidth;
            }

            canvas.width = width;
            canvas.height = height;

            const ctx = canvas.getContext('2d');
            ctx?.drawImage(img, 0, 0, width, height);

            // Convert to JPEG with 70% quality for smaller size
            const compressed = canvas.toDataURL('image/jpeg', 0.7);
            resolve(compressed);
        };
        img.onerror = () => resolve(base64);
        img.src = base64;
    });
}

export function saveGame(game: Game): void {
    if (typeof window === 'undefined') return;

    try {
        // Clear all old games first to prevent quota issues
        localStorage.removeItem(STORAGE_KEY);

        // Save only this game
        const games: Record<string, Game> = {};
        games[game.id] = game;
        localStorage.setItem(STORAGE_KEY, JSON.stringify(games));
    } catch (error) {
        console.error('Failed to save game:', error);
        // If still fails, try clearing everything and saving just the essentials
        try {
            localStorage.clear();
            const minimalGames: Record<string, Game> = {};
            minimalGames[game.id] = game;
            localStorage.setItem(STORAGE_KEY, JSON.stringify(minimalGames));
        } catch {
            alert('Gagal menyimpan game. Coba gunakan foto dengan ukuran lebih kecil.');
        }
    }
}

export function getGame(id: string): Game | null {
    if (typeof window === 'undefined') return null;

    const games = getAllGames();
    return games[id] || null;
}

export function getAllGames(): Record<string, Game> {
    if (typeof window === 'undefined') return {};

    try {
        const stored = localStorage.getItem(STORAGE_KEY);
        return stored ? JSON.parse(stored) : {};
    } catch {
        return {};
    }
}

export function normalizeAnswer(answer: string): string {
    return answer.toLowerCase().trim();
}

export function checkAnswer(userAnswer: string, correctAnswer: string): boolean {
    return normalizeAnswer(userAnswer) === normalizeAnswer(correctAnswer);
}
