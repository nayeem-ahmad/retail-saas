import {
    classifySpeechRecognitionError,
    matchVoiceNav,
    normalizeVoicePhrase,
    speechLocaleFallbackChain,
    speechLocaleToBcp47,
} from './voice-nav';

describe('normalizeVoicePhrase', () => {
    it('lowercases and strips punctuation', () => {
        expect(normalizeVoicePhrase('  Sales Entry!  ')).toBe('sales entry');
    });
});

describe('matchVoiceNav', () => {
    it('matches exact quick-link phrases', () => {
        expect(matchVoiceNav('sales entry')?.route.path).toBe('/sales/new');
        expect(matchVoiceNav('customer payment')?.route.path).toBe('/sales/customer-payments');
        expect(matchVoiceNav('expense entry')?.route.path).toBe('/accounting/expenses?new=1');
    });

    it('matches partial spoken phrases', () => {
        expect(matchVoiceNav('go to sales entry please')?.route.path).toBe('/sales/new');
        expect(matchVoiceNav('open pos')?.route.path).toBe('/sales/pos');
    });

    it('prefers more specific aliases', () => {
        expect(matchVoiceNav('sales entry')?.route.id).toBe('sales-entry');
        expect(matchVoiceNav('all sales')?.route.id).toBe('all-sales');
    });

    it('matches Bangla aliases', () => {
        expect(matchVoiceNav('সেলস এন্ট্রি')?.route.path).toBe('/sales/new');
        expect(matchVoiceNav('খরচ এন্ট্রি')?.route.path).toBe('/accounting/expenses?new=1');
    });

    it('returns null for unrecognized speech', () => {
        expect(matchVoiceNav('')).toBeNull();
        expect(matchVoiceNav('hello world')).toBeNull();
        expect(matchVoiceNav('ab')).toBeNull();
    });
});

describe('speechLocaleToBcp47', () => {
    it('maps app locales to BCP-47 tags', () => {
        expect(speechLocaleToBcp47('en')).toBe('en-US');
        expect(speechLocaleToBcp47('bn')).toBe('bn-BD');
        expect(speechLocaleToBcp47('ms')).toBe('ms-MY');
    });
});

describe('speechLocaleFallbackChain', () => {
    it('falls back to English when primary locale is not en-US', () => {
        expect(speechLocaleFallbackChain('bn')).toEqual(['bn-BD', 'en-US']);
        expect(speechLocaleFallbackChain('ms')).toEqual(['ms-MY', 'en-US']);
    });

    it('does not duplicate English fallback', () => {
        expect(speechLocaleFallbackChain('en')).toEqual(['en-US']);
    });
});

describe('classifySpeechRecognitionError', () => {
    it('maps known browser error codes', () => {
        expect(classifySpeechRecognitionError('network')).toBe('network');
        expect(classifySpeechRecognitionError('audio-capture')).toBe('audio-capture');
        expect(classifySpeechRecognitionError('language-not-supported')).toBe('language-not-supported');
        expect(classifySpeechRecognitionError('something-else')).toBe('other');
    });
});