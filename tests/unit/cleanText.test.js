const cleanText = require('../../src/preprocess/cleanText');

describe('cleanText', () => {
  test('returns empty string for falsy input', () => {
    expect(cleanText(null)).toBe('');
    expect(cleanText(undefined)).toBe('');
    expect(cleanText('')).toBe('');
  });

  test('decodes common HTML entities', () => {
    expect(cleanText('&amp;')).toBe('&');
    expect(cleanText('&lt;')).toBe('<');
    expect(cleanText('&gt;')).toBe('>');
    expect(cleanText('&quot;')).toBe('"');
    expect(cleanText('&#39;')).toBe("'");
    expect(cleanText('hello&nbsp;world')).toBe('hello world');
  });

  test('collapses multiple whitespace into a single space', () => {
    expect(cleanText('hello   world')).toBe('hello world');
    expect(cleanText('hello\n\nworld')).toBe('hello world');
    expect(cleanText('  leading and trailing  ')).toBe('leading and trailing');
  });

  test('strips non-printable control characters', () => {
    expect(cleanText('hello\x00world')).toBe('helloworld');
    expect(cleanText('tab\x09between')).toBe('tab between'); // \x09 is tab → collapsed to space
    expect(cleanText('\x1Fhidden')).toBe('hidden');
  });

  test('preserves normal punctuation and special characters', () => {
    const input = 'Hello, World! How are you? 100% OK.';
    expect(cleanText(input)).toBe(input);
  });

  test('handles mixed entities and whitespace', () => {
    const result = cleanText('foo &amp;&amp;  bar&nbsp;baz');
    expect(result).toBe('foo && bar baz');
  });
});
