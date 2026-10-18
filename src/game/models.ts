import * as THREE from 'three';
import { TextureLibrary } from './textures';

export interface AnimatedCharacter {
  group: THREE.Group;
  updateAnimation: (time: number, speed: number, isJumping: boolean, isSliding: boolean, isStumbling: boolean, delta: number) => void;
}

export interface AnimatedDemon {
  group: THREE.Group;
  updateAnimation: (time: number, speed: number, delta: number) => void;
}

/**
 * Builds the Explorer Character (Guy Dangerous) as an 11-part articulated procedural model.
 */
export function createAdventurer(): AnimatedCharacter {
  const root = new THREE.Group();

  // Materials
  const skinMat = new THREE.MeshStandardMaterial({ color: 0xdfab87, roughness: 0.65 });
  const shirtMat = new THREE.MeshStandardMaterial({ color: 0x937c58, roughness: 0.8 }); // Khaki safari
  const pantsMat = new THREE.MeshStandardMaterial({ color: 0x3d352c, roughness: 0.85 }); // Dark trail cargo
  const leatherMat = new THREE.MeshStandardMaterial({ color: 0x5a2d14, roughness: 0.45, metalness: 0.1 }); // Boots, belt, hat ribbon
  const hatMat = new THREE.MeshStandardMaterial({ color: 0x7a5b3a, roughness: 0.75 }); // Brown fedora felt
  const goldMat = new THREE.MeshStandardMaterial({ color: 0xffd700, roughness: 0.25, metalness: 0.9 });

  // Body container (for height / slide crouching)
  const body = new THREE.Group();
  root.add(body);

  // Torso
  const torsoGeo = new THREE.BoxGeometry(0.55, 0.75, 0.35);
  const torso = new THREE.Mesh(torsoGeo, shirtMat);
  torso.position.y = 1.05;
  torso.castShadow = true;
  body.add(torso);

  // Leather cross-strap & satchel
  const strapGeo = new THREE.BoxGeometry(0.58, 0.08, 0.38);
  const strap = new THREE.Mesh(strapGeo, leatherMat);
  strap.rotation.z = 0.55;
  strap.position.y = 1.05;
  body.add(strap);

  const satchelGeo = new THREE.BoxGeometry(0.2, 0.22, 0.15);
  const satchel = new THREE.Mesh(satchelGeo, leatherMat);
  satchel.position.set(0.32, 0.85, 0.05);
  body.add(satchel);

  // Head
  const headGeo = new THREE.BoxGeometry(0.36, 0.38, 0.36);
  const head = new THREE.Mesh(headGeo, skinMat);
  head.position.y = 1.62;
  head.castShadow = true;
  body.add(head);

  // Explorer Fedora Hat
  const hatGroup = new THREE.Group();
  hatGroup.position.set(0, 0.18, 0);

  // Brim
  const brimGeo = new THREE.CylinderGeometry(0.38, 0.38, 0.04, 16);
  const brim = new THREE.Mesh(brimGeo, hatMat);
  hatGroup.add(brim);

  // Crown
  const crownGeo = new THREE.CylinderGeometry(0.24, 0.28, 0.26, 16);
  const crown = new THREE.Mesh(crownGeo, hatMat);
  crown.position.y = 0.13;
  hatGroup.add(crown);

  // Hat Band
  const bandGeo = new THREE.CylinderGeometry(0.282, 0.282, 0.06, 16);
  const band = new THREE.Mesh(bandGeo, leatherMat);
  band.position.y = 0.04;
  hatGroup.add(band);

  head.add(hatGroup);

  // Golden Idol tucked in adventurer's belt/pack
  const idolSmallGeo = new THREE.CylinderGeometry(0.08, 0.06, 0.25, 8);
  const idolSmall = new THREE.Mesh(idolSmallGeo, goldMat);
  idolSmall.position.set(-0.3, 0.95, -0.15);
  idolSmall.rotation.z = -0.4;
  body.add(idolSmall);

  // Left Arm
  const leftArmPivot = new THREE.Group();
  leftArmPivot.position.set(-0.38, 1.35, 0);
  const leftArmGeo = new THREE.BoxGeometry(0.16, 0.65, 0.16);
  const leftArm = new THREE.Mesh(leftArmGeo, shirtMat);
  leftArm.position.y = -0.3;
  leftArmPivot.add(leftArm);
  body.add(leftArmPivot);

  // Right Arm
  const rightArmPivot = new THREE.Group();
  rightArmPivot.position.set(0.38, 1.35, 0);
  const rightArmGeo = new THREE.BoxGeometry(0.16, 0.65, 0.16);
  const rightArm = new THREE.Mesh(rightArmGeo, shirtMat);
  rightArm.position.y = -0.3;
  rightArmPivot.add(rightArm);
  body.add(rightArmPivot);

  // Left Leg
  const leftLegPivot = new THREE.Group();
  leftLegPivot.position.set(-0.16, 0.72, 0);
  const leftLegGeo = new THREE.BoxGeometry(0.2, 0.72, 0.22);
  const leftLeg = new THREE.Mesh(leftLegGeo, pantsMat);
  leftLeg.position.y = -0.36;
  leftLegPivot.add(leftLeg);

  const leftBootGeo = new THREE.BoxGeometry(0.22, 0.22, 0.3);
  const leftBoot = new THREE.Mesh(leftBootGeo, leatherMat);
  leftBoot.position.set(0, -0.65, 0.04);
  leftLegPivot.add(leftBoot);
  body.add(leftLegPivot);

  // Right Leg
  const rightLegPivot = new THREE.Group();
  rightLegPivot.position.set(0.16, 0.72, 0);
  const rightLegGeo = new THREE.BoxGeometry(0.2, 0.72, 0.22);
  const rightLeg = new THREE.Mesh(rightLegGeo, pantsMat);
  rightLeg.position.y = -0.36;
  rightLegPivot.add(rightLeg);

  const rightBootGeo = new THREE.BoxGeometry(0.22, 0.22, 0.3);
  const rightBoot = new THREE.Mesh(rightBootGeo, leatherMat);
  rightBoot.position.set(0, -0.65, 0.04);
  rightLegPivot.add(rightBoot);
  body.add(rightLegPivot);

  // Contact shadow
  const shadowGeo = new THREE.PlaneGeometry(0.9, 0.9);
  const shadowMat = new THREE.MeshBasicMaterial({
    color: 0x000000,
    transparent: true,
    opacity: 0.45,
    depthWrite: false,
  });
  const shadow = new THREE.Mesh(shadowGeo, shadowMat);
  shadow.rotation.x = -Math.PI / 2;
  shadow.position.y = 0.02;
  root.add(shadow);

  let runCycle = 0;

  const updateAnimation = (
    time: number,
    speed: number,
    isJumping: boolean,
    isSliding: boolean,
    isStumbling: boolean,
    delta: number
  ) => {
    runCycle += delta * speed * 0.45;

    if (isSliding) {
      // Slide crouch: Pitch body backward and lower down
      body.position.y = -0.45;
      body.rotation.x = -0.95;
      leftArmPivot.rotation.x = 0.8;
      rightArmPivot.rotation.x = -0.6;
      leftLegPivot.rotation.x = -0.8;
      rightLegPivot.rotation.x = 0.4;
      head.rotation.x = 0.6;
      shadow.scale.set(1.4, 0.8, 1);
      return;
    }

    if (isJumping) {
      // Airborne leap pose
      body.position.y = 0;
      body.rotation.x = 0.15;
      leftArmPivot.rotation.x = -1.2;
      rightArmPivot.rotation.x = -1.0;
      leftLegPivot.rotation.x = 0.6;
      rightLegPivot.rotation.x = -0.4;
      head.rotation.x = -0.2;
      shadow.scale.set(0.7, 0.7, 0.7);
      return;
    }

    if (isStumbling) {
      // Stumble: arms flailing wildly, torso pitched forward
      body.position.y = -0.1;
      body.rotation.x = 0.35 + Math.sin(time * 30) * 0.15;
      leftArmPivot.rotation.x = Math.sin(time * 25) * 1.5;
      rightArmPivot.rotation.x = -Math.sin(time * 25) * 1.5;
      leftLegPivot.rotation.x = Math.sin(runCycle * 2) * 0.6;
      rightLegPivot.rotation.x = -Math.sin(runCycle * 2) * 0.6;
      return;
    }

    // Normal running sprint
    body.position.y = Math.abs(Math.sin(runCycle * 2)) * 0.12;
    body.rotation.x = 0.22; // Forward lean
    body.rotation.y = Math.sin(runCycle) * 0.08;
    head.rotation.x = -0.12;

    // Alternating limb swing
    const legSwing = Math.sin(runCycle) * 0.95;
    leftLegPivot.rotation.x = legSwing;
    rightLegPivot.rotation.x = -legSwing;

    const armSwing = Math.sin(runCycle) * 1.1;
    leftArmPivot.rotation.x = -armSwing;
    rightArmPivot.rotation.x = armSwing;

    shadow.scale.set(1.0, 1.0, 1.0);
  };

  return { group: root, updateAnimation };
}

