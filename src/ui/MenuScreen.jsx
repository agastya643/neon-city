import * as THREE from 'three';

export class PlayerAvatar {
  constructor({ appearance, onAction }) {
    this.root = new THREE.Group();
    this.onAction = onAction;
    this.speed = 3.8;
    this.runSpeed = 6.2;
    this.sprintSpeed = 8.6;
    this.jumpForce = 6.6;
    this.gravity = 17.5;
    this.velocity = new THREE.Vector3();
    this.position = new THREE.Vector3();
    this.rotation = 0;
    this.grounded = true;
    this.health = 100;
    this.armor = 60;
    this.stamina = 100;
    this.state = 'idle';

    const bodyMaterial = new THREE.MeshStandardMaterial({
      color: new THREE.Color(appearance.skin || '#f2c7a0'),
      roughness: 0.8,
      metalness: 0.1,
    });
    const hairMaterial = new THREE.MeshStandardMaterial({
      color: new THREE.Color(appearance.hair || '#0d0d12'),
      roughness: 0.75,
    });
    const jacketMaterial = new THREE.MeshStandardMaterial({
      color: new THREE.Color(appearance.jacket || '#1ae7ff'),
      roughness: 0.65,
      metalness: 0.2,
    });
    const pantsMaterial = new THREE.MeshStandardMaterial({
      color: new THREE.Color(appearance.pants || '#4351ff'),
      roughness: 0.7,
      metalness: 0.15,
    });

    const torso = new THREE.Mesh(new THREE.BoxGeometry(0.95, 1.2, 0.45), jacketMaterial);
    torso.position.y = 1.65;
    this.root.add(torso);

    const head = new THREE.Mesh(new THREE.SphereGeometry(0.36, 18, 18), bodyMaterial);
    head.position.y = 2.7;
    this.root.add(head);

    const hair = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.22, 0.5), hairMaterial);
    hair.position.y = 2.98;
    this.root.add(hair);

    const pelvis = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.38, 0.4), pantsMaterial);
    pelvis.position.y = 0.94;
    this.root.add(pelvis);

    const limbData = [
      { name: 'leftArm', start: [-0.48, 1.68, 0], length: 0.92, radius: 0.15, material: jacketMaterial },
      { name: 'rightArm', start: [0.48, 1.68, 0], length: 0.92, radius: 0.15, material: jacketMaterial },
      { name: 'leftLeg', start: [-0.22, 0.55, 0], length: 1.1, radius: 0.17, material: pantsMaterial },
      { name: 'rightLeg', start: [0.22, 0.55, 0], length: 1.1, radius: 0.17, material: pantsMaterial },
    ];

    this.limbs = {};
    limbData.forEach(({ name, start, length, radius, material }) => {
      const limb = new THREE.Mesh(new THREE.CapsuleGeometry(radius, length, 6, 12), material);
      limb.position.set(...start);
      limb.rotation.z = name.includes('Arm') ? 0.2 : 0.1;
      this.limbs[name] = limb;
      this.root.add(limb);
    });

    this.root.traverse((obj) => {
      if (obj.isMesh) {
        obj.castShadow = true;
        obj.receiveShadow = true;
      }
    });
  }

  setAppearance(appearance) {
    const skin = new THREE.Color(appearance.skin || '#f2c7a0');
    const hair = new THREE.Color(appearance.hair || '#0d0d12');
    const jacket = new THREE.Color(appearance.jacket || '#1ae7ff');
    const pants = new THREE.Color(appearance.pants || '#4351ff');

    this.root.traverse((obj) => {
      if (!obj.isMesh) return;
      if (obj.geometry.type === 'SphereGeometry') obj.material.color = skin;
      if (obj.material && obj.material.color && obj.material.color.getHex() === 0x0d0d12) obj.material.color = hair;
      if (obj.geometry.type === 'BoxGeometry' && obj.position.y > 1.1 && obj.position.y < 2.2) obj.material.color = jacket;
      if (obj.geometry.type === 'CapsuleGeometry' && obj.position.y < 1.0) obj.material.color = pants;
    });
  }

  updateMovement({ dt, input, rotationY, cameraForward, worldColliders, sprinting, jumping, crouching, actionPressed, speedFactor }) {
    const moveX = input.x || 0;
    const moveY = input.y || 0;
    const magnitude = Math.hypot(moveX, moveY) || 0;

    let desiredYaw = Math.atan2(moveX, moveY) + rotationY;
    const direction = new THREE.Vector3(Math.sin(desiredYaw), 0, Math.cos(desiredYaw));

    const currentSpeed = sprinting && this.stamina > 0 ? this.sprintSpeed : this.runSpeed;
    const targetSpeed = magnitude > 0.05 ? currentSpeed : 0;

    const moveVector = new THREE.Vector3(moveX, 0, moveY);
    if (moveVector.lengthSq() > 0.001) {
      moveVector.normalize();
      const forward = cameraForward.clone().setY(0).normalize();
      const right = new THREE.Vector3().crossVectors(forward, new THREE.Vector3(0, 1, 0)).normalize();
      const move = new THREE.Vector3();
      move.addScaledVector(forward, moveVector.z);
      move.addScaledVector(right, moveVector.x);
      move.setY(0);
      if (move.lengthSq() > 0.001) {
        move.normalize();
        this.root.position.addScaledVector(move, targetSpeed * dt * speedFactor);
      }
    }

    if (this.root.position) {
      this.root.position.y += this.velocity.y * dt;
      this.velocity.y -= this.gravity * dt;
      if (this.root.position.y <= 0.1) {
        this.root.position.y = 0.1;
        this.velocity.y = 0;
        this.grounded = true;
      }
    }

    if (jumping && this.grounded) {
      this.velocity.y = this.jumpForce;
      this.grounded = false;
      if (this.onAction) this.onAction();
    }

    if (moving) {
      if (sprinting && this.stamina > 0) {
        this.stamina = Math.max(0, this.stamina - 22 * dt);
        this.state = 'sprint';
      } else {
        this.stamina = Math.min(100, this.stamina + 18 * dt);
        this.state = magnitude > 0.5 ? 'run' : 'walk';
      }
    } else {
      this.stamina = Math.min(100, this.stamina + 12 * dt);
      this.state = this.grounded ? 'idle' : 'jump';
    }

    if (crouching && this.grounded) {
      this.state = 'crouch';
      this.root.position.y = 0.05;
    }

    if (actionPressed && this.onAction) {
      this.onAction();
    }

    this.root.rotation.y = rotationY + Math.atan2(moveX, moveY);
    this.animateLimbs(dt, this.state);

    for (const box of worldColliders || []) {
      const dx = this.root.position.x - box.x;
      const dz = this.root.position.z - box.z;
      const halfW = box.w * 0.5 + 0.7;
      const halfD = box.d * 0.5 + 0.7;
      if (Math.abs(dx) < halfW && Math.abs(dz) < halfD) {
        const overlapX = halfW - Math.abs(dx);
        const overlapZ = halfD - Math.abs(dz);
        if (overlapX < overlapZ) {
          this.root.position.x += dx > 0 ? overlapX : -overlapX;
        } else {
          this.root.position.z += dz > 0 ? overlapZ : -overlapZ;
        }
      }
    }
  }

  animateLimbs(dt, state) {
    const swing = performance.now() * 0.008;
    const stride = state === 'walk' ? 1.2 : state === 'run' ? 1.8 : state === 'sprint' ? 2.4 : 0.2;
    const bob = state === 'idle' ? 0 : Math.sin(swing * stride) * 0.09;

    this.root.position.y += bob * 0.1;

    const armSwing = state === 'idle' ? 0.3 : Math.sin(swing * stride) * 0.9;
    const legSwing = state === 'idle' ? 0.2 : Math.sin(swing * stride + Math.PI) * 0.9;

    if (this.limbs.leftArm) this.limbs.leftArm.rotation.x = armSwing;
    if (this.limbs.rightArm) this.limbs.rightArm.rotation.x = -armSwing;
    if (this.limbs.leftLeg) this.limbs.leftLeg.rotation.x = legSwing;
    if (this.limbs.rightLeg) this.limbs.rightLeg.rotation.x = -legSwing;
  }
}

const moving = false;
