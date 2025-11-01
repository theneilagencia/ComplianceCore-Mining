/**
 * Radar Notifications Page
 * Displays regulatory notifications dashboard
 * RAD-005: Dashboard Básico Radar
 */

import { useState } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import NotificationsDashboard from '../components/NotificationsDashboard';
import { Bell, ArrowLeft } from 'lucide-react';
import { useLocation } from 'wouter';
import { Button } from '@/components/ui/button';

export default function RadarNotificationsPage() {
  const [, setLocation] = useLocation();
  const [darkMode, setDarkMode] = useState(false);

  return (
    <DashboardLayout>
      <div className={`min-h-screen ${darkMode ? 'bg-gray-900 text-white' : 'bg-[#000020] text-white'}`}>
        {/* Header */}
        <div className={`${darkMode ? 'bg-gray-800' : 'bg-white/5'} shadow-sm border-b ${darkMode ? 'border-gray-700' : 'border-white/20'}`}>
          <div className="max-w-7xl mx-auto px-4 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setLocation('/radar')}
                  className="mr-2"
                >
                  <ArrowLeft className="w-5 h-5" />
                </Button>
                <div className="w-10 h-10 bg-rose-100 rounded-lg flex items-center justify-center">
                  <Bell className="w-6 h-6 text-rose-600" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold">Notificações Regulatórias</h1>
                  <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-400'}`}>
                    Monitoramento centralizado de mudanças regulatórias e atividades minerárias
                  </p>
                </div>
              </div>
              
              <button
                onClick={() => setDarkMode(!darkMode)}
                className={`px-4 py-2 rounded-lg ${darkMode ? 'bg-gray-700 hover:bg-gray-600' : 'bg-[#171a4a] hover:bg-gray-200'}`}
              >
                {darkMode ? '☀️' : '🌙'}
              </button>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="max-w-7xl mx-auto px-4 py-6">
          <NotificationsDashboard darkMode={darkMode} />
        </div>

        {/* Footer */}
        <div className={`${darkMode ? 'bg-gray-800 border-t border-gray-700' : 'bg-white/5 border-t border-white/20'} px-4 py-3 mt-8`}>
          <div className="max-w-7xl mx-auto flex items-center justify-between text-sm">
            <div className={darkMode ? 'text-gray-400' : 'text-gray-400'}>
              Dashboard de Notificações - RAD-005
            </div>
            <div className={darkMode ? 'text-gray-400' : 'text-gray-400'}>
              Dados de DOU, SIGMINE, MapBiomas e mais
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
