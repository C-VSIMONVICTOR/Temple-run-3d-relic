import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { sound } from './audio';
import { TextureLibrary } from './textures';
import {
  createAdventurer,
  createDemonMonkey,
  createBrazier,
  createObstacleLow,
  createObstacleHigh,
  createPowerupPickup,
  type AnimatedCharacter,
  type AnimatedDemon,
} from './models';

export type GameState = 'TITLE' | 'PLAYING' | 'PAUSED' | 'GAMEOVER';

export interface GameStats {
  distance: number;
  coins: number;
  score: number;
  multiplier: number;
  speed: number;
  adrenaline: number; // 0 to 100
  activePowerup: {
    type: 'magnet' | 'shield' | 'boost' | 'multiplier' | null;
    remaining: number; // seconds
  } | null;
  demonDistance: number; // meters behind player
  isStumbling: boolean;
  hasShield: boolean;
}

export type TrackDirection = 'N' | 'E' | 'S' | 'W';

interface TrackSegment {
  id: number;
  group: THREE.Group;
  startPos: THREE.Vector3;
  endPos: THREE.Vector3;
  direction: TrackDirection;
  length: number;
  isTurn: boolean;
  turnDirection?: 'LEFT' | 'RIGHT' | 'BOTH';
  turnChosen?: 'LEFT' | 'RIGHT';
  type: 'stone' | 'bridge' | 'vault';
  obstacles: ObstacleEntity[];
  coins: CoinEntity[];
  powerups: PowerupEntity[];
  turnTelegraph?: THREE.Mesh;
}

interface ObstacleEntity {
  group: THREE.Group;
  pos: THREE.Vector3;
  type: 'low' | 'high' | 'gap';
  lane: number; // -1, 0, 1 or 99 (full width)
  hitRadius: number;
  cleared: boolean;
}

interface CoinEntity {
  mesh: THREE.Mesh;
  pos: THREE.Vector3;
  lane: number;
  collected: boolean;
  baseY: number;
}

interface PowerupEntity {
  group: THREE.Group;
  pos: THREE.Vector3;
  type: 'magnet' | 'shield' | 'boost' | 'multiplier';
  collected: boolean;
}

// Pre-allocated math helpers for 60fps GC-free loop
const _vec3 = new THREE.Vector3();
const _vec3B = new THREE.Vector3();
const _quat = new THREE.Quaternion();

export class TempleRunEngine {
  private container: HTMLElement;
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private renderer: THREE.WebGLRenderer;
  private dirLight: THREE.DirectionalLight;
  private hemiLight: THREE.HemisphereLight;

  private adventurer: AnimatedCharacter;
  private demon: AnimatedDemon;

  // Track State
  private segments: TrackSegment[] = [];
  private nextSegmentId = 1;
  private currentDirection: TrackDirection = 'N'; // N = -Z, E = +X, S = +Z, W = -X
  private cursorWorldPos = new THREE.Vector3(0, 0, 0);

  // Player State
  private playerPos = new THREE.Vector3(0, 0, 0);
  private playerVelocityY = 0;
  private isGrounded = true;
  private isJumping = false;
  private isSliding = false;
  private slideTimer = 0;
  private targetLane: number = 0; // -1 = Left, 0 = Center, 1 = Right
  private currentLaneOffset: number = 0;
  private currentAngle: number = 0; // In radians, 0 = facing -Z
  private targetAngle: number = 0;
  private speed: number = 22; // units per second
  private isStumbling = false;
  private stumbleTimer = 0;
  private demonDistance = 14; // meters behind
  private hasShield = false;

  // Active powerups
  private activePowerupType: 'magnet' | 'shield' | 'boost' | 'multiplier' | null = null;
  private powerupTimer = 0;
  private adrenaline = 0;

  // Score & Distance
  private totalDistance = 0;
  private coinsCount = 0;
  private score = 0;
  private baseMultiplier = 1;

  // Camera Shake & Dynamics
  private cameraShake = 0;
  private cameraOffset = new THREE.Vector3(0, 4.2, 7.8);
  private cameraLookOffset = new THREE.Vector3(0, 1.8, -4.5);

  // Loop & Callbacks
  private animFrameId: number | null = null;
  private lastTime = 0;
  public gameState: GameState = 'TITLE';
  public onStatsUpdate?: (stats: GameStats) => void;
  public onGameOver?: (finalStats: GameStats) => void;

  // Upgrades purchased from Shop
  public upgrades = {
    magnetDuration: 1.0,
    shieldDuration: 1.0,
    boostDuration: 1.0,
    coinValue: 1,
  };

  constructor(container: HTMLElement) {
    this.container = container;

    // 1. Scene setup
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x0e0c0a);
    this.scene.fog = new THREE.FogExp2(0x0e0c0a, 0.016);

    // 2. Camera setup
    const aspect = container.clientWidth / (container.clientHeight || 1);
    this.camera = new THREE.PerspectiveCamera(65, aspect, 0.1, 300);

