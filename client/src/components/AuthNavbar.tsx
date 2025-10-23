import { useAuth } from '@/contexts/AuthContext';
import { Link } from 'wouter';

export default function AuthNavbar() {
 const { user, plan, logout } = useAuth();

 if (!user) return null;

 return (
 <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
 <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
 <div className="flex justify-between items-center h-16">
 {/* Logo and Brand */}
 <Link href="/dashboard" className="flex items-center gap-3">
 <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center text-white font-bold text-xl">
 JI
 </div>
 <div>
 <div className="font-bold text-gray-900">QIVO Mining</div>
 <div className="text-xs text-gray-500">Infraestrutura de Governança Minerária Digital</div>
 </div>
 </Link>

 {/* User Info and Actions */}
 <div className="flex items-center gap-4">
 {/* User Info */}
 <div className="hidden md:flex flex-col items-end">
 <span className="text-sm font-medium text-gray-900">
 {user.name || user.email}
 </span>
 <span className="text-xs text-gray-500">
 Plano: <span className="font-semibold text-blue-600">{plan}</span>
 </span>
 </div>

 {/* Minha Conta Button */}
 <button
 onClick={() => window.location.href = '/account'}
 className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
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

