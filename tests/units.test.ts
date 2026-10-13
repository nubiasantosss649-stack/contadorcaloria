import {
  cmToFeetInches,
  defaultUnitSystemForRegion,
  feetInchesToCm,
  formatHeight,
  formatWeight,
  kgToLb,
  lbToKg,
  roundTo,
} from '@/lib/units';

describe('units', () => {
  it('converts kg <-> lb', () => {
    expect(roundTo(kgToLb(70), 2)).toBe(154.32);
    expect(roundTo(lbToKg(154.32), 1)).toBe(70);
    expect(lbToKg(kgToLb(82.5))).toBeCloseTo(82.5, 10);
  });

  it('converts cm <-> feet/inches', () => {
    expect(cmToFeetInches(175)).toEqual({ feet: 5, inches: 9 });
    expect(cmToFeetInches(182.88)).toEqual({ feet: 6, inches: 0 });
    expect(feetInchesToCm(5, 9)).toBeCloseTo(175.26, 2);
  });

  it('picks imperial only for imperial regions', () => {
    expect(defaultUnitSystemForRegion('US')).toBe('imperial');
    expect(defaultUnitSystemForRegion('us')).toBe('imperial');
    expect(defaultUnitSystemForRegion('BR')).toBe('metric');
    expect(defaultUnitSystemForRegion('MX')).toBe('metric');
    expect(defaultUnitSystemForRegion(undefined)).toBe('metric');
  });

  it('formats weight and height for each system', () => {
    expect(formatWeight(70, 'metric', 'en-US')).toBe('70 kg');
    expect(formatWeight(70, 'imperial', 'en-US')).toBe('154.3 lb');
    expect(formatWeight(70.5, 'metric', 'pt-BR')).toBe('70,5 kg');
    expect(formatHeight(175, 'imperial', 'en-US')).toBe(`5' 9"`);
    expect(formatHeight(175, 'metric', 'es')).toBe('175 cm');
  });
});
