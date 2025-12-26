// Sound effect manager for Mahjong Solitaire
// Uses Web Audio API for low-latency playback with realistic tile sounds

type SoundType = 'click' | 'match' | 'combo' | 'error' | 'shuffle' | 'win' | 'undo' | 'hint' | 'select';

interface SoundManager {
    play: (sound: SoundType, options?: { pitch?: number; volume?: number }) => void;
    setMuted: (muted: boolean) => void;
    isMuted: () => boolean;
    startDrone: () => void;
    stopDrone: () => void;
}

let audioContext: AudioContext | null = null;
let muted = false;
let droneOsc: OscillatorNode | null = null;
let droneGain: GainNode | null = null;

// Initialize AudioContext on first user interaction
function getAudioContext(): AudioContext {
    if (!audioContext) {
        audioContext = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
    }
    // Resume if suspended (browser autoplay policy)
    if (audioContext.state === 'suspended') {
        audioContext.resume();
    }
    return audioContext;
}

// Create noise buffer for realistic impact sounds
function createNoiseBuffer(duration: number): AudioBuffer {
    const ctx = getAudioContext();
    const bufferSize = ctx.sampleRate * duration;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const output = buffer.getChannelData(0);

    for (let i = 0; i < bufferSize; i++) {
        output[i] = Math.random() * 2 - 1;
    }
    return buffer;
}

// Play filtered noise for ceramic/tile impact sounds
function playTileClick(pitch: number = 1, volume: number = 0.3, delay: number = 0): void {
    if (muted) return;

    try {
        const ctx = getAudioContext();

        // Create noise source
        const noiseBuffer = createNoiseBuffer(0.05);
        const noiseNode = ctx.createBufferSource();
        noiseNode.buffer = noiseBuffer;

        // High-pass filter for ceramic click
        const highPass = ctx.createBiquadFilter();
        highPass.type = 'highpass';
        highPass.frequency.value = 2000 * pitch;
        highPass.Q.value = 1;

        // Band-pass for characteristic
        const bandPass = ctx.createBiquadFilter();
        bandPass.type = 'bandpass';
        bandPass.frequency.value = 4000 * pitch;
        bandPass.Q.value = 2;

        // Sharp envelope
        const gainNode = ctx.createGain();
        const startTime = ctx.currentTime + delay;
        gainNode.gain.setValueAtTime(0, startTime);
        gainNode.gain.linearRampToValueAtTime(volume, startTime + 0.002);
        gainNode.gain.exponentialRampToValueAtTime(0.001, startTime + 0.04);

        // Connect chain
        noiseNode.connect(highPass);
        highPass.connect(bandPass);
        bandPass.connect(gainNode);
        gainNode.connect(ctx.destination);

        noiseNode.start(startTime);
        noiseNode.stop(startTime + 0.05);
    } catch {
        // Audio not available, silently fail
    }
}

// Play a resonant tile clack (harder impact)
function playTileClack(pitch: number = 1, volume: number = 0.25, delay: number = 0): void {
    if (muted) return;

    try {
        const ctx = getAudioContext();
        const startTime = ctx.currentTime + delay;

        // Sharp transient with noise
        const noiseBuffer = createNoiseBuffer(0.08);
        const noiseNode = ctx.createBufferSource();
        noiseNode.buffer = noiseBuffer;

        // Filter for ceramic resonance
        const filter = ctx.createBiquadFilter();
        filter.type = 'bandpass';
        filter.frequency.value = 3500 * pitch;
        filter.Q.value = 8; // High resonance

        const noiseGain = ctx.createGain();
        noiseGain.gain.setValueAtTime(0, startTime);
        noiseGain.gain.linearRampToValueAtTime(volume, startTime + 0.001);
        noiseGain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.06);

        noiseNode.connect(filter);
        filter.connect(noiseGain);
        noiseGain.connect(ctx.destination);

        noiseNode.start(startTime);
        noiseNode.stop(startTime + 0.08);

        // Add subtle tonal component for richness
        const osc = ctx.createOscillator();
        osc.type = 'sine';
        osc.frequency.value = 800 * pitch;

        const oscGain = ctx.createGain();
        oscGain.gain.setValueAtTime(0, startTime);
        oscGain.gain.linearRampToValueAtTime(volume * 0.15, startTime + 0.001);
        oscGain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.03);

        osc.connect(oscGain);
        oscGain.connect(ctx.destination);

        osc.start(startTime);
        osc.stop(startTime + 0.05);
    } catch {
        // Audio not available
    }
}

// Play musical tone with envelope
function playTone(
    frequency: number,
    duration: number,
    type: OscillatorType = 'sine',
    volume: number = 0.3,
    delay: number = 0
): void {
    if (muted) return;

    try {
        const ctx = getAudioContext();
        const oscillator = ctx.createOscillator();
        const gainNode = ctx.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(ctx.destination);

        oscillator.type = type;
        oscillator.frequency.setValueAtTime(frequency, ctx.currentTime + delay);

        // Attack-decay envelope
        gainNode.gain.setValueAtTime(0, ctx.currentTime + delay);
        gainNode.gain.linearRampToValueAtTime(volume, ctx.currentTime + delay + 0.01);
        gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + delay + duration);

        oscillator.start(ctx.currentTime + delay);
        oscillator.stop(ctx.currentTime + delay + duration);
    } catch {
        // Audio not available
    }
}

