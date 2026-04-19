const { createCanvas, loadImage } = require('@napi-rs/canvas');
const https = require('https');

function fetchImage(url) {
  return new Promise((resolve, reject) => {
    https.get(url, res => {
      const chunks = [];
      res.on('data', d => chunks.push(d));
      res.on('end', () => resolve(Buffer.concat(chunks)));
      res.on('error', reject);
    }).on('error', reject);
  });
}

// Hexagono regular (plano arriba)
function hexPath(ctx, cx, cy, r) {
  ctx.beginPath();
  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * Math.PI * 2 - Math.PI / 6;
    const x = cx + r * Math.cos(a);
    const y = cy + r * Math.sin(a);
    i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
  }
  ctx.closePath();
}

// Esquinas geometricas (en lugar de borde completo)
function drawCorners(ctx, x, y, w, h, size, color, lw = 3) {
  ctx.strokeStyle = color;
  ctx.lineWidth = lw;
  ctx.lineCap = 'square';
  const corners = [
    [[x, y + size], [x, y], [x + size, y]],
    [[x + w - size, y], [x + w, y], [x + w, y + size]],
    [[x + w, y + h - size], [x + w, y + h], [x + w - size, y + h]],
    [[x + size, y + h], [x, y + h], [x, y + h - size]],
  ];
  corners.forEach(pts => {
    ctx.beginPath();
    ctx.moveTo(pts[0][0], pts[0][1]);
    ctx.lineTo(pts[1][0], pts[1][1]);
    ctx.lineTo(pts[2][0], pts[2][1]);
    ctx.stroke();
  });
}

