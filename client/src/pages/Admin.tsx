import { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { Users, DollarSign, TrendingUp, Settings, BarChart3, CreditCard, Database } from 'lucide-react';

const API_BASE_URL = import.meta.env.VITE_API_URL || '';

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
    id: string;
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
  stripeSubscriptionId: string | null;
}

interface Revenue {
  mrr: number;
  arr: number;
  totalActiveSubscriptions: number;
  revenueByPlan: Record<string, { count: number; revenue: number }>;
}

interface Costs {
  costs: Array<{
    service: string;
    category: string;
    monthlyCost: number;
    variableCost: number;
    description: string;
  }>;
  summary: {
    fixedCosts: number;
    variableCosts: number;
    totalCosts: number;
  };
  usage: {
    s3StorageGB: number;
    openaiTokens: number;
    copernicusRequests: number;
    mapboxRequests: number;
  };
}

interface Profit {
  revenue: number;
  fixedCosts: number;
  variableCosts: number;
  totalCosts: number;
  grossProfit: number;
  netProfit: number;
  profitMargin: number;
  usage: {
    s3StorageGB: number;
    openaiTokens: number;
    copernicusRequests: number;
    mapboxRequests: number;
  };
}

export default function Admin() {
  const [, setLocation] = useLocation();
  const [activeTab, setActiveTab] = useState<'dashboard' | 'users' | 'manage-users' | 'sales' | 'costs'>('dashboard');
  const [stats, setStats] = useState<Stats | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [revenue, setRevenue] = useState<Revenue | null>(null);
  const [costs, setCosts] = useState<Costs | null>(null);
  const [profit, setProfit] = useState<Profit | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const openCreateModal = () => setShowCreateModal(true);
  const closeCreateModal = () => setShowCreateModal(false);
  const [newUser, setNewUser] = useState({ email: '', fullName: '', password: '', plan: 'START' });

  useEffect(() => {
    checkAdminAccess();
  }, []);

  useEffect(() => {
    if (activeTab === 'dashboard') {
      fetchDashboardData();
    } else if (activeTab === 'users') {
      fetchUsers();
    } else if (activeTab === 'manage-users') {
      fetchUsers();
    } else if (activeTab === 'sales') {
      fetchSalesData();
    } else if (activeTab === 'costs') {
      fetchCostsData();
    }
  }, [activeTab]);

  const checkAdminAccess = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/admin/stats`, {
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

      fetchDashboardData();
    } catch (error) {
      console.error('Admin access check failed:', error);
      setLocation('/dashboard');
    }
  };

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const [statsRes, revenueRes, costsRes, profitRes] = await Promise.all([
        fetch(`${API_BASE_URL}/api/admin/stats`, { credentials: 'include' }),
        fetch(`${API_BASE_URL}/api/admin/revenue`, { credentials: 'include' }),
        fetch(`${API_BASE_URL}/api/admin/costs`, { credentials: 'include' }),
        fetch(`${API_BASE_URL}/api/admin/profit`, { credentials: 'include' }),
      ]);

      if (statsRes.ok) setStats(await statsRes.json());
      if (revenueRes.ok) setRevenue(await revenueRes.json());
      if (costsRes.ok) setCosts(await costsRes.json());
      if (profitRes.ok) setProfit(await profitRes.json());
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/admin/users?limit=100`, {
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

  const fetchSalesData = async () => {
    setLoading(true);
    try {
      const [subsRes, revenueRes] = await Promise.all([
        fetch(`${API_BASE_URL}/api/admin/subscriptions`, { credentials: 'include' }),
        fetch(`${API_BASE_URL}/api/admin/revenue`, { credentials: 'include' }),
      ]);

      if (subsRes.ok) {
        const data = await subsRes.json();
        setSubscriptions(data.subscriptions);
      }
      if (revenueRes.ok) setRevenue(await revenueRes.json());
    } catch (error) {
      console.error('Error fetching sales data:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchCostsData = async () => {
    setLoading(true);
    try {
      const [costsRes, profitRes] = await Promise.all([
        fetch(`${API_BASE_URL}/api/admin/costs`, { credentials: 'include' }),
        fetch(`${API_BASE_URL}/api/admin/profit`, { credentials: 'include' }),
      ]);

      if (costsRes.ok) setCosts(await costsRes.json());
      if (profitRes.ok) setProfit(await profitRes.json());
    } catch (error) {
      console.error('Error fetching costs data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateUserLicense = async (userId: string, plan: string, status: string, fullName?: string) => {
    try {
      // Atualizar licença
      const licenseResponse = await fetch(`${API_BASE_URL}/api/admin/users/${userId}/license`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ plan, status }),
      });

      if (!licenseResponse.ok) throw new Error('Failed to update license');

      // Atualizar nome se fornecido
      if (fullName && fullName.trim()) {
        const userResponse = await fetch(`${API_BASE_URL}/api/admin/users/${userId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ fullName: fullName.trim() }),
        });

        if (!userResponse.ok) console.warn('Failed to update user name');
      }

      alert('Usuário atualizado com sucesso!');
      setShowEditModal(false);
      setEditingUser(null);
      fetchUsers();
    } catch (error) {
      console.error('Error updating user:', error);
      alert('Erro ao atualizar usuário');
    }
  };

  const handleDeleteUser = async (userId: string) => {
    if (!confirm('Tem certeza que deseja excluir este usuário? Esta ação não pode ser desfeita.')) return;

    try {
      const response = await fetch(`${API_BASE_URL}/api/admin/users/${userId}`, {
        method: 'DELETE',
        credentials: 'include',
      });

      if (!response.ok) throw new Error('Failed to delete user');

      alert('Usuário excluído com sucesso!');
      setShowEditModal(false);
      setEditingUser(null);
      fetchUsers();
    } catch (error) {
      console.error('Error deleting user:', error);
      alert('Erro ao excluir usuário');
    }
  };

  const handleResetPassword = async (userId: string) => {
    if (!confirm('Deseja enviar um email com instruções para resetar a senha?')) return;

    try {
      const response = await fetch(`${API_BASE_URL}/api/admin/users/${userId}/reset-password`, {
        method: 'POST',
        credentials: 'include',
      });

      if (!response.ok) throw new Error('Failed to reset password');

      alert('Email de reset de senha enviado com sucesso!');
    } catch (error) {
      console.error('Error resetting password:', error);
      alert('Erro ao resetar senha');
    }
  };

  const handleCreateUser = async () => {
    if (!newUser.email || !newUser.password) {
      alert('Email e senha são obrigatórios');
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/api/admin/users`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(newUser),
      });

      if (!response.ok) throw new Error('Failed to create user');

      alert('Usuário criado com sucesso!');
      closeCreateModal();
      setNewUser({ email: '', fullName: '', password: '', plan: 'START' });
      fetchUsers();
    } catch (error) {
      console.error('Error creating user:', error);
      alert('Erro ao criar usuário');
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
      <div className="min-h-screen bg-gradient-to-br from-[#000020] via-[#171a4a] to-[#2f2c79] flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#7ed957]"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#000020] via-[#171a4a] to-[#2f2c79]">
      {/* Header */}
      <header className="bg-white/5 backdrop-blur-md border-b border-white/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <img src="/assets/logo-Qivo.png" alt="Qivo" className="h-10" />
              <div>
                <h1 className="text-2xl font-bold text-white">Painel de Administração</h1>
                <p className="text-sm text-gray-400">Gerenciamento Completo da Plataforma</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setLocation('/dashboard')}
                className="px-4 py-2 text-gray-300 hover:bg-white/10 rounded-lg transition-colors"
              >
                Voltar ao Dashboard
              </button>
              <button
                onClick={() => setLocation('/login')}
                className="px-4 py-2 bg-gradient-to-r from-[#8d4925] to-[#b96e48] text-white rounded-lg hover:opacity-90 transition-opacity"
              >
                Sair
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Tabs */}
      <div className="bg-white/5 backdrop-blur-md border-b border-white/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex gap-6">
            {[
              { id: 'dashboard', label: 'Dashboard', icon: BarChart3 },
              { id: 'users', label: 'Usuários', icon: Users },
              { id: 'manage-users', label: 'Gerenciar Usuários', icon: Settings },
              { id: 'sales', label: 'Vendas', icon: CreditCard },
              { id: 'costs', label: 'Custos', icon: Database },
            ].map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => setActiveTab(id as any)}
                className={`px-4 py-3 font-medium transition-all border-b-2 flex items-center gap-2 ${
                  activeTab === id
                    ? 'border-[#7ed957] text-[#7ed957]'
                    : 'border-transparent text-gray-400 hover:text-white'
                }`}
              >
                <Icon className="w-4 h-4" />
                {label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Dashboard Tab */}
        {activeTab === 'dashboard' && (
          <div className="space-y-6">
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="bg-white/5 backdrop-blur-md rounded-xl border border-white/20 p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-400 text-sm">Total de Usuários</p>
                    <p className="text-3xl font-bold text-white mt-2">{stats?.totalUsers || 0}</p>
                  </div>
                  <div className="w-12 h-12 bg-blue-500/20 rounded-lg flex items-center justify-center">
                    <Users className="w-6 h-6 text-blue-400" />
                  </div>
                </div>
                <p className="text-[#7ed957] text-sm mt-2">+{stats?.recentUsers || 0} nos últimos 30 dias</p>
              </div>

              <div className="bg-white/5 backdrop-blur-md rounded-xl border border-white/20 p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-400 text-sm">MRR</p>
                    <p className="text-3xl font-bold text-white mt-2">{formatCurrency(stats?.mrr || 0)}</p>
                  </div>
                  <div className="w-12 h-12 bg-green-500/20 rounded-lg flex items-center justify-center">
                    <DollarSign className="w-6 h-6 text-green-400" />
                  </div>
                </div>
                <p className="text-gray-400 text-sm mt-2">Receita Recorrente Mensal</p>
              </div>

              <div className="bg-white/5 backdrop-blur-md rounded-xl border border-white/20 p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-400 text-sm">Custos Mensais</p>
                    <p className="text-3xl font-bold text-white mt-2">{formatCurrency(costs?.summary.totalCosts || 0)}</p>
                  </div>
                  <div className="w-12 h-12 bg-red-500/20 rounded-lg flex items-center justify-center">
                    <Database className="w-6 h-6 text-red-400" />
                  </div>
                </div>
                <p className="text-gray-400 text-sm mt-2">Fixos + Variáveis</p>
              </div>

              <div className="bg-white/5 backdrop-blur-md rounded-xl border border-white/20 p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-400 text-sm">Lucro Líquido</p>
                    <p className="text-3xl font-bold text-white mt-2">{formatCurrency(profit?.netProfit || 0)}</p>
                  </div>
                  <div className="w-12 h-12 bg-purple-500/20 rounded-lg flex items-center justify-center">
                    <TrendingUp className="w-6 h-6 text-purple-400" />
                  </div>
                </div>
                <p className="text-[#7ed957] text-sm mt-2">Margem: {profit?.profitMargin.toFixed(1) || 0}%</p>
              </div>
            </div>

            {/* Planos Distribution */}
            <div className="bg-white/5 backdrop-blur-md rounded-xl border border-white/20 p-6">
              <h3 className="text-lg font-semibold text-white mb-4">Distribuição de Planos</h3>
              <div className="grid grid-cols-3 gap-4">
                <div className="text-center">
                  <p className="text-4xl font-bold text-gray-400">{stats?.stats.startUsers || 0}</p>
                  <p className="text-sm text-gray-500 mt-1">START</p>
                  <p className="text-xs text-gray-600">Gratuito</p>
                </div>
                <div className="text-center">
                  <p className="text-4xl font-bold text-blue-400">{stats?.stats.proUsers || 0}</p>
                  <p className="text-sm text-blue-300 mt-1">PRO</p>
                  <p className="text-xs text-gray-600">US$ 899,00/mês</p>
                </div>
                <div className="text-center">
                  <p className="text-4xl font-bold text-[#b96e48]">{stats?.stats.enterpriseUsers || 0}</p>
                  <p className="text-sm text-[#8d4925] mt-1">ENTERPRISE</p>
                  <p className="text-xs text-gray-600">US$ 1.990,00/mês</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Users Tab */}
        {activeTab === 'users' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold text-white">Gerenciar Usuários</h2>
              <div className="flex gap-3">
                <input
                  type="text"
                  placeholder="Buscar por email ou nome..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#7ed957]"
                />
                <button
                  onClick={openCreateModal}
                  className="px-4 py-2 bg-[#7ed957] text-white rounded-lg hover:opacity-90 transition-opacity flex items-center gap-2"
                >
                  <Users className="w-4 h-4" />
                  Criar Usuário
                </button>
              </div>
            </div>

            <div className="bg-white/5 backdrop-blur-md rounded-xl border border-white/20 overflow-hidden">
              <table className="w-full">
                <thead className="bg-white/10">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Email</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Nome</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Plano</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Uso</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Criado em</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/10">
                  {filteredUsers.map((user) => (
                    <tr key={user.id} className="hover:bg-white/5 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-white">{user.email}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-white">{user.fullName || '-'}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          user.license?.plan === 'ENTERPRISE' ? 'bg-[#8d4925]/20 text-[#b96e48]' :
                          user.license?.plan === 'PRO' ? 'bg-blue-500/20 text-blue-400' :
                          'bg-gray-500/20 text-gray-400'
                        }`}>
                          {user.license?.plan || 'START'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          user.license?.status === 'active' ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'
                        }`}>
                          {user.license?.status || 'inactive'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-400">
                        {user.license ? `${user.license.reportsUsed}/${user.license.reportsLimit}` : '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-400">{formatDate(user.createdAt)}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <button
                          onClick={() => {
                            setEditingUser(user);
                            setShowEditModal(true);
                          }}
                          className="px-3 py-1 bg-[#7ed957]/20 text-[#7ed957] rounded-lg hover:bg-[#7ed957]/30 transition-colors"
                        >
                          Editar
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Sales Tab */}
        {activeTab === 'sales' && (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-white">Vendas e Assinaturas</h2>

            {/* Revenue Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white/5 backdrop-blur-md rounded-xl border border-white/20 p-6">
                <p className="text-gray-400 text-sm">MRR</p>
                <p className="text-3xl font-bold text-white mt-2">{formatCurrency(revenue?.mrr || 0)}</p>
                <p className="text-gray-500 text-xs mt-1">Receita Recorrente Mensal</p>
              </div>
              <div className="bg-white/5 backdrop-blur-md rounded-xl border border-white/20 p-6">
                <p className="text-gray-400 text-sm">ARR</p>
                <p className="text-3xl font-bold text-white mt-2">{formatCurrency(revenue?.arr || 0)}</p>
                <p className="text-gray-500 text-xs mt-1">Receita Recorrente Anual</p>
              </div>
              <div className="bg-white/5 backdrop-blur-md rounded-xl border border-white/20 p-6">
                <p className="text-gray-400 text-sm">Assinaturas Ativas</p>
                <p className="text-3xl font-bold text-white mt-2">{revenue?.totalActiveSubscriptions || 0}</p>
                <p className="text-gray-500 text-xs mt-1">Total de clientes pagantes</p>
              </div>
            </div>

            {/* Subscriptions Table */}
            <div className="bg-white/5 backdrop-blur-md rounded-xl border border-white/20 overflow-hidden">
              <div className="px-6 py-4 border-b border-white/10">
                <h3 className="text-lg font-semibold text-white">Assinaturas Ativas</h3>
              </div>
              <table className="w-full">
                <thead className="bg-white/10">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Usuário</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Plano</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Uso</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Criado em</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Stripe ID</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/10">
                  {subscriptions.map((sub) => (
                    <tr key={sub.licenseId} className="hover:bg-white/5 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <div>
                          <p className="text-white">{sub.userName || '-'}</p>
                          <p className="text-gray-400 text-xs">{sub.userEmail}</p>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          sub.plan === 'ENTERPRISE' ? 'bg-[#8d4925]/20 text-[#b96e48]' :
                          sub.plan === 'PRO' ? 'bg-blue-500/20 text-blue-400' :
                          'bg-gray-500/20 text-gray-400'
                        }`}>
                          {sub.plan}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <span className="px-2 py-1 rounded-full text-xs font-medium bg-green-500/20 text-green-400">
                          {sub.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-400">
                        {sub.reportsUsed}/{sub.reportsLimit} relatórios
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-400">{formatDate(sub.createdAt)}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-400 font-mono text-xs">
                        {sub.stripeSubscriptionId || '-'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Costs Tab */}
        {activeTab === 'costs' && (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-white">Custos e Despesas</h2>

            {/* Costs Summary */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="bg-white/5 backdrop-blur-md rounded-xl border border-white/20 p-6">
                <p className="text-gray-400 text-sm">Custos Fixos</p>
                <p className="text-3xl font-bold text-white mt-2">{formatCurrency(costs?.summary.fixedCosts || 0)}</p>
                <p className="text-gray-500 text-xs mt-1">Mensais</p>
              </div>
              <div className="bg-white/5 backdrop-blur-md rounded-xl border border-white/20 p-6">
                <p className="text-gray-400 text-sm">Custos Variáveis</p>
                <p className="text-3xl font-bold text-white mt-2">{formatCurrency(costs?.summary.variableCosts || 0)}</p>
                <p className="text-gray-500 text-xs mt-1">Baseado em uso</p>
              </div>
              <div className="bg-white/5 backdrop-blur-md rounded-xl border border-white/20 p-6">
                <p className="text-gray-400 text-sm">Total de Custos</p>
                <p className="text-3xl font-bold text-white mt-2">{formatCurrency(costs?.summary.totalCosts || 0)}</p>
                <p className="text-gray-500 text-xs mt-1">Fixos + Variáveis</p>
              </div>
              <div className="bg-white/5 backdrop-blur-md rounded-xl border border-white/20 p-6">
                <p className="text-gray-400 text-sm">Margem Operacional</p>
                <p className="text-3xl font-bold text-white mt-2">{profit?.profitMargin.toFixed(1) || 0}%</p>
                <p className="text-gray-500 text-xs mt-1">Lucro / Receita</p>
              </div>
            </div>

            {/* Services Breakdown */}
            <div className="bg-white/5 backdrop-blur-md rounded-xl border border-white/20 overflow-hidden">
              <div className="px-6 py-4 border-b border-white/10">
                <h3 className="text-lg font-semibold text-white">Detalhamento por Serviço</h3>
              </div>
              <table className="w-full">
                <thead className="bg-white/10">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Serviço</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Categoria</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Custo Fixo</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Custo Variável</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Descrição</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/10">
                  {costs?.costs.map((cost, index) => (
                    <tr key={index} className="hover:bg-white/5 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-white font-medium">{cost.service}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          cost.category === 'infrastructure' ? 'bg-blue-500/20 text-blue-400' :
                          cost.category === 'ai' ? 'bg-purple-500/20 text-purple-400' :
                          cost.category === 'data' ? 'bg-green-500/20 text-green-400' :
                          'bg-orange-500/20 text-orange-400'
                        }`}>
                          {cost.category}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-white">
                        {cost.monthlyCost > 0 ? formatCurrency(cost.monthlyCost) : '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-400">
                        {cost.variableCost > 0 ? `${formatCurrency(cost.variableCost)}/unidade` : '-'}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-400">{cost.description}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Usage Metrics */}
            <div className="bg-white/5 backdrop-blur-md rounded-xl border border-white/20 p-6">
              <h3 className="text-lg font-semibold text-white mb-4">Métricas de Uso</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <p className="text-gray-400 text-sm">S3 Storage</p>
                  <p className="text-2xl font-bold text-white mt-1">{costs?.usage.s3StorageGB || 0} GB</p>
                </div>
                <div>
                  <p className="text-gray-400 text-sm">OpenAI Tokens</p>
                  <p className="text-2xl font-bold text-white mt-1">{(costs?.usage.openaiTokens || 0).toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-gray-400 text-sm">Copernicus Requests</p>
                  <p className="text-2xl font-bold text-white mt-1">{costs?.usage.copernicusRequests || 0}</p>
                </div>
                <div>
                  <p className="text-gray-400 text-sm">Mapbox Requests</p>
                  <p className="text-2xl font-bold text-white mt-1">{(costs?.usage.mapboxRequests || 0).toLocaleString()}</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Manage Users Tab */}
        {activeTab === 'manage-users' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold text-white">Gerenciar Usuários</h2>
              <button
                onClick={openCreateModal}
                className="px-6 py-3 bg-gradient-to-r from-[#7ed957] to-[#6bc247] text-white rounded-lg hover:opacity-90 transition-opacity font-medium flex items-center gap-2"
              >
                <Users className="w-5 h-5" />
                Criar Novo Usuário
              </button>
            </div>

            {/* Search Bar */}
            <div className="bg-white/5 backdrop-blur-md rounded-xl border border-white/20 p-4">
              <input
                type="text"
                placeholder="Buscar por nome ou email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#7ed957]"
              />
            </div>

            {/* Users Table */}
            <div className="bg-white/5 backdrop-blur-md rounded-xl border border-white/20 overflow-hidden">
              <div className="px-6 py-4 border-b border-white/10">
                <h3 className="text-lg font-semibold text-white">Todos os Usuários ({filteredUsers.length})</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-white/10">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Usuário</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Plano</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Status</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Uso</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Criado em</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Ações</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/10">
                    {filteredUsers.map((user) => (
                      <tr key={user.id} className="hover:bg-white/5 transition-colors">
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          <div>
                            <p className="text-white font-medium">{user.fullName || '-'}</p>
                            <p className="text-gray-400 text-xs">{user.email}</p>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            user.license?.plan === 'ENTERPRISE' ? 'bg-[#8d4925]/20 text-[#b96e48]' :
                            user.license?.plan === 'PRO' ? 'bg-blue-500/20 text-blue-400' :
                            'bg-gray-500/20 text-gray-400'
                          }`}>
                            {user.license?.plan || 'START'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            user.license?.status === 'active' ? 'bg-green-500/20 text-green-400' :
                            user.license?.status === 'suspended' ? 'bg-yellow-500/20 text-yellow-400' :
                            'bg-red-500/20 text-red-400'
                          }`}>
                            {user.license?.status === 'active' ? 'Ativo' :
                             user.license?.status === 'suspended' ? 'Suspenso' : 'Cancelado'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                          {user.license?.reportsUsed || 0} / {user.license?.reportsLimit || 0}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                          {new Date(user.createdAt).toLocaleDateString('pt-BR')}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          <button
                            onClick={() => {
                              setEditingUser(user);
                              setShowEditModal(true);
                            }}
                            className="px-3 py-1 bg-blue-500/20 text-blue-400 rounded-lg hover:bg-blue-500/30 transition-colors text-xs font-medium"
                          >
                            Editar
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white/5 backdrop-blur-md rounded-xl border border-white/20 p-6">
                <p className="text-gray-400 text-sm">Usuários Ativos</p>
                <p className="text-3xl font-bold text-[#7ed957] mt-2">
                  {users.filter(u => u.license?.status === 'active').length}
                </p>
              </div>
              <div className="bg-white/5 backdrop-blur-md rounded-xl border border-white/20 p-6">
                <p className="text-gray-400 text-sm">Usuários Suspensos</p>
                <p className="text-3xl font-bold text-yellow-400 mt-2">
                  {users.filter(u => u.license?.status === 'suspended').length}
                </p>
              </div>
              <div className="bg-white/5 backdrop-blur-md rounded-xl border border-white/20 p-6">
                <p className="text-gray-400 text-sm">Usuários Cancelados</p>
                <p className="text-3xl font-bold text-red-400 mt-2">
                  {users.filter(u => u.license?.status === 'cancelled').length}
                </p>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Edit User Modal */}
      {showEditModal && editingUser && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-[#171a4a] border border-white/20 rounded-xl p-6 max-w-md w-full mx-4">
            <h3 className="text-xl font-bold text-white mb-4">Editar Usuário</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm text-gray-400 mb-1">Email</label>
                <input
                  type="text"
                  value={editingUser.email}
                  disabled
                  className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white opacity-60 cursor-not-allowed"
                />
                <p className="text-xs text-gray-500 mt-1">O email não pode ser alterado</p>
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1">Nome Completo</label>
                <input
                  type="text"
                  defaultValue={editingUser.fullName || ''}
                  id="fullname-input"
                  placeholder="Nome completo do usuário"
                  className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#7ed957]"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1">Plano</label>
                <select
                  defaultValue={editingUser.license?.plan || 'START'}
                  id="plan-select"
                  className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white"
                >
                  <option value="START">START</option>
                  <option value="PRO">PRO</option>
                  <option value="ENTERPRISE">ENTERPRISE</option>
                </select>
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1">Status</label>
                <select
                  defaultValue={editingUser.license?.status || 'active'}
                  id="status-select"
                  className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white"
                >
                  <option value="active">Ativo</option>
                  <option value="suspended">Suspenso</option>
                  <option value="cancelled">Cancelado</option>
                </select>
              </div>
              <div className="space-y-3 mt-6">
                <div className="flex gap-3">
                  <button
                    onClick={() => {
                      setShowEditModal(false);
                      setEditingUser(null);
                    }}
                    className="flex-1 px-4 py-2 bg-white/10 text-white rounded-lg hover:bg-white/20 transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={() => {
                      const plan = (document.getElementById('plan-select') as HTMLSelectElement).value;
                      const status = (document.getElementById('status-select') as HTMLSelectElement).value;
                      const fullName = (document.getElementById('fullname-input') as HTMLInputElement).value;
                      handleUpdateUserLicense(editingUser.id, plan, status, fullName);
                    }}
                    className="flex-1 px-4 py-2 bg-[#7ed957] text-white rounded-lg hover:opacity-90 transition-opacity"
                  >
                    Salvar Alterações
                  </button>
                </div>
                <div className="flex gap-3">
                  <button
                    onClick={() => handleResetPassword(editingUser.id)}
                    className="flex-1 px-4 py-2 bg-blue-500/20 text-blue-400 rounded-lg hover:bg-blue-500/30 transition-colors"
                  >
                    Resetar Senha
                  </button>
                  <button
                    onClick={() => handleDeleteUser(editingUser.id)}
                    className="flex-1 px-4 py-2 bg-red-500/20 text-red-400 rounded-lg hover:bg-red-500/30 transition-colors"
                  >
                    Excluir Usuário
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Create User Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-[#171a4a] border border-white/20 rounded-xl p-6 max-w-md w-full mx-4">
            <h3 className="text-xl font-bold text-white mb-4">Criar Novo Usuário</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm text-gray-400 mb-1">Email *</label>
                <input
                  type="email"
                  value={newUser.email}
                  onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                  placeholder="usuario@exemplo.com"
                  className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#7ed957]"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1">Nome Completo</label>
                <input
                  type="text"
                  value={newUser.fullName}
                  onChange={(e) => setNewUser({ ...newUser, fullName: e.target.value })}
                  placeholder="João Silva"
                  className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#7ed957]"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1">Senha *</label>
                <input
                  type="password"
                  value={newUser.password}
                  onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                  placeholder="Mínimo 8 caracteres"
                  className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#7ed957]"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1">Plano</label>
                <select
                  value={newUser.plan}
                  onChange={(e) => setNewUser({ ...newUser, plan: e.target.value })}
                  className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-[#7ed957]"
                >
                  <option value="START">START (Gratuito)</option>
                  <option value="PRO">PRO (US$ 899/mês)</option>
                  <option value="ENTERPRISE">ENTERPRISE (US$ 1.990/mês)</option>
                </select>
              </div>
              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => {
                    closeCreateModal();
                    setNewUser({ email: '', fullName: '', password: '', plan: 'START' });
                  }}
                  className="flex-1 px-4 py-2 bg-white/10 text-white rounded-lg hover:bg-white/20 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleCreateUser}
                  className="flex-1 px-4 py-2 bg-[#7ed957] text-white rounded-lg hover:opacity-90 transition-opacity"
                >
                  Criar Usuário
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