/**
 * Builds the Demonic Ape Chaser (Temple Guardian Demon Beast)
 */
export function createDemonMonkey(): AnimatedDemon {
  const root = new THREE.Group();

  const demonHideMat = new THREE.MeshStandardMaterial({
    color: 0x181412,
    roughness: 0.9,
    metalness: 0.2,
  });
  const hornMat = new THREE.MeshStandardMaterial({
    color: 0x0d0b0a,
    roughness: 0.4,
    metalness: 0.5,
  });
  const eyeMat = new THREE.MeshBasicMaterial({
    color: 0xff1100,
  });

  const body = new THREE.Group();
  root.add(body);

  // Muscular hunched torso
  const torsoGeo = new THREE.BoxGeometry(1.2, 1.1, 1.4);
  const torso = new THREE.Mesh(torsoGeo, demonHideMat);
  torso.position.set(0, 1.3, 0);
  torso.castShadow = true;
  body.add(torso);

  // Volcanic spine ridges
  for (let i = 0; i < 4; i++) {
    const spikeGeo = new THREE.ConeGeometry(0.12, 0.4, 4);
    const spike = new THREE.Mesh(spikeGeo, hornMat);
    spike.position.set(0, 1.8 - i * 0.1, 0.5 - i * 0.35);
    spike.rotation.x = 0.5;
    body.add(spike);
  }

  // Head
  const headGeo = new THREE.BoxGeometry(0.75, 0.65, 0.7);
  const head = new THREE.Mesh(headGeo, demonHideMat);
  head.position.set(0, 1.85, 0.75);
  body.add(head);

  // Glowing demonic crimson eyes
  const eyeGeo = new THREE.SphereGeometry(0.09, 8, 8);
  const leftEye = new THREE.Mesh(eyeGeo, eyeMat);
  leftEye.position.set(-0.22, 0.1, 0.36);
  head.add(leftEye);

  const rightEye = new THREE.Mesh(eyeGeo, eyeMat);
  rightEye.position.set(0.22, 0.1, 0.36);
  head.add(rightEye);

  // Curved demonic horns
  const hornLGeo = new THREE.ConeGeometry(0.14, 0.7, 6);
  const hornL = new THREE.Mesh(hornLGeo, hornMat);
  hornL.position.set(-0.35, 0.45, -0.05);
  hornL.rotation.set(-0.4, 0, -0.5);
  head.add(hornL);

  const hornRGeo = new THREE.ConeGeometry(0.14, 0.7, 6);
  const hornR = new THREE.Mesh(hornRGeo, hornMat);
  hornR.position.set(0.35, 0.45, -0.05);
  hornR.rotation.set(-0.4, 0, 0.5);
  head.add(hornR);

  // Jaws / Fangs
  const jawGeo = new THREE.BoxGeometry(0.55, 0.22, 0.35);
  const jaw = new THREE.Mesh(jawGeo, demonHideMat);
  jaw.position.set(0, -0.25, 0.3);
  head.add(jaw);

  // Front Arms (Huge knuckle-walking gorilla limbs)
  const leftFrontArmPivot = new THREE.Group();
  leftFrontArmPivot.position.set(-0.75, 1.4, 0.4);
  const leftFrontArm = new THREE.Mesh(new THREE.BoxGeometry(0.32, 1.25, 0.35), demonHideMat);
  leftFrontArm.position.y = -0.6;
  leftFrontArmPivot.add(leftFrontArm);
  body.add(leftFrontArmPivot);

  const rightFrontArmPivot = new THREE.Group();
  rightFrontArmPivot.position.set(0.75, 1.4, 0.4);
  const rightFrontArm = new THREE.Mesh(new THREE.BoxGeometry(0.32, 1.25, 0.35), demonHideMat);
  rightFrontArm.position.y = -0.6;
  rightFrontArmPivot.add(rightFrontArm);
  body.add(rightFrontArmPivot);

  // Hind Legs
  const leftHindLegPivot = new THREE.Group();
  leftHindLegPivot.position.set(-0.55, 0.9, -0.5);
  const leftHindLeg = new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.9, 0.38), demonHideMat);
  leftHindLeg.position.y = -0.45;
  leftHindLegPivot.add(leftHindLeg);
  body.add(leftHindLegPivot);

  const rightHindLegPivot = new THREE.Group();
  rightHindLegPivot.position.set(0.55, 0.9, -0.5);
  const rightHindLeg = new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.9, 0.38), demonHideMat);
  rightHindLeg.position.y = -0.45;
  rightHindLegPivot.add(rightHindLeg);
  body.add(rightHindLegPivot);

  let gallopCycle = 0;

  const updateAnimation = (time: number, speed: number, delta: number) => {
    gallopCycle += delta * speed * 0.48;

    // Lunging predatory gallop
    body.position.y = Math.abs(Math.sin(gallopCycle * 2)) * 0.25;
    body.rotation.x = 0.25 + Math.sin(gallopCycle * 2) * 0.12;

    const limbSwing = Math.sin(gallopCycle) * 0.9;
    leftFrontArmPivot.rotation.x = limbSwing;
    rightFrontArmPivot.rotation.x = -limbSwing;

    leftHindLegPivot.rotation.x = -limbSwing * 0.8;
    rightHindLegPivot.rotation.x = limbSwing * 0.8;

    // Fiery eye pulsing
    eyeMat.color.setRGB(1, 0.1 + Math.sin(time * 12) * 0.1, 0);
  };

  return { group: root, updateAnimation };
}

