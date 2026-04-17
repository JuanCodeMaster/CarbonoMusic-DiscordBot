const { BaseExtractor, Track } = require('discord-player');
const { spawn } = require('child_process');
const path = require('path');

const YTDLP_BIN = process.platform === 'win32' ? 'yt-dlp.exe' : 'yt-dlp';
const YTDLP = path.join(process.cwd(), 'node_modules/yt-dlp-exec/bin', YTDLP_BIN);

function formatDuration(seconds) {
  if (!seconds) return '0:00';
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  return `${m}:${String(s).padStart(2, '0')}`;
}

function ytdlpExec(args) {
  return new Promise((resolve, reject) => {
    const proc = spawn(YTDLP, args);
    let output = '';
    let error = '';
    proc.stdout.on('data', d => (output += d.toString()));
    proc.stderr.on('data', d => (error += d.toString()));
    proc.on('close', code => {
      if (code !== 0 && !output) reject(new Error(error || `yt-dlp salió con código ${code}`));
      else resolve(output.trim());
    });
    proc.on('error', reject);
  });
}

async function ytdlpSearch(query, limit = 5) {
  const output = await ytdlpExec([
    `ytsearch${limit}:${query}`,
    '--dump-json',
    '--no-playlist',
    '--flat-playlist',
    '--no-warnings',
  ]);
  return output.split('\n').filter(Boolean).map(line => JSON.parse(line));
}

async function ytdlpGetAudioUrl(url) {
  // -g devuelve la URL directa del stream de audio
  const output = await ytdlpExec([
    url,
    '-f', 'bestaudio[ext=webm]/bestaudio[ext=m4a]/bestaudio/best',
    '-g',
    '--no-playlist',
    '--no-warnings',
  ]);
  // Devuelve la primera URL (puede haber varias líneas)
  return output.split('\n')[0].trim();
}

class PlayDLExtractor extends BaseExtractor {
  static identifier = 'yt-dlp-extractor';

  async activate() {}
  async deactivate() {}

  async validate(query) {
    return typeof query === 'string';
  }

  async handle(query, context) {
    console.log(`[yt-dlp] handle() llamado para: "${query}"`);
    try {
      const isUrl = /^https?:\/\/(www\.)?(youtube\.com|youtu\.be)/.test(query);
      const results = await ytdlpSearch(isUrl ? query : query, isUrl ? 1 : 5);

      if (!results.length) return this.createResponse(null, []);

      console.log(`[yt-dlp] "${query}" -> ${results.length} resultados`);
      results.forEach((v, i) => console.log(`  ${i + 1}. ${v.title}`));

      const tracks = results.map(v =>
        new Track(this.context.player, {
          title: v.title || 'Sin título',
          url: v.webpage_url || v.url,
          duration: formatDuration(v.duration || 0),
          thumbnail: v.thumbnails?.[0]?.url || '',
          description: '',
          author: v.channel || v.uploader || '',
          requestedBy: context.requestedBy,
          source: 'youtube',
          queryType: 'youtubeVideo',
          extractor: this,
        })
      );

      return this.createResponse(null, tracks);
    } catch (err) {
      console.error('[yt-dlp] Error en handle:', err.message);
      return this.createResponse(null, []);
    }
  }

  async stream(info) {
    console.log(`[yt-dlp] Obteniendo stream: ${info.title}`);
    try {
      const audioUrl = await ytdlpGetAudioUrl(info.url);
      console.log(`[yt-dlp] URL de audio obtenida: ${audioUrl.substring(0, 80)}...`);
      return audioUrl; // discord-player acepta una URL string directa
    } catch (err) {
      console.error('[yt-dlp] Error al obtener stream:', err.message);
      throw err;
    }
  }

  async getRelatedTracks() {
    return this.createResponse(null, []);
  }
}

module.exports = { PlayDLExtractor };
