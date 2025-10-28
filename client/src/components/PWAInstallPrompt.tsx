import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Download, X, Wifi, WifiOff } from 'lucide-react';
import { useServiceWorker } from '@/hooks/useServiceWorker';
import { Alert, AlertDescription } from '@/components/ui/alert';

export function PWAInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showInstallPrompt, setShowInstallPrompt] = useState(false);
  const { updateAvailable, updateServiceWorker, isOnline } = useServiceWorker();

  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      
      // Check if user has dismissed before
      const dismissed = localStorage.getItem('pwa-install-dismissed');
      if (!dismissed) {
        setShowInstallPrompt(true);
      }
    };

    window.addEventListener('beforeinstallprompt', handler);

    return () => {
      window.removeEventListener('beforeinstallprompt', handler);
    };
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;

    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    
    console.log(`PWA install outcome: ${outcome}`);
    
    setDeferredPrompt(null);
    setShowInstallPrompt(false);
  };

  const handleDismiss = () => {
    setShowInstallPrompt(false);
    localStorage.setItem('pwa-install-dismissed', 'true');
  };

  return (
    <>
      {/* Offline indicator */}
      {!isOnline && (
        <Alert className="fixed bottom-4 right-4 w-auto z-50 bg-yellow-50 border-yellow-200">
          <WifiOff className="h-4 w-4 text-yellow-600" />
          <AlertDescription className="text-yellow-800">
            Você está offline. Algumas funcionalidades podem estar limitadas.
          </AlertDescription>
        </Alert>
      )}

      {/* Update available */}
      {updateAvailable && (
        <Alert className="fixed bottom-4 right-4 w-auto z-50 bg-blue-50 border-blue-200">
          <Download className="h-4 w-4 text-blue-600" />
          <AlertDescription className="text-blue-800 flex items-center gap-2">
            Nova versão disponível!
            <Button size="sm" variant="outline" onClick={updateServiceWorker}>
              Atualizar
            </Button>
          </AlertDescription>
        </Alert>
      )}

      {/* Install prompt */}
      {showInstallPrompt && (
        <Card className="fixed bottom-4 right-4 w-80 z-50 shadow-lg">
          <CardHeader className="pb-3">
            <div className="flex items-start justify-between">
              <div>
                <CardTitle className="text-base">Instalar QIVO Mining</CardTitle>
                <CardDescription className="text-sm mt-1">
                  Acesse offline e receba notificações
                </CardDescription>
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6"
                onClick={handleDismiss}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="flex gap-2">
            <Button onClick={handleInstall} className="flex-1">
              <Download className="mr-2 h-4 w-4" />
              Instalar
            </Button>
            <Button variant="outline" onClick={handleDismiss}>
              Agora não
            </Button>
          </CardContent>
        </Card>
      )}
    </>
  );
}

