import { massInputToGrams } from './mass-unit.util';

describe('massInputToGrams', () => {
  it('returns value unchanged when unit is g', () => {
    expect(massInputToGrams(250, 'g')).toBe(250);
  });

  it('multiplies by 1000 when unit is kg', () => {
    expect(massInputToGrams(1.5, 'kg')).toBe(1500);
  });

  it('handles zero', () => {
    expect(massInputToGrams(0, 'g')).toBe(0);
    expect(massInputToGrams(0, 'kg')).toBe(0);
  });

  it('handles fractional grams', () => {
    expect(massInputToGrams(0.5, 'g')).toBe(0.5);
  });
});
