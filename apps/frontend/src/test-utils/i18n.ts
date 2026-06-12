import { enMessages } from '@/lib/localization/messages/en';

export function mockUseI18n() {
    return {
        locale: 'en' as const,
        setLocale: jest.fn(),
        locales: [],
        localeInfo: { code: 'en', label: 'English', nativeLabel: 'English', htmlLang: 'en', dir: 'ltr' as const, numberLocale: 'en-US', dateLocale: 'en-GB', enabled: true },
        t: enMessages,
    };
}

export function setupI18nMock() {
    jest.mock('@/lib/i18n', () => ({
        useI18n: () => mockUseI18n(),
        formatMessage: (template: string, values: Record<string, string | number>) =>
            Object.entries(values).reduce(
                (result, [key, value]) => result.replaceAll(`{${key}}`, String(value)),
                template,
            ),
        I18nProvider: ({ children }: { children: React.ReactNode }) => children,
    }));
}