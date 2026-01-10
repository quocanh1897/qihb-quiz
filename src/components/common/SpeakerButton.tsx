import { useState, useCallback, useEffect } from 'react';
import { Volume2, VolumeX, Loader2 } from 'lucide-react';
import { SPEECH_CONFIG } from '@/config';

interface SpeakerButtonProps {
    text: string;
    lang?: string;
    size?: number;
    className?: string;
}

// Female voice indicators (names commonly used for female Chinese voices)
const FEMALE_VOICE_INDICATORS = [
    'female', 'Female', 'FEMALE',
    'Ting-Ting', 'Tingting',  // Apple's female Chinese voice
    'Tian-Tian', 'Tiantian',
    'Mei-Jia', 'Meijia',
    'Sin-Ji', 'Sinji',        // Cantonese female
    'Lili', 'Li-Li',
    'Xiaoxiao',               // Microsoft female
    'Xiaoyi',
    'Yunxi',                  // Microsoft female (though name is unisex)
    '女',                     // Female in Chinese
];

// Male voice indicators
const MALE_VOICE_INDICATORS = [
    'male', 'Male', 'MALE',
    'Yun',                    // Microsoft male voices often start with Yun
    'Yunyang',
    '男',                     // Male in Chinese
];

/**
 * Find the best Chinese voice based on preference
 */
function findBestChineseVoice(voices: SpeechSynthesisVoice[], preferFemale: boolean): SpeechSynthesisVoice | null {
    // Filter to Chinese voices only
    const chineseVoices = voices.filter(
        voice => voice.lang.startsWith('zh') || voice.lang.includes('Chinese')
    );

    if (chineseVoices.length === 0) return null;

    // Try to find preferred gender
    const preferredIndicators = preferFemale ? FEMALE_VOICE_INDICATORS : MALE_VOICE_INDICATORS;
    const oppositeIndicators = preferFemale ? MALE_VOICE_INDICATORS : FEMALE_VOICE_INDICATORS;

    // First, try to find a voice matching preferred gender
    const preferredVoice = chineseVoices.find(voice =>
        preferredIndicators.some(indicator => voice.name.includes(indicator))
    );
    if (preferredVoice) return preferredVoice;

    // Exclude voices that are clearly the opposite gender
    const neutralVoices = chineseVoices.filter(voice =>
        !oppositeIndicators.some(indicator => voice.name.includes(indicator))
    );
    if (neutralVoices.length > 0) return neutralVoices[0];

    // Fall back to any Chinese voice
    return chineseVoices[0];
}

/**
 * SpeakerButton - Uses the built-in Web Speech API to speak Chinese text
 * No external API needed - works directly in the browser
 * Voice preference (male/female) is configurable in quiz.config.json
 */
export function SpeakerButton({
    text,
    lang = 'zh-CN',
    size = 16,
    className = '',
}: SpeakerButtonProps) {
    const [isSpeaking, setIsSpeaking] = useState(false);
    const [isSupported] = useState(() => 'speechSynthesis' in window);
    const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);

    // Load voices (they may load asynchronously)
    useEffect(() => {
        if (!isSupported) return;

        const loadVoices = () => {
            setVoices(window.speechSynthesis.getVoices());
        };

        loadVoices();
        window.speechSynthesis.onvoiceschanged = loadVoices;

        return () => {
            window.speechSynthesis.onvoiceschanged = null;
        };
    }, [isSupported]);

    const speak = useCallback(() => {
        if (!isSupported || !text) return;

        // Cancel any ongoing speech
        window.speechSynthesis.cancel();

        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = lang;
        utterance.rate = SPEECH_CONFIG.rate;
        utterance.pitch = SPEECH_CONFIG.pitch;
        utterance.volume = SPEECH_CONFIG.volume;

        // Find the best Chinese voice based on gender preference
        const bestVoice = findBestChineseVoice(voices, SPEECH_CONFIG.preferFemale);
        if (bestVoice) {
            utterance.voice = bestVoice;
        }

        utterance.onstart = () => setIsSpeaking(true);
        utterance.onend = () => setIsSpeaking(false);
        utterance.onerror = () => setIsSpeaking(false);

        window.speechSynthesis.speak(utterance);
    }, [text, lang, isSupported, voices]);

    const stop = useCallback(() => {
        window.speechSynthesis.cancel();
        setIsSpeaking(false);
    }, []);

    if (!isSupported) {
        return (
            <span
                title="Trình duyệt không hỗ trợ phát âm"
                className={`inline-flex items-center justify-center text-gray-300 cursor-not-allowed ${className}`}
            >
                <VolumeX size={size} />
            </span>
        );
    }

    return (
        <button
            type="button"
            onClick={isSpeaking ? stop : speak}
            title={isSpeaking ? 'Dừng' : 'Nghe'}
            className={`
                inline-flex items-center justify-center p-1 rounded-full
                transition-all duration-150 hover:bg-primary-100
                ${isSpeaking ? 'text-primary-600 bg-primary-100' : 'text-gray-500 hover:text-primary-600'}
                ${className}
            `}
        >
            {isSpeaking ? (
                <Loader2 size={size} className="animate-spin" />
            ) : (
                <Volume2 size={size} />
            )}
        </button>
    );
}

/**
 * Hook to get available voices (useful for debugging or voice selection UI)
 */
export function useAvailableVoices() {
    const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);

    useEffect(() => {
        if ('speechSynthesis' in window) {
            const loadVoices = () => {
                const allVoices = window.speechSynthesis.getVoices();
                // Filter to Chinese voices
                const chineseVoices = allVoices.filter(
                    v => v.lang.startsWith('zh') || v.lang.includes('Chinese')
                );
                setVoices(chineseVoices);
            };

            loadVoices();
            window.speechSynthesis.onvoiceschanged = loadVoices;
        }
    }, []);

    return voices;
}
