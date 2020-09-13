/* eslint-disable max-classes-per-file */
/*
proctree.js
Copyright (c) 2012, Paul Brunt
All rights reserved.

Redistribution and use in source and binary forms, with or without
modification, are permitted provided that the following conditions are met:
    * Redistributions of source code must retain the above copyright
      notice, this list of conditions and the following disclaimer.
    * Redistributions in binary form must reproduce the above copyright
      notice, this list of conditions and the following disclaimer in the
      documentation and/or other materials provided with the distribution.
    * Neither the name of tree.js nor the
      names of its contributors may be used to endorse or promote products
      derived from this software without specific prior written permission.

THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND
ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED
WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE
DISCLAIMED. IN NO EVENT SHALL PAUL BRUNT BE LIABLE FOR ANY
DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES
(INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES;
LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND
ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
(INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS
SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
*/

import {
  normalize,
  cross,
  subVec,
  addVec,
  scaleVec,
  dot,
  length,
  scaleInDirection,
  vecAxisAngle,
} from './mathHelpers';
import { IProperties } from './Properties';
import { Branch } from './Branch';

export class Tree {
  properties: IProperties;

  root: Branch;

  normals: [number, number, number][];

  faces: [number, number, number][];

  verts: [number, number, number][];

  UV: [number, number][];

  vertsTwig: [number, number, number][];

  normalsTwig: [number, number, number][];

  facesTwig: [number, number, number][];

  uvsTwig: [number, number][];

  constructor(data: IProperties) {
    this.properties = {
      ...this.getDefaultProperties(),
      ...data,
    };
    this.properties.rseed = this.properties.seed;
    this.root = new Branch([0, this.properties.trunkLength, 0]);
    this.root.length = this.properties.initalBranchLength;
    this.verts = [];
    this.faces = [];
    this.normals = [];
    this.UV = [];
    this.vertsTwig = [];
    this.normalsTwig = [];
    this.facesTwig = [];
    this.uvsTwig = [];
    this.root.split(null, null, this.properties);
    this.createForks();
    this.createTwigs();
    this.doFaces();
    this.calcNormals();
  }

  getDefaultProperties = (): IProperties => ({
    clumpMax: 0.8,
    clumpMin: 0.5,
    lengthFalloffFactor: 0.85,
    lengthFalloffPower: 1,
    branchFactor: 2.0,
    radiusFalloffRate: 0.6,
    climbRate: 1.5,
    trunkKink: 0.0,
    maxRadius: 0.25,
    treeSteps: 2,
    taperRate: 0.95,
    twistRate: 13,
    segments: 6,
    levels: 3,
    sweepAmount: 0,
    initalBranchLength: 0.85,
    trunkLength: 2.5,
    dropAmount: 0.0,
    growAmount: 0.0,
    vMultiplier: 0.2,
    twigScale: 2.0,
    seed: 10,
    rseed: 10,
    random(a) {
      if (!a) a = this.rseed++;
      return Math.abs(Math.cos(a + a * a));
    },
  });

  calcNormals = (): void => {
    const { normals, faces, verts } = this;
    const allNormals = [];
    for (let i = 0; i < verts.length; i++) {
      allNormals[i] = [];
    }
    for (let i = 0; i < faces.length; i++) {
      const face = faces[i];
      const norm = normalize(
        cross(subVec(verts[face[1]], verts[face[2]]), subVec(verts[face[1]], verts[face[0]])),
      );
      allNormals[face[0]].push(norm);
      allNormals[face[1]].push(norm);
      allNormals[face[2]].push(norm);
    }
    for (let i = 0; i < allNormals.length; i++) {
      let total: [number, number, number] = [0, 0, 0];
      const l = allNormals[i].length;
      for (let j = 0; j < l; j++) {
        total = addVec(total, scaleVec(allNormals[i][j], 1 / l));
      }
      normals[i] = total;
    }
  };

