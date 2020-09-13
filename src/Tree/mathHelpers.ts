export const dot = (v1: number[], v2: number[]): number => {
  return v1[0] * v2[0] + v1[1] * v2[1] + v1[2] * v2[2];
};

export const cross = (v1: number[], v2: number[]): [number, number, number] => {
  return [
    v1[1] * v2[2] - v1[2] * v2[1],
    v1[2] * v2[0] - v1[0] * v2[2],
    v1[0] * v2[1] - v1[1] * v2[0],
  ];
};

export const length = (v: number[]): number => {
  return Math.sqrt(v[0] * v[0] + v[1] * v[1] + v[2] * v[2]);
};

export const scaleVec = (v: number[], s: number): [number, number, number] => {
  return [v[0] * s, v[1] * s, v[2] * s];
};
export const subVec = (v1: number[], v2: number[]): [number, number, number] => {
  return [v1[0] - v2[0], v1[1] - v2[1], v1[2] - v2[2]];
};
export const addVec = (v1: number[], v2: number[]): [number, number, number] => {
  return [v1[0] + v2[0], v1[1] + v2[1], v1[2] + v2[2]];
};

export const normalize = (v: number[]): [number, number, number] => {
  const l = length(v);
  return scaleVec(v, 1 / l);
};

export const vecAxisAngle = (
  vec: number[],
  axis: number[],
  angle: number,
): [number, number, number] => {
  // v cos(T) + (axis x v) * sin(T) + axis*(axis . v)(1-cos(T)
  const cosr = Math.cos(angle);
  const sinr = Math.sin(angle);
  return addVec(
    addVec(scaleVec(vec, cosr), scaleVec(cross(axis, vec), sinr)),
    scaleVec(axis, dot(axis, vec) * (1 - cosr)),
  );
};

export const scaleInDirection = (
  vector: number[],
  direction: number[],
  scale: number,
): [number, number, number] => {
  const currentMag = dot(vector, direction);
  const change = scaleVec(direction, currentMag * scale - currentMag);
  return addVec(vector, change);
};
