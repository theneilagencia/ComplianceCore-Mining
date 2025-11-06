import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

type Locale = 'pt' | 'en' | 'es' | 'fr';

interface LocaleContextValue {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  translations: Record<string, any>;
}

const LocaleContext = createContext<LocaleContextValue | undefined>(undefined);

interface LocaleProviderProps {
  children: ReactNode;
}

export function LocaleProvider({ children }: LocaleProviderProps) {
  const [locale, setLocaleState] = useState<Locale>(() => {
    // Tentar obter do localStorage
    const saved = localStorage.getItem('locale');
    if (saved && ['pt', 'en', 'es', 'fr'].includes(saved)) {
      return saved as Locale;
    }
    
    // Detectar idioma do navegador
    const browserLang = navigator.language.toLowerCase();
    if (browserLang.startsWith('pt')) return 'pt';
    if (browserLang.startsWith('es')) return 'es';
    if (browserLang.startsWith('fr')) return 'fr';
    return 'en';
  });

  const [translations, setTranslations] = useState<Record<string, any>>({});

  // Carregar traduções quando idioma mudar
  useEffect(() => {
    const loadTranslations = async () => {
      try {
        const response = await fetch(`/locales/${locale}/reports.json`);
        if (response.ok) {
          const data = await response.json();
          setTranslations((prev) => ({
            ...prev,
            [locale]: data,
          }));
        }
      } catch (error) {
        console.error(`Failed to load translations for ${locale}:`, error);
      }
    };

    if (!translations[locale]) {
      loadTranslations();
    }
  }, [locale]);

  const setLocale = (newLocale: Locale) => {
    setLocaleState(newLocale);
    localStorage.setItem('locale', newLocale);
    // Atualizar atributo html lang
    document.documentElement.lang = newLocale;
  };

  // Inicializar html lang
  useEffect(() => {
    document.documentElement.lang = locale;
  }, []);

  return (
    <LocaleContext.Provider value={{ locale, setLocale, translations }}>
      {children}
    </LocaleContext.Provider>
  );
}

export function useLocale() {
  const context = useContext(LocaleContext);
  if (!context) {
    throw new Error('useLocale must be used within LocaleProvider');
  }
  return context;
}

export { LocaleContext };
