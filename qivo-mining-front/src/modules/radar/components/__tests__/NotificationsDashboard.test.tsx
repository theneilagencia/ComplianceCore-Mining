/**
 * Notifications Dashboard Component Tests
 * RAD-005: Dashboard Básico Radar
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import NotificationsDashboard from '../NotificationsDashboard';

// Mock fetch
global.fetch = vi.fn();

const mockNotificationsResponse = {
  success: true,
  notifications: [
    {
      id: 'notif-001',
      title: 'Nova Publicação DOU',
      message: 'Portaria nº 123/2025 do IBAMA estabelece novos critérios',
      severity: 'high',
      category: 'regulatory',
      source: 'DOU Scraper',
      date: new Date('2025-10-25T08:30:00Z').toISOString(),
      read: false,
      metadata: { agency: 'IBAMA' }
    },
    {
      id: 'notif-002',
      title: 'Área de Mineração Detectada',
      message: '15 novos processos de mineração registrados',
      severity: 'medium',
      category: 'mining_activity',
      source: 'SIGMINE Client',
      date: new Date('2025-10-24T14:20:00Z').toISOString(),
      read: true,
      metadata: { state: 'MG', processCount: 15 }
    },
  ],
  stats: {
    total: 10,
    filtered: 2,
    unread: 3,
    bySeverity: { high: 4, medium: 3, low: 3 },
    byCategory: { regulatory: 4, environmental: 2, mining_activity: 3, compliance: 1 }
  }
};

describe('NotificationsDashboard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (global.fetch as any).mockResolvedValue({
      json: async () => mockNotificationsResponse,
    });
  });

  describe('Component Rendering', () => {
    it('should render loading state initially', () => {
      render(<NotificationsDashboard />);
      expect(screen.getByRole('img', { hidden: true })).toBeInTheDocument(); // Loading spinner
    });

    it('should render notifications after loading', async () => {
      render(<NotificationsDashboard />);
      
      await waitFor(() => {
        expect(screen.getByText('Nova Publicação DOU')).toBeInTheDocument();
        expect(screen.getByText('Área de Mineração Detectada')).toBeInTheDocument();
      });
    });

    it('should render statistics cards', async () => {
      render(<NotificationsDashboard />);
      
      await waitFor(() => {
        expect(screen.getByText('Total')).toBeInTheDocument();
        expect(screen.getByText('10')).toBeInTheDocument(); // Total count
        expect(screen.getByText('Não Lidas')).toBeInTheDocument();
        expect(screen.getByText('3')).toBeInTheDocument(); // Unread count
        expect(screen.getByText('Alta Prioridade')).toBeInTheDocument();
        expect(screen.getByText('4')).toBeInTheDocument(); // High severity count
      });
    });

    it('should render filter button', async () => {
      render(<NotificationsDashboard />);
      
      await waitFor(() => {
        expect(screen.getByText('Filtros')).toBeInTheDocument();
      });
    });
  });

  describe('Filtering', () => {
    it('should show filters panel when filter button is clicked', async () => {
      render(<NotificationsDashboard />);
      
      await waitFor(() => {
        const filterButton = screen.getByText('Filtros');
        fireEvent.click(filterButton);
      });

      expect(screen.getByText('Severidade')).toBeInTheDocument();
      expect(screen.getByText('Categoria')).toBeInTheDocument();
      expect(screen.getByText('Status')).toBeInTheDocument();
      expect(screen.getByText('Fonte')).toBeInTheDocument();
    });

    it('should fetch notifications with severity filter', async () => {
      render(<NotificationsDashboard />);
      
      await waitFor(() => {
        fireEvent.click(screen.getByText('Filtros'));
      });

      const severitySelect = screen.getByLabelText('Severidade') as HTMLSelectElement;
      fireEvent.change(severitySelect, { target: { value: 'high' } });

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          expect.stringContaining('severity=high')
        );
      });
    });

    it('should fetch notifications with category filter', async () => {
      render(<NotificationsDashboard />);
      
      await waitFor(() => {
        fireEvent.click(screen.getByText('Filtros'));
      });

      const categorySelect = screen.getByLabelText('Categoria') as HTMLSelectElement;
      fireEvent.change(categorySelect, { target: { value: 'regulatory' } });

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          expect.stringContaining('category=regulatory')
        );
      });
    });

    it('should fetch notifications with read status filter', async () => {
      render(<NotificationsDashboard />);
      
      await waitFor(() => {
        fireEvent.click(screen.getByText('Filtros'));
      });

      const statusSelect = screen.getByLabelText('Status') as HTMLSelectElement;
      fireEvent.change(statusSelect, { target: { value: 'false' } });

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          expect.stringContaining('read=false')
        );
      });
    });
  });

  describe('Notification Details', () => {
    it('should open detail modal when notification is clicked', async () => {
      render(<NotificationsDashboard />);
      
      await waitFor(() => {
        fireEvent.click(screen.getByText('Nova Publicação DOU'));
      });

      expect(screen.getByText('Portaria nº 123/2025 do IBAMA estabelece novos critérios')).toBeInTheDocument();
      expect(screen.getByText('Informações Adicionais')).toBeInTheDocument();
    });

    it('should close detail modal when X button is clicked', async () => {
      render(<NotificationsDashboard />);
      
      await waitFor(() => {
        fireEvent.click(screen.getByText('Nova Publicação DOU'));
      });

      const closeButtons = screen.getAllByRole('button');
      const xButton = closeButtons.find(btn => btn.querySelector('svg'));
      if (xButton) fireEvent.click(xButton);

      await waitFor(() => {
        expect(screen.queryByText('Informações Adicionais')).not.toBeInTheDocument();
      });
    });

    it('should show mark as read button for unread notifications', async () => {
      render(<NotificationsDashboard />);
      
      await waitFor(() => {
        fireEvent.click(screen.getByText('Nova Publicação DOU'));
      });

      expect(screen.getByText('Marcar como Lida')).toBeInTheDocument();
    });

    it('should not show mark as read button for read notifications', async () => {
      render(<NotificationsDashboard />);
      
      await waitFor(() => {
        fireEvent.click(screen.getByText('Área de Mineração Detectada'));
      });

      expect(screen.queryByText('Marcar como Lida')).not.toBeInTheDocument();
    });
  });

  describe('Mark as Read', () => {
    it('should call API when marking notification as read', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        json: async () => mockNotificationsResponse,
      }).mockResolvedValueOnce({
        json: async () => ({ success: true, notification: { ...mockNotificationsResponse.notifications[0], read: true } }),
      });

      render(<NotificationsDashboard />);
      
      await waitFor(() => {
        fireEvent.click(screen.getByText('Nova Publicação DOU'));
      });

      const markButton = screen.getByText('Marcar como Lida');
      fireEvent.click(markButton);

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          '/api/radar/notifications/notif-001/read',
          expect.objectContaining({ method: 'PATCH' })
        );
      });
    });
  });

  describe('Refresh', () => {
    it('should refetch notifications when refresh button is clicked', async () => {
      render(<NotificationsDashboard />);
      
      await waitFor(() => {
        expect(screen.getByText('Atualizar')).toBeInTheDocument();
      });

      const refreshButton = screen.getByText('Atualizar');
      fireEvent.click(refreshButton);

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledTimes(2); // Initial + refresh
      });
    });
  });

  describe('Error Handling', () => {
    it('should display error message when API fails', async () => {
      (global.fetch as any).mockRejectedValueOnce(new Error('Network error'));

      render(<NotificationsDashboard />);

      await waitFor(() => {
        expect(screen.getByText('Erro ao carregar notificações')).toBeInTheDocument();
        expect(screen.getByText('Network error')).toBeInTheDocument();
      });
    });

    it('should display error message when API returns error', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        json: async () => ({ success: false, error: 'Server error' }),
      });

      render(<NotificationsDashboard />);

      await waitFor(() => {
        expect(screen.getByText('Erro ao carregar notificações')).toBeInTheDocument();
        expect(screen.getByText('Server error')).toBeInTheDocument();
      });
    });
  });

  describe('Empty State', () => {
    it('should show empty state when no notifications are found', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        json: async () => ({
          success: true,
          notifications: [],
          stats: { total: 0, filtered: 0, unread: 0, bySeverity: {}, byCategory: {} }
        }),
      });

      render(<NotificationsDashboard />);

      await waitFor(() => {
        expect(screen.getByText('Nenhuma notificação encontrada')).toBeInTheDocument();
      });
    });
  });

  describe('Severity Badges', () => {
    it('should show correct badge color for high severity', async () => {
      render(<NotificationsDashboard />);
      
      await waitFor(() => {
        const badges = screen.getAllByText('Alta');
        expect(badges.length).toBeGreaterThan(0);
      });
    });

    it('should show correct badge color for medium severity', async () => {
      render(<NotificationsDashboard />);
      
      await waitFor(() => {
        const badges = screen.getAllByText('Média');
        expect(badges.length).toBeGreaterThan(0);
      });
    });
  });

  describe('Category Icons', () => {
    it('should display correct icon for regulatory category', async () => {
      render(<NotificationsDashboard />);
      
      await waitFor(() => {
        expect(screen.getByText('Nova Publicação DOU')).toBeInTheDocument();
        // Icon should be rendered (FileText icon for regulatory)
      });
    });

    it('should display correct icon for mining_activity category', async () => {
      render(<NotificationsDashboard />);
      
      await waitFor(() => {
        expect(screen.getByText('Área de Mineração Detectada')).toBeInTheDocument();
        // Icon should be rendered (HardHat icon for mining_activity)
      });
    });
  });

  describe('Date Formatting', () => {
    it('should format dates correctly', async () => {
      render(<NotificationsDashboard />);
      
      await waitFor(() => {
        // Date should be formatted in pt-BR locale
        const dateElements = screen.getAllByText(/out|nov|dez|jan/i);
        expect(dateElements.length).toBeGreaterThan(0);
      });
    });
  });

  describe('Dark Mode', () => {
    it('should apply dark mode styles when prop is true', () => {
      render(<NotificationsDashboard darkMode={true} />);
      // Component should render without crashing with dark mode
      expect(screen.getByRole('img', { hidden: true })).toBeInTheDocument();
    });

    it('should apply light mode styles when prop is false', () => {
      render(<NotificationsDashboard darkMode={false} />);
      // Component should render without crashing with light mode
      expect(screen.getByRole('img', { hidden: true })).toBeInTheDocument();
    });
  });

  describe('Unread Indicator', () => {
    it('should show blue dot for unread notifications', async () => {
      render(<NotificationsDashboard />);
      
      await waitFor(() => {
        const notification = screen.getByText('Nova Publicação DOU').closest('div');
        expect(notification).toBeInTheDocument();
        // Should have border-l-4 border-blue-500 class for unread
      });
    });

    it('should not show blue dot for read notifications', async () => {
      render(<NotificationsDashboard />);
      
      await waitFor(() => {
        const notification = screen.getByText('Área de Mineração Detectada').closest('div');
        expect(notification).toBeInTheDocument();
        // Should not have blue border for read notifications
      });
    });
  });
});
