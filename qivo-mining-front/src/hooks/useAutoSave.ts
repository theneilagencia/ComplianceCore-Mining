import { useEffect, useRef, useCallback } from 'react';
import { useApi } from './useApi';
import { toast } from 'sonner';

interface UseAutoSaveOptions {
  key: string;
  data: any;
  enabled?: boolean;
  interval?: number; // em milissegundos
  onSave?: (data: any) => Promise<void>;
}

export function useAutoSave({
  key,
  data,
  enabled = true,
  interval = 30000, // 30 segundos por padrão
  onSave,
}: UseAutoSaveOptions) {
  const { apiFetch } = useApi();
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const lastSavedRef = useRef<string>('');
  const isSavingRef = useRef(false);

  // Salvar no localStorage
  const saveToLocalStorage = useCallback(() => {
    try {
      const dataString = JSON.stringify(data);
      localStorage.setItem(`autosave_${key}`, dataString);
      localStorage.setItem(`autosave_${key}_timestamp`, new Date().toISOString());
    } catch (error) {
      console.error('Erro ao salvar no localStorage:', error);
    }
  }, [key, data]);

  // Carregar do localStorage
  const loadFromLocalStorage = useCallback((): any | null => {
    try {
      const saved = localStorage.getItem(`autosave_${key}`);
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (error) {
      console.error('Erro ao carregar do localStorage:', error);
    }
    return null;
  }, [key]);

  // Limpar localStorage
  const clearLocalStorage = useCallback(() => {
    try {
      localStorage.removeItem(`autosave_${key}`);
      localStorage.removeItem(`autosave_${key}_timestamp`);
    } catch (error) {
      console.error('Erro ao limpar localStorage:', error);
    }
  }, [key]);

  // Salvar no servidor
  const saveToServer = useCallback(async () => {
    if (isSavingRef.current) return;

    const dataString = JSON.stringify(data);
    
    // Não salvar se os dados não mudaram
    if (dataString === lastSavedRef.current) return;

    try {
      isSavingRef.current = true;

      if (onSave) {
        await onSave(data);
      }

      lastSavedRef.current = dataString;
      
      // Mostrar toast discreto de sucesso
      toast.success('Relatório salvo automaticamente', {
        duration: 2000,
        position: 'bottom-right',
      });
    } catch (error: any) {
      console.error('Erro ao salvar no servidor:', error);
      toast.error('Erro ao salvar automaticamente', {
        description: 'Os dados foram salvos localmente',
        duration: 3000,
      });
    } finally {
      isSavingRef.current = false;
    }
  }, [data, onSave]);

  // Auto-save effect
  useEffect(() => {
    if (!enabled) return;

    // Salvar no localStorage imediatamente
    saveToLocalStorage();

    // Configurar timer para salvar no servidor
    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }

    timerRef.current = setTimeout(() => {
      saveToServer();
    }, interval);

    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, [data, enabled, interval, saveToLocalStorage, saveToServer]);

  // Salvar manualmente
  const saveNow = useCallback(async () => {
    saveToLocalStorage();
    await saveToServer();
  }, [saveToLocalStorage, saveToServer]);

  return {
    saveNow,
    loadFromLocalStorage,
    clearLocalStorage,
    isSaving: isSavingRef.current,
  };
}

