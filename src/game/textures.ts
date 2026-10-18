import * as THREE from 'three';

/**
 * Procedural texture generators for ancient temple tiles, carvings, wood planks, coins, and runes.
 * Enforces zero-404 asset policy and sets SRGBColorSpace.
 */

export class TextureLibrary {
  private static stonePaverTex: THREE.CanvasTexture | null = null;
  private static stoneWallTex: THREE.CanvasTexture | null = null;
  private static woodPlankTex: THREE.CanvasTexture | null = null;
  private static fireParticleTex: THREE.CanvasTexture | null = null;
  private static coinTex: THREE.CanvasTexture | null = null;
  private static demonSkinTex: THREE.CanvasTexture | null = null;
  private static runeArrowTex: THREE.CanvasTexture | null = null;

  public static initAnisotropy(maxAniso: number) {
    const texs = [
      this.stonePaverTex,
      this.stoneWallTex,
      this.woodPlankTex,
      this.coinTex,
      this.demonSkinTex,
      this.runeArrowTex,
    ];
    texs.forEach((t) => {
      if (t) t.anisotropy = maxAniso;
    });
  }

  // Ancient mossy stone paving tiles
  public static getStonePaver(): THREE.CanvasTexture {
    if (this.stonePaverTex) return this.stonePaverTex;
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext('2d')!;

    // Base stone color
    ctx.fillStyle = '#4a443b';
    ctx.fillRect(0, 0, 512, 512);

    // Stone blocks grid
    const cols = 4;
    const rows = 4;
    const cw = 512 / cols;
    const ch = 512 / rows;

    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const x = c * cw;
        const y = r * ch;
        // slight tone variance
        const shade = Math.floor(65 + Math.random() * 25);
        ctx.fillStyle = `rgb(${shade + 5}, ${shade}, ${shade - 8})`;
        ctx.fillRect(x + 3, y + 3, cw - 6, ch - 6);

        // Inner bevel
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
        ctx.lineWidth = 2;
        ctx.strokeRect(x + 5, y + 5, cw - 10, ch - 10);

        // Cracks
        ctx.strokeStyle = 'rgba(20, 16, 12, 0.45)';
        ctx.lineWidth = 1.5;
        if (Math.random() > 0.4) {
          ctx.beginPath();
          ctx.moveTo(x + 10, y + 10);
          ctx.lineTo(x + cw * 0.4, y + ch * 0.5);
          ctx.lineTo(x + cw * 0.8, y + ch * 0.6);
          ctx.stroke();
        }

        // Moss spots
        if (Math.random() > 0.5) {
          ctx.fillStyle = 'rgba(38, 70, 32, 0.4)';
          ctx.beginPath();
          ctx.arc(x + cw * 0.5, y + ch * 0.5, 12 + Math.random() * 15, 0, Math.PI * 2);
          ctx.fill();
        }
      }
    }

    // Mortar gaps
    ctx.strokeStyle = '#1d1712';
    ctx.lineWidth = 6;
    for (let i = 0; i <= 512; i += cw) {
      ctx.beginPath();
      ctx.moveTo(i, 0);
      ctx.lineTo(i, 512);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(0, i);
      ctx.lineTo(512, i);
      ctx.stroke();
    }

    const tex = new THREE.CanvasTexture(canvas);
    tex.wrapS = THREE.RepeatWrapping;
    tex.wrapT = THREE.RepeatWrapping;
    tex.colorSpace = THREE.SRGBColorSpace;
    this.stonePaverTex = tex;
    return tex;
  }

  // Ancient carved wall relief
  public static getStoneWall(): THREE.CanvasTexture {
    if (this.stoneWallTex) return this.stoneWallTex;
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext('2d')!;

    // Dark temple masonry
    ctx.fillStyle = '#3a332a';
    ctx.fillRect(0, 0, 512, 512);

    // Carved horizontal relief bands
    for (let y = 30; y < 512; y += 90) {
      // Band background
      ctx.fillStyle = '#2d261e';
      ctx.fillRect(0, y, 512, 45);

      // Engraved glyphs
      ctx.strokeStyle = '#6e5e49';
      ctx.lineWidth = 3;
      for (let x = 20; x < 512; x += 55) {
        // Glyphic square / spiral pattern
        ctx.strokeRect(x, y + 8, 30, 30);
        ctx.beginPath();
        ctx.moveTo(x + 7, y + 15);
        ctx.lineTo(x + 23, y + 15);
        ctx.lineTo(x + 23, y + 30);
        ctx.lineTo(x + 14, y + 30);
        ctx.stroke();
      }

      // Golden accent dust in engravings
      ctx.fillStyle = 'rgba(215, 160, 40, 0.15)';
      ctx.fillRect(0, y + 39, 512, 4);
    }

    const tex = new THREE.CanvasTexture(canvas);
    tex.wrapS = THREE.RepeatWrapping;
    tex.wrapT = THREE.RepeatWrapping;
    tex.colorSpace = THREE.SRGBColorSpace;
    this.stoneWallTex = tex;
    return tex;
  }

  // Wooden rope bridge planks
  public static getWoodPlank(): THREE.CanvasTexture {
    if (this.woodPlankTex) return this.woodPlankTex;
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext('2d')!;

    ctx.fillStyle = '#533822';
    ctx.fillRect(0, 0, 512, 512);

    const plankH = 512 / 8;
    for (let i = 0; i < 8; i++) {
      const y = i * plankH;
      // Tone variation
      const v = Math.random() * 20;
      ctx.fillStyle = `rgb(${75 + v}, ${48 + v * 0.7}, ${28 + v * 0.5})`;
      ctx.fillRect(0, y + 2, 512, plankH - 4);

      // Wood grain lines
      ctx.strokeStyle = 'rgba(30, 18, 10, 0.35)';
      ctx.lineWidth = 1;
      for (let g = 0; g < 4; g++) {
        const gy = y + 8 + g * 12;
        ctx.beginPath();
        ctx.moveTo(0, gy);
        ctx.bezierCurveTo(150, gy + Math.sin(i) * 6, 350, gy - Math.sin(i) * 6, 512, gy);
        ctx.stroke();
      }

      // Iron nails on sides
      ctx.fillStyle = '#221a15';
      ctx.beginPath();
      ctx.arc(35, y + plankH * 0.5, 4, 0, Math.PI * 2);
      ctx.arc(477, y + plankH * 0.5, 4, 0, Math.PI * 2);
      ctx.fill();
    }

    const tex = new THREE.CanvasTexture(canvas);
    tex.wrapS = THREE.RepeatWrapping;
    tex.wrapT = THREE.RepeatWrapping;
    tex.colorSpace = THREE.SRGBColorSpace;
    this.woodPlankTex = tex;
    return tex;
  }

  // Torch fire flame particle billboard
  public static getFireParticle(): THREE.CanvasTexture {
    if (this.fireParticleTex) return this.fireParticleTex;
    const canvas = document.createElement('canvas');
    canvas.width = 128;
    canvas.height = 128;
    const ctx = canvas.getContext('2d')!;

    const grad = ctx.createRadialGradient(64, 64, 0, 64, 64, 60);
    grad.addColorStop(0, 'rgba(255, 255, 220, 1)');
    grad.addColorStop(0.2, 'rgba(255, 195, 30, 0.9)');
    grad.addColorStop(0.5, 'rgba(240, 80, 15, 0.6)');
    grad.addColorStop(0.85, 'rgba(180, 20, 5, 0.2)');
    grad.addColorStop(1, 'rgba(0, 0, 0, 0)');

    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 128, 128);

    const tex = new THREE.CanvasTexture(canvas);
    this.fireParticleTex = tex;
    return tex;
  }

  // Golden Aztec coin face
  public static getCoin(): THREE.CanvasTexture {
    if (this.coinTex) return this.coinTex;
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 256;
    const ctx = canvas.getContext('2d')!;

    // Gold rim
    const grad = ctx.createRadialGradient(128, 128, 60, 128, 128, 120);
    grad.addColorStop(0, '#ffd700');
    grad.addColorStop(0.7, '#d4af37');
    grad.addColorStop(1, '#996515');

    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(128, 128, 120, 0, Math.PI * 2);
    ctx.fill();

    // Aztec sun border notches
    ctx.strokeStyle = '#6e4808';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.arc(128, 128, 100, 0, Math.PI * 2);
    ctx.stroke();

    for (let a = 0; a < Math.PI * 2; a += Math.PI / 8) {
      const x1 = 128 + Math.cos(a) * 100;
      const y1 = 128 + Math.sin(a) * 100;
      const x2 = 128 + Math.cos(a) * 115;
      const y2 = 128 + Math.sin(a) * 115;
      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);
      ctx.stroke();
    }

    // Central relic mask symbol
    ctx.fillStyle = '#6e4808';
    // Eyes
    ctx.fillRect(95, 95, 18, 18);
    ctx.fillRect(143, 95, 18, 18);
    // Mouth
    ctx.fillRect(100, 140, 56, 14);

    const tex = new THREE.CanvasTexture(canvas);
    tex.colorSpace = THREE.SRGBColorSpace;
    this.coinTex = tex;
    return tex;
  }

  // Glowing runic turn indicator arrows
  public static getRuneArrow(): THREE.CanvasTexture {
    if (this.runeArrowTex) return this.runeArrowTex;
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 256;
    const ctx = canvas.getContext('2d')!;

    ctx.clearRect(0, 0, 256, 256);

    // Glowing chevron
    ctx.strokeStyle = '#f59e0b';
    ctx.lineWidth = 18;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.shadowColor = '#fbbf24';
    ctx.shadowBlur = 20;

    // Chevron pointing up (will be rotated toward turn direction)
    ctx.beginPath();
    ctx.moveTo(50, 170);
    ctx.lineTo(128, 80);
    ctx.lineTo(206, 170);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(70, 210);
    ctx.lineTo(128, 140);
    ctx.lineTo(186, 210);
    ctx.stroke();

    const tex = new THREE.CanvasTexture(canvas);
    tex.colorSpace = THREE.SRGBColorSpace;
    this.runeArrowTex = tex;
    return tex;
  }
}
