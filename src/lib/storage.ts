import { Game } from '@/types';
import { supabase } from '@/lib/supabase';

// Helper to generate concise ID
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

// SAVE GAME TO SUPABASE
export async function saveGame(game: Game): Promise<boolean> {
    try {
        const { error } = await supabase
            .from('games')
            .upsert([{
                id: game.id,
                game_data: game
            }]);

        if (error) {
            console.error('Error saving game:', error);
            return false;
        }
        return true;
    } catch (e) {
        console.error('Exception saving game:', e);
        return false;
    }
}

// GET GAME FROM SUPABASE
export async function getGame(gameId: string): Promise<Game | null> {
    try {
        const { data, error } = await supabase
            .from('games')
            .select('game_data')
            .eq('id', gameId)
            .single();

        if (error || !data) {
            console.warn('Game not found or error:', error);
            return null;
        }

        return data.game_data as Game;
    } catch (e) {
        console.error('Exception fetching game:', e);
        return null;
    }
}

// Check answer locally (still valid as we have the game object in memory)
export function checkAnswer(game: Game, monsterIndex: number, answer: string): boolean {
    const monster = game.monsters[monsterIndex];
    if (!monster) return false;
    return monster.answer.toLowerCase().trim() === answer.toLowerCase().trim();
}
