import { describe, expect, it } from 'vitest';
import { color, palette } from './palette';

const expectedNames = [
  'concrete0',
  'concrete1',
  'concrete2',
  'concrete3',
  'metal0',
  'metal1',
  'metal2',
  'metal3',
  'rust0',
  'rust1',
  'rust2',
  'wood0',
  'wood1',
  'wood2',
  'wood3',
  'pine0',
  'pine1',
  'pine2',
  'grass0',
  'grass1',
  'lake0',
  'lake1',
  'sky0',
  'sky1',
  'sky2',
  'moon',
  'rot0',
  'rot1',
  'rot2',
  'rot3',
  'clothWorker',
  'clothSoldier',
  'clothLab',
  'clothCook',
  'blood',
  'ember',
  'ion',
  'frost',
  'shock',
  'gold',
  'perkIronhide',
  'perkQuickhand',
  'perkSecondWind',
  'perkTwinTrigger',
  'perkLongStride',
  'perkBlastShield',
  'perkPackMule',
  'perkSteadyEye',
  'perkStaticSpark',
] as const;

describe('palette', () => {
  it('resolves every named color', () => {
    expect(Object.keys(palette).sort()).toEqual([...expectedNames].sort());

    for (const name of expectedNames) {
      expect(color(name)).toMatch(/^#[\da-f]{6}$/i);
    }
  });

  it('has no duplicate colors', () => {
    const colors = Object.values(palette);
    expect(new Set(colors).size).toBe(colors.length);
  });
});
