import * as THREE from 'three';

export function createTestWorld(scene, quality = { fog: 0.0035 }) {
  const cityGroup = new THREE.Group();
  scene.add(cityGroup);

  const ground = new THREE.Mesh(
    new THREE.PlaneGeometry(120, 120),
    new THREE.MeshStandardMaterial({ color: 0x0b1220, roughness: 0.9, metalness: 0.12 })
  );
  ground.rotation.x = -Math.PI / 2;
  ground.position.y = -0.04;
  cityGroup.add(ground);

  const sky = new THREE.Mesh(
    new THREE.SphereGeometry(120, 32, 32),
    new THREE.MeshBasicMaterial({ color: 0x07131e, side: THREE.BackSide })
  );
  cityGroup.add(sky);

  const road = new THREE.Mesh(
    new THREE.BoxGeometry(18, 0.08, 120),
    new THREE.MeshStandardMaterial({ color: 0x101827, emissive: 0x091222, roughness: 0.9 })
  );
  road.position.set(0, 0.02, 0);
  cityGroup.add(road);

  const sidewalkMaterial = new THREE.MeshStandardMaterial({ color: 0x192537, roughness: 0.88 });
  const sidewalkLeft = new THREE.Mesh(new THREE.BoxGeometry(8, 0.08, 120), sidewalkMaterial);
  const sidewalkRight = sidewalkLeft.clone();
  sidewalkLeft.position.set(-12, 0.03, 0);
  sidewalkRight.position.set(12, 0.03, 0);
  cityGroup.add(sidewalkLeft, sidewalkRight);

  const colliders = [];
  const buildingColors = [0x1d5c7b, 0x2c355d, 0x1f2a49, 0x2a1c44, 0x153452];

  for (let i = 0; i < 12; i += 1) {
    const width = 3 + Math.random() * 3.5;
    const depth = 3 + Math.random() * 3.2;
    const height = 4 + Math.random() * 9;
    const x = -25 + Math.random() * 50;
    const z = -30 + Math.random() * 60;
    if (Math.abs(x) < 12 && Math.abs(z) < 35) continue;

    const material = new THREE.MeshStandardMaterial({
      color: buildingColors[i % buildingColors.length],
      emissive: new THREE.Color(buildingColors[i % buildingColors.length]).multiplyScalar(0.13),
      roughness: 0.82,
      metalness: 0.28,
    });
    const mesh = new THREE.Mesh(new THREE.BoxGeometry(width, height, depth), material);
    mesh.position.set(x, height / 2, z);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    cityGroup.add(mesh);
    colliders.push({ x, y: height / 2, z, w: width, h: height, d: depth });
  }

  const streetLights = new THREE.Group();
  for (let i = -4; i <= 4; i += 2) {
    const pole = new THREE.Mesh(
      new THREE.CylinderGeometry(0.08, 0.12, 3.8, 8),
      new THREE.MeshStandardMaterial({ color: 0x17212d, emissive: 0x0a0f19, roughness: 0.5 })
    );
    pole.position.set(i * 6, 1.9, -48);
    const glow = new THREE.Mesh(
      new THREE.SphereGeometry(0.26, 16, 16),
      new THREE.MeshStandardMaterial({ color: 0x63f4ff, emissive: 0x63f4ff, emissiveIntensity: 1.2 })
    );
    glow.position.set(i * 6, 3.9, -48);
    streetLights.add(pole, glow);
  }
  cityGroup.add(streetLights);

  return { cityGroup, colliders, ground, road };
}
