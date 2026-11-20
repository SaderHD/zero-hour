import { MeshLambertMaterial } from 'three';

export const flatMaterial = new MeshLambertMaterial({
  flatShading: true,
  vertexColors: true,
});
flatMaterial.name = 'flat-lambert';

export const emissiveMaterial = new MeshLambertMaterial({
  emissive: 0xffffff,
  emissiveIntensity: 2,
  flatShading: true,
  vertexColors: true,
});
emissiveMaterial.name = 'emissive-lambert';
emissiveMaterial.onBeforeCompile = (shader) => {
  shader.vertexShader = shader.vertexShader
    .replace(
      '#include <common>',
      `#include <common>
attribute float emissiveMask;
varying float vEmissiveMask;`,
    )
    .replace(
      '#include <begin_vertex>',
      `#include <begin_vertex>
vEmissiveMask = emissiveMask;`,
    );
  shader.fragmentShader = shader.fragmentShader
    .replace(
      '#include <common>',
      `#include <common>
varying float vEmissiveMask;`,
    )
    .replace(
      '#include <emissivemap_fragment>',
      `#include <emissivemap_fragment>
totalEmissiveRadiance *= vColor.rgb * vEmissiveMask;`,
    );
};
emissiveMaterial.customProgramCacheKey = () => 'lambert-emissive-mask-v1';
