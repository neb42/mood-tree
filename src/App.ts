import * as THREE from 'three';

import config from './config';
import { Tree } from './Tree';
import { Floor } from './Floor';
import { Player } from './Player';

export class App {
  private container: HTMLElement;

  private scene: THREE.Scene;

  private renderer: THREE.Renderer;

  private camera: THREE.PerspectiveCamera;

  private light: THREE.DirectionalLight;

  private clock: THREE.Clock;

  private player: Player;

  private floor: Floor;

  private tree: Tree;

  constructor(containerId: string) {
    this.container = document.getElementById(containerId);
    this.initScene();
    this.initCamera();
    this.initRenderer();
    this.initLights();
    this.clock = new THREE.Clock();
    this.player = new Player(this.scene, this.camera);
    this.floor = new Floor(this.scene);
    this.tree = new Tree(this.scene);
  }

  public update = (): void => {
    requestAnimationFrame(() => this.update());
    const delta = this.clock.getDelta();
    this.player.update(delta);
    this.tree.update(delta);
    this.renderer.render(this.scene, this.camera);
  };

  public resize = (): void => {
    const w = this.container.clientWidth;
    const h = this.container.clientHeight;
    const aspect = w / h;
    this.camera.aspect = aspect;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(w, h);
  };

  private initScene = (): void => {
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0xffffff);
    this.scene.fog = new THREE.Fog(0xffffff, 0, 750);
  };

  private initCamera = (): void => {
    const aspect = this.container.clientWidth / this.container.clientHeight;
    const camera = new THREE.PerspectiveCamera(
      config.camera.FOV,
      aspect,
      config.camera.NEAR,
      config.camera.FAR,
    );
    const pos = config.camera.INIT_POS;
    camera.position.set(pos.x, pos.y, pos.z);
    this.camera = camera;
  };

  private initRenderer = (): void => {
    const renderer = new THREE.WebGLRenderer({
      alpha: true,
      antialias: true,
    });
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFShadowMap;
    renderer.setClearColor(0xffffff);
    renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer = renderer;
    this.container.appendChild(this.renderer.domElement);
  };

  private initLights = (): void => {
    const light0 = new THREE.DirectionalLight(0xffffff, 1.0);
    light0.position.set(20, 30, 20);
    light0.castShadow = true;
    // light0.shadow.camera.fov = 120;
    light0.shadow.camera.near = 0.1;
    light0.shadow.camera.far = 1000;
    light0.shadow.camera.top = 20;
    light0.shadow.camera.right = 20;
    light0.shadow.camera.bottom = -20;
    light0.shadow.camera.left = -20;
    light0.shadow.mapSize.width = 2048;
    light0.shadow.mapSize.height = 2048;
    this.scene.add(light0);

    this.light = light0;

    const light1 = new THREE.DirectionalLight(0xffffff, 0.5);
    light1.position.set(-1, 1, -1);
    this.scene.add(light1);

    const ambientLight = new THREE.AmbientLight(0x404040);
    this.scene.add(ambientLight);
  };
}
