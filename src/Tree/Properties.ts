export interface IProperties {
  clumpMax?: number;
  clumpMin?: number;
  lengthFalloffFactor?: number;
  lengthFalloffPower?: number;
  branchFactor?: number;
  radiusFalloffRate?: number;
  climbRate?: number;
  trunkKink?: number;
  maxRadius?: number;
  treeSteps?: number;
  taperRate?: number;
  twistRate?: number;
  segments?: number;
  levels?: number;
  sweepAmount?: number;
  initalBranchLength?: number;
  trunkLength?: number;
  dropAmount?: number;
  growAmount?: number;
  vMultiplier?: number;
  twigScale?: number;
  seed?: number;
  rseed?: number;
  random?: (a: number) => number;
}
