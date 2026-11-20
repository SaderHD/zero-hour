import {
  Color,
  MeshLambertMaterial,
  ShaderLib,
  type WebGLProgramParametersWithUniforms,
  type WebGLRenderer,
} from 'three';
import { describe, expect, it } from 'vitest';
import { color } from '../palette';
import { emissiveMaterial, flatMaterial } from './materials';

describe('shared materials', () => {
  it('uses flat Lambert shading and vertex colors', () => {
    for (const material of [flatMaterial, emissiveMaterial]) {
      expect(material).toBeInstanceOf(MeshLambertMaterial);
      expect(material.flatShading).toBe(true);
      expect(material.vertexColors).toBe(true);
    }
    expect(flatMaterial.emissive.getHex()).toBe(0);
    expect(emissiveMaterial.emissive.getHex()).toBe(0xffffff);
    expect(emissiveMaterial.emissiveIntensity).toBeGreaterThan(1);
  });

  it('makes the ember emissive cross the HDR bloom threshold', () => {
    const radiance = new Color(color('ember')).multiplyScalar(
      emissiveMaterial.emissiveIntensity,
    );
    const luminance =
      radiance.r * 0.2126 + radiance.g * 0.7152 + radiance.b * 0.0722;

    expect(luminance).toBeGreaterThan(1);
  });

  it('masks emissive radiance per vertex and tints it with vertex color', () => {
    const shader = {
      vertexShader: ShaderLib.lambert.vertexShader,
      fragmentShader: ShaderLib.lambert.fragmentShader,
    };

    emissiveMaterial.onBeforeCompile(
      shader as WebGLProgramParametersWithUniforms,
      {} as WebGLRenderer,
    );

    expect(shader.vertexShader).toContain('attribute float emissiveMask;');
    expect(shader.vertexShader).toContain('varying float vEmissiveMask;');
    expect(shader.vertexShader).toContain('vEmissiveMask = emissiveMask;');
    expect(shader.fragmentShader).toContain('varying float vEmissiveMask;');
    expect(shader.fragmentShader).toContain(
      'totalEmissiveRadiance *= vColor.rgb * vEmissiveMask;',
    );
    expect(emissiveMaterial.customProgramCacheKey()).toBe(
      'lambert-emissive-mask-v1',
    );
  });
});
