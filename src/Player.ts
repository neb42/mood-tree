import * as THREE from 'three';
import { PointerLockControls } from 'three/examples/jsm/controls/PointerLockControls';

export class Player {
  private scene: THREE.Scene;

  private camera: THREE.Camera;

  private controls: PointerLockControls;

  private raycaster: THREE.Raycaster;

  private velocity: THREE.Vector3;

  private direction: THREE.Vector3;

  private moveForward: boolean;

  private moveBackward: boolean;

  private moveLeft: boolean;

  private moveRight: boolean;

  private colliders: THREE.Mesh<any, any>[];

  constructor(scene: THREE.Scene, camera: THREE.Camera) {
    this.scene = scene;
    this.camera = camera;

    this.moveForward = false;
    this.moveBackward = false;
    this.moveLeft = false;
    this.moveRight = false;

    this.raycaster = new THREE.Raycaster();

    this.controls = new PointerLockControls(this.camera, document.body);
    this.scene.add(this.controls.getObject());

    this.velocity = new THREE.Vector3();
    this.direction = new THREE.Vector3();

    document.addEventListener('keydown', this.onKeyDown, false);
    document.addEventListener('keyup', this.onKeyUp, false);

    const blocker = document.getElementById('blocker');
    const instructions = document.getElementById('instructions');

    instructions.addEventListener(
      'click',
      () => {
        this.controls.lock();
      },
      false,
    );

    this.controls.addEventListener('lock', () => {
      instructions.style.display = 'none';
      blocker.style.display = 'none';
    });

    this.controls.addEventListener('unlock', () => {
      blocker.style.display = 'block';
      instructions.style.display = '';
    });
  }

  public update = (delta: number): void => {
    this.velocity.x -= this.velocity.x * 10.0 * delta;
    this.velocity.z -= this.velocity.z * 10.0 * delta;

    // this.velocity.y -= 9.8 * 100.0 * delta; // 100.0 = mass

    this.direction.z = Number(this.moveForward) - Number(this.moveBackward);
    this.direction.x = Number(this.moveRight) - Number(this.moveLeft);
    this.direction.normalize(); // this ensures consistent movements in all directions

    if (this.moveForward || this.moveBackward) {
      this.velocity.z -= this.direction.z * 50.0 * delta;
    }
    if (this.moveLeft || this.moveRight) {
      this.velocity.x -= this.direction.x * 50.0 * delta;
    }

    this.controls.moveRight(-this.velocity.x * delta);
    this.controls.moveForward(-this.velocity.z * delta);
  };

  public addCollider = (collider: THREE.Mesh<any, any>): void => {
    this.colliders.push(collider);
  };

  private onKeyDown = (event: KeyboardEvent): void => {
    switch (event.key) {
      case 'w':
      case 'ArrowUp':
        this.moveForward = true;
        break;
      case 'a':
      case 'ArrowLeft':
        this.moveLeft = true;
        break;
      case 's':
      case 'ArrowDown':
        this.moveBackward = true;
        break;
      case 'd':
      case 'ArrowRight':
        this.moveRight = true;
        break;
      default:
        break;
    }
  };

  private onKeyUp = (event: KeyboardEvent): void => {
    switch (event.key) {
      case 'w':
      case 'ArrowUp':
        this.moveForward = false;
        break;
      case 'a':
      case 'ArrowLeft':
        this.moveLeft = false;
        break;
      case 's':
      case 'ArrowDown':
        this.moveBackward = false;
        break;
      case 'd':
      case 'ArrowRight':
        this.moveRight = false;
        break;
      default:
        break;
    }
  };
}
