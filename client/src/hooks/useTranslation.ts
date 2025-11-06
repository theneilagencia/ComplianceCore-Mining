import { useLocale } from '@/contexts/LocaleContext';

interface TranslationFunction {
  (key: string, params?: Record<string, string | number>): string;
}

export function useTranslation(namespace: string = 'reports'): {
  t: TranslationFunction;
  locale: string;
  setLocale: (locale: 'pt' | 'en' | 'es' | 'fr') => void;
  availableLocales: string[];
} {
  const { locale, setLocale, translations } = useLocale();

  const t: TranslationFunction = (key, params) => {
    const keys = key.split('.');
    let value: any = translations[locale]?.[namespace];
    
    // Navegar pela estrutura de objetos
    for (const k of keys) {
      value = value?.[k];
    }
    
    // Se não encontrar tradução, retornar a chave
    if (!value) {
      console.warn(`Translation missing: ${namespace}.${key} (${locale})`);
      return key;
    }
    
    // Se não for string, retornar a chave
    if (typeof value !== 'string') {
      console.warn(`Translation is not a string: ${namespace}.${key} (${locale})`);
      return key;
    }
    
    // Interpolação de parâmetros {{param}}
    if (params) {
      return value.replace(/\{\{(\w+)\}\}/g, (_, param) => {
        return String(params[param] ?? `{{${param}}}`);
      });
    }
    
    return value;
  };

  return {
    t,
    locale,
    setLocale,
    availableLocales: ['pt', 'en', 'es', 'fr'],
  };
}
