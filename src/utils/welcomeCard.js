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

function drawCircleAvatar(ctx, img, cx, cy, r) {
  ctx.save();
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.clip();
  ctx.drawImage(img, cx - r, cy - r, r * 2, r * 2);
  ctx.restore();
}

function drawGlow(ctx, cx, cy, r, color, alpha = 0.3) {
  const grad = ctx.createRadialGradient(cx, cy, r * 0.5, cx, cy, r * 1.8);
  grad.addColorStop(0, color.replace(')', `, ${alpha})`).replace('rgb', 'rgba'));
  grad.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.arc(cx, cy, r * 1.8, 0, Math.PI * 2);
  ctx.fill();
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

function drawStar(ctx, cx, cy, size, alpha) {
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  for (let i = 0; i < 4; i++) {
    const angle = (i / 4) * Math.PI * 2;
    const x = cx + Math.cos(angle) * size;
    const y = cy + Math.sin(angle) * size;
    i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
    const mx = cx + Math.cos(angle + Math.PI / 4) * size * 0.4;
    const my = cy + Math.sin(angle + Math.PI / 4) * size * 0.4;
    ctx.lineTo(mx, my);
  }
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

function drawParticles(ctx, W, H) {
  const particles = [
    { x: 0.08, y: 0.15, s: 4,  a: 0.7 },
    { x: 0.15, y: 0.75, s: 3,  a: 0.5 },
    { x: 0.55, y: 0.10, s: 5,  a: 0.6 },
    { x: 0.70, y: 0.85, s: 3,  a: 0.4 },
    { x: 0.85, y: 0.20, s: 6,  a: 0.5 },
    { x: 0.92, y: 0.60, s: 3,  a: 0.6 },
    { x: 0.40, y: 0.90, s: 4,  a: 0.4 },
    { x: 0.78, y: 0.45, s: 2,  a: 0.5 },
    { x: 0.25, y: 0.50, s: 2,  a: 0.3 },
    { x: 0.62, y: 0.30, s: 3,  a: 0.4 },
  ];
  particles.forEach(p => drawStar(ctx, p.x * W, p.y * H, p.s, p.a));
}

async function generateWelcomeCard({ username, avatarUrl, memberCount, serverName }) {
  const W = 1000, H = 340;
  const canvas = createCanvas(W, H);
  const ctx = canvas.getContext('2d');

  // ── Fondo principal ──────────────────────────────────────────────────
  const bg = ctx.createLinearGradient(0, 0, W, H);
  bg.addColorStop(0,   '#0d0d1a');
  bg.addColorStop(0.5, '#0a0f2e');
  bg.addColorStop(1,   '#0d0d1a');
  ctx.fillStyle = bg;
  drawRoundedRect(ctx, 0, 0, W, H, 24);
  ctx.fill();

  // ── Líneas de cuadrícula decorativas ────────────────────────────────
  ctx.strokeStyle = 'rgba(255,215,0,0.04)';
  ctx.lineWidth = 1;
  for (let x = 0; x < W; x += 40) {
    ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke();
  }
  for (let y = 0; y < H; y += 40) {
    ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke();
  }

  // ── Resplandores de fondo ────────────────────────────────────────────
  const glow1 = ctx.createRadialGradient(180, H / 2, 0, 180, H / 2, 220);
  glow1.addColorStop(0, 'rgba(255,215,0,0.12)');
  glow1.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = glow1;
  ctx.fillRect(0, 0, W, H);

  const glow2 = ctx.createRadialGradient(W - 100, 60, 0, W - 100, 60, 180);
  glow2.addColorStop(0, 'rgba(100,80,255,0.10)');
  glow2.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = glow2;
  ctx.fillRect(0, 0, W, H);

  // ── Partículas/estrellas ─────────────────────────────────────────────
  drawParticles(ctx, W, H);

  // ── Panel de texto (derecha) ─────────────────────────────────────────
  const panelX = 320, panelY = 30, panelW = W - panelX - 30, panelH = H - 60;
  ctx.save();
  ctx.globalAlpha = 0.35;
  ctx.fillStyle = '#1a1a3e';
  drawRoundedRect(ctx, panelX, panelY, panelW, panelH, 16);
  ctx.fill();
  ctx.restore();

  // borde dorado panel
  ctx.save();
  ctx.globalAlpha = 0.6;
  ctx.strokeStyle = '#FFD700';
  ctx.lineWidth = 1.5;
  drawRoundedRect(ctx, panelX, panelY, panelW, panelH, 16);
  ctx.stroke();
  ctx.restore();

  // ── Borde exterior del canvas ────────────────────────────────────────
  const borderGrad = ctx.createLinearGradient(0, 0, W, H);
  borderGrad.addColorStop(0,   '#FFD700');
  borderGrad.addColorStop(0.5, '#aa8800');
  borderGrad.addColorStop(1,   '#FFD700');
  ctx.strokeStyle = borderGrad;
  ctx.lineWidth = 3;
  drawRoundedRect(ctx, 2, 2, W - 4, H - 4, 23);
  ctx.stroke();

  // ── Avatar ───────────────────────────────────────────────────────────
  const cx = 170, cy = H / 2, avatarR = 110;

  // halo exterior difuso
  drawGlow(ctx, cx, cy, avatarR, 'rgb(255,215,0)', 0.25);

  // anillo exterior
  ctx.beginPath();
  ctx.arc(cx, cy, avatarR + 8, 0, Math.PI * 2);
  const ringGrad = ctx.createLinearGradient(cx - avatarR, cy - avatarR, cx + avatarR, cy + avatarR);
  ringGrad.addColorStop(0, '#FFD700');
  ringGrad.addColorStop(0.5, '#fff8dc');
  ringGrad.addColorStop(1, '#FFD700');
  ctx.strokeStyle = ringGrad;
  ctx.lineWidth = 5;
  ctx.stroke();

  // anillo interior delgado
  ctx.beginPath();
  ctx.arc(cx, cy, avatarR + 2, 0, Math.PI * 2);
  ctx.strokeStyle = 'rgba(255,255,255,0.3)';
  ctx.lineWidth = 1.5;
  ctx.stroke();

  // imagen del avatar
  try {
    const buf = await fetchImage(avatarUrl);
    const img = await loadImage(buf);
    drawCircleAvatar(ctx, img, cx, cy, avatarR);
  } catch {
    ctx.beginPath();
    ctx.arc(cx, cy, avatarR, 0, Math.PI * 2);
    ctx.fillStyle = '#2a2a4a';
    ctx.fill();
  }

  // ── Textos ───────────────────────────────────────────────────────────
  const tx = panelX + 30;

  // "NUEVO MIEMBRO" badge
  const badgeY = panelY + 42;
  ctx.save();
  ctx.fillStyle = 'rgba(255,215,0,0.15)';
  drawRoundedRect(ctx, tx, badgeY - 18, 160, 26, 6);
  ctx.fill();
  ctx.strokeStyle = 'rgba(255,215,0,0.5)';
  ctx.lineWidth = 1;
  drawRoundedRect(ctx, tx, badgeY - 18, 160, 26, 6);
  ctx.stroke();
  ctx.restore();

  ctx.font = 'bold 13px sans-serif';
  ctx.fillStyle = '#FFD700';
  ctx.fillText('✦  NUEVO MIEMBRO  ✦', tx + 10, badgeY);

  // Username
  const maxW = panelW - 60;
  let fontSize = 54;
  ctx.font = `bold ${fontSize}px sans-serif`;
  while (ctx.measureText(username).width > maxW && fontSize > 28) {
    fontSize -= 2;
    ctx.font = `bold ${fontSize}px sans-serif`;
  }
  ctx.fillStyle = '#ffffff';
  ctx.shadowColor = 'rgba(255,215,0,0.4)';
  ctx.shadowBlur = 10;
  ctx.fillText(username, tx, badgeY + fontSize + 14);
  ctx.shadowBlur = 0;

  // línea separadora dorada
  const lineY = badgeY + fontSize + 28;
  const lineGrad = ctx.createLinearGradient(tx, 0, tx + 260, 0);
  lineGrad.addColorStop(0, '#FFD700');
  lineGrad.addColorStop(1, 'rgba(255,215,0,0)');
  ctx.fillStyle = lineGrad;
  ctx.fillRect(tx, lineY, 260, 2);

  // Servidor
  ctx.font = '18px sans-serif';
  ctx.fillStyle = 'rgba(255,255,255,0.55)';
  ctx.fillText(`✦ ${serverName}`, tx, lineY + 30);

  // Miembro #N
  ctx.font = 'bold 16px sans-serif';
  ctx.fillStyle = '#FFD700';
  ctx.fillText(`Miembro  #${memberCount}`, tx, panelY + panelH - 22);

  return canvas.toBuffer('image/png');
}

module.exports = { generateWelcomeCard };