/**
 * Creates the Golden Cursed Idol relic
 */
export function createGoldenIdol(): THREE.Group {
  const group = new THREE.Group();

  const goldMat = new THREE.MeshStandardMaterial({
    color: 0xffcc00,
    metalness: 0.92,
    roughness: 0.2,
  });

  const rubyMat = new THREE.MeshStandardMaterial({
    color: 0xff0044,
    roughness: 0.1,
    metalness: 0.3,
    emissive: 0x990022,
  });

  // Base Pedestal
  const base = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.65, 0.25, 12), goldMat);
  group.add(base);

  // Totemic Body
  const totem = new THREE.Mesh(new THREE.BoxGeometry(0.55, 0.85, 0.45), goldMat);
  totem.position.y = 0.55;
  group.add(totem);

  // Carved Face
  const face = new THREE.Mesh(new THREE.BoxGeometry(0.65, 0.7, 0.55), goldMat);
  face.position.y = 1.25;
  group.add(face);

  // Ruby Eyes
  const eyeL = new THREE.Mesh(new THREE.SphereGeometry(0.08, 8, 8), rubyMat);
  eyeL.position.set(-0.16, 1.35, 0.28);
  group.add(eyeL);

  const eyeR = new THREE.Mesh(new THREE.SphereGeometry(0.08, 8, 8), rubyMat);
  eyeR.position.set(0.16, 1.35, 0.28);
  group.add(eyeR);

  // Feathered Headdress Crown
  for (let i = -3; i <= 3; i++) {
    const feather = new THREE.Mesh(new THREE.BoxGeometry(0.07, 0.45, 0.05), goldMat);
    feather.position.set(i * 0.1, 1.75 + (3 - Math.abs(i)) * 0.05, 0);
    feather.rotation.z = -i * 0.12;
    group.add(feather);
  }

  return group;
}

