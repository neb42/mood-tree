import * as THREE from 'three';

import config from './config';
import { Tree as T } from './Tree/Tree';
import branch from './textures/branch.png';
import trunkColor from './textures/trunk_color.jpg';
import trunkNormal from './textures/trunk_normal.jpg';
import leafFrag from './shaders/leaf.frag';
import leafVert from './shaders/leaf.vert';

interface IUniforms {
  time: { value: number };
  lowerLimit: { value: number };
  upperLimit: { value: number };
  upperRatio: { value: number };
  spiralRadius: { value: number };
  spiralTurns: { value: number };
  colorR: { value: number };
  colorG: { value: number };
  colorB: { value: number };
}

export class Tree {
  private scene: THREE.Scene;

  private twigsGeometry: THREE.Geometry;

  private t: number;

  private uniforms: IUniforms;

  constructor(scene: THREE.Scene) {
    this.t = 0;
    this.scene = scene;
    this.makeTree();
    this.makePetalCloud(
      new THREE.Color(config.petals.color.R, config.petals.color.G, config.petals.color.B),
    );
  }

  public update = (delta: number): void => {
    this.t += delta * 0.5;
    this.uniforms.time.value = this.t;
  };

  private makeTree = (): void => {
    function newTreeGeometry(tree: T, isTwigs?: boolean) {
      const output = new THREE.Geometry();

      tree[isTwigs ? 'vertsTwig' : 'verts'].forEach(function (v) {
        output.vertices.push(new THREE.Vector3(v[0], v[1], v[2]));
      });

      const uv = isTwigs ? tree.uvsTwig : tree.UV;
      tree[isTwigs ? 'facesTwig' : 'faces'].forEach(function (f) {
        output.faces.push(new THREE.Face3(f[0], f[1], f[2]));
        output.faceVertexUvs[0].push(
          f.map(function (v) {
            return new THREE.Vector2(uv[v][0], uv[v][1]);
          }),
        );
      });

      output.computeFaceNormals();
      output.computeVertexNormals(true);

      return output;
    }

    const tree = new T({
      branchFactor: config.tree.BRANCH_FACTOR,
      climbRate: config.tree.CLIMB_RATE,
      clumpMax: config.tree.CLUMP_MAX,
      clumpMin: config.tree.CLUMP_MIN,
      dropAmount: config.tree.DROP_AMOUNT,
      growAmount: config.tree.GROW_AMOUNT,
      initalBranchLength: config.tree.INITAL_BRANCH_LENGTH,
      lengthFalloffFactor: config.tree.LENGTH_FALLOFF_FACTOR,
      lengthFalloffPower: config.tree.LENGTH_FALLOFF_POWER,
      levels: config.tree.LEVELS,
      maxRadius: config.tree.MAX_RADIUS,
      radiusFalloffRate: config.tree.RADIUS_FALLOFF_RATE,
      seed: config.tree.SEED,
      segments: config.tree.SEGMENTS,
      sweepAmount: config.tree.SWEEP_AMOUNT,
      taperRate: config.tree.TAPER_RATE,
      treeSteps: config.tree.TREE_STEPS,
      trunkKink: config.tree.TRUNK_KINK,
      trunkLength: config.tree.TRUNK_LENGTH,
      twigScale: config.tree.TWIG_SCALE,
      twistRate: config.tree.TWIST_RATE,
      vMultiplier: config.tree.V_MULTIPLIER,
    });

    const textureLoader = new THREE.TextureLoader();

    const trunkGeo = newTreeGeometry(tree);
    const trunkTextureColor = textureLoader.load(trunkColor);
    trunkTextureColor.wrapS = THREE.RepeatWrapping;
    trunkTextureColor.wrapT = THREE.RepeatWrapping;
    trunkTextureColor.repeat.set(1, 1);
    const trunkTextureNormal = textureLoader.load(trunkNormal);
    trunkTextureNormal.wrapS = THREE.RepeatWrapping;
    trunkTextureNormal.wrapT = THREE.RepeatWrapping;
    trunkTextureNormal.repeat.set(1, 1);
    const trunkMaterial = new THREE.MeshPhysicalMaterial({
      map: trunkTextureColor,
      normalMap: trunkTextureNormal,
    });
    const trunkMesh = new THREE.Mesh(trunkGeo, trunkMaterial);
    trunkMesh.castShadow = true;
    trunkMesh.receiveShadow = true;
    this.scene.add(trunkMesh);

    const twigsGeo = newTreeGeometry(tree, true);
    const twigsTexture = textureLoader.load(branch);
    const twigsMaterial = new THREE.MeshBasicMaterial({ map: twigsTexture, transparent: true });
    const twigsMesh = new THREE.Mesh(twigsGeo, twigsMaterial);
    this.scene.add(twigsMesh);

    this.twigsGeometry = twigsGeo;
  };

  private makePetalCloud = (color: THREE.Color): void => {
    const r = config.petals.RADIUS; // radius
    const { MAX_POINTS } = config.petals;
    let pointsCount = 0;
    const points = []; // 3
    const speed = []; // 2
    const colors = []; // 3
    const c = new THREE.Color();
    while (pointsCount < MAX_POINTS) {
      const vec = new THREE.Vector3(
        THREE.MathUtils.randFloat(-r, r),
        0,
        THREE.MathUtils.randFloat(-r, r),
      );
      const rRatio = vec.length() / r;
      if (vec.length() <= r && Math.random() < 1 - rRatio) {
        points.push(vec);
        c.set(0xffffcc);
        colors.push(c.r, c.g - Math.random() * 0.1, c.b + Math.random() * 0.2);
        const val = THREE.MathUtils.randFloat(1, 2);
        speed.push(Math.PI * val * 0.125, val); // angle, height
        pointsCount += 1;
      }
    }
    const pointsGeom = new THREE.BufferGeometry().setFromPoints(points);
    pointsGeom.setAttribute('color', new THREE.BufferAttribute(new Float32Array(colors), 3));
    pointsGeom.setAttribute('speed', new THREE.BufferAttribute(new Float32Array(speed), 2));

    this.uniforms = {
      time: { value: config.petals.START_TIME },
      lowerLimit: { value: config.petals.LOWER_LIMIT },
      upperLimit: { value: config.petals.UPPER_LIMIT },
      upperRatio: { value: config.petals.UPPER_RATIO },
      spiralRadius: { value: config.petals.SPIRAL_RADIUS },
      spiralTurns: { value: config.petals.SPIRAL_TURNS },
      colorR: { value: color.r },
      colorG: { value: color.g },
      colorB: { value: color.b },
    };
    const pointsMat = new THREE.PointsMaterial({
      color: THREE.VertexColors,
      size: config.petals.SIZE,
    });
    pointsMat.onBeforeCompile = (shader) => {
      shader.uniforms.time = this.uniforms.time;
      shader.uniforms.lowerLimit = this.uniforms.lowerLimit;
      shader.uniforms.upperLimit = this.uniforms.upperLimit;
      shader.uniforms.upperRatio = this.uniforms.upperRatio;
      shader.uniforms.spiralRadius = this.uniforms.spiralRadius;
      shader.uniforms.spiralTurns = this.uniforms.spiralTurns;
      shader.uniforms.colorR = this.uniforms.colorR;
      shader.uniforms.colorG = this.uniforms.colorG;
      shader.uniforms.colorB = this.uniforms.colorB;
      shader.fragmentShader = leafFrag;
      shader.vertexShader = leafVert;
    };

    const p = new THREE.Points(pointsGeom, pointsMat);
    this.scene.add(p);
  };
}