    // 3. Renderer setup
    const isHeadless = navigator.webdriver || /HeadlessChrome/i.test(navigator.userAgent);
    this.renderer = new THREE.WebGLRenderer({
      powerPreference: 'high-performance',
      antialias: !isHeadless,
    });
    this.renderer.setSize(container.clientWidth, container.clientHeight);
    this.renderer.setPixelRatio(isHeadless ? 1 : Math.min(window.devicePixelRatio, 2));
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.15;
    this.renderer.shadowMap.enabled = !isHeadless;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    container.appendChild(this.renderer.domElement);

    // Texture Anisotropy
    TextureLibrary.initAnisotropy(this.renderer.capabilities.getMaxAnisotropy());

    // Procedural RoomEnvironment reflection
    const pmremGenerator = new THREE.PMREMGenerator(this.renderer);
    this.scene.environment = pmremGenerator.fromScene(new RoomEnvironment(), 0.04).texture;
    pmremGenerator.dispose();

    // 4. Lighting Rig
    this.hemiLight = new THREE.HemisphereLight(0x7fb3d5, 0x221a14, 0.7);
    this.scene.add(this.hemiLight);

    this.dirLight = new THREE.DirectionalLight(0xffdfa0, 1.8);
    this.dirLight.position.set(20, 45, 25);
    this.dirLight.castShadow = !isHeadless;
    this.dirLight.shadow.mapSize.width = 1024;
    this.dirLight.shadow.mapSize.height = 1024;
    this.dirLight.shadow.camera.near = 10;
    this.dirLight.shadow.camera.far = 120;
    const d = 25;
    this.dirLight.shadow.camera.left = -d;
    this.dirLight.shadow.camera.right = d;
    this.dirLight.shadow.camera.top = d;
    this.dirLight.shadow.camera.bottom = -d;
    this.dirLight.shadow.bias = -0.0005;
    this.dirLight.shadow.normalBias = 0.02;
    this.scene.add(this.dirLight);

    // 5. Spawn Adventurer & Demon
    this.adventurer = createAdventurer();
    this.scene.add(this.adventurer.group);

    this.demon = createDemonMonkey();
    this.scene.add(this.demon.group);

    // 6. Preload initial track
    this.resetTrack();

    // 7. Window resize handling
    window.addEventListener('resize', this.handleResize);