  doFaces = (_branch?: Branch): void => {
    const branch = _branch || this.root;
    const { segments } = this.properties;
    const { faces, verts, UV } = this;
    if (!branch.parent) {
      for (let i = 0; i < verts.length; i++) {
        UV[i] = [0, 0];
      }
      const tangent = normalize(
        cross(subVec(branch.child0.head, branch.head), subVec(branch.child1.head, branch.head)),
      );
      const normal = normalize(branch.head);
      let angle = Math.acos(dot(tangent, [-1, 0, 0]));
      if (dot(cross([-1, 0, 0], tangent), normal) > 0) angle = 2 * Math.PI - angle;
      const segOffset = Math.round((angle / Math.PI / 2) * segments);
      for (let i = 0; i < segments; i++) {
        const v1 = branch.ring0[i];
        const v2 = branch.root[(i + segOffset + 1) % segments];
        const v3 = branch.root[(i + segOffset) % segments];
        const v4 = branch.ring0[(i + 1) % segments];

        faces.push([v1, v4, v3]);
        faces.push([v4, v2, v3]);
        UV[(i + segOffset) % segments] = [Math.abs(i / segments - 0.5) * 2, 0];
        const len =
          length(subVec(verts[branch.ring0[i]], verts[branch.root[(i + segOffset) % segments]])) *
          this.properties.vMultiplier;
        UV[branch.ring0[i]] = [Math.abs(i / segments - 0.5) * 2, len];
        UV[branch.ring2[i]] = [Math.abs(i / segments - 0.5) * 2, len];
      }
    }

    if (branch.child0.ring0) {
      let segOffset0;
      let segOffset1;
      let match0;
      let match1;

      let v1 = normalize(subVec(verts[branch.ring1[0]], branch.head));
      let v2 = normalize(subVec(verts[branch.ring2[0]], branch.head));

      v1 = scaleInDirection(v1, normalize(subVec(branch.child0.head, branch.head)), 0);
      v2 = scaleInDirection(v2, normalize(subVec(branch.child1.head, branch.head)), 0);

      for (let i = 0; i < segments; i++) {
        let d = normalize(subVec(verts[branch.child0.ring0[i]], branch.child0.head));
        let l = dot(d, v1);
        if (segOffset0 === undefined || l > match0) {
          match0 = l;
          segOffset0 = segments - i;
        }
        d = normalize(subVec(verts[branch.child1.ring0[i]], branch.child1.head));
        l = dot(d, v2);
        if (segOffset1 === undefined || l > match1) {
          match1 = l;
          segOffset1 = segments - i;
        }
      }

      const UVScale = this.properties.maxRadius / branch.radius;

      for (let i = 0; i < segments; i++) {
        const vv1 = branch.child0.ring0[i];
        const vv2 = branch.ring1[(i + segOffset0 + 1) % segments];
        const vv3 = branch.ring1[(i + segOffset0) % segments];
        const vv4 = branch.child0.ring0[(i + 1) % segments];
        faces.push([vv1, vv4, vv3]);
        faces.push([vv4, vv2, vv3]);
        const vvv1 = branch.child1.ring0[i];
        const vvv2 = branch.ring2[(i + segOffset1 + 1) % segments];
        const vvv3 = branch.ring2[(i + segOffset1) % segments];
        const vvv4 = branch.child1.ring0[(i + 1) % segments];
        faces.push([vvv1, vvv2, vvv3]);
        faces.push([vvv1, vvv4, vvv2]);

        const len1 =
          length(
            subVec(verts[branch.child0.ring0[i]], verts[branch.ring1[(i + segOffset0) % segments]]),
          ) * UVScale;
        const uv1 = UV[branch.ring1[(i + segOffset0 - 1) % segments]];

        UV[branch.child0.ring0[i]] = [uv1[0], uv1[1] + len1 * this.properties.vMultiplier];
        UV[branch.child0.ring2[i]] = [uv1[0], uv1[1] + len1 * this.properties.vMultiplier];

        const len2 =
          length(
            subVec(verts[branch.child1.ring0[i]], verts[branch.ring2[(i + segOffset1) % segments]]),
          ) * UVScale;
        const uv2 = UV[branch.ring2[(i + segOffset1 - 1) % segments]];

        UV[branch.child1.ring0[i]] = [uv2[0], uv2[1] + len2 * this.properties.vMultiplier];
        UV[branch.child1.ring2[i]] = [uv2[0], uv2[1] + len2 * this.properties.vMultiplier];
      }

      this.doFaces(branch.child0);
      this.doFaces(branch.child1);
    } else {
      for (let i = 0; i < segments; i++) {
        faces.push([branch.child0.end, branch.ring1[(i + 1) % segments], branch.ring1[i]]);
        faces.push([branch.child1.end, branch.ring2[(i + 1) % segments], branch.ring2[i]]);

        let len = length(subVec(verts[branch.child0.end], verts[branch.ring1[i]]));
        UV[branch.child0.end] = [
          Math.abs(i / segments - 1 - 0.5) * 2,
          len * this.properties.vMultiplier,
        ];
        len = length(subVec(verts[branch.child1.end], verts[branch.ring2[i]]));
        UV[branch.child1.end] = [
          Math.abs(i / segments - 0.5) * 2,
          len * this.properties.vMultiplier,
        ];
      }
    }
  };