/**
 * Stone Brazier with animated fire flame billboard and warm point light
 */
export function createBrazier(): { group: THREE.Group; light: THREE.PointLight } {
  const group = new THREE.Group();

  const stoneMat = new THREE.MeshStandardMaterial({
    color: 0x3f3830,
    roughness: 0.85,
  });
  const bronzeMat = new THREE.MeshStandardMaterial({
    color: 0x8b5a2b,
    roughness: 0.4,
    metalness: 0.8,
  });

  // Pillar
  const col = new THREE.Mesh(new THREE.CylinderGeometry(0.25, 0.35, 1.4, 8), stoneMat);
  col.position.y = 0.7;
  group.add(col);

  // Bowl
  const bowl = new THREE.Mesh(new THREE.CylinderGeometry(0.55, 0.25, 0.3, 10), bronzeMat);
  bowl.position.y = 1.45;
  group.add(bowl);

  // Embers / Fire billboard
  const fireTex = TextureLibrary.getFireParticle();
  const fireMat = new THREE.SpriteMaterial({
    map: fireTex,
    blending: THREE.AdditiveBlending,
    color: 0xffaa33,
  });
  const fireSprite = new THREE.Sprite(fireMat);
  fireSprite.scale.set(0.9, 1.2, 1);
  fireSprite.position.y = 1.95;
  group.add(fireSprite);

  // Torch light
  const light = new THREE.PointLight(0xff8822, 1.2, 8);
  light.position.y = 2.0;
  group.add(light);

  return { group, light };
}

