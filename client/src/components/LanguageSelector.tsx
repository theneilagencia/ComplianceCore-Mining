import { useTranslation } from '@/hooks/useTranslation';
import { Globe } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';

const languages = {
  pt: { name: 'Português', flag: '🇧🇷' },
  en: { name: 'English', flag: '🇺🇸' },
  es: { name: 'Español', flag: '🇪🇸' },
  fr: { name: 'Français', flag: '🇫🇷' },
};

export function LanguageSelector() {
  const { locale, setLocale, availableLocales } = useTranslation();

  const currentLanguage = languages[locale as keyof typeof languages];

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className="gap-2">
          <Globe className="h-4 w-4" />
          <span className="hidden sm:inline">{currentLanguage.flag} {currentLanguage.name}</span>
          <span className="sm:hidden">{currentLanguage.flag}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {availableLocales.map((lang) => (
          <DropdownMenuItem
            key={lang}
            onClick={() => setLocale(lang as 'pt' | 'en' | 'es' | 'fr')}
            className={locale === lang ? 'bg-accent' : ''}
          >
            <span className="mr-2">{languages[lang as keyof typeof languages].flag}</span>
            {languages[lang as keyof typeof languages].name}
            {locale === lang && <span className="ml-auto text-xs">✓</span>}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

