'use client';

import { useState } from 'react';
import { Game, Monster, Reward } from '@/types';
import { generateGameId, saveGame } from '@/lib/storage';

export default function CreatePage() {
    const [step, setStep] = useState(1);

    // Form states
    const [creatorName, setCreatorName] = useState('');
    const [playerName, setPlayerName] = useState('');
    const [openingText, setOpeningText] = useState('');
    const [playerAvatar, setPlayerAvatar] = useState('');
    const [creatorAvatar, setCreatorAvatar] = useState('');
    const [characterType, setCharacterType] = useState<'female' | 'male'>('female');
    const [monsters, setMonsters] = useState<Monster[]>(
        Array.from({ length: 5 }, (_, i) => ({ id: i + 1, question: '', answer: '', wrongAnswer: '' }))
    );
    const [reward, setReward] = useState<Reward>({ type: 'text', value: '' });

    const [loading, setLoading] = useState(false);
    const [generatedLink, setGeneratedLink] = useState('');
    const [showCopyModal, setShowCopyModal] = useState(false);
    const [showQrisModal, setShowQrisModal] = useState(false);

    // Compress image before storing
    const compressImage = (file: File, maxWidth: number = 300): Promise<string> => {
        return new Promise((resolve) => {
            const reader = new FileReader();
            reader.onload = (e) => {
                const img = new Image();
                img.onload = () => {
                    const canvas = document.createElement('canvas');
                    let width = img.width;
                    let height = img.height;

                    if (width > maxWidth) {
                        height = (height * maxWidth) / width;
                        width = maxWidth;
                    }

                    canvas.width = width;
                    canvas.height = height;

                    const ctx = canvas.getContext('2d');
                    ctx?.drawImage(img, 0, 0, width, height);

                    const compressed = canvas.toDataURL('image/jpeg', 0.6);
                    resolve(compressed);
                };
                img.src = e.target?.result as string;
            };
            reader.readAsDataURL(file);
        });
    };

    const handleImageUpload = async (
        e: React.ChangeEvent<HTMLInputElement>,
        setter: (value: string) => void
    ) => {
        const file = e.target.files?.[0];
        if (file) {
            const compressed = await compressImage(file);
            setter(compressed);
        }
    };

    const updateMonster = (index: number, field: 'question' | 'answer' | 'wrongAnswer', value: string) => {
        const updated = [...monsters];
        updated[index] = { ...updated[index], [field]: value };
        setMonsters(updated);
    };

    const generateGame = () => {
        const gameId = generateGameId();
        const game: Game = {
            id: gameId,
            creatorName,
            playerName,
            openingText,
            playerAvatar,
            creatorAvatar: creatorAvatar || null,
            characterType,
            monsters,
            reward,
            createdAt: Date.now(),
        };

        try {
            saveGame(game);
            const link = `${window.location.origin}/play/${gameId}`;
            setGeneratedLink(link);
            setStep(5);
        } catch (error) {
            alert('Gagal menyimpan game! File gambar mungkin terlalu besar.');
        }
    };

    const handleReset = () => {
        setStep(1);
        setGeneratedLink('');
        // Optional: Keep names for convenience, or clear them? 
        // Clearing them for a "fresh" start is usually safer.
        setCreatorName('');
        setPlayerName('');
        setOpeningText('');
        setPlayerAvatar('');
        setCreatorAvatar('');
        setCharacterType('female');
        setMonsters(Array.from({ length: 5 }, (_, i) => ({ id: i + 1, question: '', answer: '', wrongAnswer: '' })));
        setReward({ type: 'text', value: '' });
        setShowCopyModal(false);
    };

    const isStep1Valid = creatorName && playerName && openingText;
    const isStep2Valid = playerAvatar;
    const isStep3Valid = monsters.every(m => m.question && m.answer && m.wrongAnswer);
    const isStep4Valid = reward.value;

    const copyLink = () => {
        navigator.clipboard.writeText(generatedLink);
        setShowCopyModal(true);
    };

    return (
        <div className="min-h-screen bg-[var(--neo-yellow)] py-8 px-4 font-sans text-black relative">
            {/* Decorative Background */}
            <div className="absolute inset-0 z-0 opacity-5 pointer-events-none"
                style={{ backgroundImage: 'radial-gradient(#000 2px, transparent 2px)', backgroundSize: '20px 20px' }}>
            </div>

            <div className="max-w-3xl mx-auto relative z-10">
                {/* Header */}
                <div className="text-center mb-10">
                    <h1 className="text-4xl md:text-5xl font-black mb-2 uppercase italic text-outline text-white drop-shadow-[4px_4px_0px_#000]">
                        🛠️ Bikin Game
                    </h1>
                    <p className="font-bold bg-black text-white inline-block px-3 py-1 rotate-1">
                        Buat petualangan spesial buat si dia!
                    </p>
                    <br />
                    <button
                        onClick={() => setShowQrisModal(true)}
                        className="mt-3 text-[10px] font-bold text-gray-500 hover:text-pink-600 underline bg-white/80 px-2 py-1 rounded-full border border-gray-300 hover:border-pink-500 transition-all"
                    >
                        ☕ Traktir Kopi Creator
                    </button>
                </div>

                {/* Progress Bar - Brutalist Style */}
                <div className="flex justify-between mb-8 px-2 relative">
                    {/* Line behind */}
                    <div className="absolute top-1/2 left-0 w-full h-2 bg-black -z-10 -translate-y-1/2 rounded-full"></div>

                    {[1, 2, 3, 4, 5].map((s) => (
                        <div key={s} className="relative group">
                            <div
                                className={`w-12 h-12 rounded-full border-4 border-black flex items-center justify-center font-bold text-xl transition-all z-10 ${step >= s
                                    ? 'bg-[var(--neo-pink)] text-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]'
                                    : 'bg-white text-gray-400'
                                    }`}
                            >
                                {s === 5 ? '🏁' : s}
                            </div>
                        </div>
                    ))}
                </div>

                {/* Main Card */}
                <div className="neo-box p-6 md:p-10 relative bg-white">
                    {/* Step Title Badge */}
                    <div className="absolute -top-5 -left-2 bg-black text-white px-4 py-2 font-bold rotate-2 border-2 border-white shadow-lg">
                        STEP {step} OF 5
                    </div>

                    {/* Step 1: Basic Info */}
                    {step === 1 && (
                        <div className="space-y-6 animate-fade-in">
                            <div className="text-center mb-6">
                                <h2 className="text-2xl font-black uppercase">Kenalan Dulu</h2>
                                <p className="text-sm font-bold text-gray-500">Siapa yang bikin & siapa yang main?</p>
                            </div>

                            <div className="space-y-4">
                                <div>
                                    <label className="block font-bold mb-1 border-l-4 border-black pl-2">Nama Kamu (Creator)</label>
                                    <input
                                        type="text"
                                        value={creatorName}
                                        onChange={(e) => setCreatorName(e.target.value)}
                                        className="neo-input"
                                        placeholder="Misal: Pangeran Tampan"
                                    />
                                </div>

                                <div>
                                    <label className="block font-bold mb-1 border-l-4 border-black pl-2">Nama Pasangan (Player)</label>
                                    <input
                                        type="text"
                                        value={playerName}
                                        onChange={(e) => setPlayerName(e.target.value)}
                                        className="neo-input"
                                        placeholder="Misal: Tuan Putri"
                                    />
                                </div>

                                <div>
                                    <label className="block font-bold mb-1 border-l-4 border-black pl-2">Pesan Pembuka</label>
                                    <textarea
                                        value={openingText}
                                        onChange={(e) => setOpeningText(e.target.value)}
                                        rows={3}
                                        className="neo-input resize-none"
                                        placeholder="Tulis pesan romantis buat nyambut dia pas buka game..."
                                    />
                                    <p className="text-xs font-bold mt-1 text-gray-500">💡 Tips: Bikin dia senyum dari detik pertama!</p>
                                </div>
                            </div>

                            <button
                                onClick={() => setStep(2)}
                                disabled={!isStep1Valid}
                                className="neo-button bg-[var(--neo-pink)] text-white w-full mt-4 text-xl disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                LANJUT BOSS! 👉
                            </button>
                        </div>
                    )}

                    {/* Step 2: Avatar Upload */}
                    {step === 2 && (
                        <div className="space-y-6 animate-fade-in">
                            <h2 className="text-2xl font-black uppercase text-center">Pilih Avatar</h2>

                            {/* Character Picker */}
                            <div className="p-4 bg-blue-50 border-4 border-black border-dashed rounded-xl">
                                <label className="block font-bold mb-3 text-center">Pilih Ksatria Kamu ⚔️</label>
                                <div className="grid grid-cols-2 gap-4">
                                    <button
                                        type="button"
                                        onClick={() => setCharacterType('female')}
                                        className={`p-2 border-4 transition-all ${characterType === 'female' ? 'bg-pink-200 border-black shadow-[4px_4px_0px_black]' : 'border-transparent hover:bg-gray-100'}`}
                                    >
                                        <img src="/sprites/knight.png" alt="Female" className="h-20 mx-auto pixelated" />
                                        <span className="block font-bold text-sm mt-1">Cewek</span>
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setCharacterType('male')}
                                        className={`p-2 border-4 transition-all ${characterType === 'male' ? 'bg-blue-200 border-black shadow-[4px_4px_0px_black]' : 'border-transparent hover:bg-gray-100'}`}
                                    >
                                        <img src="/sprites/Knight-boy.png" alt="Male" className="h-20 mx-auto pixelated" />
                                        <span className="block font-bold text-sm mt-1">Cowok</span>
                                    </button>
                                </div>
                            </div>

                            <div>
                                <label className="block font-bold mb-2">📸 Foto Wajah Player (Wajib)</label>
                                <label className="neo-box block h-40 flex flex-col items-center justify-center cursor-pointer hover:bg-gray-100 border-dashed">
                                    <input type="file" accept="image/*" className="hidden" onChange={(e) => handleImageUpload(e, setPlayerAvatar)} />
                                    {playerAvatar ? (
                                        <img src={playerAvatar} className="h-32 w-32 object-cover rounded-full border-4 border-black" />
                                    ) : (
                                        <>
                                            <span className="text-4xl">📂</span>
                                            <span className="font-bold text-gray-500">Upload Foto Disini</span>
                                        </>
                                    )}
                                </label>
                            </div>

                            <div>
                                <label className="block font-bold mb-2">📸 Foto Wajah Kamu (Opsional)</label>
                                <label className="neo-box block h-32 flex flex-col items-center justify-center cursor-pointer hover:bg-gray-100 border-dashed">
                                    <input type="file" accept="image/*" className="hidden" onChange={(e) => handleImageUpload(e, setCreatorAvatar)} />
                                    {creatorAvatar ? (
                                        <img src={creatorAvatar} className="h-24 w-24 object-cover rounded-full border-4 border-black" />
                                    ) : (
                                        <span className="font-bold text-gray-500 text-sm">Upload (Biar romantis)</span>
                                    )}
                                </label>
                            </div>

                            <div className="flex gap-4">
                                <button onClick={() => setStep(1)} className="neo-button bg-gray-200 flex-1">BACK</button>
                                <button
                                    onClick={() => setStep(3)}
                                    disabled={!isStep2Valid}
                                    className="neo-button bg-[var(--neo-pink)] text-white flex-[2] disabled:opacity-50"
                                >
                                    GASKEUN! 👉
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Step 3: Monster Questions */}
                    {step === 3 && (
                        <div className="space-y-6 animate-fade-in">
                            <div className="text-center mb-4 relative">
                                <h2 className="text-2xl font-black uppercase">5 Pertanyaan Maut</h2>
                                <p className="text-sm font-bold bg-yellow-200 inline-block px-2 border-2 border-black mb-2">
                                    Pastikan dia tau jawabannya ya!
                                </p>
                                <button
                                    onClick={() => setShowQrisModal(true)}
                                    className="block mx-auto mt-2 text-xs font-black text-white bg-gradient-to-r from-pink-500 to-purple-600 px-3 py-1.5 rounded-full border-2 border-black shadow-[2px_2px_0px_black] hover:scale-105 active:scale-95 transition-transform animate-bounce-slow"
                                >
                                    ☕ Support Creator
                                </button>
                            </div>

                            <div className="space-y-6 max-h-[50vh] overflow-y-auto pr-2 custom-scrollbar">
                                {monsters.map((monster, index) => (
                                    <div key={monster.id} className="border-4 border-black p-4 rounded-xl bg-gray-50 shadow-[4px_4px_0px_rgba(0,0,0,0.2)]">
                                        <div className="flex items-center gap-2 mb-3 border-b-2 border-black pb-2">
                                            <span className="text-2xl">{['🐉', '👻', '🦇', '🐺', '💀'][index]}</span>
                                            <span className="font-black">STAGE {index + 1}</span>
                                        </div>

                                        <div className="space-y-3">
                                            <input
                                                type="text"
                                                value={monster.question}
                                                onChange={(e) => updateMonster(index, 'question', e.target.value)}
                                                className="neo-input py-2 text-sm"
                                                placeholder={`Pertanyaan ${index + 1} (Ex: Tgl jadian kita?)`}
                                            />
                                            <div className="grid grid-cols-2 gap-2">
                                                <input
                                                    type="text"
                                                    value={monster.answer}
                                                    onChange={(e) => updateMonster(index, 'answer', e.target.value)}
                                                    className="neo-input py-2 text-sm border-green-500 text-green-700 bg-white placeholder-gray-400 focus:bg-green-50 transition-colors"
                                                    placeholder="Jawaban Benar ✅"
                                                />
                                                <input
                                                    type="text"
                                                    value={monster.wrongAnswer}
                                                    onChange={(e) => updateMonster(index, 'wrongAnswer', e.target.value)}
                                                    className="neo-input py-2 text-sm border-red-500 text-red-700 bg-white placeholder-gray-400 focus:bg-red-50 transition-colors"
                                                    placeholder="Jawaban Pengecoh ❌"
                                                />
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            <div className="flex gap-4 pt-4">
                                <button onClick={() => setStep(2)} className="neo-button bg-gray-200 flex-1">BACK</button>
                                <button
                                    onClick={() => setStep(4)}
                                    disabled={!isStep3Valid}
                                    className="neo-button bg-[var(--neo-pink)] text-white flex-[2] disabled:opacity-50"
                                >
                                    NEXT LEVEL 👉
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Step 4: Reward */}
                    {step === 4 && (
                        <div className="space-y-6 animate-fade-in">
                            <h2 className="text-2xl font-black uppercase text-center">Hadiah Kemenangan 🏆</h2>

                            <div className="flex gap-4">
                                <button
                                    onClick={() => setReward({ type: 'text', value: '' })}
                                    className={`flex-1 py-4 border-4 border-black font-bold transition-all ${reward.type === 'text' ? 'bg-[var(--neo-pink)] text-white shadow-[4px_4px_0px_black]' : 'bg-white'}`}
                                >
                                    📝 Pesan Cinta
                                </button>
                                <button
                                    onClick={() => setReward({ type: 'image', value: '' })}
                                    className={`flex-1 py-4 border-4 border-black font-bold transition-all ${reward.type === 'image' ? 'bg-[var(--neo-pink)] text-white shadow-[4px_4px_0px_black]' : 'bg-white'}`}
                                >
                                    🖼️ Meme / Foto
                                </button>
                            </div>

                            <div className="p-6 border-4 border-black bg-yellow-50 rounded-xl relative">
                                <div className="absolute -top-3 left-4 bg-black text-white px-2 font-bold text-xs uppercase">Preview Hadiah</div>
                                {reward.type === 'text' ? (
                                    <textarea
                                        value={reward.value}
                                        onChange={(e) => setReward({ ...reward, value: e.target.value })}
                                        rows={4}
                                        className="w-full bg-transparent border-none focus:ring-0 font-handwriting text-xl text-center placeholder-gray-400"
                                        placeholder="Tulisjan janji manismu disini..."
                                    />
                                ) : (
                                    <label className="block h-48 flex flex-col items-center justify-center cursor-pointer border-2 border-dashed border-gray-400 hover:border-black">
                                        <input type="file" accept="image/*" className="hidden" onChange={(e) => handleImageUpload(e, (val) => setReward({ ...reward, value: val }))} />
                                        {reward.value ? (
                                            <img src={reward.value} className="h-full object-contain" />
                                        ) : (
                                            <span className="text-gray-500 font-bold">Upload Gambar Disini</span>
                                        )}
                                    </label>
                                )}
                            </div>

                            <div className="flex gap-4">
                                <button onClick={() => setStep(3)} className="neo-button bg-gray-200 flex-1">BACK</button>
                                <button
                                    onClick={generateGame}
                                    disabled={!isStep4Valid}
                                    className="neo-button bg-black text-white flex-[2] text-xl hover:bg-gray-900 disabled:opacity-50"
                                >
                                    ✨ BIKIN GAME SEKARANG!
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Step 5: Success */}
                    {step === 5 && (
                        <div className="text-center space-y-8 animate-bounce-in">
                            <div className="inline-block p-4 border-4 border-black rounded-full bg-green-400 shadow-[8px_8px_0px_black]">
                                <span className="text-6xl">🎉</span>
                            </div>

                            <div>
                                <h2 className="text-4xl font-black uppercase mb-2">BERHASIL!</h2>
                                <p className="font-bold mb-4">Game unyu buatanmu udah siap dimainkan!</p>

                                <p className="font-bold bg-yellow-300 text-black px-4 py-2 inline-block border-2 border-black rotate-1 shadow-[4px_4px_0px_black] mb-2">
                                    👇 Kirim link ini ke ayang kamu buat dimainin! 👇
                                </p>
                            </div>

                            <div className="bg-black p-4 rounded-xl flex gap-2">
                                <input
                                    type="text"
                                    value={generatedLink}
                                    readOnly
                                    className="flex-1 bg-gray-800 text-white px-4 py-2 rounded font-mono text-sm outline-none border border-gray-700 focus:border-pink-500"
                                />
                                <button
                                    onClick={copyLink}
                                    className="bg-[var(--neo-pink)] text-white px-6 font-bold rounded hover:bg-pink-600 transition-colors"
                                >
                                    COPY
                                </button>
                            </div>

                            <button
                                onClick={handleReset}
                                className="neo-button bg-white text-black w-full text-lg mt-4 border-2 border-black"
                            >
                                🔄 Buat Game Lagi
                            </button>

                            <button
                                onClick={() => setShowQrisModal(true)}
                                className="neo-button bg-gradient-to-r from-pink-400 to-purple-500 text-white w-full text-lg mt-4 border-2 border-black shadow-[4px_4px_0px_black] hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-2 animate-pulse"
                            >
                                ☕ TRAKTIR KOPI CREATOR
                            </button>
                        </div>
                    )}
                </div>
            </div>

            {/* Custom Copy Modal */}
            {showCopyModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-fade-in">
                    <div className="bg-white border-4 border-black p-6 rounded-2xl shadow-[8px_8px_0px_0px_#000] max-w-sm w-full text-center relative animate-bounce-soft">
                        <div className="text-5xl mb-4">✅</div>
                        <h3 className="text-2xl font-black uppercase mb-2">Link Tersalin!</h3>
                        <p className="font-bold text-gray-600 mb-6">
                            Kirimkan ke ayang tadi sekarang! Jangan lupa minta dia mainin ya! 💘
                        </p>

                        <div className="flex flex-col gap-3">
                            <button
                                onClick={handleReset}
                                className="bg-[var(--neo-pink)] text-white font-bold py-3 px-4 rounded-xl border-4 border-black shadow-[4px_4px_0px_0px_#000] hover:translate-y-1 hover:shadow-none transition-all active:translate-y-2 active:shadow-none"
                            >
                                ✨ Buat Game Baru
                            </button>
                            <button
                                onClick={() => setShowCopyModal(false)}
                                className="bg-gray-200 text-black font-bold py-3 px-4 rounded-xl border-4 border-black hover:bg-gray-300 transition-all"
                            >
                                Kembali
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* QRIS Modal */}
            {showQrisModal && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-fade-in" onClick={() => setShowQrisModal(false)}>
                    <div className="bg-white border-4 border-black p-4 rounded-2xl shadow-[8px_8px_0px_0px_#000] max-w-sm w-full text-center relative animate-bounce-soft" onClick={e => e.stopPropagation()}>
                        <button
                            onClick={() => setShowQrisModal(false)}
                            className="absolute -top-4 -right-4 bg-red-500 text-white w-10 h-10 rounded-full border-2 border-black font-bold flex items-center justify-center shadow-lg hover:bg-red-600 transition-colors z-10"
                        >
                            ✕
                        </button>
                        <h3 className="text-xl font-black uppercase mb-2">Traktir Kopi ☕</h3>
                        <p className="text-sm font-bold text-gray-600 mb-4">
                            Makasih udah pake AyangQuest! Dukunganmu sangat berarti buat server & pengembangan selanjutnya. :)
                        </p>
                        <div className="bg-gray-100 p-2 rounded-xl border-2 border-gray-200">
                            <img src="/qriscode.jpg" alt="QRIS" className="w-full h-auto rounded-lg" />
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
            )}
        </div>
    );
}

