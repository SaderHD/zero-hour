export const palette = {
  concrete0: '#2f3735',
  concrete1: '#46504b',
  concrete2: '#606b64',
  concrete3: '#7d8880',

  metal0: '#252c30',
  metal1: '#3b464c',
  metal2: '#59666c',
  metal3: '#7b898e',
  rust0: '#59392e',
  rust1: '#87503a',
  rust2: '#ae704b',

  wood0: '#382d27',
  wood1: '#574437',
  wood2: '#785b45',
  wood3: '#9a7958',

  pine0: '#1f302b',
  pine1: '#30473b',
  pine2: '#47604a',
  grass0: '#465542',
  grass1: '#667054',

  lake0: '#182c38',
  lake1: '#294858',
  sky0: '#111a29',
  sky1: '#24354b',
  sky2: '#455c73',
  moon: '#d6dfcf',

  rot0: '#3e4b3e',
  rot1: '#59654c',
  rot2: '#778064',
  rot3: '#98a07d',

  clothWorker: '#5c5145',
  clothSoldier: '#4b5544',
  clothLab: '#a4aaa0',
  clothCook: '#766962',

  blood: '#8f2f35',
  ember: '#f07a3c',
  ion: '#72e39a',
  frost: '#80c8e8',
  shock: '#f2db4d',
  gold: '#d2a84a',

  perkIronhide: '#b33a4b',
  perkQuickhand: '#9dcc4d',
  perkSecondWind: '#43c6c8',
  perkTwinTrigger: '#e5a33c',
  perkLongStride: '#65a9dd',
  perkBlastShield: '#9b6bd6',
  perkPackMule: '#89914a',
  perkSteadyEye: '#e4dcc4',
  perkStaticSpark: '#f5e75a',
} as const;

export type PaletteName = keyof typeof palette;

export function color(name: PaletteName): string {
  return palette[name];
}
