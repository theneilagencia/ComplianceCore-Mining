import { useState } from 'react';
import { useLocation } from 'wouter';
import { useAuth } from '../contexts/AuthContext';

export default function LoginPage() {
  const [, setLocation] = useLocation();
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await login(email, password);
      // Redirect to dashboard after successful login
      setLocation('/dashboard');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = () => {
    window.location.href = '/api/auth/google';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#000020] via-[#171a4a] to-[#2f2c79] flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white/5 backdrop-blur-sm border border-white/20 rounded-2xl shadow-2xl p-8">
        {/* Logo */}
        <div className="flex justify-center mb-6">
          <img src="/assets/logo-Qivo.png" alt="QIVO Mining" className="h-12 w-auto" />
        </div>

        <h1 className="text-3xl font-bold text-center mb-2 text-white">Bem-vindo de Volta</h1>
        <p className="text-gray-300 text-center mb-8">
          Entre na sua conta para continuar
        </p>

        {error && (
          <div className="bg-red-500/20 border border-red-500/50 text-red-200 px-4 py-3 rounded-lg mb-6">
            {error}
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-white mb-1">
              Email
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full px-4 py-3 bg-white/5 border border-white/20 text-white rounded-lg focus:ring-2 focus:ring-[#b96e48] focus:border-transparent placeholder:text-gray-400"
              placeholder="seu@email.com"
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-white mb-1">
              Senha
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full px-4 py-3 bg-white/5 border border-white/20 text-white rounded-lg focus:ring-2 focus:ring-[#b96e48] focus:border-transparent placeholder:text-gray-400"
              placeholder="••••••••"
            />
          </div>

          <div className="flex items-center justify-end mb-4">
            <button
              type="button"
              onClick={() => setLocation('/forgot-password')}
              className="text-sm text-[#b96e48] hover:text-[#8d4925] font-medium"
            >
              Esqueci minha senha
            </button>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[#2f2c79] text-white py-3 rounded-lg font-semibold hover:bg-[#b96e48] transition-all disabled:opacity-50"
          >
            {loading ? 'Entrando...' : 'Entrar'}
          </button>
        </form>

        <p className="text-center text-gray-300 mt-6">
          Não tem uma conta?{' '}
          <button
            onClick={() => setLocation('/register')}
            className="text-[#b96e48] font-semibold hover:underline"
          >
            Criar conta
          </button>
        </p>
      </div>
    </div>
  );
}

