import { useCallback, useRef } from 'react';
import { FEEDBACK_CONFIG } from '@/config';

type SoundType = 'correct' | 'incorrect' | 'celebration' | 'hint';

interface SoundEffectsHook {
    playSound: (type: SoundType) => void;
    isEnabled: boolean;
}

/**
 * Hook to play sound effects for correct/incorrect answers
 * Uses Web Audio API for synthesized sounds
 * Configurable via quiz.config.json
 */
export function useSoundEffects(): SoundEffectsHook {
    const audioContextRef = useRef<AudioContext | null>(null);

    const getAudioContext = useCallback(() => {
        if (!audioContextRef.current) {
            audioContextRef.current = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
        }
        return audioContextRef.current;
    }, []);

    const playCorrectSound = useCallback(() => {
        const ctx = getAudioContext();
        const now = ctx.currentTime;
        const { correctSound, soundVolume } = FEEDBACK_CONFIG;

        // Create a pleasant ascending chime for correct answer
        correctSound.frequencies.forEach((freq, i) => {
            const oscillator = ctx.createOscillator();
            const gainNode = ctx.createGain();

            oscillator.connect(gainNode);
            gainNode.connect(ctx.destination);

            oscillator.type = correctSound.type;
            oscillator.frequency.setValueAtTime(freq, now);

            // Stagger the notes with overlap
            const startTime = now + i * 0.07;
            const endTime = startTime + correctSound.duration;

            // Louder volume with smooth envelope
            gainNode.gain.setValueAtTime(0, startTime);
            gainNode.gain.linearRampToValueAtTime(soundVolume * 0.6, startTime + 0.02);
            gainNode.gain.setValueAtTime(soundVolume * 0.5, startTime + correctSound.duration * 0.5);
            gainNode.gain.exponentialRampToValueAtTime(0.01, endTime);

            oscillator.start(startTime);
            oscillator.stop(endTime);
        });

        // Add a higher octave sparkle
        const sparkleFreqs = [1046.5, 1318.5, 1568]; // C6, E6, G6
        sparkleFreqs.forEach((freq, i) => {
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();

            osc.connect(gain);
            gain.connect(ctx.destination);

            osc.type = 'sine';
            osc.frequency.setValueAtTime(freq, now);

            const startTime = now + 0.1 + i * 0.05;
            const endTime = startTime + 0.2;

            gain.gain.setValueAtTime(0, startTime);
            gain.gain.linearRampToValueAtTime(soundVolume * 0.2, startTime + 0.01);
            gain.gain.exponentialRampToValueAtTime(0.01, endTime);

            osc.start(startTime);
            osc.stop(endTime);
        });
    }, [getAudioContext]);

    const playIncorrectSound = useCallback(() => {
        const ctx = getAudioContext();
        const now = ctx.currentTime;
        const { incorrectSound, soundVolume } = FEEDBACK_CONFIG;

        // First buzz tone - descending
        const oscillator = ctx.createOscillator();
        const gainNode = ctx.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(ctx.destination);

        oscillator.type = incorrectSound.type;
        oscillator.frequency.setValueAtTime(incorrectSound.frequencies[0], now);
        oscillator.frequency.linearRampToValueAtTime(incorrectSound.frequencies[1], now + incorrectSound.duration * 0.6);

        gainNode.gain.setValueAtTime(soundVolume * 0.4, now);
        gainNode.gain.setValueAtTime(soundVolume * 0.4, now + incorrectSound.duration * 0.7);
        gainNode.gain.exponentialRampToValueAtTime(0.01, now + incorrectSound.duration);

        oscillator.start(now);
        oscillator.stop(now + incorrectSound.duration);

        // Second lower tone for emphasis
        const oscillator2 = ctx.createOscillator();
        const gainNode2 = ctx.createGain();

        oscillator2.connect(gainNode2);
        gainNode2.connect(ctx.destination);

        oscillator2.type = incorrectSound.type;
        oscillator2.frequency.setValueAtTime(incorrectSound.frequencies[1], now + 0.03);
        oscillator2.frequency.linearRampToValueAtTime(80, now + incorrectSound.duration);

        gainNode2.gain.setValueAtTime(soundVolume * 0.3, now + 0.03);
        gainNode2.gain.exponentialRampToValueAtTime(0.01, now + incorrectSound.duration + 0.05);

        oscillator2.start(now + 0.03);
        oscillator2.stop(now + incorrectSound.duration + 0.05);

        // Add a brief noise burst for impact
        const bufferSize = ctx.sampleRate * 0.05;
        const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
        const output = noiseBuffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
            output[i] = Math.random() * 2 - 1;
        }

        const noise = ctx.createBufferSource();
        const noiseGain = ctx.createGain();
        const noiseFilter = ctx.createBiquadFilter();

        noise.buffer = noiseBuffer;
        noiseFilter.type = 'lowpass';
        noiseFilter.frequency.value = 500;

        noise.connect(noiseFilter);
        noiseFilter.connect(noiseGain);
        noiseGain.connect(ctx.destination);

        noiseGain.gain.setValueAtTime(soundVolume * 0.15, now);
        noiseGain.gain.exponentialRampToValueAtTime(0.01, now + 0.05);

        noise.start(now);
        noise.stop(now + 0.05);
    }, [getAudioContext]);

    // Celebration sound - longer (2-3 seconds) with fade-out effect
    const playCelebrationSound = useCallback(() => {
        const ctx = getAudioContext();
        const now = ctx.currentTime;
        const { soundVolume } = FEEDBACK_CONFIG;
        const duration = 2.5; // 2.5 seconds

        // Create a master gain for overall fade-out
        const masterGain = ctx.createGain();
        masterGain.connect(ctx.destination);
        masterGain.gain.setValueAtTime(soundVolume * 0.7, now);
        masterGain.gain.setValueAtTime(soundVolume * 0.7, now + duration * 0.6);
        masterGain.gain.exponentialRampToValueAtTime(0.001, now + duration);

        // Celebratory chord progression: C major -> G major -> A minor -> F major
        const chordProgression = [
            { notes: [261.63, 329.63, 392.00], time: 0 },      // C major (C4, E4, G4)
            { notes: [392.00, 493.88, 587.33], time: 0.5 },    // G major (G4, B4, D5)
            { notes: [440.00, 523.25, 659.25], time: 1.0 },    // A minor (A4, C5, E5)
            { notes: [349.23, 440.00, 523.25], time: 1.5 },    // F major (F4, A4, C5)
            { notes: [523.25, 659.25, 783.99], time: 2.0 },    // C major high (C5, E5, G5)
        ];

        chordProgression.forEach(chord => {
            chord.notes.forEach((freq, noteIndex) => {
                const osc = ctx.createOscillator();
                const noteGain = ctx.createGain();

                osc.connect(noteGain);
                noteGain.connect(masterGain);

                osc.type = 'sine';
                osc.frequency.setValueAtTime(freq, now + chord.time);

                const startTime = now + chord.time;
                const noteEndTime = startTime + 0.6;

                // Smooth envelope for each note
                noteGain.gain.setValueAtTime(0, startTime);
                noteGain.gain.linearRampToValueAtTime(0.3 - noteIndex * 0.05, startTime + 0.05);
                noteGain.gain.setValueAtTime(0.25 - noteIndex * 0.04, startTime + 0.3);
                noteGain.gain.exponentialRampToValueAtTime(0.01, noteEndTime);

                osc.start(startTime);
                osc.stop(noteEndTime);
            });
        });

        // Add sparkle arpeggios
        const sparkleNotes = [
            { freq: 1046.5, time: 0.1 },   // C6
            { freq: 1174.66, time: 0.2 },  // D6
            { freq: 1318.51, time: 0.3 },  // E6
            { freq: 1567.98, time: 0.4 },  // G6
            { freq: 1760, time: 0.6 },     // A6
            { freq: 2093, time: 0.8 },     // C7
            { freq: 1567.98, time: 1.2 },  // G6
            { freq: 2093, time: 1.6 },     // C7
            { freq: 2637, time: 2.0 },     // E7
        ];

        sparkleNotes.forEach(note => {
            const osc = ctx.createOscillator();
            const noteGain = ctx.createGain();

            osc.connect(noteGain);
            noteGain.connect(masterGain);

            osc.type = 'sine';
            osc.frequency.setValueAtTime(note.freq, now + note.time);

            const startTime = now + note.time;
            const noteEndTime = startTime + 0.25;

            noteGain.gain.setValueAtTime(0, startTime);
            noteGain.gain.linearRampToValueAtTime(0.15, startTime + 0.02);
            noteGain.gain.exponentialRampToValueAtTime(0.01, noteEndTime);

            osc.start(startTime);
            osc.stop(noteEndTime);
        });

        // Add subtle bass notes for richness
        const bassNotes = [
            { freq: 130.81, time: 0 },    // C3
            { freq: 98.00, time: 0.5 },   // G2
            { freq: 110.00, time: 1.0 },  // A2
            { freq: 87.31, time: 1.5 },   // F2
            { freq: 130.81, time: 2.0 },  // C3
        ];

        bassNotes.forEach(note => {
            const osc = ctx.createOscillator();
            const noteGain = ctx.createGain();

            osc.connect(noteGain);
            noteGain.connect(masterGain);

            osc.type = 'triangle';
            osc.frequency.setValueAtTime(note.freq, now + note.time);

            const startTime = now + note.time;
            const noteEndTime = startTime + 0.5;

            noteGain.gain.setValueAtTime(0, startTime);
            noteGain.gain.linearRampToValueAtTime(0.2, startTime + 0.05);
            noteGain.gain.exponentialRampToValueAtTime(0.01, noteEndTime);

            osc.start(startTime);
            osc.stop(noteEndTime);
        });
    }, [getAudioContext]);

    // Hint sound - a gentle "reveal" chime
    const playHintSound = useCallback(() => {
        const ctx = getAudioContext();
        const now = ctx.currentTime;
        const { soundVolume } = FEEDBACK_CONFIG;

        // Gentle ascending notes like a "light bulb" moment
        const hintNotes = [
            { freq: 392.00, time: 0 },      // G4
            { freq: 493.88, time: 0.08 },   // B4
            { freq: 587.33, time: 0.16 },   // D5
            { freq: 783.99, time: 0.24 },   // G5
        ];

        hintNotes.forEach((note, i) => {
            const osc = ctx.createOscillator();
            const noteGain = ctx.createGain();

            osc.connect(noteGain);
            noteGain.connect(ctx.destination);

            osc.type = 'sine';
            osc.frequency.setValueAtTime(note.freq, now + note.time);

            const startTime = now + note.time;
            const noteEndTime = startTime + 0.25;

            // Gentle envelope
            noteGain.gain.setValueAtTime(0, startTime);
            noteGain.gain.linearRampToValueAtTime(soundVolume * (0.4 - i * 0.05), startTime + 0.02);
            noteGain.gain.setValueAtTime(soundVolume * (0.3 - i * 0.04), startTime + 0.1);
            noteGain.gain.exponentialRampToValueAtTime(0.01, noteEndTime);

            osc.start(startTime);
            osc.stop(noteEndTime);
        });

        // Add a soft shimmer on top
        const shimmer = ctx.createOscillator();
        const shimmerGain = ctx.createGain();

        shimmer.connect(shimmerGain);
        shimmerGain.connect(ctx.destination);

        shimmer.type = 'sine';
        shimmer.frequency.setValueAtTime(1567.98, now + 0.2); // G6

        shimmerGain.gain.setValueAtTime(0, now + 0.2);
        shimmerGain.gain.linearRampToValueAtTime(soundVolume * 0.15, now + 0.22);
        shimmerGain.gain.exponentialRampToValueAtTime(0.01, now + 0.5);

        shimmer.start(now + 0.2);
        shimmer.stop(now + 0.5);
    }, [getAudioContext]);

    const playSound = useCallback((type: SoundType) => {
        if (!FEEDBACK_CONFIG.soundEnabled) return;

        try {
            if (type === 'correct') {
                playCorrectSound();
            } else if (type === 'incorrect') {
                playIncorrectSound();
            } else if (type === 'celebration') {
                playCelebrationSound();
            } else if (type === 'hint') {
                playHintSound();
            }
        } catch (error) {
            // Audio may not be available in some environments
            console.warn('Sound effect failed:', error);
        }
    }, [playCorrectSound, playIncorrectSound, playCelebrationSound, playHintSound]);

    return {
        playSound,
        isEnabled: FEEDBACK_CONFIG.soundEnabled,
    };
}

/**
 * Get animation duration from config
 */
export function getAnimationDurations() {
    return {
        shakeDuration: FEEDBACK_CONFIG.shakeDuration,
        successPulseDuration: FEEDBACK_CONFIG.successPulseDuration,
        animationEnabled: FEEDBACK_CONFIG.animationEnabled,
    };
}
