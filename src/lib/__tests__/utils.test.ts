import { cn } from '../utils'; // Adjust path as necessary

describe('cn utility function', () => {
  it('should combine basic string class names', () => {
    expect(cn('foo', 'bar')).toBe('foo bar');
  });

  it('should handle conditional class names with objects', () => {
    expect(cn('foo', { bar: true, baz: false })).toBe('foo bar');
  });

  it('should handle conditional class names with arrays', () => {
    expect(cn(['foo', { bar: true, baz: false }])).toBe('foo bar');
  });

  it('should correctly merge conflicting Tailwind CSS classes', () => {
    // tailwind-merge behavior: the last conflicting class wins
    expect(cn('p-4', 'p-2')).toBe('p-2');
    expect(cn('m-4', 'm-2', 'p-4', 'p-2')).toBe('m-2 p-2');
    expect(cn('text-red-500', 'text-blue-500')).toBe('text-blue-500');
    expect(cn('bg-red-500', 'p-4', 'bg-blue-500')).toBe('p-4 bg-blue-500'); // Order matters for non-conflicting
  });

  it('should handle mixed types including null, undefined, and booleans', () => {
    expect(cn('foo', null, 'bar', undefined, { baz: true, qux: false })).toBe('foo bar baz');
    expect(cn(true && 'foo', false && 'bar', 'baz')).toBe('foo baz');
  });

  it('should handle deeply nested arrays', () => {
    expect(cn('a', ['b', { c: true, d: false }, ['e', { f: true }]])).toBe('a b c e f');
  });

  it('should return an empty string if no truthy values are provided', () => {
    expect(cn(null, undefined, false, { foo: false })).toBe('');
  });

  // Example from tailwind-merge documentation for conflicting classes
  it('should correctly merge text size and color', () => {
    expect(cn('text-lg', 'text-black', 'text-xl')).toBe('text-black text-xl');
  });

  it('should handle more complex Tailwind conflicts', () => {
    expect(cn('block', 'inline-block')).toBe('inline-block'); // display conflict
    expect(cn('w-10', 'w-12')).toBe('w-12'); // width conflict
    expect(cn('pt-2', 'p-4')).toBe('p-4'); // padding conflict (broader overrides specific if later) - actually, p-4 sets all paddings
    expect(cn('p-4', 'pt-2')).toBe('p-4 pt-2'); // p-4 sets all, pt-2 overrides padding-top
    expect(cn('px-4', 'pl-2')).toBe('px-4 pl-2'); // pl-2 overrides the left part of px-4
    expect(cn('py-4', 'pb-2', 'pt-6')).toBe('py-4 pb-2 pt-6'); // Check multiple overrides
  });
});
