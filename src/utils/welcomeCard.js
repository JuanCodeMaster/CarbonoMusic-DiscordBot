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

function roundedRect(ctx, x, y, w, h, r) {
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

async function generateWelcomeCard({ username, avatarUrl, memberCount, serverName }) {
  const W = 900, H = 300;
  const canvas = createCanvas(W, H);
  const ctx = canvas.getContext('2d');

  // Fondo degradado oscuro
  const bg = ctx.createLinearGradient(0, 0, W, H);
  bg.addColorStop(0, '#1a1a2e');
  bg.addColorStop(1, '#16213e');
  ctx.fillStyle = bg;
  roundedRect(ctx, 0, 0, W, H, 20);
  ctx.fill();

  // Borde dorado
  ctx.strokeStyle = '#FFD700';
  ctx.lineWidth = 3;
  roundedRect(ctx, 2, 2, W - 4, H - 4, 18);
  ctx.stroke();

  // Línea vertical decorativa
  ctx.fillStyle = '#FFD700';
  ctx.fillRect(270, 40, 2, H - 80);

  // Avatar circular
  const avatarSize = 160;
  const avatarX = 55;
  const avatarY = H / 2 - avatarSize / 2;

  // Borde dorado del avatar
  ctx.beginPath();
  ctx.arc(avatarX + avatarSize / 2, H / 2, avatarSize / 2 + 5, 0, Math.PI * 2);
  ctx.fillStyle = '#FFD700';
  ctx.fill();

  // Avatar
  try {
    const avatarBuffer = await fetchImage(avatarUrl);
    const avatarImg = await loadImage(avatarBuffer);
    ctx.save();
    ctx.beginPath();
    ctx.arc(avatarX + avatarSize / 2, H / 2, avatarSize / 2, 0, Math.PI * 2);
    ctx.clip();
    ctx.drawImage(avatarImg, avatarX, avatarY, avatarSize, avatarSize);
    ctx.restore();
  } catch {
    ctx.beginPath();
    ctx.arc(avatarX + avatarSize / 2, H / 2, avatarSize / 2, 0, Math.PI * 2);
    ctx.fillStyle = '#333';
    ctx.fill();
  }

  const textX = 300;

  // "¡BIENVENIDO!" pequeño arriba
  ctx.font = 'bold 22px sans-serif';
  ctx.fillStyle = '#FFD700';
  ctx.fillText('¡BIENVENIDO!', textX, 90);

  // Nombre de usuario grande
  const maxWidth = W - textX - 30;
  let fontSize = 52;
  ctx.font = `bold ${fontSize}px sans-serif`;
  while (ctx.measureText(username).width > maxWidth && fontSize > 28) {
    fontSize -= 2;
    ctx.font = `bold ${fontSize}px sans-serif`;
  }
  ctx.fillStyle = '#ffffff';
  ctx.fillText(username, textX, 90 + fontSize + 10);

  // Servidor
  ctx.font = '20px sans-serif';
  ctx.fillStyle = '#aaaaaa';
  ctx.fillText(serverName, textX, 90 + fontSize + 44);

  // Miembro #N
  ctx.font = 'bold 18px sans-serif';
  ctx.fillStyle = '#FFD700';
  ctx.fillText(`Miembro #${memberCount}`, textX, H - 40);

  return canvas.toBuffer('image/png');
}

module.exports = { generateWelcomeCard };
