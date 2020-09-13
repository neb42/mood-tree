import * as THREE from 'three';

export class Floor {
  scene: THREE.Scene;

  constructor(scene: THREE.Scene) {
    this.scene = scene;

    const planeSize = 12;

    const groundGeometry = new THREE.PlaneBufferGeometry(planeSize, planeSize);

    const texture = new THREE.TextureLoader().load(
      'https://threejsfundamentals.org/threejs/resources/images/checker.png',
    );
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.magFilter = THREE.NearestFilter;
    const repeats = planeSize / 2;
    texture.repeat.set(repeats, repeats);

    const groundMaterial = new THREE.MeshBasicMaterial({ map: texture });
    const ground = new THREE.Mesh(groundGeometry, groundMaterial);
    ground.rotation.x = -Math.PI * 0.5;
    this.scene.add(ground);

    const planeGeometry = new THREE.PlaneGeometry(200, 200);
    planeGeometry.rotateX(-Math.PI / 2);
    const planeMaterial = new THREE.ShadowMaterial();
    planeMaterial.opacity = 0.8;
    const plane = new THREE.Mesh(planeGeometry, planeMaterial);
    plane.receiveShadow = true;
    plane.position.y = ground.position.y + 0.01;
    this.scene.add(plane);
  }
}
