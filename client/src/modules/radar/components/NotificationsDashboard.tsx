/**
 * Notifications Dashboard Component
 * Displays regulatory notifications with filters and indicators
 * RAD-005: Dashboard Básico Radar
 */

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Bell, 
  Filter, 
  Calendar, 
  AlertCircle, 
  CheckCircle, 
  Info,
  FileText,
  Leaf,
  HardHat,
  Shield,
  X,
  RefreshCw
} from 'lucide-react';

interface Notification {
  id: string;
  title: string;
  message: string;
  severity: 'high' | 'medium' | 'low';
  category: 'regulatory' | 'environmental' | 'mining_activity' | 'compliance';
  source: string;
  date: string;
  read: boolean;
  metadata?: Record<string, any>;
}

interface NotificationStats {
  total: number;
  filtered: number;
  unread: number;
  bySeverity: {
    high: number;
    medium: number;
    low: number;
  };
  byCategory: {
    regulatory: number;
    environmental: number;
    mining_activity: number;
    compliance: number;
  };
}

interface NotificationsDashboardProps {
  darkMode?: boolean;
}

export default function NotificationsDashboard({ darkMode = false }: NotificationsDashboardProps) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [stats, setStats] = useState<NotificationStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Filters
  const [showFilters, setShowFilters] = useState(false);
  const [severityFilter, setSeverityFilter] = useState<string>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [readFilter, setReadFilter] = useState<string>('all');
  const [sourceFilter, setSourceFilter] = useState<string>('all');
  
  // Selected notification for detail view
  const [selectedNotification, setSelectedNotification] = useState<Notification | null>(null);

  const fetchNotifications = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Build query params
      const params = new URLSearchParams();
      if (severityFilter !== 'all') params.append('severity', severityFilter);
      if (categoryFilter !== 'all') params.append('category', categoryFilter);
      if (readFilter !== 'all') params.append('read', readFilter);
      if (sourceFilter !== 'all') params.append('source', sourceFilter);

      const response = await fetch(`/api/radar/notifications?${params.toString()}`);
      const data = await response.json();

      if (data.success) {
        setNotifications(data.notifications);
        setStats(data.stats);
      } else {
        setError(data.error || 'Failed to fetch notifications');
      }
    } catch (err: any) {
      setError(err.message || 'Network error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, [severityFilter, categoryFilter, readFilter, sourceFilter]);

  const markAsRead = async (notificationId: string) => {
    try {
      const response = await fetch(`/api/radar/notifications/${notificationId}/read`, {
        method: 'PATCH',
      });
      const data = await response.json();

      if (data.success) {
        setNotifications(prev =>
          prev.map(n => (n.id === notificationId ? { ...n, read: true } : n))
        );
        if (stats) {
          setStats({
            ...stats,
            unread: stats.unread - 1,
          });
        }
      }
    } catch (err) {
      console.error('Failed to mark notification as read:', err);
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'high':
        return 'bg-red-100 text-red-700 border-red-200';
      case 'medium':
        return 'bg-yellow-100 text-yellow-700 border-yellow-200';
      case 'low':
        return 'bg-blue-100 text-blue-700 border-blue-200';
      default:
        return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'high':
        return <AlertCircle className="w-4 h-4" />;
      case 'medium':
        return <Info className="w-4 h-4" />;
      case 'low':
        return <CheckCircle className="w-4 h-4" />;
      default:
        return <Bell className="w-4 h-4" />;
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'regulatory':
        return <FileText className="w-5 h-5 text-blue-600" />;
      case 'environmental':
        return <Leaf className="w-5 h-5 text-green-600" />;
      case 'mining_activity':
        return <HardHat className="w-5 h-5 text-orange-600" />;
      case 'compliance':
        return <Shield className="w-5 h-5 text-purple-600" />;
      default:
        return <Bell className="w-5 h-5 text-gray-600" />;
    }
  };

  const getCategoryLabel = (category: string) => {
    switch (category) {
      case 'regulatory':
        return 'Regulatório';
      case 'environmental':
        return 'Ambiental';
      case 'mining_activity':
        return 'Atividade Minerária';
      case 'compliance':
        return 'Compliance';
      default:
        return category;
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (loading && notifications.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (error) {
    return (
      <Card className="p-6">
        <div className="flex items-center gap-3 text-red-600">
          <AlertCircle className="w-6 h-6" />
          <div>
            <h3 className="font-semibold">Erro ao carregar notificações</h3>
            <p className="text-sm text-red-500">{error}</p>
          </div>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Statistics Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400">Total</p>
                <p className="text-2xl font-bold text-white">{stats.total}</p>
              </div>
              <Bell className="w-10 h-10 text-blue-600 opacity-20" />
            </div>
          </Card>

          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400">Não Lidas</p>
                <p className="text-2xl font-bold text-white">{stats.unread}</p>
              </div>
              <AlertCircle className="w-10 h-10 text-red-600 opacity-20" />
            </div>
          </Card>

          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400">Alta Prioridade</p>
                <p className="text-2xl font-bold text-white">{stats.bySeverity.high}</p>
              </div>
              <AlertCircle className="w-10 h-10 text-red-600 opacity-20" />
            </div>
          </Card>

          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400">Regulatórias</p>
                <p className="text-2xl font-bold text-white">{stats.byCategory.regulatory}</p>
              </div>
              <FileText className="w-10 h-10 text-blue-600 opacity-20" />
            </div>
          </Card>
        </div>
      )}

      {/* Filters Bar */}
      <Card className="p-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-white">Notificações Regulatórias</h2>
          <div className="flex gap-2">
            <Button
              onClick={() => setShowFilters(!showFilters)}
              variant="outline"
              size="sm"
            >
              <Filter className="w-4 h-4 mr-2" />
              Filtros
            </Button>
            <Button
              onClick={fetchNotifications}
              variant="outline"
              size="sm"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Atualizar
            </Button>
          </div>
        </div>

        {showFilters && (
          <div className="mt-4 grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1 text-gray-300">
                Severidade
              </label>
              <select
                value={severityFilter}
                onChange={(e) => setSeverityFilter(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border bg-gray-800 border-gray-600 text-white"
              >
                <option value="all">Todas</option>
                <option value="high">Alta</option>
                <option value="medium">Média</option>
                <option value="low">Baixa</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1 text-gray-300">
                Categoria
              </label>
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border bg-gray-800 border-gray-600 text-white"
              >
                <option value="all">Todas</option>
                <option value="regulatory">Regulatório</option>
                <option value="environmental">Ambiental</option>
                <option value="mining_activity">Atividade Minerária</option>
                <option value="compliance">Compliance</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1 text-gray-300">
                Status
              </label>
              <select
                value={readFilter}
                onChange={(e) => setReadFilter(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border bg-gray-800 border-gray-600 text-white"
              >
                <option value="all">Todas</option>
                <option value="false">Não Lidas</option>
                <option value="true">Lidas</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1 text-gray-300">
                Fonte
              </label>
              <select
                value={sourceFilter}
                onChange={(e) => setSourceFilter(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border bg-gray-800 border-gray-600 text-white"
              >
                <option value="all">Todas</option>
                <option value="DOU">DOU Scraper</option>
                <option value="SIGMINE">SIGMINE Client</option>
                <option value="MapBiomas">MapBiomas Client</option>
                <option value="Regulatory">Regulatory Changes</option>
              </select>
            </div>
          </div>
        )}
      </Card>

      {/* Notifications List */}
      <div className="space-y-3">
        {notifications.length === 0 ? (
          <Card className="p-8 text-center">
            <Bell className="w-16 h-16 text-gray-400 mx-auto mb-4 opacity-50" />
            <p className="text-gray-400 text-lg">Nenhuma notificação encontrada</p>
            <p className="text-sm text-gray-500 mt-2">
              Ajuste os filtros para ver mais resultados
            </p>
          </Card>
        ) : (
          notifications.map((notification) => (
            <Card
              key={notification.id}
              className={`p-4 cursor-pointer transition-all hover:shadow-lg ${
                !notification.read ? 'border-l-4 border-blue-500' : ''
              }`}
              onClick={() => setSelectedNotification(notification)}
            >
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0 mt-1">
                  {getCategoryIcon(notification.category)}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="text-lg font-semibold text-white truncate">
                          {notification.title}
                        </h3>
                        {!notification.read && (
                          <span className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0" />
                        )}
                      </div>
                      <p className="text-sm text-gray-400 line-clamp-2">
                        {notification.message}
                      </p>
                    </div>

                    <Badge className={getSeverityColor(notification.severity)}>
                      <span className="flex items-center gap-1">
                        {getSeverityIcon(notification.severity)}
                        {notification.severity === 'high' && 'Alta'}
                        {notification.severity === 'medium' && 'Média'}
                        {notification.severity === 'low' && 'Baixa'}
                      </span>
                    </Badge>
                  </div>

                  <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {formatDate(notification.date)}
                    </span>
                    <span>{notification.source}</span>
                    <Badge variant="outline" className="text-xs">
                      {getCategoryLabel(notification.category)}
                    </Badge>
                  </div>
                </div>
              </div>
            </Card>
          ))
        )}
      </div>

      {/* Detail Modal */}
      {selectedNotification && (
        <div
          className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4"
          onClick={() => setSelectedNotification(null)}
        >
          <Card
            className="max-w-2xl w-full max-h-[80vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-start gap-3 flex-1">
                  {getCategoryIcon(selectedNotification.category)}
                  <div>
                    <h2 className="text-2xl font-bold text-white mb-1">
                      {selectedNotification.title}
                    </h2>
                    <div className="flex items-center gap-2">
                      <Badge className={getSeverityColor(selectedNotification.severity)}>
                        <span className="flex items-center gap-1">
                          {getSeverityIcon(selectedNotification.severity)}
                          {selectedNotification.severity === 'high' && 'Alta Prioridade'}
                          {selectedNotification.severity === 'medium' && 'Média Prioridade'}
                          {selectedNotification.severity === 'low' && 'Baixa Prioridade'}
                        </span>
                      </Badge>
                      <Badge variant="outline">
                        {getCategoryLabel(selectedNotification.category)}
                      </Badge>
                    </div>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSelectedNotification(null)}
                >
                  <X className="w-5 h-5" />
                </Button>
              </div>

              <div className="space-y-4">
                <div>
                  <h3 className="text-sm font-semibold text-gray-400 mb-1">Mensagem</h3>
                  <p className="text-white">{selectedNotification.message}</p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h3 className="text-sm font-semibold text-gray-400 mb-1">Data</h3>
                    <p className="text-white text-sm">
                      {formatDate(selectedNotification.date)}
                    </p>
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-gray-400 mb-1">Fonte</h3>
                    <p className="text-white text-sm">{selectedNotification.source}</p>
                  </div>
                </div>

                {selectedNotification.metadata && (
                  <div>
                    <h3 className="text-sm font-semibold text-gray-400 mb-2">
                      Informações Adicionais
                    </h3>
                    <div className="bg-gray-800 rounded-lg p-3 space-y-1">
                      {Object.entries(selectedNotification.metadata).map(([key, value]) => (
                        <div key={key} className="flex justify-between text-sm">
                          <span className="text-gray-400 capitalize">
                            {key.replace(/([A-Z])/g, ' $1').trim()}:
                          </span>
                          <span className="text-white font-medium">{String(value)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {!selectedNotification.read && (
                  <div className="pt-4 border-t border-gray-700">
                    <Button
                      onClick={() => {
                        markAsRead(selectedNotification.id);
                        setSelectedNotification(null);
                      }}
                      className="w-full"
                    >
                      <CheckCircle className="w-4 h-4 mr-2" />
                      Marcar como Lida
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