/**
 * Obstacle Low: Fallen mossy pillar or tree log across the path (Must JUMP)
 */
export function createObstacleLow(): THREE.Group {
  const group = new THREE.Group();

  const stoneMat = new THREE.MeshStandardMaterial({
    map: TextureLibrary.getStonePaver(),
    roughness: 0.85,
  });

  // Fallen carved pillar trunk
  const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.38, 0.38, 4.6, 10), stoneMat);
  trunk.rotation.z = Math.PI / 2;
  trunk.position.y = 0.38;
  trunk.castShadow = true;
  group.add(trunk);

  // Broken stone chunks on sides
  const chunk1 = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.4, 0.5), stoneMat);
  chunk1.position.set(-2.0, 0.2, 0.2);
  group.add(chunk1);

  const chunk2 = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.45, 0.5), stoneMat);
  chunk2.position.set(2.0, 0.22, -0.2);
  group.add(chunk2);

  return group;
}

/**
 * Obstacle High: Overhead spiked temple beam or low arch (Must SLIDE)
 */
export function createObstacleHigh(): THREE.Group {
  const group = new THREE.Group();

  const stoneMat = new THREE.MeshStandardMaterial({
    map: TextureLibrary.getStoneWall(),
    roughness: 0.8,
  });
  const ironMat = new THREE.MeshStandardMaterial({
    color: 0x242428,
    roughness: 0.35,
    metalness: 0.85,
  });

  // Overhead beam at height ~1.4 (must slide under!)
  const beam = new THREE.Mesh(new THREE.BoxGeometry(4.8, 0.65, 0.7), stoneMat);
  beam.position.y = 1.65;
  beam.castShadow = true;
  group.add(beam);

  // Hanging bronze spikes
  for (let i = -1.8; i <= 1.8; i += 0.55) {
    const spike = new THREE.Mesh(new THREE.ConeGeometry(0.12, 0.45, 6), ironMat);
    spike.position.set(i, 1.1, 0);
    spike.rotation.x = Math.PI;
    group.add(spike);
  }

  // Supporting side stone pillars
  const colL = new THREE.Mesh(new THREE.BoxGeometry(0.6, 2.0, 0.6), stoneMat);
  colL.position.set(-2.4, 1.0, 0);
  group.add(colL);

  const colR = new THREE.Mesh(new THREE.BoxGeometry(0.6, 2.0, 0.6), stoneMat);
  colR.position.set(2.4, 1.0, 0);
  group.add(colR);

  return group;
}