// Play chord
function playChord(
    frequencies: number[],
    duration: number,
    type: OscillatorType = 'sine',
    volume: number = 0.2,
    stagger: number = 20
): void {
    frequencies.forEach((freq, i) => {
        playTone(freq, duration, type, volume / frequencies.length * 1.5, i * stagger / 1000);
    });
}

// Sound definitions - Realistic mahjong tile sounds
const sounds: Record<SoundType, (pitch?: number) => void> = {
    click: () => {
        playTileClick(1.0, 0.2);
    },

    select: () => {
        playTileClick(1.2, 0.25);
        playTone(600, 0.06, 'sine', 0.08, 0.02);
    },

    match: (p = 1.0) => {
        // Two tiles clacking together - double impact
        playTileClack(p, 0.35);
        playTileClack(p * 0.9, 0.25, 0.03);
        // Pleasant chime overlay - frequency scales with pitch option (combo level)
        playTone(880 * p, 0.25, 'sine', 0.12, 0.05);
        playTone(1320 * p, 0.2, 'sine', 0.08, 0.08);
    },

    combo: (p = 1.0) => {
        // Quick tile impacts with ascending chime
        playTileClack(p, 0.3);
        playTileClack(p * 1.1, 0.25, 0.05);
        playTileClack(p * 1.2, 0.2, 0.1);
        // Ascending tones scaling with combo pitch
        playTone(523 * p, 0.12, 'sine', 0.15, 0.06);
        playTone(659 * p, 0.12, 'sine', 0.15, 0.1);
        playTone(784 * p, 0.15, 'sine', 0.18, 0.14);
    },

    error: () => {
        playTileClick(0.5, 0.15);
        playTone(150, 0.1, 'triangle', 0.08, 0.02);
    },

    hint: () => {
        playTileClick(1.3, 0.15);
        playTileClick(1.4, 0.12, 0.08);
        playTone(1000, 0.08, 'sine', 0.08, 0.05);
    },

    shuffle: () => {
        for (let i = 0; i < 8; i++) {
            playTileClick(0.7 + Math.random() * 0.6, 0.08 + Math.random() * 0.06, i * 0.025);
        }
        for (let i = 0; i < 10; i++) {
            playTileClack(0.8 + Math.random() * 0.5, 0.06 + Math.random() * 0.05, 0.12 + i * 0.03);
        }
        for (let i = 0; i < 6; i++) {
            playTileClick(0.9 + Math.random() * 0.4, 0.04 + Math.random() * 0.03, 0.35 + i * 0.04);
        }
        playTileClack(1.0, 0.12, 0.55);
        playTileClack(0.95, 0.08, 0.6);
    },

    win: () => {
        for (let i = 0; i < 5; i++) {
            playTileClack(1.0 + i * 0.05, 0.2 - i * 0.02, i * 0.08);
        }
        const melody = [523, 659, 784, 880, 1047];
        melody.forEach((freq, i) => {
            playTone(freq, 0.3, 'sine', 0.2, 0.4 + i * 0.12);
        });
        setTimeout(() => {
            playChord([523, 659, 784, 1047], 0.6, 'sine', 0.35, 10);
        }, 1000);
        setTimeout(() => {
            playChord([261, 523, 659, 784, 1047], 1.0, 'sine', 0.3, 5);
        }, 1400);
    },

    undo: () => {
        playTileClick(0.9, 0.15);
        playTileClick(0.85, 0.12, 0.04);
        playTone(400, 0.08, 'triangle', 0.08, 0.02);
        playTone(300, 0.1, 'triangle', 0.06, 0.06);
    },
};

// Check localStorage for mute preference
function loadMutePreference(): boolean {
    try {
        const stored = localStorage.getItem('mahjong-muted');
        return stored === 'true';
    } catch {
        return false;
    }
}

// Save mute preference
function saveMutePreference(value: boolean): void {
    try {
        localStorage.setItem('mahjong-muted', String(value));
    } catch {
        // localStorage not available
    }
}

// Initialize mute state from localStorage
muted = loadMutePreference();

export const soundManager: SoundManager = {
    play: (sound: SoundType, options?: { pitch?: number; volume?: number }) => {
        if (!muted) {
            sounds[sound]?.(options?.pitch);
        }
    },

    setMuted: (newMuted: boolean) => {
        muted = newMuted;
        saveMutePreference(newMuted);
        if (newMuted) {
            soundManager.stopDrone();
        } else {
            soundManager.startDrone();
        }
    },

    isMuted: () => muted,

    startDrone: () => {
        if (muted || droneOsc) return;
        try {
            const ctx = getAudioContext();
            droneOsc = ctx.createOscillator();
            droneGain = ctx.createGain();

            droneOsc.type = 'sine';
            droneOsc.frequency.setValueAtTime(55, ctx.currentTime); // Low A

            droneGain.gain.setValueAtTime(0, ctx.currentTime);
            droneGain.gain.linearRampToValueAtTime(0.04, ctx.currentTime + 3);

            droneOsc.connect(droneGain);
            droneGain.connect(ctx.destination);
            droneOsc.start();
        } catch { }
    },

    stopDrone: () => {
        if (droneGain) {
            const ctx = getAudioContext();
            droneGain.gain.linearRampToValueAtTime(0, ctx.currentTime + 1.5);
            setTimeout(() => {
                droneOsc?.stop();
                droneOsc = null;
                droneGain = null;
            }, 1600);
        }
    }
};

export default soundManager;
