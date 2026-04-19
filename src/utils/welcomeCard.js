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

function drawRoundedRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

// Diamante dibujado (reemplaza ✦)
function drawDiamond(ctx, cx, cy, size, color, alpha = 1) {
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(cx, cy - size);
  ctx.lineTo(cx + size * 0.4, cy);
  ctx.lineTo(cx, cy + size);
  ctx.lineTo(cx - size * 0.4, cy);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

// Cruz de 4 puntas (estrella decorativa)
function drawSparkle(ctx, cx, cy, size, alpha) {
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.fillStyle = '#FFD700';
  // rayo vertical
  ctx.fillRect(cx - size * 0.12, cy - size, size * 0.24, size * 2);
  // rayo horizontal
  ctx.fillRect(cx - size, cy - size * 0.12, size * 2, size * 0.24);
  // rayo diagonal suave
  ctx.globalAlpha = alpha * 0.5;
  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate(Math.PI / 4);
  ctx.fillRect(-size * 0.6 * 0.12, -size * 0.6, size * 0.6 * 0.24, size * 0.6 * 2);
  ctx.fillRect(-size * 0.6, -size * 0.6 * 0.12, size * 0.6 * 2, size * 0.6 * 0.24);
  ctx.restore();
  ctx.restore();
}

function drawParticles(ctx, W, H) {
  const stars = [
    { x: 0.07,  y: 0.18, s: 5,  a: 0.7 },
    { x: 0.14,  y: 0.78, s: 3,  a: 0.5 },
    { x: 0.56,  y: 0.08, s: 6,  a: 0.6 },
    { x: 0.72,  y: 0.88, s: 3,  a: 0.4 },
    { x: 0.86,  y: 0.18, s: 7,  a: 0.55 },
    { x: 0.93,  y: 0.62, s: 4,  a: 0.6 },
    { x: 0.42,  y: 0.92, s: 4,  a: 0.4 },
    { x: 0.79,  y: 0.42, s: 3,  a: 0.5 },
    { x: 0.26,  y: 0.55, s: 2,  a: 0.3 },
    { x: 0.63,  y: 0.28, s: 4,  a: 0.45 },
    { x: 0.50,  y: 0.70, s: 2,  a: 0.3 },
    { x: 0.95,  y: 0.90, s: 5,  a: 0.4 },
  ];
  stars.forEach(p => drawSparkle(ctx, p.x * W, p.y * H, p.s, p.a));
}

function drawCircleAvatar(ctx, img, cx, cy, r) {
  ctx.save();
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.clip();
  ctx.drawImage(img, cx - r, cy - r, r * 2, r * 2);
  ctx.restore();
}

async function generateWelcomeCard({ username, avatarUrl, memberCount, serverName }) {
  const W = 1000, H = 340;
  const canvas = createCanvas(W, H);
  const ctx = canvas.getContext('2d');

  // ── Fondo carmesi -> fuego ──────────────────────────────────────────
  const bg = ctx.createLinearGradient(0, 0, W, H);
  bg.addColorStop(0,    '#1a0005');
  bg.addColorStop(0.45, '#2d0010');
  bg.addColorStop(1,    '#1a0000');
  ctx.fillStyle = bg;
  drawRoundedRect(ctx, 0, 0, W, H, 24);
  ctx.fill();

  // ── Cuadricula sutil ────────────────────────────────────────────────
  ctx.strokeStyle = 'rgba(255,215,0,0.04)';
  ctx.lineWidth = 1;
  for (let x = 0; x < W; x += 40) {
    ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke();
  }
  for (let y = 0; y < H; y += 40) {
    ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke();
  }

  // ── Resplandor carmesi detras del avatar ────────────────────────────
  const glowAvatar = ctx.createRadialGradient(170, H / 2, 0, 170, H / 2, 230);
  glowAvatar.addColorStop(0, 'rgba(180,0,40,0.35)');
  glowAvatar.addColorStop(0.5, 'rgba(100,0,10,0.15)');
  glowAvatar.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = glowAvatar;
  ctx.fillRect(0, 0, W, H);

  // ── Resplandor fuego esquina superior derecha ───────────────────────
  const glowFire = ctx.createRadialGradient(W - 80, 50, 0, W - 80, 50, 200);
  glowFire.addColorStop(0, 'rgba(255,80,0,0.12)');
  glowFire.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = glowFire;
  ctx.fillRect(0, 0, W, H);

  // ── Resplandor dorado en el centro ─────────────────────────────────
  const glowCenter = ctx.createRadialGradient(W * 0.6, H * 0.5, 0, W * 0.6, H * 0.5, 180);
  glowCenter.addColorStop(0, 'rgba(255,215,0,0.05)');
  glowCenter.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = glowCenter;
  ctx.fillRect(0, 0, W, H);

  // ── Estrellas ───────────────────────────────────────────────────────
  drawParticles(ctx, W, H);

  // ── Panel de texto ──────────────────────────────────────────────────
  const panelX = 320, panelY = 28, panelW = W - panelX - 28, panelH = H - 56;
  ctx.save();
  ctx.globalAlpha = 0.3;
  ctx.fillStyle = '#2a0010';
  drawRoundedRect(ctx, panelX, panelY, panelW, panelH, 16);
  ctx.fill();
  ctx.restore();

  ctx.save();
  ctx.globalAlpha = 0.7;
  ctx.strokeStyle = '#FFD700';
  ctx.lineWidth = 1.5;
  drawRoundedRect(ctx, panelX, panelY, panelW, panelH, 16);
  ctx.stroke();
  ctx.restore();

  // linea roja interior del panel
  ctx.save();
  ctx.globalAlpha = 0.3;
  ctx.strokeStyle = '#cc0020';
  ctx.lineWidth = 1;
  drawRoundedRect(ctx, panelX + 4, panelY + 4, panelW - 8, panelH - 8, 13);
  ctx.stroke();
  ctx.restore();

  // ── Borde exterior degradado ────────────────────────────────────────
  const borderGrad = ctx.createLinearGradient(0, 0, W, H);
  borderGrad.addColorStop(0,    '#FFD700');
  borderGrad.addColorStop(0.35, '#cc0020');
  borderGrad.addColorStop(0.65, '#cc0020');
  borderGrad.addColorStop(1,    '#FFD700');
  ctx.strokeStyle = borderGrad;
  ctx.lineWidth = 3;
  drawRoundedRect(ctx, 2, 2, W - 4, H - 4, 23);
  ctx.stroke();

  // ── Avatar ──────────────────────────────────────────────────────────
  const cx = 170, cy = H / 2, avatarR = 110;

  // halo carmesi exterior difuso
  const halo = ctx.createRadialGradient(cx, cy, avatarR * 0.6, cx, cy, avatarR * 1.9);
  halo.addColorStop(0, 'rgba(200,0,30,0.3)');
  halo.addColorStop(0.5, 'rgba(255,215,0,0.08)');
  halo.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = halo;
  ctx.beginPath();
  ctx.arc(cx, cy, avatarR * 1.9, 0, Math.PI * 2);
  ctx.fill();

  // anillo dorado exterior
  ctx.beginPath();
  ctx.arc(cx, cy, avatarR + 8, 0, Math.PI * 2);
  const ringGrad = ctx.createLinearGradient(cx - avatarR, cy - avatarR, cx + avatarR, cy + avatarR);
  ringGrad.addColorStop(0,    '#FFD700');
  ringGrad.addColorStop(0.4,  '#ff4400');
  ringGrad.addColorStop(0.6,  '#cc0020');
  ringGrad.addColorStop(1,    '#FFD700');
  ctx.strokeStyle = ringGrad;
  ctx.lineWidth = 5;
  ctx.stroke();

  // anillo interior fino blanco
  ctx.beginPath();
  ctx.arc(cx, cy, avatarR + 2, 0, Math.PI * 2);
  ctx.strokeStyle = 'rgba(255,255,255,0.2)';
  ctx.lineWidth = 1.5;
  ctx.stroke();

  // imagen avatar
  try {
    const buf = await fetchImage(avatarUrl);
    const img = await loadImage(buf);
    drawCircleAvatar(ctx, img, cx, cy, avatarR);
  } catch {
    ctx.beginPath();
    ctx.arc(cx, cy, avatarR, 0, Math.PI * 2);
    ctx.fillStyle = '#2a0010';
    ctx.fill();
  }

  // diamantes decorativos en las esquinas del panel
  drawDiamond(ctx, panelX,              panelY,              6, '#FFD700', 0.8);
  drawDiamond(ctx, panelX + panelW,     panelY,              6, '#FFD700', 0.8);
  drawDiamond(ctx, panelX,              panelY + panelH,     6, '#FFD700', 0.8);
  drawDiamond(ctx, panelX + panelW,     panelY + panelH,     6, '#FFD700', 0.8);

  // ── Textos ──────────────────────────────────────────────────────────
  const tx = panelX + 28;

  // Badge "NUEVO MIEMBRO"
  const badgeY = panelY + 44;
  ctx.save();
  ctx.fillStyle = 'rgba(255,215,0,0.12)';
  drawRoundedRect(ctx, tx, badgeY - 20, 168, 28, 6);
  ctx.fill();
  ctx.strokeStyle = 'rgba(255,215,0,0.55)';
  ctx.lineWidth = 1;
  drawRoundedRect(ctx, tx, badgeY - 20, 168, 28, 6);
  ctx.stroke();
  ctx.restore();

  ctx.font = 'bold 13px sans-serif';
  ctx.fillStyle = '#FFD700';
  ctx.fillText('NUEVO  MIEMBRO', tx + 22, badgeY);

  // diamante izquierda del badge
  drawDiamond(ctx, tx + 10, badgeY - 6, 5, '#FFD700', 0.9);

  // Username
  const maxW = panelW - 56;
  let fontSize = 52;
  ctx.font = `bold ${fontSize}px sans-serif`;
  while (ctx.measureText(username).width > maxW && fontSize > 26) {
    fontSize -= 2;
    ctx.font = `bold ${fontSize}px sans-serif`;
  }
  ctx.fillStyle = '#ffffff';
  ctx.shadowColor = 'rgba(200,0,30,0.6)';
  ctx.shadowBlur = 14;
  ctx.fillText(username, tx, badgeY + fontSize + 14);
  ctx.shadowBlur = 0;

  // linea separadora carmesi -> dorado -> transparente
  const lineY = badgeY + fontSize + 28;
  const lineGrad = ctx.createLinearGradient(tx, 0, tx + 280, 0);
  lineGrad.addColorStop(0,   '#cc0020');
  lineGrad.addColorStop(0.4, '#FFD700');
  lineGrad.addColorStop(1,   'rgba(255,215,0,0)');
  ctx.fillStyle = lineGrad;
  ctx.fillRect(tx, lineY, 280, 2);

  // Nombre del servidor
  ctx.font = '17px sans-serif';
  ctx.fillStyle = 'rgba(255,255,255,0.5)';
  ctx.fillText(serverName, tx + 14, lineY + 30);
  drawDiamond(ctx, tx + 5, lineY + 24, 4, '#cc0020', 0.8);

  // Miembro #N
  ctx.font = 'bold 15px sans-serif';
  ctx.fillStyle = '#FFD700';
  ctx.fillText(`Miembro  #${memberCount}`, tx, panelY + panelH - 22);
  drawDiamond(ctx, tx - 12, panelY + panelH - 28, 4, '#FFD700', 0.7);

  return canvas.toBuffer('image/png');
}

module.exports = { generateWelcomeCard };
