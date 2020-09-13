import { IProperties } from './Properties';
import { normalize, cross, subVec, addVec, scaleVec, dot } from './mathHelpers';

export class Branch {
  head: [number, number, number];

  parent: Branch;

  child0: Branch;

  child1: Branch;

  length?: number;

  type: string;

  radius?: number;

  root: number[];

  ring0: number[];

  ring1: number[];

  ring2: number[];

  tangent: [number, number, number];

  end?: number;

  constructor(head: [number, number, number], parent?: Branch) {
    this.head = head;
    this.parent = parent;
    this.child0 = null;
    this.child1 = null;
    // this.parent = null;
    // this.head = null;
    this.length = 1;
  }

  mirrorBranch = (
    vec: number[],
    norm: number[],
    properties: IProperties,
  ): [number, number, number] => {
    const v = cross(norm, cross(vec, norm));
    const s = properties.branchFactor * dot(v, vec);
    return [vec[0] - v[0] * s, vec[1] - v[1] * s, vec[2] - v[2] * s];
  };

  split = (_level: number, _steps: number, properties: IProperties, _l1?: number, _l2?: number) => {
    const defaultValue = (v: number, d: number) => (!v && v !== 0 ? d : v);
    const l1 = defaultValue(_l1, 1);
    const l2 = defaultValue(_l2, 1);
    const level = defaultValue(_level, properties.levels);
    const steps = defaultValue(_steps, properties.treeSteps);
    const rLevel = properties.levels - level;
    let po;
    if (this.parent) {
      po = this.parent.head;
    } else {
      po = [0, 0, 0];
      this.type = 'trunk';
    }
    const so = this.head;
    const dir = normalize(subVec(so, po));

    const normal = cross(dir, [dir[2], dir[0], dir[1]]);
    const tangent = cross(dir, normal);
    const r = properties.random(rLevel * 10 + l1 * 5 + l2 + properties.seed);
    // const r2 = properties.random(rLevel * 10 + l1 * 5 + l2 + 1 + properties.seed);
    const clumpmax = properties.clumpMax;
    const clumpmin = properties.clumpMin;

    let adj = addVec(scaleVec(normal, r), scaleVec(tangent, 1 - r));
    if (r > 0.5) adj = scaleVec(adj, -1);

    const clump = (clumpmax - clumpmin) * r + clumpmin;
    let newdir = normalize(addVec(scaleVec(adj, 1 - clump), scaleVec(dir, clump)));

    let newdir2 = this.mirrorBranch(newdir, dir, properties);
    if (r > 0.5) {
      const tmp = newdir;
      newdir = newdir2;
      newdir2 = tmp;
    }
    if (steps > 0) {
      const angle = (steps / properties.treeSteps) * 2 * Math.PI * properties.twistRate;
      newdir2 = normalize([Math.sin(angle), r, Math.cos(angle)]);
    }

    const growAmount =
      ((level * level) / (properties.levels * properties.levels)) * properties.growAmount;
    const dropAmount = rLevel * properties.dropAmount;
    const sweepAmount = rLevel * properties.sweepAmount;
    newdir = normalize(addVec(newdir, [sweepAmount, dropAmount + growAmount, 0]));
    newdir2 = normalize(addVec(newdir2, [sweepAmount, dropAmount + growAmount, 0]));

    const head0 = addVec(so, scaleVec(newdir, this.length));
    const head1 = addVec(so, scaleVec(newdir2, this.length));
    this.child0 = new Branch(head0, this);
    this.child1 = new Branch(head1, this);
    this.child0.length =
      this.length ** properties.lengthFalloffPower * properties.lengthFalloffFactor;
    this.child1.length =
      this.length ** properties.lengthFalloffPower * properties.lengthFalloffFactor;
    if (level > 0) {
      if (steps > 0) {
        this.child0.head = addVec(this.head, [
          (r - 0.5) * 2 * properties.trunkKink,
          properties.climbRate,
          (r - 0.5) * 2 * properties.trunkKink,
        ]);
        this.child0.type = 'trunk';
        this.child0.length = this.length * properties.taperRate;
        this.child0.split(level, steps - 1, properties, l1 + 1, l2);
      } else {
        this.child0.split(level - 1, 0, properties, l1 + 1, l2);
      }
      this.child1.split(level - 1, 0, properties, l1, l2 + 1);
    }
  };
}