/**
 * Obstacle Gap: Broken pathway section (Must JUMP across)
 */
export function createChasmEdge(): THREE.Group {
  const group = new THREE.Group();
  const stoneMat = new THREE.MeshStandardMaterial({
    map: TextureLibrary.getStoneWall(),
    roughness: 0.9,
  });

  // Broken jagged masonry lip
  const lip = new THREE.Mesh(new THREE.BoxGeometry(4.6, 0.35, 0.4), stoneMat);
  lip.position.y = -0.15;
  group.add(lip);

  return group;
}

/**
 * Power-up Floating Item (Magnet, Shield, Boost, Multiplier)
 */
export function createPowerupPickup(type: 'magnet' | 'shield' | 'boost' | 'multiplier'): THREE.Group {
  const group = new THREE.Group();

  if (type === 'magnet') {
    const mat = new THREE.MeshStandardMaterial({
      color: 0x00d4ff,
      emissive: 0x0055aa,
      roughness: 0.2,
      metalness: 0.8,
    });
    // Horseshoe magnet
    const torus = new THREE.Mesh(new THREE.TorusGeometry(0.32, 0.09, 12, 24, Math.PI), mat);
    torus.rotation.z = Math.PI;
    torus.position.y = 0.9;
    group.add(torus);

    // Tips (red and blue poles)
    const tipMatR = new THREE.MeshBasicMaterial({ color: 0xff3333 });
    const tipMatB = new THREE.MeshBasicMaterial({ color: 0x3366ff });
    const tipL = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.14, 0.18), tipMatR);
    tipL.position.set(-0.32, 0.9, 0);
    group.add(tipL);
    const tipR = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.14, 0.18), tipMatB);
    tipR.position.set(0.32, 0.9, 0);
    group.add(tipR);
  } else if (type === 'shield') {
    const mat = new THREE.MeshStandardMaterial({
      color: 0x10b981,
      emissive: 0x065f46,
      roughness: 0.2,
      metalness: 0.6,
      transparent: true,
      opacity: 0.85,
    });
    const sphere = new THREE.Mesh(new THREE.IcosahedronGeometry(0.35, 1), mat);
    sphere.position.y = 0.9;
    group.add(sphere);

    const ring = new THREE.Mesh(
      new THREE.RingGeometry(0.42, 0.48, 16),
      new THREE.MeshBasicMaterial({ color: 0x34d399, side: THREE.DoubleSide })
    );
    ring.position.y = 0.9;
    group.add(ring);
  } else if (type === 'boost') {
    const mat = new THREE.MeshStandardMaterial({
      color: 0xf59e0b,
      emissive: 0xb45309,
      roughness: 0.3,
      metalness: 0.9,
    });
    // Golden Phoenix Wing Crystal
    const octa = new THREE.Mesh(new THREE.OctahedronGeometry(0.35), mat);
    octa.scale.set(0.7, 1.4, 0.7);
    octa.position.y = 0.9;
    group.add(octa);
  } else {
    // 2X Multiplier
    const mat = new THREE.MeshStandardMaterial({
      color: 0xec4899,
      emissive: 0x9d174d,
      roughness: 0.25,
      metalness: 0.85,
    });
    const box = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.5, 0.2), mat);
    box.position.y = 0.9;
    group.add(box);
  }

  // Aura Light
  const colors = {
    magnet: 0x00d4ff,
    shield: 0x10b981,
    boost: 0xf59e0b,
    multiplier: 0xec4899,
  };
  const light = new THREE.PointLight(colors[type], 1.2, 5);
  light.position.y = 0.9;
  group.add(light);

  return group;
}
