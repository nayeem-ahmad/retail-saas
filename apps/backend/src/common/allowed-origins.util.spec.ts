describe('getAllowedOrigins', () => {
    const env = process.env;

    beforeEach(() => {
        process.env = { ...env };
        delete process.env.FRONTEND_URL;
        delete process.env.BACKEND_PUBLIC_URL;
        delete process.env.ALLOWED_ORIGINS;
        delete process.env.NODE_ENV;
        jest.resetModules();
    });

    afterAll(() => {
        process.env = env;
    });

    async function loadUtil() {
        return import('./allowed-origins.util');
    }

    it('defaults to localhost when no env is set', async () => {
        const { getAllowedOrigins } = await loadUtil();
        expect(getAllowedOrigins()).toEqual(['http://localhost:3000']);
    });

    it('includes FRONTEND_URL and BACKEND_PUBLIC_URL origins', async () => {
        process.env.FRONTEND_URL = 'https://app.erp71.com/dashboard';
        process.env.BACKEND_PUBLIC_URL = 'https://api.erp71.com/api/v1';
        const { getAllowedOrigins } = await loadUtil();
        expect(getAllowedOrigins()).toEqual(
            expect.arrayContaining(['https://app.erp71.com', 'https://api.erp71.com']),
        );
    });

    it('includes migration origins in production', async () => {
        process.env.NODE_ENV = 'production';
        process.env.FRONTEND_URL = 'https://app.nayeemahmad.com';
        const { getAllowedOrigins, isAllowedOrigin } = await loadUtil();
        expect(getAllowedOrigins()).toEqual(
            expect.arrayContaining(['https://app.erp71.com', 'https://app.nayeemahmad.com']),
        );
        expect(isAllowedOrigin('https://app.erp71.com')).toBe(true);
    });

    it('parses ALLOWED_ORIGINS as a comma-separated list', async () => {
        process.env.ALLOWED_ORIGINS = 'https://staging.example.com,https://preview.example.com/path';
        const { getAllowedOrigins } = await loadUtil();
        expect(getAllowedOrigins()).toEqual(
            expect.arrayContaining(['https://staging.example.com', 'https://preview.example.com']),
        );
    });
});