import { useAuth } from '@/contexts/AuthContext';
import { Link } from 'wouter';

// Updated: 2025-10-29 - Qivo Design System
export default function AuthNavbar() {
 const { user, plan, logout } = useAuth();

 if (!user) return null;

 return (
  <header className="backdrop-blur-md bg-white/5 border-b border-white/10 sticky top-0 z-50">
 <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
 <div className="flex justify-between items-center h-16">
 {/* Logo and Brand */}
      <Link href="/dashboard" className="flex items-center gap-3">
        <img
          src="/assets/logo-Qivo.png"
          alt="QIVO Mining"
          className="h-10 w-auto"
        />
        <div>
          <div className="font-bold text-white">QIVO Mining</div>
          <div className="text-xs text-gray-300">Governança Técnica, Regulatória e Ambiental</div>
        </div>
      </Link>

 {/* User Info and Actions */}
 <div className="flex items-center gap-4">
 {/* User Info */}
 <div className="hidden md:flex flex-col items-end">
 <span className="text-sm font-medium text-white">
 {user.name || user.email}
 </span>
 <span className="text-xs text-gray-500">
 Plano: <span className="font-semibold text-blue-600">{plan}</span>
 </span>
 </div>

 {/* Minha Conta Button */}
 <button
 onClick={() => window.location.href = '/account'}
 className="px-4 py-2 text-sm font-medium text-gray-300 bg-[#171a4a] hover:bg-gray-200 rounded-lg transition-colors"
 >
 Minha Conta
 </button>

 {/* Logout Button */}
 <button
 onClick={logout}
 className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors"
 >
 Sair
 </button>
 </div>
 </div>
 </div>
 </header>
 );
}

