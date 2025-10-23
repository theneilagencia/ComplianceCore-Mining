import { Router } from 'express';
import fs from 'fs/promises';
import path from 'path';
import { marked } from 'marked';

const router = Router();

// Diretório dos manuais
const DOCS_DIR = path.join(__dirname, '../../docs/support');

// Lista de manuais disponíveis
const MANUALS = [
  {
    id: 'manual-start',
    title: 'Manual START - Primeiros Passos',
    description: 'Guia completo para iniciantes: criar conta, fazer login e gerar seu primeiro relatório',
    icon: '🚀',
    category: 'getting-started',
  },
  {
    id: 'manual-pro',
    title: 'Manual PRO - Módulos Avançados',
    description: 'Aprenda a usar auditoria KRCI, pré-certificação, ESG reporting e valuation automático',
    icon: '⚙️',
    category: 'advanced',
  },
  {
    id: 'manual-admin',
    title: 'Manual ADMIN - Gestão',
    description: 'Gerencie usuários, licenças, assinaturas e configurações da organização',
    icon: '👥',
    category: 'admin',
  },
  {
    id: 'faq',
    title: 'FAQ - Perguntas Frequentes',
    description: 'Respostas rápidas para as dúvidas mais comuns sobre a plataforma',
    icon: '❓',
    category: 'faq',
  },
];

// GET /api/support/manuals - Lista todos os manuais
router.get('/manuals', async (req, res) => {
  try {
    res.json({
      success: true,
      manuals: MANUALS,
    });
  } catch (error) {
    console.error('Error listing manuals:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to list manuals',
    });
  }
});

// GET /api/support/manual/:id - Retorna conteúdo de um manual específico
router.get('/manual/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { format = 'html' } = req.query;

    // Verifica se o manual existe
    const manual = MANUALS.find(m => m.id === id);
    if (!manual) {
      return res.status(404).json({
        success: false,
        error: 'Manual not found',
      });
    }

    // Lê o arquivo Markdown
    const filePath = path.join(DOCS_DIR, `${id}.md`);
    const markdown = await fs.readFile(filePath, 'utf-8');

    // Retorna em formato solicitado
    if (format === 'markdown') {
      return res.json({
        success: true,
        manual: {
          ...manual,
          content: markdown,
          format: 'markdown',
        },
      });
    }

    // Converte Markdown para HTML
    const html = await marked(markdown);

    res.json({
      success: true,
      manual: {
        ...manual,
        content: html,
        format: 'html',
      },
    });
  } catch (error) {
    console.error('Error fetching manual:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch manual',
    });
  }
});

// GET /api/support/search - Busca nos manuais
router.get('/search', async (req, res) => {
  try {
    const { q } = req.query;

    if (!q || typeof q !== 'string') {
      return res.status(400).json({
        success: false,
        error: 'Query parameter "q" is required',
      });
    }

    const query = q.toLowerCase();
    const results: any[] = [];

    // Busca em todos os manuais
    for (const manual of MANUALS) {
      const filePath = path.join(DOCS_DIR, `${manual.id}.md`);
      const content = await fs.readFile(filePath, 'utf-8');

      // Busca por linhas que contenham a query
      const lines = content.split('\n');
      const matches: any[] = [];

      lines.forEach((line, index) => {
        if (line.toLowerCase().includes(query)) {
          // Captura contexto (linha anterior e próxima)
          const context = {
            before: lines[index - 1] || '',
            match: line,
            after: lines[index + 1] || '',
          };

          matches.push({
            line: index + 1,
            text: line.trim(),
            context,
          });
        }
      });

      if (matches.length > 0) {
        results.push({
          manual: {
            id: manual.id,
            title: manual.title,
            description: manual.description,
            icon: manual.icon,
          },
          matches: matches.slice(0, 5), // Limita a 5 matches por manual
          totalMatches: matches.length,
        });
      }
    }

    res.json({
      success: true,
      query: q,
      results,
      totalResults: results.length,
    });
  } catch (error) {
    console.error('Error searching manuals:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to search manuals',
    });
  }
});

export default router;

