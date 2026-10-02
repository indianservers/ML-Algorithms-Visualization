import { describe, expect, it } from 'vitest';
import { POSE_FEATURE_SIZE, poseFeatureVector, splitPoseSamples } from '../src/features/computer-vision/utils/poseClassifier';

function samplePose(offsetX = 0, offsetY = 0, scale = 1) {
  return Array.from({ length: 33 }, (_, index) => ({
    x: offsetX + scale * (0.3 + (index % 5) * 0.08),
    y: offsetY + scale * (0.2 + Math.floor(index / 5) * 0.07),
    z: scale * (index % 3) * 0.01,
    visibility: 1,
  }));
}

describe('custom pose classifier features', () => {
  it('uses stable, finite features despite translation and scale', () => {
    const first = poseFeatureVector(samplePose());
    const shifted = poseFeatureVector(samplePose(0.12, -0.07, 0.7));
    expect(first).toHaveLength(POSE_FEATURE_SIZE);
    expect(shifted).toHaveLength(POSE_FEATURE_SIZE);
    first.forEach((value, index) => expect(shifted[index]).toBeCloseTo(value, 5));
  });

  it('rejects incomplete or unclear poses', () => {
    expect(poseFeatureVector(samplePose().slice(0, 30))).toEqual([]);
    const hidden = samplePose();
    hidden[11]!.visibility = 0.1;
    expect(poseFeatureVector(hidden)).toEqual([]);
  });

  it('reserves validation examples from every class when enough exist', () => {
    const rows = ['standing', 'raised'].flatMap((classId) => Array.from({ length: 10 }, (_, index) => ({ classId, embedding: [index] })));
    const split = splitPoseSamples(rows, ['standing', 'raised'], 0.2);
    expect(split.training).toHaveLength(16);
    expect(split.validation).toHaveLength(4);
    expect(split.validation.map((row) => row.classId)).toEqual(['standing', 'standing', 'raised', 'raised']);
    const small = splitPoseSamples(rows.slice(0, 12), ['standing', 'raised'], 0.2);
    expect(small.training).toHaveLength(12);
    expect(small.validation).toHaveLength(0);
  });
});
