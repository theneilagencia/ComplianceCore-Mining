/**
 * Email Verification Page
 * Handles email verification after user clicks link in email
 */

import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { CheckCircle, XCircle, Loader2 } from 'lucide-react';

export default function VerifyEmail() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('');

  useEffect(() => {
    const token = searchParams.get('token');

    if (!token) {
      setStatus('error');
      setMessage('Token de verificação não encontrado');
      return;
    }

    verifyEmail(token);
  }, [searchParams]);

  async function verifyEmail(token: string) {
    try {
      const response = await fetch('/api/auth/verify-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setStatus('success');
        setMessage('Email verificado com sucesso!');
        
        // Redirect to dashboard after 3 seconds
        setTimeout(() => {
          navigate('/dashboard');
        }, 3000);
      } else {
        setStatus('error');
        setMessage(data.error || 'Falha ao verificar email');
      }
    } catch (error) {
      setStatus('error');
      setMessage('Erro ao verificar email. Por favor, tente novamente.');
    }
  }

  async function resendVerification() {
    try {
      const response = await fetch('/api/auth/resend-verification', {
        method: 'POST',
        credentials: 'include',
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setMessage('Email de verificação reenviado! Verifique sua caixa de entrada.');
      } else {
        setMessage(data.error || 'Falha ao reenviar email');
      }
    } catch (error) {
      setMessage('Erro ao reenviar email. Por favor, tente novamente.');
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/10 to-secondary/10 p-4">
      <div className="max-w-md w-full bg-card rounded-lg shadow-lg p-8">
        <div className="text-center">
          {status === 'loading' && (
            <>
              <Loader2 className="w-16 h-16 mx-auto text-primary animate-spin mb-4" />
              <h1 className="text-2xl font-bold mb-2">Verificando Email</h1>
              <p className="text-muted-foreground">
                Por favor, aguarde enquanto verificamos seu email...
              </p>
            </>
          )}

          {status === 'success' && (
            <>
              <CheckCircle className="w-16 h-16 mx-auto text-green-500 mb-4" />
              <h1 className="text-2xl font-bold mb-2 text-green-600">
                Email Verificado!
              </h1>
              <p className="text-muted-foreground mb-4">{message}</p>
              <p className="text-sm text-muted-foreground">
                Redirecionando para o dashboard...
              </p>
            </>
          )}

          {status === 'error' && (
            <>
              <XCircle className="w-16 h-16 mx-auto text-red-500 mb-4" />
              <h1 className="text-2xl font-bold mb-2 text-red-600">
                Erro na Verificação
              </h1>
              <p className="text-muted-foreground mb-6">{message}</p>
              
              <div className="space-y-3">
                <button
                  onClick={resendVerification}
                  className="w-full px-4 py-2 bg-primary text-white rounded-md hover:bg-primary/90 transition"
                >
                  Reenviar Email de Verificação
                </button>
                
                <button
                  onClick={() => navigate('/login')}
                  className="w-full px-4 py-2 bg-secondary text-white rounded-md hover:bg-secondary/90 transition"
                >
                  Voltar para Login
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
