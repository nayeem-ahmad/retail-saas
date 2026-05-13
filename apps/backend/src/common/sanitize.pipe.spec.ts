import { SanitizePipe } from './sanitize.pipe';

describe('SanitizePipe', () => {
    let pipe: SanitizePipe;

    beforeEach(() => {
        pipe = new SanitizePipe();
    });

    const meta: any = { type: 'body', metatype: Object, data: '' };

    it('strips HTML tags from plain strings', () => {
        expect(pipe.transform('<b>hello</b>', meta)).toBe('hello');
        expect(pipe.transform('<script>alert(1)</script>hello', meta)).toBe('alert(1)hello');
    });

    it('strips tags from nested object fields', () => {
        const result = pipe.transform({ name: '<b>Widget</b>', price: 99 }, meta) as any;
        expect(result.name).toBe('Widget');
        expect(result.price).toBe(99);
    });

    it('strips tags from strings inside arrays', () => {
        const result = pipe.transform(['<em>a</em>', 'b'], meta) as string[];
        expect(result).toEqual(['a', 'b']);
    });

    it('passes non-string primitives through unchanged', () => {
        expect(pipe.transform(42, meta)).toBe(42);
        expect(pipe.transform(true, meta)).toBe(true);
        expect(pipe.transform(null, meta)).toBeNull();
    });

    it('trims surrounding whitespace from strings', () => {
        expect(pipe.transform('  hello  ', meta)).toBe('hello');
    });
});
