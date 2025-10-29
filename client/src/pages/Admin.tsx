import { useState, useEffect } from 'react';
import { useLocation } from 'wouter';

interface Stats {
  totalUsers: number;
  recentUsers: number;
  mrr: number;
  stats: {
    startUsers: number;
    proUsers: number;
    enterpriseUsers: number;
  };
}

interface User {
  id: string;
  email: string;
  fullName: string;
  createdAt: string;
  lastLoginAt: string;
  license: {
    plan: string;
    status: string;
    reportsUsed: number;
    reportsLimit: number;
    projectsActive: number;
    projectsLimit: number;
  } | null;
}

interface Subscription {
  licenseId: string;
  userId: string;
  userEmail: string;
  userName: string;
  plan: string;
  status: string;
  reportsUsed: number;
  reportsLimit: number;
  projectsActive: number;
  projectsLimit: number;
  createdAt: string;
  expiresAt: string | null;
}

interface Revenue {
  mrr: number;
  arr: number;
  totalActiveSubscriptions: number;
  revenueByPlan: Record<string, { count: number; revenue: number }>;
}

export default function Admin() {
  const [, setLocation] = useLocation();
  const [activeTab, setActiveTab] = useState<'dashboard' | 'users' | 'subscriptions' | 'revenue'>('dashboard');
  const [stats, setStats] = useState<Stats | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [revenue, setRevenue] = useState<Revenue | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    checkAdminAccess();
  }, []);

  useEffect(() => {
    if (activeTab === 'dashboard') {
      fetchStats();
    } else if (activeTab === 'users') {
      fetchUsers();
    } else if (activeTab === 'subscriptions') {
      fetchSubscriptions();
    } else if (activeTab === 'revenue') {
      fetchRevenue();
    }
  }, [activeTab]);

  const checkAdminAccess = async () => {
    // Check if user is admin by trying to fetch stats
    try {
      const response = await fetch('/api/admin/stats', {
        credentials: 'include',
      });

      if (response.status === 403 || response.status === 401) {
        alert('Acesso negado! Apenas administradores podem acessar este painel.');
        setLocation('/dashboard');
        return;
      }

      if (!response.ok) {
        throw new Error('Failed to verify admin access');
      }

      fetchStats();
    } catch (error) {
      console.error('Admin access check failed:', error);
      setLocation('/dashboard');
    }
  };

  const fetchStats = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/admin/stats', {
        credentials: 'include',
      });

      if (!response.ok) throw new Error('Failed to fetch stats');

      const data = await response.json();
      setStats(data);
    } catch (error) {
      console.error('Error fetching stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/admin/users?limit=100', {
        credentials: 'include',
      });

      if (!response.ok) throw new Error('Failed to fetch users');

      const data = await response.json();
      setUsers(data.users);
    } catch (error) {
      console.error('Error fetching users:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchSubscriptions = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/admin/subscriptions', {
        credentials: 'include',
      });

      if (!response.ok) throw new Error('Failed to fetch subscriptions');

      const data = await response.json();
      setSubscriptions(data.subscriptions);
    } catch (error) {
      console.error('Error fetching subscriptions:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchRevenue = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/admin/revenue', {
        credentials: 'include',
      });

      if (!response.ok) throw new Error('Failed to fetch revenue');

      const data = await response.json();
      setRevenue(data);
    } catch (error) {
      console.error('Error fetching revenue:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'USD',
    }).format(value);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  };

  const filteredUsers = users.filter(user =>
    user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.fullName?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading && activeTab === 'dashboard') {
    return (
      <div className="min-h-screen bg-[#000020] flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50">
      {/* Header */}
      <header className="bg-white/5 border-b border-white/20 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-red-600 rounded-lg flex items-center justify-center text-white font-bold text-xl">
                A
              </div>
              <div>
                <h1 className="text-2xl font-bold text-white">Painel de Administração</h1>
                <p className="text-sm text-gray-400">Gerenciamento de Usuários e Assinaturas</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setLocation('/dashboard')}
                className="px-4 py-2 text-gray-300 hover:bg-[#171a4a] rounded-lg transition-colors"
              >
                Voltar ao Dashboard
              </button>
              <button
                onClick={() => {
                  setLocation('/login');
                }}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                Sair
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Tabs */}
      <div className="bg-white/5 border-b border-white/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex gap-6">
            <button
              onClick={() => setActiveTab('dashboard')}
              className={`px-4 py-3 font-medium transition-colors border-b-2 ${
                activeTab === 'dashboard'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-400 hover:text-white'
              }`}
            >
              Dashboard
            </button>
            <button
              onClick={() => setActiveTab('users')}
              className={`px-4 py-3 font-medium transition-colors border-b-2 ${
                activeTab === 'users'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-400 hover:text-white'
              }`}
            >
              Usuários
            </button>
            <button
              onClick={() => setActiveTab('subscriptions')}
              className={`px-4 py-3 font-medium transition-colors border-b-2 ${
                activeTab === 'subscriptions'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-400 hover:text-white'
              }`}
            >
              Assinaturas
            </button>
            <button
              onClick={() => setActiveTab('revenue')}
              className={`px-4 py-3 font-medium transition-colors border-b-2 ${
                activeTab === 'revenue'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-400 hover:text-white'
              }`}
            >
              Receita
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Dashboard Tab */}
        {activeTab === 'dashboard' && stats && (
          <div className="space-y-6">
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="bg-white/5 rounded-xl shadow-lg p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-400 text-sm">Total de Usuários</p>
                    <p className="text-3xl font-bold text-white mt-2">{stats.totalUsers}</p>
                  </div>
                  <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                    <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                    </svg>
                  </div>
                </div>
                <p className="text-green-600 text-sm mt-2">+{stats.recentUsers} nos últimos 30 dias</p>
              </div>

              <div className="bg-white/5 rounded-xl shadow-lg p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-400 text-sm">MRR</p>
                    <p className="text-3xl font-bold text-white mt-2">{formatCurrency(stats.mrr)}</p>
                  </div>
                  <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                    <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                </div>
                <p className="text-slate-500 text-sm mt-2">Receita Recorrente Mensal</p>
              </div>

              <div className="bg-white/5 rounded-xl shadow-lg p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-400 text-sm">Planos PRO</p>
                    <p className="text-3xl font-bold text-white mt-2">{stats.stats.proUsers}</p>
                  </div>
                  <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                    <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                    </svg>
                  </div>
                </div>
                <p className="text-slate-500 text-sm mt-2">Assinaturas Ativas</p>
              </div>

              <div className="bg-white/5 rounded-xl shadow-lg p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-400 text-sm">Planos ENTERPRISE</p>
                    <p className="text-3xl font-bold text-white mt-2">{stats.stats.enterpriseUsers}</p>
                  </div>
                  <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                    <svg className="w-6 h-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                    </svg>
                  </div>
                </div>
                <p className="text-slate-500 text-sm mt-2">Assinaturas Ativas</p>
              </div>
            </div>

            {/* Chart Placeholder */}
            <div className="bg-white/5 rounded-xl shadow-lg p-6">
              <h3 className="text-lg font-bold text-white mb-4">Distribuição de Planos</h3>
              <div className="grid grid-cols-3 gap-4">
                <div className="text-center">
                  <div className="text-4xl font-bold text-slate-400">{stats.stats.startUsers}</div>
                  <div className="text-gray-400 mt-2">START</div>
                  <div className="text-slate-500 text-sm">Gratuito</div>
                </div>
                <div className="text-center">
                  <div className="text-4xl font-bold text-purple-600">{stats.stats.proUsers}</div>
                  <div className="text-gray-400 mt-2">PRO</div>
                  <div className="text-slate-500 text-sm">{formatCurrency(899)}/mês</div>
                </div>
                <div className="text-center">
                  <div className="text-4xl font-bold text-orange-600">{stats.stats.enterpriseUsers}</div>
                  <div className="text-gray-400 mt-2">ENTERPRISE</div>
                  <div className="text-slate-500 text-sm">{formatCurrency(1990)}/mês</div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Users Tab */}
        {activeTab === 'users' && (
          <div className="space-y-6">
            {/* Search */}
            <div className="bg-white/5 rounded-xl shadow-lg p-4">
              <input
                type="text"
                placeholder="Buscar por email ou nome..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Users Table */}
            <div className="bg-white/5 rounded-xl shadow-lg overflow-hidden">
              <table className="w-full">
                <thead className="bg-[#000020] border-b border-white/20">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Email</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Nome</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Plano</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Uso</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Criado em</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {filteredUsers.map((user) => (
                    <tr key={user.id} className="hover:bg-[#000020]">
                      <td className="px-6 py-4 text-sm text-white">{user.email}</td>
                      <td className="px-6 py-4 text-sm text-white">{user.fullName || '-'}</td>
                      <td className="px-6 py-4 text-sm">
                        <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                          user.license?.plan === 'ENTERPRISE' ? 'bg-orange-100 text-orange-800' :
                          user.license?.plan === 'PRO' ? 'bg-purple-100 text-purple-800' :
                          'bg-[#171a4a] text-slate-800'
                        }`}>
                          {user.license?.plan || 'Nenhum'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm">
                        <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                          user.license?.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                        }`}>
                          {user.license?.status === 'active' ? 'Ativo' : 'Inativo'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-400">
                        {user.license ? `${user.license.reportsUsed}/${user.license.reportsLimit} relatórios` : '-'}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-400">{formatDate(user.createdAt)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Subscriptions Tab */}
        {activeTab === 'subscriptions' && (
          <div className="bg-white/5 rounded-xl shadow-lg overflow-hidden">
            <table className="w-full">
              <thead className="bg-[#000020] border-b border-white/20">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Usuário</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Email</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Plano</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Relatórios</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Projetos</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Criado em</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {subscriptions.map((sub) => (
                  <tr key={sub.licenseId} className="hover:bg-[#000020]">
                    <td className="px-6 py-4 text-sm text-white">{sub.userName || '-'}</td>
                    <td className="px-6 py-4 text-sm text-white">{sub.userEmail}</td>
                    <td className="px-6 py-4 text-sm">
                      <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                        sub.plan === 'ENTERPRISE' ? 'bg-orange-100 text-orange-800' :
                        sub.plan === 'PRO' ? 'bg-purple-100 text-purple-800' :
                        'bg-[#171a4a] text-slate-800'
                      }`}>
                        {sub.plan}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-400">
                      {sub.reportsUsed}/{sub.reportsLimit}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-400">
                      {sub.projectsActive}/{sub.projectsLimit === 999 ? '∞' : sub.projectsLimit}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-400">{formatDate(sub.createdAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Revenue Tab */}
        {activeTab === 'revenue' && revenue && (
          <div className="space-y-6">
            {/* Revenue Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white/5 rounded-xl shadow-lg p-6">
                <p className="text-gray-400 text-sm">MRR (Receita Recorrente Mensal)</p>
                <p className="text-4xl font-bold text-green-600 mt-2">{formatCurrency(revenue.mrr)}</p>
              </div>
              <div className="bg-white/5 rounded-xl shadow-lg p-6">
                <p className="text-gray-400 text-sm">ARR (Receita Recorrente Anual)</p>
                <p className="text-4xl font-bold text-blue-600 mt-2">{formatCurrency(revenue.arr)}</p>
              </div>
              <div className="bg-white/5 rounded-xl shadow-lg p-6">
                <p className="text-gray-400 text-sm">Assinaturas Ativas</p>
                <p className="text-4xl font-bold text-purple-600 mt-2">{revenue.totalActiveSubscriptions}</p>
              </div>
            </div>

            {/* Revenue by Plan */}
            <div className="bg-white/5 rounded-xl shadow-lg p-6">
              <h3 className="text-lg font-bold text-white mb-4">Receita por Plano</h3>
              <div className="space-y-4">
                {Object.entries(revenue.revenueByPlan).map(([plan, data]) => (
                  <div key={plan} className="flex items-center justify-between p-4 bg-[#000020] rounded-lg">
                    <div>
                      <p className="font-semibold text-white">{plan}</p>
                      <p className="text-sm text-gray-400">{data.count} assinaturas</p>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold text-green-600">{formatCurrency(data.revenue)}</p>
                      <p className="text-sm text-gray-400">por mês</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {loading && activeTab !== 'dashboard' && (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        )}
      </main>
    </div>
  );
}

