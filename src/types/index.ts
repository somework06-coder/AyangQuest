export interface Monster {
    id: number;
    question: string;
    answer: string;
    wrongAnswer?: string;
}

export interface Reward {
    type: 'text' | 'image';
    value: string;
}

export interface Game {
    id: string;
    creatorName: string;
    playerName: string;
    openingText: string;
    playerAvatar: string;
    creatorAvatar: string | null;
    characterType: 'female' | 'male';
    monsters: Monster[];
    reward: Reward;
    createdAt: number;
}

export type GameState = 'INIT' | 'INTRO' | 'BATTLE_1' | 'BATTLE_2' | 'BATTLE_3' | 'BATTLE_4' | 'BATTLE_5' | 'VICTORY' | 'GAME_OVER'
    | 'RUN_3'
    | 'RUN_4'
    | 'WIN';