    // 8. Start render tick
    this.lastTime = performance.now();
    this.tick(this.lastTime);
  }

  private handleResize = () => {
    if (!this.container || !this.renderer || !this.camera) return;
    const w = this.container.clientWidth;
    const h = this.container.clientHeight;
    this.camera.aspect = w / (h || 1);
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(w, h);
  };

  public loadUpgrades(upgrades: { magnetDuration: number; shieldDuration: number; boostDuration: number; coinValue: number }) {
    this.upgrades = upgrades;
  }

  // Reset Track and Player for New Run
  public resetTrack() {
    // Clear old segments
    for (const seg of this.segments) {
      this.scene.remove(seg.group);
      this.disposeObject(seg.group);
    }
    this.segments = [];
    this.nextSegmentId = 1;

    this.currentDirection = 'N';
    this.cursorWorldPos.set(0, 0, 0);
    this.playerPos.set(0, 0, 0);
    this.playerVelocityY = 0;
    this.isGrounded = true;
    this.isJumping = false;
    this.isSliding = false;
    this.slideTimer = 0;
    this.targetLane = 0;
    this.currentLaneOffset = 0;
    this.currentAngle = 0;
    this.targetAngle = 0;
    this.speed = 22;
    this.isStumbling = false;
    this.stumbleTimer = 0;
    this.demonDistance = 14;
    this.hasShield = false;
    this.activePowerupType = null;
    this.powerupTimer = 0;
    this.adrenaline = 0;
    this.totalDistance = 0;
    this.coinsCount = 0;
    this.score = 0;
    this.baseMultiplier = 1;
    this.cameraShake = 0;

    // Build initial straight runway (safe start ~60m)
    this.buildSegment(40, false, undefined, 'stone', true);
    this.buildSegment(40, false, undefined, 'stone', false);
    this.buildSegment(40, false, undefined, 'stone', false);

    // Populate track ahead
    this.ensureTrackLength();

    // Position actors
    this.adventurer.group.position.set(0, 0, 0);
    this.adventurer.group.rotation.set(0, 0, 0);

    this.demon.group.position.set(0, 0, 14);
    this.demon.group.rotation.set(0, 0, 0);
  }

  private getDirectionVector(dir: TrackDirection): THREE.Vector3 {
    switch (dir) {
      case 'N': return new THREE.Vector3(0, 0, -1);
      case 'E': return new THREE.Vector3(1, 0, 0);
      case 'S': return new THREE.Vector3(0, 0, 1);
      case 'W': return new THREE.Vector3(-1, 0, 0);
    }
  }

  private getRightVector(dir: TrackDirection): THREE.Vector3 {
    switch (dir) {
      case 'N': return new THREE.Vector3(1, 0, 0);
      case 'E': return new THREE.Vector3(0, 0, 1);
      case 'S': return new THREE.Vector3(-1, 0, 0);
      case 'W': return new THREE.Vector3(0, 0, -1);
    }
  }

  private turnDirectionClockwise(dir: TrackDirection, isRight: boolean): TrackDirection {
    const clockwise: TrackDirection[] = ['N', 'E', 'S', 'W'];
    let idx = clockwise.indexOf(dir);
    if (isRight) {
      idx = (idx + 1) % 4;
    } else {
      idx = (idx + 3) % 4;
    }
    return clockwise[idx];
  }

  private getAngleForDirection(dir: TrackDirection): number {
    switch (dir) {
      case 'N': return 0;
      case 'E': return -Math.PI / 2;
      case 'S': return Math.PI;
      case 'W': return Math.PI / 2;
    }
  }

  private buildSegment(
    length: number,
    isTurn: boolean,
    turnDirection?: 'LEFT' | 'RIGHT' | 'BOTH',
    theme: 'stone' | 'bridge' | 'vault' = 'stone',
    isStartRunway: boolean = false
  ): TrackSegment {
    const group = new THREE.Group();
    const forwardVec = this.getDirectionVector(this.currentDirection);
    const rightVec = this.getRightVector(this.currentDirection);
    const startPos = this.cursorWorldPos.clone();
    const endPos = startPos.clone().addScaledVector(forwardVec, length);

    const obstacles: ObstacleEntity[] = [];
    const coins: CoinEntity[] = [];
    const powerups: PowerupEntity[] = [];

    const pathWidth = 5.2;
    const laneWidth = 1.6;

    if (isTurn) {
      // 90-Degree Turn Junction
      const cornerGeo = new THREE.BoxGeometry(pathWidth, 1.2, pathWidth);
      const stoneMat = new THREE.MeshStandardMaterial({
        map: TextureLibrary.getStonePaver(),
        roughness: 0.8,
      });
      const cornerMesh = new THREE.Mesh(cornerGeo, stoneMat);
      cornerMesh.position.copy(endPos).addScaledVector(forwardVec, pathWidth * 0.5);
      cornerMesh.position.y = -0.6;
      cornerMesh.receiveShadow = true;
      group.add(cornerMesh);

      // Back decorative wall at the end of the straight corridor so player turns or crashes
      const backWallGeo = new THREE.BoxGeometry(pathWidth + 1.2, 5.0, 1.0);
      const wallMat = new THREE.MeshStandardMaterial({
        map: TextureLibrary.getStoneWall(),
        roughness: 0.8,
      });
      const backWall = new THREE.Mesh(backWallGeo, wallMat);
      backWall.position.copy(endPos).addScaledVector(forwardVec, pathWidth + 0.5);
      backWall.position.y = 2.0;
      backWall.castShadow = true;
      backWall.receiveShadow = true;
      group.add(backWall);

      // Ornate Altar / Relic statue on the back wall
      const altarGeo = new THREE.BoxGeometry(1.8, 2.2, 0.8);
      const altar = new THREE.Mesh(altarGeo, stoneMat);
      altar.position.copy(endPos).addScaledVector(forwardVec, pathWidth);
      altar.position.y = 1.1;
      group.add(altar);

      // Glowing Runic Turn Telegraph on the floor
      const arrowGeo = new THREE.PlaneGeometry(3.2, 3.2);
      const arrowMat = new THREE.MeshBasicMaterial({
        map: TextureLibrary.getRuneArrow(),
        transparent: true,
        opacity: 0.9,
        depthWrite: false,
      });
      const arrowMesh = new THREE.Mesh(arrowGeo, arrowMat);
      arrowMesh.rotation.x = -Math.PI / 2;
      arrowMesh.position.copy(endPos).addScaledVector(forwardVec, -1.5);
      arrowMesh.position.y = 0.02;

      // Rotate arrow to point left or right
      if (turnDirection === 'LEFT') {
        arrowMesh.rotation.z = Math.PI / 2;
      } else if (turnDirection === 'RIGHT') {
        arrowMesh.rotation.z = -Math.PI / 2;
      }
      group.add(arrowMesh);

      // Braziers at corner turns
      const b1 = createBrazier();
      b1.group.position.copy(endPos).addScaledVector(rightVec, pathWidth * 0.55).addScaledVector(forwardVec, 0.5);
      group.add(b1.group);

      const b2 = createBrazier();
      b2.group.position.copy(endPos).addScaledVector(rightVec, -pathWidth * 0.55).addScaledVector(forwardVec, 0.5);
      group.add(b2.group);

    } else {
      // Straight Pathway Segment
      const floorGeo = new THREE.BoxGeometry(pathWidth, 1.2, length);
      let floorMat: THREE.Material;

      if (theme === 'bridge') {
        floorMat = new THREE.MeshStandardMaterial({
          map: TextureLibrary.getWoodPlank(),
          roughness: 0.85,
        });
      } else {
        floorMat = new THREE.MeshStandardMaterial({
          map: TextureLibrary.getStonePaver(),
          roughness: 0.8,
        });
      }

      const floorMesh = new THREE.Mesh(floorGeo, floorMat);
      const midPoint = startPos.clone().addScaledVector(forwardVec, length * 0.5);
      floorMesh.position.copy(midPoint);
      floorMesh.position.y = -0.6;
      floorMesh.receiveShadow = true;

      // Orient floor to current direction
      if (this.currentDirection === 'E' || this.currentDirection === 'W') {
        floorMesh.rotation.y = Math.PI / 2;
      }
      group.add(floorMesh);

      // Parapets / Temple Side Walls (or Rope Bridge Rails)
      if (theme === 'bridge') {
        // Wooden Posts and Ropes on left and right
        const postGeo = new THREE.CylinderGeometry(0.08, 0.08, 1.2, 6);
        const postMat = new THREE.MeshStandardMaterial({ color: 0x4a2c16 });
        const ropeMat = new THREE.MeshStandardMaterial({ color: 0x6e4a28, roughness: 0.9 });

        for (let dist = 3; dist < length - 2; dist += 5) {
          const postPosL = startPos.clone().addScaledVector(forwardVec, dist).addScaledVector(rightVec, -pathWidth * 0.5);
          postPosL.y = 0.6;
          const postL = new THREE.Mesh(postGeo, postMat);
          postL.position.copy(postPosL);
          group.add(postL);

          const postPosR = startPos.clone().addScaledVector(forwardVec, dist).addScaledVector(rightVec, pathWidth * 0.5);
          postPosR.y = 0.6;
          const postR = new THREE.Mesh(postGeo, postMat);
          postR.position.copy(postPosR);
          group.add(postR);
        }

        // Bridge top rope
        const ropeGeo = new THREE.CylinderGeometry(0.05, 0.05, length, 6);
        const ropeL = new THREE.Mesh(ropeGeo, ropeMat);
        ropeL.position.copy(midPoint).addScaledVector(rightVec, -pathWidth * 0.5);
        ropeL.position.y = 1.1;
        if (this.currentDirection === 'E' || this.currentDirection === 'W') {
          ropeL.rotation.y = Math.PI / 2;
        }
        ropeL.rotation.x = Math.PI / 2;
        group.add(ropeL);

        const ropeR = new THREE.Mesh(ropeGeo, ropeMat);
        ropeR.position.copy(midPoint).addScaledVector(rightVec, pathWidth * 0.5);
        ropeR.position.y = 1.1;
        if (this.currentDirection === 'E' || this.currentDirection === 'W') {
          ropeR.rotation.y = Math.PI / 2;
        }
        ropeR.rotation.x = Math.PI / 2;
        group.add(ropeR);
      } else {
        // Ancient Stone Parapets
        const wallMat = new THREE.MeshStandardMaterial({
          map: TextureLibrary.getStoneWall(),
          roughness: 0.8,
        });

        const wallL = new THREE.Mesh(new THREE.BoxGeometry(0.6, 1.4, length), wallMat);
        wallL.position.copy(midPoint).addScaledVector(rightVec, -pathWidth * 0.5 - 0.3);
        wallL.position.y = 0.7;
        if (this.currentDirection === 'E' || this.currentDirection === 'W') {
          wallL.rotation.y = Math.PI / 2;
        }
        wallL.castShadow = true;
        wallL.receiveShadow = true;
        group.add(wallL);

        const wallR = new THREE.Mesh(new THREE.BoxGeometry(0.6, 1.4, length), wallMat);
        wallR.position.copy(midPoint).addScaledVector(rightVec, pathWidth * 0.5 + 0.3);
        wallR.position.y = 0.7;
        if (this.currentDirection === 'E' || this.currentDirection === 'W') {
          wallR.rotation.y = Math.PI / 2;
        }
        wallR.castShadow = true;
        wallR.receiveShadow = true;
        group.add(wallR);

        // Periodic braziers along the straight walls
        for (let dist = 12; dist < length - 8; dist += 20) {
          const brazier = createBrazier();
          const side = Math.random() > 0.5 ? 1 : -1;
          brazier.group.position
            .copy(startPos)
            .addScaledVector(forwardVec, dist)
            .addScaledVector(rightVec, side * (pathWidth * 0.5 + 0.3));
          group.add(brazier.group);
        }
      }

      // Populate obstacles, coins, and power-ups if not in initial runway
      if (!isStartRunway) {
        // Obstacle generation (Every 18–26 meters)
        for (let dist = 10; dist < length - 10; dist += 22) {
          const obsTypeRand = Math.random();
          const lane = [-1, 0, 1][Math.floor(Math.random() * 3)];
          const obsPos = startPos.clone().addScaledVector(forwardVec, dist).addScaledVector(rightVec, lane * laneWidth);

          if (obsTypeRand < 0.45) {
            // Low Obstacle: fallen log/pillar across the lane or full path
            const obsMesh = createObstacleLow();
            obsMesh.position.copy(obsPos);
            obsMesh.position.y = 0;
            if (this.currentDirection === 'E' || this.currentDirection === 'W') {
              obsMesh.rotation.y = Math.PI / 2;
            }
            group.add(obsMesh);

            obstacles.push({
              group: obsMesh,
              pos: obsPos,
              type: 'low',
              lane,
              hitRadius: 1.1,
              cleared: false,
            });

            // Arcs of coins over the jump obstacle!
            for (let c = -2; c <= 2; c++) {
              const coinPos = obsPos.clone().addScaledVector(forwardVec, c * 1.5);
              const arcH = 0.8 + (1 - (Math.abs(c) / 2) ** 2) * 1.6;
              coinPos.y = arcH;
              const coinMesh = this.createCoinMesh(coinPos);
              group.add(coinMesh);
              coins.push({
                mesh: coinMesh,
                pos: coinPos,
                lane,
                collected: false,
                baseY: arcH,
              });
            }
          } else if (obsTypeRand < 0.85) {
            // High Obstacle: overhead spiked beam (must slide!)
            const obsMesh = createObstacleHigh();
            obsMesh.position.copy(obsPos);
            obsMesh.position.y = 0;
            if (this.currentDirection === 'E' || this.currentDirection === 'W') {
              obsMesh.rotation.y = Math.PI / 2;
            }
            group.add(obsMesh);

            obstacles.push({
              group: obsMesh,
              pos: obsPos,
              type: 'high',
              lane: 99, // spans the road
              hitRadius: 1.2,
              cleared: false,
            });

            // Line of low coins under the slide
            for (let c = -1; c <= 1; c++) {
              const coinPos = obsPos.clone().addScaledVector(forwardVec, c * 1.4);
              coinPos.y = 0.35;
              const coinMesh = this.createCoinMesh(coinPos);
              group.add(coinMesh);
              coins.push({
                mesh: coinMesh,
                pos: coinPos,
                lane,
                collected: false,
                baseY: 0.35,
              });
            }
          }
        }

        // Additional Coin Streams along lanes
        for (let dist = 4; dist < length - 6; dist += 14) {
          const lane = [-1, 0, 1][Math.floor(Math.random() * 3)];
          // 4 coins in a row
          for (let i = 0; i < 4; i++) {
            const coinPos = startPos.clone().addScaledVector(forwardVec, dist + i * 1.5).addScaledVector(rightVec, lane * laneWidth);
            coinPos.y = 0.8;
            const coinMesh = this.createCoinMesh(coinPos);
            group.add(coinMesh);
            coins.push({
              mesh: coinMesh,
              pos: coinPos,
              lane,
              collected: false,
              baseY: 0.8,
            });
          }
        }

        // Rare Powerup spawn (~20% chance per straight segment)
        if (Math.random() < 0.28) {
          const ptypes: ('magnet' | 'shield' | 'boost' | 'multiplier')[] = ['magnet', 'shield', 'boost', 'multiplier'];
          const chosenPType = ptypes[Math.floor(Math.random() * ptypes.length)];
          const pLane = [-1, 0, 1][Math.floor(Math.random() * 3)];
          const pPos = startPos.clone().addScaledVector(forwardVec, length * 0.5).addScaledVector(rightVec, pLane * laneWidth);
          pPos.y = 0.8;

          const pGroup = createPowerupPickup(chosenPType);
          pGroup.position.copy(pPos);
          group.add(pGroup);

          powerups.push({
            group: pGroup,
            pos: pPos,
            type: chosenPType,
            collected: false,
          });
        }
      }
    }

    this.scene.add(group);

    const segment: TrackSegment = {
      id: this.nextSegmentId++,
      group,
      startPos,
      endPos,
      direction: this.currentDirection,
      length,
      isTurn,
      turnDirection,
      type: theme,
      obstacles,
      coins,
      powerups,
    };

    this.segments.push(segment);

    // Update cursor pos
    this.cursorWorldPos = endPos;

    return segment;
  }

  private createCoinMesh(pos: THREE.Vector3): THREE.Mesh {
    const geo = new THREE.CylinderGeometry(0.32, 0.32, 0.08, 12);
    const mat = new THREE.MeshStandardMaterial({
      map: TextureLibrary.getCoin(),
      metalness: 0.9,
      roughness: 0.25,
      color: 0xffd700,
    });
    const mesh = new THREE.Mesh(geo, mat);
    mesh.position.copy(pos);
    mesh.rotation.x = Math.PI / 2;
    return mesh;
  }

  private ensureTrackLength() {
    // Keep at least 4 segments ahead of player
    while (this.segments.length < 7) {
      const themes: ('stone' | 'bridge' | 'vault')[] = ['stone', 'stone', 'bridge', 'vault'];
      const theme = themes[Math.floor(Math.random() * themes.length)];

      // Straight segment
      const straightLen = 45 + Math.floor(Math.random() * 25);
      this.buildSegment(straightLen, false, undefined, theme, false);

      // Add a 90° Turn Junction
      const turnDir = Math.random() > 0.5 ? 'RIGHT' : 'LEFT';
      this.buildSegment(10, true, turnDir, theme, false);

      // Turn the path building direction for subsequent segments
      this.currentDirection = this.turnDirectionClockwise(this.currentDirection, turnDir === 'RIGHT');
    }
  }

  // === PLAYER CONTROLS ===

  public handleTurn(direction: 'LEFT' | 'RIGHT') {
    if (this.gameState !== 'PLAYING') return;

    // Check if player is near an active turn junction
    const currentTurnSeg = this.segments.find((seg) => seg.isTurn && !seg.turnChosen);
    if (!currentTurnSeg) {
      // Minor stumble if turning on straight path
      this.triggerStumble();
      sound.playTurn();
      return;
    }

    const distToTurn = this.playerPos.distanceTo(currentTurnSeg.endPos);
    if (distToTurn < 10) {
      // Successful Turn!
      currentTurnSeg.turnChosen = direction;
      this.targetAngle += direction === 'LEFT' ? Math.PI / 2 : -Math.PI / 2;
      this.targetLane = 0;
      this.currentLaneOffset = 0;
      this.cameraShake = 0.2;
      sound.playTurn();

      // Add combo points
      this.score += 500 * this.baseMultiplier;
    } else {
      // Turned way too early
      this.triggerStumble();
      sound.playTurn();
    }
  }

  public handleLaneChange(direction: 'LEFT' | 'RIGHT') {
    if (this.gameState !== 'PLAYING') return;
    if (direction === 'LEFT' && this.targetLane > -1) {
      this.targetLane--;
      sound.playTurn();
    } else if (direction === 'RIGHT' && this.targetLane < 1) {
      this.targetLane++;
      sound.playTurn();
    }
  }

  public handleJump() {
    if (this.gameState !== 'PLAYING') return;
    if (this.isGrounded && !this.isJumping) {
      this.isJumping = true;
      this.isGrounded = false;
      this.playerVelocityY = 11.5;
      this.isSliding = false;
      this.slideTimer = 0;
      sound.playJump();
    }
  }

  public handleSlide() {
    if (this.gameState !== 'PLAYING') return;
    this.isSliding = true;
    this.slideTimer = 0.85; // slide duration in seconds
    if (this.isJumping) {
      // Fast fall down
      this.playerVelocityY = -14;
    }
    sound.playSlide();
  }

  public activateAdrenaline() {
    if (this.gameState !== 'PLAYING') return;
    if (this.adrenaline >= 100) {
      this.adrenaline = 0;
      this.applyPowerup('boost', 6.0);
      sound.playPowerup();
    }
  }

  private applyPowerup(type: 'magnet' | 'shield' | 'boost' | 'multiplier', baseDuration: number = 7.0) {
    let multiplier = 1.0;
    if (type === 'magnet') multiplier = this.upgrades.magnetDuration;
    if (type === 'shield') multiplier = this.upgrades.shieldDuration;
    if (type === 'boost') multiplier = this.upgrades.boostDuration;

    this.activePowerupType = type;
    this.powerupTimer = baseDuration * multiplier;
    if (type === 'shield') {
      this.hasShield = true;
    }
  }

  private triggerStumble() {
    if (this.isStumbling || this.activePowerupType === 'boost') return;
    this.isStumbling = true;
    this.stumbleTimer = 2.2;
    this.cameraShake = 0.45;
    sound.playStumble();
    sound.playDemonRoar();

    // Demon closes in!
    this.demonDistance = Math.max(3.2, this.demonDistance - 7.0);

    // If demon is right at heels and player stumbled, game over!
    if (this.demonDistance <= 4.0) {
      this.endGame('CAUGHT_BY_DEMON');
    }
  }

  private endGame(reason: string) {
    if (this.gameState === 'GAMEOVER') return;
    this.gameState = 'GAMEOVER';
    this.cameraShake = 0.8;
    sound.stopMusic();
    sound.playGameOver();

    const finalStats: GameStats = {
      distance: Math.floor(this.totalDistance),
      coins: this.coinsCount,
      score: Math.floor(this.score),
      multiplier: this.baseMultiplier,
      speed: Math.floor(this.speed),
      adrenaline: Math.floor(this.adrenaline),
      activePowerup: null,
      demonDistance: Math.floor(this.demonDistance),
      isStumbling: false,
      hasShield: this.hasShield,
    };

    if (this.onGameOver) {
      this.onGameOver(finalStats);
    }
  }

  // === MAIN 60FPS SIMULATION LOOP ===

  private tick = (time: number) => {
    this.animFrameId = requestAnimationFrame(this.tick);

    const rawDt = (time - this.lastTime) * 0.001;
    this.lastTime = time;
    const dt = Math.min(rawDt, 0.05); // Clamp dt for stable physics

    if (this.gameState === 'TITLE') {
      // Atmospheric live-world camera showcase on Title Screen
      const angle = time * 0.0004;
      this.camera.position.set(Math.sin(angle) * 8.5, 4.0, Math.cos(angle) * 8.5);
      this.camera.lookAt(0, 1.4, 0);

      // Idle run in place
      this.adventurer.updateAnimation(time * 0.001, 14, false, false, false, dt);
      this.demon.updateAnimation(time * 0.001, 14, dt);
      this.renderer.render(this.scene, this.camera);
      return;
    }

    if (this.gameState === 'PAUSED') {
      this.renderer.render(this.scene, this.camera);
      return;
    }

    if (this.gameState === 'PLAYING') {
      // 1. Difficulty & Speed Scaling
      const targetSpeed = this.activePowerupType === 'boost' ? 44 : 22 + Math.min(20, this.totalDistance * 0.015);
      this.speed = THREE.MathUtils.damp(this.speed, targetSpeed, 2.0, dt);
      sound.updateMusicSpeed(this.speed / 22);

      // Distance and Score progression
      const moveStep = this.speed * dt;
      this.totalDistance += moveStep;
      this.score += moveStep * (this.activePowerupType === 'multiplier' ? 4 : 2) * this.baseMultiplier;

      // 2. Smooth Turning & Angle damp
      this.currentAngle = THREE.MathUtils.damp(this.currentAngle, this.targetAngle, 9.0, dt);

      // Forward step in current heading
      const forwardHeading = new THREE.Vector3(
        -Math.sin(this.currentAngle),
        0,
        -Math.cos(this.currentAngle)
      );
      const rightHeading = new THREE.Vector3(
        Math.cos(this.currentAngle),
        0,
        -Math.sin(this.currentAngle)
      );

      this.playerPos.addScaledVector(forwardHeading, moveStep);

      // 3. Lane Switching Physics (Spring damping)
      const targetLaneX = this.targetLane * 1.6;
      this.currentLaneOffset = THREE.MathUtils.damp(this.currentLaneOffset, targetLaneX, 14.0, dt);

      // 4. Vertical Jump & Gravity
      if (!this.isGrounded) {
        this.playerVelocityY -= 32 * dt; // Gravity
        this.playerPos.y += this.playerVelocityY * dt;
        if (this.playerPos.y <= 0) {
          this.playerPos.y = 0;
          this.playerVelocityY = 0;
          this.isGrounded = true;
          this.isJumping = false;
        }
      }

      // 5. Slide Timer
      if (this.isSliding) {
        this.slideTimer -= dt;
        if (this.slideTimer <= 0) {
          this.isSliding = false;
        }
      }

      // 6. Stumble recovery
      if (this.isStumbling) {
        this.stumbleTimer -= dt;
        if (this.stumbleTimer <= 0) {
          this.isStumbling = false;
        }
      }

      // Demon monkey slowly retreats back if player runs cleanly
      if (!this.isStumbling && this.demonDistance < 14) {
        this.demonDistance = THREE.MathUtils.damp(this.demonDistance, 14, 0.4, dt);
      }

      // 7. Powerup timers
      if (this.activePowerupType) {
        this.powerupTimer -= dt;
        if (this.powerupTimer <= 0) {
          this.activePowerupType = null;
          this.hasShield = false;
        }
      }

      // 8. Update Adventurer Model Position & Orientation
      const effectivePlayerPos = this.playerPos.clone().addScaledVector(rightHeading, this.currentLaneOffset);
      this.adventurer.group.position.copy(effectivePlayerPos);
      this.adventurer.group.rotation.y = this.currentAngle;
      // Banking tilt when changing lanes
      const laneBank = (this.targetLane * 1.6 - this.currentLaneOffset) * 0.2;
      this.adventurer.group.rotation.z = -laneBank;

      this.adventurer.updateAnimation(
        time * 0.001,
        this.speed,
        this.isJumping,
        this.isSliding,
        this.isStumbling,
        dt
      );

      // 9. Update Demon Monkey Position (pursuing behind player)
      const demonPos = this.playerPos
        .clone()
        .addScaledVector(forwardHeading, -this.demonDistance)
        .addScaledVector(rightHeading, this.currentLaneOffset * 0.7);
      this.demon.group.position.copy(demonPos);
      this.demon.group.rotation.y = this.currentAngle;
      this.demon.updateAnimation(time * 0.001, this.speed, dt);

      // 10. Check Turn Junction Expiry (Did player miss a turn?)
      for (const seg of this.segments) {
        if (seg.isTurn && !seg.turnChosen) {
          const toEnd = this.playerPos.clone().sub(seg.endPos);
          const forwardDot = toEnd.dot(forwardHeading);
          // If player ran past the end of the turn junction without turning:
          if (forwardDot > 5.5) {
            this.endGame('MISSED_TURN');
            break;
          }
        }
      }

      // 11. Obstacle Collision Detection & Coin Collection
      const isInvulnerable = this.activePowerupType === 'boost';

      for (const seg of this.segments) {
        // Coin collection & Magnet physics
        for (const coin of seg.coins) {
          if (coin.collected) continue;

          // Rotate coin continuously
          coin.mesh.rotation.z += dt * 5.0;

          const distToCoin = effectivePlayerPos.distanceTo(coin.mesh.position);

          // Coin Magnet attraction
          if (this.activePowerupType === 'magnet' || isInvulnerable) {
            if (distToCoin < 16) {
              coin.mesh.position.lerp(effectivePlayerPos, dt * 12);
            }
          }

          // Collection radius
          if (distToCoin < 1.4) {
            coin.collected = true;
            seg.group.remove(coin.mesh);
            this.coinsCount += this.upgrades.coinValue;
            this.score += 50 * (this.activePowerupType === 'multiplier' ? 2 : 1) * this.baseMultiplier;
            this.adrenaline = Math.min(100, this.adrenaline + 1.5);
            sound.playCoin();
          }
        }

        // Power-up pickups
        for (const p of seg.powerups) {
          if (p.collected) continue;
          p.group.rotation.y += dt * 4.0;
          p.group.position.y = 0.8 + Math.sin(time * 0.005) * 0.15;

          if (effectivePlayerPos.distanceTo(p.pos) < 1.5) {
            p.collected = true;
            seg.group.remove(p.group);
            this.applyPowerup(p.type);
            sound.playPowerup();
          }
        }

        // Obstacles collision check
        for (const obs of seg.obstacles) {
          if (obs.cleared) continue;

          const toObs = effectivePlayerPos.clone().sub(obs.pos);
          const distAlong = toObs.dot(forwardHeading);
          const lateralDist = Math.abs(this.currentLaneOffset - obs.lane * 1.6);

          // If obstacle is ahead or just behind
          if (Math.abs(distAlong) < 1.0) {
            const laneOverlap = obs.lane === 99 || lateralDist < 1.0;

            if (laneOverlap) {
              if (obs.type === 'low') {
                // Must jump! If player is grounded or jump height is too low:
                if (effectivePlayerPos.y < 0.65) {
                  if (isInvulnerable) {
                    obs.cleared = true;
                  } else if (this.hasShield) {
                    this.hasShield = false;
                    obs.cleared = true;
                    this.cameraShake = 0.35;
                    sound.playStumble();
                  } else {
                    this.endGame('HIT_OBSTACLE');
                    return;
                  }
                }
              } else if (obs.type === 'high') {
                // Must slide! If player is not sliding:
                if (!this.isSliding) {
                  if (isInvulnerable) {
                    obs.cleared = true;
                  } else if (this.hasShield) {
                    this.hasShield = false;
                    obs.cleared = true;
                    this.cameraShake = 0.35;
                    sound.playStumble();
                  } else {
                    this.endGame('HIT_OBSTACLE');
                    return;
                  }
                }
              }
            }
          }

          if (distAlong > 2.0) {
            obs.cleared = true;
          }
        }
      }

      // 12. Segment recycling & spawning ahead
      if (this.segments.length > 0) {
        const firstSeg = this.segments[0];
        const distFromPlayer = effectivePlayerPos.distanceTo(firstSeg.endPos);
        if (distFromPlayer > 60 && this.segments.length > 5) {
          this.scene.remove(firstSeg.group);
          this.disposeObject(firstSeg.group);
          this.segments.shift();
        }
      }

      this.ensureTrackLength();

      // 13. Camera Follow Physics with Damping & Screen Shake
      const desiredCamPos = effectivePlayerPos
        .clone()
        .addScaledVector(forwardHeading, -this.cameraOffset.z)
        .add(new THREE.Vector3(0, this.cameraOffset.y, 0));

      // Camera Shake
      if (this.cameraShake > 0) {
        this.cameraShake = Math.max(0, this.cameraShake - dt * 1.5);
        desiredCamPos.x += (Math.random() - 0.5) * this.cameraShake * 1.2;
        desiredCamPos.y += (Math.random() - 0.5) * this.cameraShake * 1.2;
        desiredCamPos.z += (Math.random() - 0.5) * this.cameraShake * 1.2;
      }

      this.camera.position.lerp(desiredCamPos, 0.15);

      const lookTarget = effectivePlayerPos
        .clone()
        .addScaledVector(forwardHeading, this.cameraLookOffset.z)
        .add(new THREE.Vector3(0, this.cameraLookOffset.y, 0));
      this.camera.lookAt(lookTarget);

      // Update Directional Light position to track player
      this.dirLight.position.set(
        effectivePlayerPos.x + 20,
        effectivePlayerPos.y + 45,
        effectivePlayerPos.z + 25
      );
      this.dirLight.target.position.copy(effectivePlayerPos);
      this.dirLight.target.updateMatrixWorld();

      // Stats Update Callback for HUD
      if (this.onStatsUpdate) {
        this.onStatsUpdate({
          distance: Math.floor(this.totalDistance),
          coins: this.coinsCount,
          score: Math.floor(this.score),
          multiplier: this.baseMultiplier,
          speed: Math.floor(this.speed),
          adrenaline: Math.floor(this.adrenaline),
          activePowerup: this.activePowerupType ? { type: this.activePowerupType, remaining: Math.ceil(this.powerupTimer) } : null,
          demonDistance: Math.floor(this.demonDistance),
          isStumbling: this.isStumbling,
          hasShield: this.hasShield,
        });
      }
    }

    this.renderer.render(this.scene, this.camera);
  };

  public startGame() {
    this.resetTrack();
    this.gameState = 'PLAYING';
    sound.startMusic();
  }

  public pauseGame() {
    if (this.gameState === 'PLAYING') {
      this.gameState = 'PAUSED';
      sound.stopMusic();
    }
  }

  public resumeGame() {
    if (this.gameState === 'PAUSED') {
      this.gameState = 'PLAYING';
      this.lastTime = performance.now();
      sound.startMusic();
    }
  }

  public revive() {
    this.gameState = 'PLAYING';
    this.demonDistance = 14;
    this.isStumbling = false;
    this.applyPowerup('shield', 5.0);
    this.lastTime = performance.now();
    sound.startMusic();
  }

  public cleanup() {
    if (this.animFrameId !== null) {
      cancelAnimationFrame(this.animFrameId);
    }
    window.removeEventListener('resize', this.handleResize);
    sound.stopMusic();
    for (const seg of this.segments) {
      this.scene.remove(seg.group);
      this.disposeObject(seg.group);
    }
    this.renderer.dispose();
  }

  private disposeObject(obj: THREE.Object3D) {
    obj.traverse((child) => {
      if ((child as THREE.Mesh).isMesh) {
        const mesh = child as THREE.Mesh;
        if (mesh.geometry) mesh.geometry.dispose();
        if (Array.isArray(mesh.material)) {
          mesh.material.forEach((m) => m.dispose());
        } else if (mesh.material) {
          mesh.material.dispose();
        }
      }
    });
  }
}
