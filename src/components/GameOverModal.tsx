// Game over modal for stuck state - premium styling
import React from 'react';

// SVG Icons
const AlertIcon = () => (
    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" />
        <line x1="12" y1="8" x2="12" y2="12" />
        <line x1="12" y1="16" x2="12.01" y2="16" />
    </svg>
);

const ShuffleIcon = () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M16 3h5v5" />
        <path d="M4 20L21 3" />
        <path d="M21 16v5h-5" />
        <path d="M15 15l6 6" />
        <path d="M4 4l5 5" />
    </svg>
);

interface GameOverModalProps {
    onShuffle: () => void;
    onNewGame: () => void;
}

export const GameOverModal: React.FC<GameOverModalProps> = ({
    onShuffle,
    onNewGame,
}) => {
    return (
        <div className="modal-overlay">
            <div className="modal-content text-center">
                {/* Animated warning icon */}
                <div className="text-[var(--color-imperial-gold)] mb-6 flex justify-center" style={{ animation: 'winBounce 0.5s ease-out' }}>
                    <AlertIcon />
                </div>

                <h2 className="text-3xl font-bold tracking-tight mb-4 text-white">
                    NO MOVES LEFT
                </h2>

                <p className="text-white/60 mb-8 leading-relaxed">
                    There are no more matching pairs available.
                    <br />
                    <span className="text-sm font-medium">
                        Shuffle the boutique set or start a new game.
                    </span>
                </p>

                <div className="flex gap-4">
                    <button
                        className="game-button flex-1 py-4 text-white/60 hover:text-white border-white/10"
                        onClick={onShuffle}
                    >
                        <ShuffleIcon /> SHUFFLE
                    </button>
                    <button
                        className="game-button flex-1 py-4 bg-[var(--color-imperial-gold)] text-black border-none font-bold"
                        onClick={onNewGame}
                    >
                        NEW GAME
                    </button>
                </div>
            </div>
        </div>
    );
};

export default GameOverModal;

