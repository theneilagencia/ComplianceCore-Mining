import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

// Traduções
import ptBR from './locales/pt-BR.json';
import enUS from './locales/en-US.json';
import esES from './locales/es-ES.json';
import frFR from './locales/fr-FR.json';

i18n
  .use(LanguageDetector) // Detecta idioma do navegador
  .use(initReactI18next) // Passa i18n para react-i18next
  .init({
    resources: {
      'pt-BR': { translation: ptBR },
      'en-US': { translation: enUS },
      'es-ES': { translation: esES },
      'fr-FR': { translation: frFR },
    },
    fallbackLng: 'pt-BR', // Idioma padrão
    lng: 'pt-BR', // Idioma inicial
    interpolation: {
      escapeValue: false, // React já faz escape
    },
    detection: {
      order: ['localStorage', 'navigator'], // Prioridade de detecção
      caches: ['localStorage'], // Persistir no localStorage
    },
  });

export default i18n;