// Partícula ember (brasa pequeña con halo)
function drawEmber(ctx, x, y, r, color) {
  const glow = ctx.createRadialGradient(x, y, 0, x, y, r * 3);
  glow.addColorStop(0, color);
  glow.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = glow;
  ctx.beginPath();
  ctx.arc(x, y, r * 3, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = '#ffffff';
  ctx.globalAlpha = 0.9;
  ctx.beginPath();
  ctx.arc(x, y, r * 0.5, 0, Math.PI * 2);
  ctx.fill();
  ctx.globalAlpha = 1;
}

// Texto de marca de agua gigante
function drawWatermark(ctx, text, cx, cy, fontSize, color) {
  ctx.save();
  ctx.font = `900 ${fontSize}px sans-serif`;
  ctx.fillStyle = color;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.globalAlpha = 0.04;
  ctx.fillText(text, cx, cy);
  ctx.restore();
}

// Grano de ruido (textura sutil)
function drawGrain(ctx, W, H) {
  ctx.save();
  ctx.globalAlpha = 0.025;
  for (let i = 0; i < 2200; i++) {
    const x = Math.random() * W;
    const y = Math.random() * H;
    const s = Math.random() * 1.2;
    ctx.fillStyle = Math.random() > 0.5 ? '#ffffff' : '#ff2200';
    ctx.fillRect(x, y, s, s);
  }
  ctx.restore();
}

async function generateWelcomeCard({ username, avatarUrl, memberCount, serverName }) {
  const W = 1060, H = 360;
  const canvas = createCanvas(W, H);
  const ctx = canvas.getContext('2d');

  // ── Fondo negro profundo ────────────────────────────────────────────
  ctx.fillStyle = '#070707';
  ctx.fillRect(0, 0, W, H);

  // ── Banda diagonal carmesi-fuego de fondo ───────────────────────────
  ctx.save();
  ctx.globalAlpha = 0.13;
  const band = ctx.createLinearGradient(0, H, W * 0.75, 0);
  band.addColorStop(0,   '#8b0000');
  band.addColorStop(0.5, '#cc2200');
  band.addColorStop(1,   '#ff6600');
  ctx.fillStyle = band;
  ctx.beginPath();
  ctx.moveTo(0, H);
  ctx.lineTo(W * 0.78, 0);
  ctx.lineTo(W, 0);
  ctx.lineTo(W * 0.22, H);
  ctx.closePath();
  ctx.fill();
  ctx.restore();

  // ── Resplandor carmesi izquierda (zona avatar) ──────────────────────
  const glowL = ctx.createRadialGradient(190, H / 2, 0, 190, H / 2, 260);
  glowL.addColorStop(0,   'rgba(160,0,20,0.45)');
  glowL.addColorStop(0.6, 'rgba(80,0,10,0.15)');
  glowL.addColorStop(1,   'rgba(0,0,0,0)');
  ctx.fillStyle = glowL;
  ctx.fillRect(0, 0, W, H);

  // ── Resplandor fuego esquina superior derecha ───────────────────────
  const glowR = ctx.createRadialGradient(W - 60, 40, 0, W - 60, 40, 220);
  glowR.addColorStop(0,  'rgba(200,60,0,0.18)');
  glowR.addColorStop(1,  'rgba(0,0,0,0)');
  ctx.fillStyle = glowR;
  ctx.fillRect(0, 0, W, H);

  // ── Marca de agua ───────────────────────────────────────────────────
  drawWatermark(ctx, 'WELCOME', W * 0.56, H * 0.5, 200, '#cc1100');

  // ── Grano de ruido ──────────────────────────────────────────────────
  drawGrain(ctx, W, H);

  // ── Brasas (embers) ─────────────────────────────────────────────────
  const emberColors = [
    'rgba(255,60,0,0.7)',
    'rgba(255,140,0,0.6)',
    'rgba(200,0,20,0.6)',
    'rgba(255,200,0,0.5)',
    'rgba(255,80,0,0.65)',
  ];
  const embers = [
    { x: 0.05, y: 0.12, r: 2.5 }, { x: 0.11, y: 0.82, r: 2 },
    { x: 0.42, y: 0.08, r: 3 },   { x: 0.58, y: 0.90, r: 2 },
    { x: 0.72, y: 0.14, r: 3.5 }, { x: 0.88, y: 0.72, r: 2.5 },
    { x: 0.95, y: 0.22, r: 2 },   { x: 0.35, y: 0.88, r: 2 },
    { x: 0.80, y: 0.45, r: 3 },   { x: 0.64, y: 0.20, r: 2 },
    { x: 0.50, y: 0.78, r: 2.5 }, { x: 0.22, y: 0.50, r: 1.5 },
    { x: 0.90, y: 0.92, r: 3 },   { x: 0.15, y: 0.30, r: 1.5 },
  ];
  embers.forEach((e, i) => {
    drawEmber(ctx, e.x * W, e.y * H, e.r, emberColors[i % emberColors.length]);
  });

  // ── Barra lateral izquierda ─────────────────────────────────────────
  const bar = ctx.createLinearGradient(0, 0, 0, H);
  bar.addColorStop(0,   'rgba(255,215,0,0)');
  bar.addColorStop(0.3, '#cc0020');
  bar.addColorStop(0.7, '#ff4400');
  bar.addColorStop(1,   'rgba(255,215,0,0)');
  ctx.fillStyle = bar;
  ctx.fillRect(0, 0, 4, H);

  // ── Separador vertical entre avatar y texto ─────────────────────────
  const sep = ctx.createLinearGradient(0, 0, 0, H);
  sep.addColorStop(0,   'rgba(255,215,0,0)');
  sep.addColorStop(0.2, 'rgba(255,215,0,0.6)');
  sep.addColorStop(0.5, 'rgba(200,0,30,0.8)');
  sep.addColorStop(0.8, 'rgba(255,215,0,0.6)');
  sep.addColorStop(1,   'rgba(255,215,0,0)');
  ctx.fillStyle = sep;
  ctx.fillRect(342, 10, 1.5, H - 20);

  // ── AVATAR hexagonal ────────────────────────────────────────────────
  const cx = 182, cy = H / 2, hexR = 115;

  // halo difuso exterior
  const halo = ctx.createRadialGradient(cx, cy, hexR * 0.4, cx, cy, hexR * 2.2);
  halo.addColorStop(0,   'rgba(200,0,30,0.4)');
  halo.addColorStop(0.5, 'rgba(255,80,0,0.1)');
  halo.addColorStop(1,   'rgba(0,0,0,0)');
  ctx.fillStyle = halo;
  ctx.beginPath();
  ctx.arc(cx, cy, hexR * 2.2, 0, Math.PI * 2);
  ctx.fill();

  // hexagono relleno (sombra interna)
  hexPath(ctx, cx, cy, hexR + 12);
  ctx.fillStyle = '#1a0005';
  ctx.fill();

  // borde hex exterior — gradiente dorado-carmesi
  hexPath(ctx, cx, cy, hexR + 12);
  const hexBorder = ctx.createLinearGradient(cx - hexR, cy - hexR, cx + hexR, cy + hexR);
  hexBorder.addColorStop(0,   '#FFD700');
  hexBorder.addColorStop(0.4, '#ff4400');
  hexBorder.addColorStop(0.6, '#cc0020');
  hexBorder.addColorStop(1,   '#FFD700');
  ctx.strokeStyle = hexBorder;
  ctx.lineWidth = 4;
  ctx.stroke();

  // borde hex interior fino
  hexPath(ctx, cx, cy, hexR + 4);
  ctx.strokeStyle = 'rgba(255,255,255,0.15)';
  ctx.lineWidth = 1.2;
  ctx.stroke();

  // clip y dibujar avatar
  try {
    const buf = await fetchImage(avatarUrl);
    const img = await loadImage(buf);
    ctx.save();
    hexPath(ctx, cx, cy, hexR);
    ctx.clip();
    ctx.drawImage(img, cx - hexR, cy - hexR, hexR * 2, hexR * 2);
    ctx.restore();
  } catch {
    ctx.save();
    hexPath(ctx, cx, cy, hexR);
    ctx.fillStyle = '#1a0005';
    ctx.fill();
    ctx.restore();
  }

  // ── Esquinas geometricas ────────────────────────────────────────────
  drawCorners(ctx, 12, 12, W - 24, H - 24, 28, '#FFD700', 2.5);
  drawCorners(ctx, 16, 16, W - 32, H - 32, 16, 'rgba(200,0,30,0.6)', 1);

  // ── TEXTOS ──────────────────────────────────────────────────────────
  const tx = 370;

  // etiqueta "NUEVO MIEMBRO" — solo texto, sin fondo
  ctx.font = 'bold 11px sans-serif';
  ctx.fillStyle = '#cc0020';
  ctx.letterSpacing = '4px';
  ctx.fillText('NUEVO  MIEMBRO', tx, 80);
  ctx.letterSpacing = '0px';

  // linea bajo la etiqueta
  const labelLineGrad = ctx.createLinearGradient(tx, 0, tx + 200, 0);
  labelLineGrad.addColorStop(0,   '#cc0020');
  labelLineGrad.addColorStop(0.6, '#FFD700');
  labelLineGrad.addColorStop(1,   'rgba(0,0,0,0)');
  ctx.fillStyle = labelLineGrad;
  ctx.fillRect(tx, 88, 220, 1.5);

  // Username — grande y con sombra fuego
  const maxW = W - tx - 30;
  let fs = 70;
  ctx.font = `900 ${fs}px sans-serif`;
  while (ctx.measureText(username).width > maxW && fs > 28) {
    fs -= 2;
    ctx.font = `900 ${fs}px sans-serif`;
  }
  ctx.shadowColor = 'rgba(200,0,20,0.8)';
  ctx.shadowBlur = 20;
  ctx.fillStyle = '#ffffff';
  ctx.fillText(username, tx, 88 + fs + 14);
  ctx.shadowBlur = 0;

  // linea separadora gruesa dorado -> transparente
  const sepLine = ctx.createLinearGradient(tx, 0, tx + 320, 0);
  sepLine.addColorStop(0,   '#FFD700');
  sepLine.addColorStop(0.5, 'rgba(255,215,0,0.4)');
  sepLine.addColorStop(1,   'rgba(0,0,0,0)');
  ctx.fillStyle = sepLine;
  ctx.fillRect(tx, 88 + fs + 26, 320, 2.5);

  // nombre servidor
  ctx.font = '16px sans-serif';
  ctx.fillStyle = 'rgba(255,255,255,0.4)';
  ctx.fillText(serverName, tx, 88 + fs + 58);

  // miembro # — abajo derecha del panel
  ctx.font = 'bold 14px sans-serif';
  ctx.fillStyle = '#FFD700';
  ctx.fillText(`Miembro  #${memberCount}`, tx, H - 32);

  // pequeño rectangulo decorativo junto al miembro
  ctx.fillStyle = '#cc0020';
  ctx.fillRect(tx - 12, H - 44, 3, 18);

  return canvas.toBuffer('image/png');
}

module.exports = { generateWelcomeCard };
