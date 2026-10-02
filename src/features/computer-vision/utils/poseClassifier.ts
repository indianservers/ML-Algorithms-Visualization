import { angleAt, type Xyz } from './landmarkGeometry';

export const POSE_FEATURE_SIZE = 140;
const CORE_JOINTS = [11, 12, 23, 24];
const ANGLES: Array<[number, number, number]> = [
  [11, 13, 15], [12, 14, 16], [13, 11, 23], [14, 12, 24],
  [11, 23, 25], [12, 24, 26], [23, 25, 27], [24, 26, 28],
];

/** Translation- and scale-normalized pose features for a small browser classifier. */
export function poseFeatureVector(points: Xyz[]): number[] {
  if (points.length !== 33 || CORE_JOINTS.some((index) => (points[index]?.visibility ?? 1) < 0.35)) return [];
  const leftHip = points[23]!;
  const rightHip = points[24]!;
  const leftShoulder = points[11]!;
  const rightShoulder = points[12]!;
  const center = {
    x: (leftHip.x + rightHip.x) / 2,
    y: (leftHip.y + rightHip.y) / 2,
    z: ((leftHip.z ?? 0) + (rightHip.z ?? 0)) / 2,
  };
  const shoulderCenter = { x: (leftShoulder.x + rightShoulder.x) / 2, y: (leftShoulder.y + rightShoulder.y) / 2 };
  const shoulderWidth = Math.hypot(leftShoulder.x - rightShoulder.x, leftShoulder.y - rightShoulder.y);
  const hipWidth = Math.hypot(leftHip.x - rightHip.x, leftHip.y - rightHip.y);
  const torso = Math.hypot(shoulderCenter.x - center.x, shoulderCenter.y - center.y);
  const scale = Math.max(shoulderWidth, hipWidth, torso * 2, 1e-3);
  const coordinates = points.flatMap((point) => {
    const visibility = Math.max(0, Math.min(1, point.visibility ?? 1));
    if (visibility < 0.25) return [0, 0, 0, visibility];
    return [
      (point.x - center.x) / scale,
      (point.y - center.y) / scale,
      ((point.z ?? 0) - center.z) / scale,
      visibility,
    ];
  });
  const angles = ANGLES.map(([a, b, c]) => (angleAt(points[a], points[b], points[c]) ?? 0) / 180);
  const vector = [...coordinates, ...angles];
  return vector.length === POSE_FEATURE_SIZE && vector.every(Number.isFinite) ? vector : [];
}

export interface PoseTrainingSample { classId: string; embedding: number[] }

/** Reserve examples from every class for validation, instead of slicing one class off the end. */
export function splitPoseSamples<T extends PoseTrainingSample>(samples: T[], classIds: string[], validationFraction: number) {
  if (validationFraction <= 0 || classIds.some((id) => samples.filter((sample) => sample.classId === id).length < 5)) {
    return { training: samples, validation: [] as T[] };
  }
  const training: T[] = [];
  const validation: T[] = [];
  for (const id of classIds) {
    const group = samples.filter((sample) => sample.classId === id);
    const validationCount = group.length >= 5 ? Math.min(group.length - 2, Math.max(1, Math.round(group.length * validationFraction))) : 0;
    validation.push(...group.slice(0, validationCount));
    training.push(...group.slice(validationCount));
  }
  return { training, validation };
}
