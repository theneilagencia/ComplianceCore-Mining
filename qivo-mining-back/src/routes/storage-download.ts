/**
 * Storage Download Route
 * 
 * Serve arquivos armazenados no Render Disk
 */

import express from 'express';
import path from 'path';
import fs from 'fs/promises';

const router = express.Router();

const RENDER_DISK_PATH = process.env.RENDER_DISK_PATH || '/var/data/uploads';

router.get('/download/:key(*)', async (req, res) => {
  try {
    const key = decodeURIComponent(req.params.key);
    const filePath = path.join(RENDER_DISK_PATH, key);

    // Verificar se arquivo existe
    try {
      await fs.access(filePath);
    } catch {
      return res.status(404).json({ error: 'File not found' });
    }

    // Ler arquivo
    const buffer = await fs.readFile(filePath);

    // Detectar content type baseado na extensão
    const ext = path.extname(key).toLowerCase();
    const contentTypes: Record<string, string> = {
      '.pdf': 'application/pdf',
      '.json': 'application/json',
      '.txt': 'text/plain',
      '.csv': 'text/csv',
      '.xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      '.png': 'image/png',
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg',
      '.gif': 'image/gif',
      '.svg': 'image/svg+xml',
    };

    const contentType = contentTypes[ext] || 'application/octet-stream';

    // Enviar arquivo
    res.setHeader('Content-Type', contentType);
    res.setHeader('Content-Length', buffer.length);
    res.setHeader('Cache-Control', 'public, max-age=3600');
    res.send(buffer);

  } catch (error) {
    console.error('Error serving file:', error);
    res.status(500).json({ error: 'Failed to serve file' });
  }
});

export default router;