  createTwigs = (_branch?: Branch): void => {
    const branch = _branch || this.root;
    const { vertsTwig, normalsTwig, facesTwig, uvsTwig } = this;

    if (!branch.child0) {
      const tangent = normalize(
        cross(
          subVec(branch.parent.child0.head, branch.parent.head),
          subVec(branch.parent.child1.head, branch.parent.head),
        ),
      );
      const binormal = normalize(subVec(branch.head, branch.parent.head));
      let normal = cross(tangent, binormal);

      const vert1 = vertsTwig.length;
      vertsTwig.push(
        addVec(
          addVec(branch.head, scaleVec(tangent, this.properties.twigScale)),
          scaleVec(binormal, this.properties.twigScale * 2 - branch.length),
        ),
      );
      const vert2 = vertsTwig.length;
      vertsTwig.push(
        addVec(
          addVec(branch.head, scaleVec(tangent, -this.properties.twigScale)),
          scaleVec(binormal, this.properties.twigScale * 2 - branch.length),
        ),
      );
      const vert3 = vertsTwig.length;
      vertsTwig.push(
        addVec(
          addVec(branch.head, scaleVec(tangent, -this.properties.twigScale)),
          scaleVec(binormal, -branch.length),
        ),
      );
      const vert4 = vertsTwig.length;
      vertsTwig.push(
        addVec(
          addVec(branch.head, scaleVec(tangent, this.properties.twigScale)),
          scaleVec(binormal, -branch.length),
        ),
      );

      const vert8 = vertsTwig.length;
      vertsTwig.push(
        addVec(
          addVec(branch.head, scaleVec(tangent, this.properties.twigScale)),
          scaleVec(binormal, this.properties.twigScale * 2 - branch.length),
        ),
      );
      const vert7 = vertsTwig.length;
      vertsTwig.push(
        addVec(
          addVec(branch.head, scaleVec(tangent, -this.properties.twigScale)),
          scaleVec(binormal, this.properties.twigScale * 2 - branch.length),
        ),
      );
      const vert6 = vertsTwig.length;
      vertsTwig.push(
        addVec(
          addVec(branch.head, scaleVec(tangent, -this.properties.twigScale)),
          scaleVec(binormal, -branch.length),
        ),
      );
      const vert5 = vertsTwig.length;
      vertsTwig.push(
        addVec(
          addVec(branch.head, scaleVec(tangent, this.properties.twigScale)),
          scaleVec(binormal, -branch.length),
        ),
      );

      facesTwig.push([vert1, vert2, vert3]);
      facesTwig.push([vert4, vert1, vert3]);

      facesTwig.push([vert6, vert7, vert8]);
      facesTwig.push([vert6, vert8, vert5]);

      normal = normalize(
        cross(
          subVec(vertsTwig[vert1], vertsTwig[vert3]),
          subVec(vertsTwig[vert2], vertsTwig[vert3]),
        ),
      );
      const normal2 = normalize(
        cross(
          subVec(vertsTwig[vert7], vertsTwig[vert6]),
          subVec(vertsTwig[vert8], vertsTwig[vert6]),
        ),
      );

      normalsTwig.push(normal);
      normalsTwig.push(normal);
      normalsTwig.push(normal);
      normalsTwig.push(normal);

      normalsTwig.push(normal2);
      normalsTwig.push(normal2);
      normalsTwig.push(normal2);
      normalsTwig.push(normal2);

      uvsTwig.push([0, 1]);
      uvsTwig.push([1, 1]);
      uvsTwig.push([1, 0]);
      uvsTwig.push([0, 0]);

      uvsTwig.push([0, 1]);
      uvsTwig.push([1, 1]);
      uvsTwig.push([1, 0]);
      uvsTwig.push([0, 0]);
    } else {
      this.createTwigs(branch.child0);
      this.createTwigs(branch.child1);
    }
  };

