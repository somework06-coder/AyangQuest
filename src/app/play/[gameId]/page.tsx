'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import NextImage from 'next/image';
import { useParams } from 'next/navigation';
import { Game, GameState } from '@/types';
import { getGame, checkAnswer } from '@/lib/storage';
import html2canvas from 'html2canvas';

export default function PlayPage() {
    const params = useParams();
    const gameId = params.gameId as string;

    const [game, setGame] = useState<Game | null>(null);
    const [loading, setLoading] = useState(true);
    const [gameState, setGameState] = useState<GameState>('INIT');
    const [currentMonster, setCurrentMonster] = useState(0);
    const [userAnswer, setUserAnswer] = useState('');
    const [isWrong, setIsWrong] = useState(false);
    const [showMonsterDefeat, setShowMonsterDefeat] = useState(false);
    const [showVS, setShowVS] = useState(false);
    const [showSlash, setShowSlash] = useState(false);
    const [showGreeting, setShowGreeting] = useState(false);
    const [currentOptions, setCurrentOptions] = useState<string[]>([]);
    const [wrongAnswersCount, setWrongAnswersCount] = useState(0);
    const [showMonsterAttack, setShowMonsterAttack] = useState(false);
    const [showGameOver, setShowGameOver] = useState(false);
    const [attemptCount, setAttemptCount] = useState(1);
    const [showQrisModal, setShowQrisModal] = useState(false);

    // Audio System
    const [isMuted, setIsMuted] = useState(false);
    const bgmRef = useRef<HTMLAudioElement | null>(null);
    const slashRef = useRef<HTMLAudioElement | null>(null);
    const wrongRef = useRef<HTMLAudioElement | null>(null);
    const victoryRef = useRef<HTMLAudioElement | null>(null);

    // ANALYTICS: Track Game Played
    useEffect(() => {
        if (gameId) {
            import('@/lib/analytics').then(({ trackGamePlayed }) => {
                trackGamePlayed(gameId);
            });
        }
    }, [gameId]);

    // ANALYTICS: Track Game Completion
    useEffect(() => {
        if (gameState === 'VICTORY') {
            import('@/lib/analytics').then(({ trackGameCompleted }) => {
                trackGameCompleted(gameId, true, attemptCount);
            });
        } else if (showGameOver && gameState.startsWith('BATTLE')) {
            import('@/lib/analytics').then(({ trackGameCompleted }) => {
                trackGameCompleted(gameId, false, attemptCount);
            });
        }
    }, [gameState, showGameOver, gameId, attemptCount]);

    const handleRestart = () => {
        setGameState('INTRO');
        setCurrentMonster(0);
        setWrongAnswersCount(0);
        setUserAnswer('');
        setIsWrong(false);
        setShowMonsterDefeat(false);
        setShowSlash(false);
        setShowGameOver(false);
        setShowMonsterAttack(false);
        setAttemptCount(prev => prev + 1); // Increment attempt count on restart
        // Reset audio
        if (bgmRef.current) {
            bgmRef.current.currentTime = 0;
            bgmRef.current.play().catch(() => { });
        }
    };

    useEffect(() => {
        // Initialize Audio
        bgmRef.current = new Audio('/sounds/bgm.mp3');
        bgmRef.current.loop = true;
        bgmRef.current.volume = 0.3; // Low volume for BGM

        slashRef.current = new Audio('/sounds/slash.mp3');
        slashRef.current.volume = 0.8;

        wrongRef.current = new Audio('/sounds/wrong.mp3');
        wrongRef.current.volume = 0.8;

        victoryRef.current = new Audio('/sounds/victory.mp3');
        victoryRef.current.volume = 0.8;

        // Cleanup to prevent memory leaks and stopping audio on unmount
        return () => {
            if (bgmRef.current) { bgmRef.current.pause(); bgmRef.current = null; }
            if (slashRef.current) { slashRef.current.pause(); slashRef.current = null; }
            if (wrongRef.current) { wrongRef.current.pause(); wrongRef.current = null; }
            if (victoryRef.current) { victoryRef.current.pause(); victoryRef.current = null; }
        };
    }, []);

    const playSound = (audio: HTMLAudioElement | null) => {
        if (audio && !isMuted) {
            audio.currentTime = 0;
            const playPromise = audio.play();
            if (playPromise !== undefined) {
                playPromise.catch(error => {
                    console.error("Audio playback failed:", error);
                });
            }
        } else {
            console.log("Audio not played: Muted or Null");
        }
    };

    const toggleMute = () => {
        setIsMuted(prev => {
            const next = !prev;
            if (bgmRef.current) bgmRef.current.muted = next;
            if (slashRef.current) slashRef.current.muted = next;
            if (wrongRef.current) wrongRef.current.muted = next;
            if (victoryRef.current) victoryRef.current.muted = next;
            return next;
        });
    };

    const handleShare = async () => {
        const card = document.getElementById('victory-card');
        if (!card) return;

        try {
            const canvas = await html2canvas(card, {
                scale: 2,
                backgroundColor: '#0a0a0a', // Force dark background for dark mode card
                logging: false,
                useCORS: true
            });

            canvas.toBlob(async (blob) => {
                if (!blob) return;

                const file = new File([blob], 'victory-card.png', { type: 'image/png' });

                if (navigator.canShare && navigator.canShare({ files: [file] })) {
                    try {
                        await navigator.share({
                            files: [file],
                            title: 'AyangQuest Victory!',
                            text: `Aku berhasil menyelesaikan tantangan dari ${game?.creatorName || 'ayang'}! 🏆`,
                        });
                    } catch (err) {
                        console.error('Share failed:', err);
                    }
                } else {
                    // Fallback: Download image
                    const link = document.createElement('a');
                    link.download = 'victory-card.png';
                    link.href = canvas.toDataURL();
                    link.click();
                }
            });
        } catch (err) {
            console.error('Screenshot failed:', err);
        }
    };

    const shuffle = (array: string[]) => {
        return [...array].sort(() => Math.random() - 0.5);
    };

    // Monster sprites and names
    const monsterSprites = [
        '/sprites/dragon.png',
        '/sprites/ghost.png',
        '/sprites/wolf.png',
        '/sprites/skull.png',
        '/sprites/finalboss.png',
    ];
    const monsterNames = ['Naga Api', 'Mantan', 'Serigala Malam', 'Banaspati', 'Mpruy'];
    const monsterGreetings = [
        'Halo Maniezz! 👋',
        'Eh kamu... apa kabar? 🥺',
        'Aing Maung! 🐯',
        'Sudah malam... atau ah sudahlah 🌑',
        'Eh you nonton bigmo juga? #izin',
    ];

    // Background per stage: bg1 for monster 1-2, bg2 for monster 3-4, bg3 for final boss
    const getBackground = (monsterIndex: number) => {
        if (monsterIndex <= 1) return '/sprites/bg1.jpg';
        if (monsterIndex <= 3) return '/sprites/bg2.jpg';
        return '/sprites/bg3.jpg';
    };

    // Character sprites based on selection (fallback to female for legacy games)
    const knightSprite = game?.characterType === 'male' ? '/sprites/Knight-boy.png' : '/sprites/knight.png';
    const knightRunSprite = game?.characterType === 'male' ? '/sprites/Knight-boy-run.png' : '/sprites/knight-run.png';

    useEffect(() => {
        const loadGame = async () => {
            const loadedGame = await getGame(gameId);
            if (loadedGame) {
                setGame(loadedGame);
                setGameState('INTRO');
            } else {
                console.error('Game not found');
            }
            setLoading(false);
        };
        loadGame();
    }, [gameId]);

    // Handle Victory Music
    useEffect(() => {
        if (gameState === 'WIN') {
            if (bgmRef.current) {
                bgmRef.current.pause();
                bgmRef.current.currentTime = 0;
            }
            playSound(victoryRef.current);
        }
    }, [gameState, isMuted]);

    const startGame = () => {
        console.log("Starting Game...");
        setGameState('BATTLE_1');
        setCurrentMonster(0);
        setShowMonsterAttack(false); // Fix: Reset attack state on start

        // Start BGM
        if (bgmRef.current) {
            console.log("Attempting to play BGM...");
            if (!isMuted) {
                bgmRef.current.play()
                    .then(() => console.log("BGM playing successfully"))
                    .catch(e => console.error("BGM autoplay prevented:", e));
            } else {
                console.log("BGM is muted");
            }
        } else {
            console.error("BGM Ref is null!");
        }

        // Generate options if present
        if (game?.monsters[0].wrongAnswer) {
            setCurrentOptions(shuffle([game.monsters[0].answer, game.monsters[0].wrongAnswer]));
        }

        // Show VS animation briefly, then Greeting
        setShowVS(true);
        setShowGreeting(true);
        setTimeout(() => setShowVS(false), 1500); // VS lasts 1.5s
        setTimeout(() => setShowGreeting(false), 4000); // Greeting lasts 2.5s after VS
    };

    const submitAnswer = (option?: string) => {
        const answer = option || userAnswer;
        if (!answer.trim()) return;

        if (checkAnswer(game!, currentMonster, answer)) {
            // Correct Answer
            setIsWrong(false);
            playSound(slashRef.current);

            // 1. Show Slash Animation
            setShowSlash(true);

            // 2. Then show defeat after slash finishes (400ms)
            setTimeout(() => {
                setShowSlash(false);
                setShowMonsterDefeat(true);

                // 3. Move to next stage
                setTimeout(() => {
                    setShowMonsterDefeat(false);

                    if (currentMonster < 4) {
                        setGameState(`RUN_${currentMonster + 1}` as GameState);
                    } else {
                        setGameState('WIN');
                    }
                }, 1500);
            }, 400);
        } else {
            setIsWrong(true);
            setWrongAnswersCount(prev => prev + 1);
            playSound(wrongRef.current);
            setShowMonsterAttack(true);

            // Trigger Game Over after a short delay for the attack animation
            setTimeout(() => {
                setShowGameOver(true);
            }, 500);
        }
    };

    const advanceFromRun = useCallback(() => {
        setUserAnswer('');
        setCurrentMonster(prev => {
            const next = prev + 1;
            if (game?.monsters[next]?.wrongAnswer) {
                setCurrentOptions(shuffle([game.monsters[next].answer, game.monsters[next].wrongAnswer]));
            }
            return next;
        });

        // Show greeting for next monster
        setShowGreeting(true);
        setTimeout(() => setShowGreeting(false), 2500);

        setGameState(`BATTLE_${currentMonster + 2}` as GameState);
    }, [currentMonster, game]);

    useEffect(() => {
        if (gameState.startsWith('RUN_')) {
            const timer = setTimeout(advanceFromRun, 3500);
            return () => clearTimeout(timer);
        }
    }, [gameState, advanceFromRun]);

    if (loading) {
        return (
            <div className="min-h-screen bg-gradient-to-b from-pink-400 to-purple-600 flex items-center justify-center">
                <div className="text-white text-2xl animate-pulse">Loading...</div>
            </div>
        );
    }

    if (!game) {
        return (
            <div className="min-h-screen bg-gradient-to-b from-pink-400 to-purple-600 flex items-center justify-center p-4">
                <div className="bg-white/10 backdrop-blur-lg rounded-3xl p-8 text-center max-w-md">
                    <div className="text-6xl mb-4">😢</div>
                    <h1 className="text-2xl font-bold text-white mb-4">Game Tidak Ditemukan</h1>
                    <p className="text-pink-200 mb-6">Link game ini tidak valid atau sudah tidak ada.</p>
                    <a
                        href="/create"
                        className="inline-block bg-gradient-to-r from-pink-500 to-rose-500 text-white px-8 py-3 rounded-xl font-bold hover:shadow-lg transition-all"
                    >
                        Buat Game Baru
                    </a>
                </div>
            </div>
        );
    }

    // INTRO Scene - Super Mario Style
    if (gameState === 'INTRO') {
        return (
            <div className="h-dvh bg-gray-900 flex items-center justify-center overflow-hidden">
                {/* Mute Button */}
                <button
                    onClick={toggleMute}
                    className="absolute top-4 right-4 z-[60] bg-black/50 p-3 rounded-full text-xl text-white backdrop-blur-sm border border-white/20 hover:bg-black/70 transition-all active:scale-95"
                >
                    {isMuted ? '🔇' : '🔊'}
                </button>

                {/* Mobile Container */}
                <div className="w-full max-w-md h-full relative overflow-hidden shadow-2xl flex flex-col pb-safe">
                    {/* Parallax Background */}
                    <div
                        className="absolute inset-0 bg-cover bg-bottom"
                        style={{ backgroundImage: `url('${getBackground(currentMonster)}')` }}
                    />

                    {/* Ground */}
                    <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-green-800 to-green-600 border-t-4 border-green-400" />
                    <div className="absolute bottom-0 left-0 right-0 h-8 bg-gradient-to-r from-amber-700 via-amber-600 to-amber-700" style={{
                        backgroundImage: 'repeating-linear-gradient(90deg, #92400e 0px, #92400e 40px, #78350f 40px, #78350f 80px)'
                    }} />

                    {/* Content */}
                    <div className="relative z-10 h-full flex items-center justify-center p-4">
                        <div className="bg-black/60 backdrop-blur-sm rounded-3xl p-6 text-center max-w-sm border-4 border-yellow-400 shadow-2xl">
                            {/* Knight Character */}
                            <div className="relative w-28 h-28 mx-auto mb-4">
                                <NextImage
                                    src={knightSprite}
                                    alt="Knight"
                                    width={112}
                                    height={112}
                                    className="w-full h-full object-contain animate-bounce-soft pixelated -scale-x-100"
                                />
                            </div>

                            {/* Player Avatar */}
                            <div className="relative w-24 h-24 mx-auto mb-4">
                                <NextImage
                                    src={game.playerAvatar}
                                    alt={game.playerName}
                                    width={96}
                                    height={96}
                                    className="w-full h-full object-cover rounded-full border-4 border-yellow-400 shadow-lg"
                                />
                            </div>

                            <h1 className="text-2xl font-bold text-yellow-300 mb-2 drop-shadow-lg">
                                Hai, {game.playerName}!
                            </h1>
                            <p className="text-white mb-6 whitespace-pre-line text-base">{game.openingText}</p>

                            <button
                                onClick={startGame}
                                className="bg-gradient-to-b from-yellow-400 to-yellow-600 text-black px-8 py-3 rounded-xl font-bold text-lg shadow-lg border-4 border-yellow-300 hover:from-yellow-300 hover:to-yellow-500 transition-all animate-pulse hover:animate-none active:scale-95"
                            >
                                ▶ MULAI PETUALANGAN
                            </button>

                            {game.creatorName && (
                                <div className="mt-8 flex justify-center">
                                    <div className="bg-gradient-to-r from-pink-900/80 to-purple-900/80 backdrop-blur-md px-6 py-2 rounded-2xl border-2 border-pink-400/30 shadow-xl flex items-center gap-3 transform hover:scale-105 transition-all duration-300">
                                        <span className="text-2xl animate-bounce">💌</span>
                                        <div className="text-left">
                                            <p className="text-pink-300 text-xs font-bold uppercase tracking-wider">Petuah dari:</p>
                                            <p className="text-white font-bold text-lg">{game.creatorName} 💕</p>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    // BATTLE Scene - Mobile Layout
    if (gameState.startsWith('BATTLE_')) {
        return (
            <div className={`h-dvh bg-gray-900 flex items-center justify-center overflow-hidden transition-colors duration-100 ${showMonsterAttack ? 'bg-red-900' : ''}`}>

                {/* Screen Flash on Attack */}
                {showMonsterAttack && (
                    <div className="absolute inset-0 z-50 bg-red-600/30 animate-pulse pointer-events-none"></div>
                )}

                {/* Mute Button */}
                <button
                    onClick={toggleMute}
                    className="absolute top-4 right-4 z-[60] bg-black/50 p-3 rounded-full text-xl text-white backdrop-blur-sm border border-white/20 hover:bg-black/70 transition-all active:scale-95"
                >
                    {isMuted ? '🔇' : '🔊'}
                </button>

                {/* Mobile Container */}
                <div className={`w-full max-w-md h-full flex flex-col relative overflow-hidden shadow-2xl pb-safe ${showMonsterAttack ? 'animate-shake' : ''}`}>
                    {/* ===== TOP SECTION: Animation Area ===== */}
                    <div className="flex-1 relative">
                        {/* Background - positioned at bottom so ground shows */}
                        <div className="absolute inset-0 z-0">
                            <NextImage
                                src={getBackground(currentMonster)}
                                alt="Background"
                                fill
                                className="object-cover object-bottom"
                                priority
                            />
                        </div>

                        {/* Ground */}
                        <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-green-800 to-green-600 border-t-4 border-green-400" />

                        {/* Stage Progress - Top */}
                        <div className="absolute top-8 left-0 right-0 z-20 px-4">
                            <div className="flex justify-center gap-2">
                                {[0, 1, 2, 3, 4].map((i) => (
                                    <div
                                        key={i}
                                        className={`w-8 h-8 rounded-full border-2 border-yellow-400 flex items-center justify-center text-sm font-bold transition-all ${i < currentMonster
                                            ? 'bg-green-500 text-white'
                                            : i === currentMonster
                                                ? 'bg-yellow-500 text-black animate-pulse'
                                                : 'bg-black/50 text-white/50'
                                            }`}
                                    >
                                        {i < currentMonster ? '✓' : i + 1}
                                    </div>
                                ))}
                            </div>
                            {/* Monster Name - Cool Display */}
                            <div className="mt-3 text-center">
                                <div className="inline-block bg-gradient-to-r from-red-600 via-red-500 to-red-600 px-6 py-2 rounded-xl border-2 border-red-400 shadow-lg">
                                    <span className="text-white font-bold text-lg drop-shadow-lg" style={{ textShadow: '2px 2px 4px rgba(0,0,0,0.5)' }}>
                                        👹 {monsterNames[currentMonster]}
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* VS Animation - Shows only at start */}
                        {showVS && (
                            <div className="absolute inset-0 z-30 flex items-center justify-center">
                                <div className="text-6xl sm:text-8xl font-bold text-red-500 drop-shadow-lg animate-vs-appear" style={{ textShadow: '0 0 30px rgba(255,0,0,0.8), 0 0 60px rgba(255,100,100,0.6)' }}>
                                    VS
                                </div>
                            </div>
                        )}

                        {/* Battle Arena - Characters on Ground */}
                        <div className="absolute bottom-8 left-0 right-0 z-10">
                            <div className="flex items-end justify-center gap-8 px-4">
                                {/* Player Knight - on ground */}
                                <div className={`relative ${showMonsterAttack ? 'grayscale brightness-50' : ''} transition-all duration-200`}>
                                    <NextImage
                                        src={knightSprite}
                                        alt="Knight"
                                        width={144}
                                        height={144}
                                        className="w-28 h-28 sm:w-36 sm:h-36 object-contain pixelated animate-bounce-soft -scale-x-100"
                                    />
                                    {/* Player Face */}
                                    <div className="absolute -top-10 left-1/2 -translate-x-1/2 w-16 h-16 rounded-full overflow-hidden border-4 border-yellow-400 shadow-lg bg-gray-200">
                                        <img src={game.playerAvatar} alt="" className="w-full h-full object-cover" />
                                    </div>

                                    {/* Error Feedback - Floating above Knight */}
                                    {isWrong && (
                                        <div className="absolute -top-24 left-1/2 -translate-x-1/2 z-30 animate-fade-in w-48">
                                            <div className="bg-red-500 text-white p-2 rounded-xl shadow-xl border-4 border-red-700 relative text-center">
                                                <p className="font-bold text-xs sm:text-sm">
                                                    {game.monsters[currentMonster].wrongAnswer ? 'Aduh! Serangan Meleset!' : 'Salah! Kamu Diserang!'}
                                                </p>
                                                {/* Tooltip arrow */}
                                                <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-0 h-0 border-l-[8px] border-l-transparent border-r-[8px] border-r-transparent border-t-[8px] border-t-red-700"></div>
                                            </div>
                                        </div>
                                    )}

                                    {/* Game Over Modal was here - Moved to root of Battle Scene */}
                                </div>

                                {/* Monster - on ground with question bubble */}
                                <div className={`relative ${showMonsterAttack ? 'scale-125 z-50' : ''} transition-transform duration-200`}>
                                    {/* Question or Greeting Bubble - Above Monster */}
                                    {!showMonsterDefeat && !showVS && (
                                        <div className="absolute -top-20 left-1/2 -translate-x-1/2 w-44 sm:w-56 animate-fade-in z-20">
                                            <div className={`${showGreeting ? 'bg-white border-gray-300' : 'bg-gradient-to-b from-yellow-300 to-yellow-400 border-yellow-500'} rounded-2xl p-3 shadow-xl relative border-4 transition-colors duration-300`}>
                                                <p className={`text-sm sm:text-base font-bold text-center ${showGreeting ? 'text-gray-800 italic' : 'text-gray-900'}`}>
                                                    {showGreeting ? monsterGreetings[currentMonster] : game.monsters[currentMonster].question}
                                                </p>
                                                {/* Speech bubble pointer pointing to monster */}
                                                <div className={`absolute -bottom-3 left-1/2 -translate-x-1/2 w-0 h-0 border-l-[10px] border-l-transparent border-r-[10px] border-r-transparent border-t-[10px] ${showGreeting ? 'border-t-white' : 'border-t-yellow-400'}`}></div>
                                            </div>
                                        </div>
                                    )}



                                    {/* Monster sprite */}
                                    {/* Victory Message */}
                                    {showMonsterDefeat && (
                                        <div className="absolute -top-24 left-1/2 -translate-x-1/2 bg-green-500 text-white px-4 py-2 rounded-xl shadow-xl animate-fade-in z-20 whitespace-nowrap">
                                            <p className="text-sm sm:text-base font-bold text-center">✨ KALAH! ✨</p>
                                        </div>
                                    )}

                                    {/* Monster sprite */}
                                    <div className={`transition-all duration-500 ${showMonsterDefeat ? 'animate-monster-defeat' : 'animate-monster-idle'}`}>
                                        <NextImage
                                            src={monsterSprites[currentMonster]}
                                            alt={monsterNames[currentMonster]}
                                            width={144}
                                            height={144}
                                            className={`w-28 h-28 sm:w-36 sm:h-36 object-contain pixelated ${currentMonster === 4 ? '-scale-x-100' : ''}`}
                                        />
                                    </div>

                                    {/* Sword Slash Effect */}
                                    {showSlash && (
                                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 z-40 pointer-events-none">
                                            <img
                                                src="/sprites/sword-slash.png"
                                                alt="Slash"
                                                className="w-full h-full object-contain animate-slash"
                                            />
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* ===== BOTTOM SECTION: Answer Input ===== */}
                    <div className="bg-gray-900 border-t-4 border-yellow-500 p-4 pb-safe mb-8 lg:mb-20">
                        <div className="max-w-md mx-auto space-y-3">
                            {/* Instruction */}
                            <p className="text-yellow-400 text-center font-bold text-sm">
                                {game.monsters[currentMonster].wrongAnswer
                                    ? '⚔️ Pilih jawaban yang bener ya ayang, untuk melawan monsternya!'
                                    : '⚔️ Ketikkan jawaban ayang untuk melawan monster!'}
                            </p>

                            {/* Error Message */}
                            {/* Error Message Removed from here */}

                            {/* Input or Buttons - Always rendered but hidden during Greeting to prevent layout shift */}
                            <div className={`transition-all duration-300 ${showGreeting ? 'opacity-0 pointer-events-none' : 'opacity-100 pointer-events-auto'}`}>
                                {game.monsters[currentMonster].wrongAnswer ? (
                                    <div className="grid grid-cols-2 gap-4 animate-fade-in">
                                        {currentOptions.map((option, idx) => (
                                            <button
                                                key={idx}
                                                onClick={() => submitAnswer(option)}
                                                className="bg-gradient-to-br from-amber-500 to-orange-600 border-b-4 border-amber-800 hover:border-b-2 hover:translate-y-[2px] text-white p-3 rounded-xl font-bold text-base sm:text-lg transition-all shadow-lg min-h-[60px] flex items-center justify-center text-center leading-tight active:border-b-0 active:translate-y-[4px]"
                                            >
                                                {option}
                                            </button>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="flex gap-3">
                                        <input
                                            type="text"
                                            value={userAnswer}
                                            onChange={(e) => setUserAnswer(e.target.value)}
                                            onKeyPress={(e) => e.key === 'Enter' && submitAnswer()}
                                            className={`flex-1 bg-gray-800 border-2 rounded-xl px-4 py-4 text-white font-bold placeholder-gray-500 focus:outline-none transition-all text-lg ${isWrong
                                                ? 'border-red-500 animate-shake'
                                                : 'border-gray-600 focus:border-yellow-500'
                                                }`}
                                            placeholder="Ketik jawabanmu..."
                                            autoFocus={!showGreeting}
                                        />
                                        <button
                                            onClick={() => submitAnswer()}
                                            className="bg-gradient-to-b from-red-500 to-red-700 text-white px-6 py-4 rounded-xl font-bold text-lg border-2 border-red-400 shadow-lg active:scale-95 transition-all"
                                        >
                                            ⚔️
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Game Over Modal - Placed outside of shaking container to avoid transform issues */}
                {showGameOver && (
                    <div className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
                        <div className="bg-white rounded-3xl p-6 w-full max-w-sm text-center border-4 border-red-500 shadow-2xl relative overflow-hidden animate-bounce-soft">
                            <div className="text-6xl mb-4 animate-pulse">😢</div>
                            <h2 className="text-2xl font-black text-gray-900 mb-2">YAH... GAME OVER</h2>
                            <p className="text-gray-700 font-bold text-lg mb-6">
                                Kayaknya kamu kurang sayang deh...
                            </p>
                            <button
                                onClick={handleRestart}
                                className="w-full bg-red-500 hover:bg-red-600 text-white font-bold py-3 px-6 rounded-xl shadow-lg border-b-4 border-red-700 active:border-b-0 active:translate-y-1 transition-all flex items-center justify-center gap-2"
                            >
                                <span>🔄</span> Ulangi Game
                            </button>
                        </div>
                    </div>
                )}
            </div>
        );
    }

    // RUN Scene - Super Mario Style Side-Scroller
    if (gameState.startsWith('RUN_')) {
        const runMessages = [
            'Hebat, pelan-pelan ayang larinya... 🏃💨',
            'Sabar ya ayang, monster berikutnya lagi dandan 💅',
            'Duh, ayang makin jago nih! 😍',
            'Hati-hati ayang, Boss terakhir galak! 😱',
        ];

        // Use next monster's background for transition effect
        const nextBackground = getBackground(currentMonster + 1);

        return (
            <div className="h-dvh bg-gray-900 flex items-center justify-center overflow-hidden">
                {/* Mute Button */}
                <button
                    onClick={toggleMute}
                    className="absolute top-4 right-4 z-[60] bg-black/50 p-3 rounded-full text-xl text-white backdrop-blur-sm border border-white/20 hover:bg-black/70 transition-all active:scale-95"
                >
                    {isMuted ? '🔇' : '🔊'}
                </button>

                {/* Mobile Container */}
                <div className="w-full max-w-md h-full flex flex-col relative overflow-hidden shadow-2xl pb-safe">
                    {/* ===== TOP SECTION: Animation Area ===== */}
                    <div className="flex-1 relative">
                        {/* Background - use next monster's background with scroll animation */}
                        <div
                            className="absolute inset-0 bg-cover bg-bottom animate-bg-scroll"
                            style={{ backgroundImage: `url('${nextBackground}')`, backgroundRepeat: 'repeat-x' }}
                        />

                        {/* Ground */}
                        <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-green-800 to-green-600 border-t-4 border-green-400" />

                        {/* Stage Progress - Top */}
                        <div className="absolute top-8 left-0 right-0 z-20 px-4">
                            <div className="flex justify-center gap-2">
                                {[0, 1, 2, 3, 4].map((i) => (
                                    <div
                                        key={i}
                                        className={`w-8 h-8 rounded-full border-2 border-yellow-400 flex items-center justify-center text-sm font-bold transition-all ${i <= currentMonster
                                            ? 'bg-green-500 text-white'
                                            : 'bg-black/50 text-white/50'
                                            }`}
                                    >
                                        {i <= currentMonster ? '✓' : i + 1}
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Battle Arena - Knight running */}
                        <div className="absolute bottom-4 left-0 right-0 z-10">
                            <div className="flex items-end justify-center px-4">
                                {/* Player Knight - running */}
                                <div className="relative">
                                    <img
                                        src={knightRunSprite}
                                        alt="Knight Running"
                                        className="w-36 h-36 sm:w-44 sm:h-44 object-contain pixelated animate-run-character -scale-x-100"
                                    />
                                    {/* Player Face */}
                                    <div className="absolute -top-10 left-1/2 -translate-x-1/2 w-16 h-16 rounded-full overflow-hidden border-4 border-yellow-400 shadow-lg bg-gray-200">
                                        <img src={game.playerAvatar} alt="" className="w-full h-full object-cover" />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* ===== BOTTOM SECTION: Running Message ===== */}
                    <div className="bg-gray-900 border-t-4 border-yellow-500 p-4 pb-safe mb-8 lg:mb-20">
                        <div className="max-w-md mx-auto">
                            <div className="bg-gradient-to-r from-yellow-500 to-yellow-600 rounded-xl p-4 text-center">
                                <p className="text-black font-bold text-lg animate-pulse">
                                    🏃 {runMessages[currentMonster]}
                                </p>
                                <div className="mt-3 bg-black/20 rounded-full h-3 overflow-hidden">
                                    <div
                                        className="h-full bg-white transition-all duration-1000 animate-pulse"
                                        style={{ width: `${((currentMonster + 1) / 5) * 100}%` }}
                                    />
                                </div>
                                <p className="text-black/70 mt-2 text-sm font-bold">
                                    Stage {currentMonster + 1} → Stage {currentMonster + 2}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    // WIN Scene - Super Mario Style Victory
    if (gameState === 'VICTORY' || gameState === 'WIN') {
        return (
            <div className="h-dvh bg-gray-900 flex items-center justify-center overflow-hidden">
                {/* Mobile Container */}
                <div className="w-full max-w-md h-full relative overflow-hidden shadow-2xl flex flex-col">
                    {/* Victory Background - Full Height relative to container */}
                    <div
                        className="absolute inset-0 bg-cover bg-center"
                        style={{ backgroundImage: `url('${getBackground(4)}')` }}
                    />

                    {/* Ground Overlay */}
                    <div className="absolute inset-0 bg-black/40 z-0" />

                    {/* Confetti effect */}
                    <div className="absolute inset-0 overflow-hidden pointer-events-none z-20">
                        {[...Array(20)].map((_, i) => (
                            <div
                                key={i}
                                className="absolute text-3xl animate-confetti"
                                style={{
                                    left: `${Math.random() * 100}%`,
                                    animationDelay: `${Math.random() * 2}s`,
                                    animationDuration: `${3 + Math.random() * 2}s`
                                }}
                            >
                                {['🎉', '✨', '💖', '⭐', '🎊'][Math.floor(Math.random() * 5)]}
                            </div>
                        ))}
                    </div>

                    {/* Victory Content - Compact Scrollable Area */}
                    <div className="relative z-10 w-full h-full overflow-y-auto pb-safe">
                        <div className="min-h-full flex flex-col items-center justify-center p-4">
                            {/* Create New Challenge Button - Floating Above */}
                            <a
                                href="/create"
                                className="group relative inline-flex items-center gap-2 px-8 py-4 mb-6 bg-gradient-to-r from-pink-500 to-rose-600 rounded-full text-white font-bold shadow-lg shadow-pink-500/40 transition-all hover:scale-105 hover:shadow-pink-500/60 active:scale-95 animate-bounce-soft z-50 ring-4 ring-pink-500/20"
                            >
                                <span className="text-2xl">💝</span>
                                <span className="text-lg">Buat Tantangan Baru</span>
                                <span className="absolute -right-1 -top-1 flex h-3 w-3">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-pink-400 opacity-75"></span>
                                    <span className="relative inline-flex rounded-full h-3 w-3 bg-pink-500"></span>
                                </span>
                            </a>

                            <div
                                id="victory-card"
                                className="rounded-3xl p-5 text-center w-full shadow-2xl animate-fade-in space-y-5"
                                style={{
                                    backgroundColor: 'rgba(0, 0, 0, 0.85)',
                                    backdropFilter: 'blur(8px)',
                                    border: '4px solid #facc15',
                                    boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)'
                                }}
                            >

                                {/* 1. Compact Header */}
                                <div>
                                    <div className="text-5xl mb-2 animate-bounce">🏆</div>
                                    <h1
                                        className="text-2xl font-bold animate-pulse leading-tight"
                                        style={{ color: '#fde047' }}
                                    >
                                        SELAMAT!
                                    </h1>
                                    <p
                                        className="text-sm"
                                        style={{ color: '#ffffff' }}
                                    >
                                        <span className="font-bold" style={{ color: '#f9a8d4' }}>{game.playerName}</span> berhasil menaklukkan Tantangan!
                                    </p>
                                </div>

                                {/* 2. Side-by-Side: Avatar (Left) & Stats (Right) */}
                                <div
                                    className="flex items-center gap-4 rounded-2xl p-3"
                                    style={{
                                        backgroundColor: '#333333', // Solid dark gray instead of transparent
                                        border: '1px solid #555555'
                                    }}
                                >
                                    {/* Avatar */}
                                    <div className="shrink-0">
                                        <div
                                            className="w-20 h-20 rounded-full shadow-lg overflow-hidden"
                                            style={{
                                                border: '2px solid #ffffff',
                                                backgroundColor: '#e5e7eb'
                                            }}
                                        >
                                            <img src={game.playerAvatar} alt="" className="w-full h-full object-cover" />
                                        </div>
                                    </div>

                                    {/* Stats Grid */}
                                    <div className="flex-1 grid grid-cols-1 gap-2">
                                        <div
                                            className="rounded-lg p-2 flex items-center justify-between px-3"
                                            style={{
                                                backgroundColor: '#222222', // Solid darker gray
                                                border: '1px solid #444444'
                                            }}
                                        >
                                            <div className="flex items-center gap-2">
                                                <span className="text-base">⚔️</span>
                                                <span className="text-[10px] font-bold uppercase" style={{ color: '#9ca3af' }}>Stage</span>
                                            </div>
                                            <span className="text-sm font-bold" style={{ color: '#ffffff' }}>5/5</span>
                                        </div>
                                        <div
                                            className="rounded-lg p-2 flex items-center justify-between px-3"
                                            style={{
                                                backgroundColor: '#222222',
                                                border: '1px solid #444444'
                                            }}
                                        >
                                            <div className="flex items-center gap-2">
                                                <span className="text-base">🎯</span>
                                                <span className="text-[10px] font-bold uppercase" style={{ color: '#9ca3af' }}>Total Percobaan</span>
                                            </div>
                                            <span className="text-sm font-bold" style={{ color: '#f87171' }}>{attemptCount}x</span>
                                        </div>
                                    </div>
                                </div>

                                {/* 3. Compact Reward Box */}
                                <div
                                    className="rounded-xl p-3 relative overflow-hidden shadow-lg"
                                    style={{
                                        background: 'linear-gradient(to bottom, #ec4899, #9333ea)',
                                        border: '2px solid #f9a8d4'
                                    }}
                                >
                                    {/* Removed overlay div to prevent darkening */}
                                    <div className="relative z-10">
                                        {game.reward.type === 'text' ? (
                                            <>
                                                <p
                                                    className="text-base whitespace-pre-line font-extrabold tracking-wide drop-shadow-md py-1"
                                                    style={{ color: '#ffffff' }}
                                                >
                                                    {game.reward.value}
                                                </p>

                                                {/* Screenshot Instruction */}
                                                <div className="mt-4 flex justify-center">
                                                    <p className="text-[10px] sm:text-xs text-yellow-200 font-bold animate-pulse px-4 border border-yellow-400/50 rounded-full py-1 bg-black/20 inline-block">
                                                        📸 Silahkan screenshot dan tagih ke ayangnya ya!
                                                    </p>
                                                </div>
                                            </>
                                        ) : (
                                            <NextImage
                                                src={game.reward.value}
                                                alt="Reward"
                                                width={300}
                                                height={200}
                                                className="max-w-full h-24 object-contain rounded-lg mx-auto shadow-sm"
                                                style={{ border: '1px solid #ffffff' }}
                                            />
                                        )}
                                    </div>
                                </div>

                                {/* 4. Creator Footer */}
                                {game.creatorName && (
                                    <div
                                        className="flex items-center justify-center gap-3 pt-4 text-sm mt-2 cursor-pointer hover:opacity-80 transition-opacity"
                                        onClick={() => setShowQrisModal(true)}
                                        style={{
                                            color: '#cccccc',
                                            borderTop: '1px solid #444444'
                                        }}
                                    >
                                        <span>Dibuat dengan ❤️ oleh</span>
                                        {game.creatorAvatar && (
                                            <NextImage
                                                src={game.creatorAvatar}
                                                alt={game.creatorName}
                                                width={40}
                                                height={40}
                                                className="w-10 h-10 rounded-full object-cover"
                                                style={{ border: '2px solid #ffffff' }}
                                            />
                                        )}
                                        <span className="font-bold text-base hover:text-pink-400 transition-colors" style={{ color: '#ffffff' }}>altur.somework</span>
                                    </div>
                                )}
                            </div>

                            {/* Action Buttons */}
                            <div className="w-full space-y-3 mt-4">
                                <button
                                    onClick={handleRestart}
                                    className="w-full bg-gray-800 hover:bg-gray-700 text-white font-bold py-3 px-4 rounded-xl shadow-lg border-2 border-gray-600 transition-all active:scale-95 flex items-center justify-center gap-2"
                                >
                                    <span>🔄</span> Ulangi Game
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    {/* QRIS Modal */ }
    {
        showQrisModal && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-fade-in" onClick={() => setShowQrisModal(false)}>
                <div className="bg-white border-4 border-black p-4 rounded-2xl shadow-[8px_8px_0px_0px_#000] max-w-sm w-full text-center relative animate-bounce-soft" onClick={e => e.stopPropagation()}>
                    <button
                        onClick={() => setShowQrisModal(false)}
                        className="absolute -top-4 -right-4 bg-red-500 text-white w-10 h-10 rounded-full border-2 border-black font-bold flex items-center justify-center shadow-lg hover:bg-red-600 transition-colors z-10"
                    >
                        ✕
                    </button>
                    <h3 className="text-xl font-black uppercase mb-2 text-black">Traktir Kopi ☕</h3>
                    <p className="text-sm font-bold text-gray-600 mb-4">
                        Makasih udah nyoba AyangQuest! ✨<br />
                        Bisa kali nyisihin dikit buat nambah-nambah biaya server hehe 💸
                    </p>
                    <div className="bg-gray-100 p-2 rounded-xl border-2 border-gray-200">
                        <NextImage src="/qriscode.jpg" alt="QRIS" width={300} height={300} className="w-full h-auto rounded-lg" />
                    </div>
                    <p className="text-xs font-bold text-gray-400 mt-2">Scan pake GoPay, OVO, Dana, dll.</p>
                    <a
                        href="https://www.threads.net/@althur_somework"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="block mt-4 text-sm font-black text-blue-500 hover:text-blue-700 underline"
                    >
                        🔗 Cek Threads Creator
                    </a>
                </div>
            </div>
        )
    }
    return null;
}