  createForks = (_branch?: Branch, _radius?: number): void => {
    const branch = _branch || this.root;
    let radius = _radius || this.properties.maxRadius;

    branch.radius = radius;

    if (radius > branch.length) radius = branch.length;

    const { verts } = this;
    const { segments } = this.properties;

    const segmentAngle = (Math.PI * 2) / segments;

    if (!branch.parent) {
      // create the root of the tree
      branch.root = [];
      const axis = [0, 1, 0];
      for (let i = 0; i < segments; i++) {
        const vec = vecAxisAngle([-1, 0, 0], axis, -segmentAngle * i);
        branch.root.push(verts.length);
        verts.push(scaleVec(vec, radius / this.properties.radiusFalloffRate));
      }
    }

    // cross the branches to get the left
    // add the branches to get the up
    if (branch.child0) {
      const axis = branch.parent
        ? normalize(subVec(branch.head, branch.parent.head))
        : normalize(branch.head);

      const axis1 = normalize(subVec(branch.head, branch.child0.head));
      const axis2 = normalize(subVec(branch.head, branch.child1.head));
      const tangent = normalize(cross(axis1, axis2));
      branch.tangent = tangent;

      const axis3 = normalize(
        cross(tangent, normalize(addVec(scaleVec(axis1, -1), scaleVec(axis2, -1)))),
      );
      const dir = [axis2[0], 0, axis2[2]];
      const centerloc = addVec(branch.head, scaleVec(dir, -this.properties.maxRadius / 2));

      branch.ring0 = [];
      branch.ring1 = [];
      branch.ring2 = [];
      const { ring0 } = branch;
      const { ring1 } = branch;
      const { ring2 } = branch;

      let scale = this.properties.radiusFalloffRate;

      if (branch.child0.type === 'trunk' || branch.type === 'trunk') {
        scale = 1 / this.properties.taperRate;
      }

      // main segment ring
      const linch0 = verts.length;
      ring0.push(linch0);
      ring2.push(linch0);
      verts.push(addVec(centerloc, scaleVec(tangent, radius * scale)));

      let start = verts.length - 1;
      const d1 = vecAxisAngle(tangent, axis2, 1.57);
      const d2 = normalize(cross(tangent, axis));
      const s = 1 / dot(d1, d2);
      for (let i = 1; i < segments / 2; i++) {
        let vec = vecAxisAngle(tangent, axis2, segmentAngle * i);
        ring0.push(start + i);
        ring2.push(start + i);
        vec = scaleInDirection(vec, d2, s);
        verts.push(addVec(centerloc, scaleVec(vec, radius * scale)));
      }
      const linch1 = verts.length;
      ring0.push(linch1);
      ring1.push(linch1);
      verts.push(addVec(centerloc, scaleVec(tangent, -radius * scale)));
      for (let i = segments / 2 + 1; i < segments; i++) {
        const vec = vecAxisAngle(tangent, axis1, segmentAngle * i);
        ring0.push(verts.length);
        ring1.push(verts.length);
        verts.push(addVec(centerloc, scaleVec(vec, radius * scale)));
      }
      ring1.push(linch0);
      ring2.push(linch1);
      start = verts.length - 1;
      for (let i = 1; i < segments / 2; i++) {
        const vec = vecAxisAngle(tangent, axis3, segmentAngle * i);
        ring1.push(start + i);
        ring2.push(start + (segments / 2 - i));
        const v = scaleVec(vec, radius * scale);
        verts.push(addVec(centerloc, v));
      }

      // child radius is related to the brans direction and the length of the branch
      // const length0 = length(subVec(branch.head, branch.child0.head));
      // const length1 = length(subVec(branch.head, branch.child1.head));

      let radius0 = 1 * radius * this.properties.radiusFalloffRate;
      const radius1 = 1 * radius * this.properties.radiusFalloffRate;
      if (branch.child0.type === 'trunk') radius0 = radius * this.properties.taperRate;
      this.createForks(branch.child0, radius0);
      this.createForks(branch.child1, radius1);
    } else {
      // add points for the ends of braches
      branch.end = verts.length;
      // branch.head = addVec(
      //   branch.head,
      //   scaleVec(
      //     [this.properties.xBias, this.properties.yBias, this.properties.zBias],
      //     branch.length * 3,
      //   ),
      // );
      verts.push(branch.head);
    }
  };

  flattenArray = (input: number[][]): number[] => {
    const retArray = [];
    for (let i = 0; i < input.length; i++) {
      for (let j = 0; j < input[i].length; j++) {
        retArray.push(input[i][j]);
      }
    }
    return retArray;
  };
}
