import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Languages } from 'lucide-react';

const languages = {
  en: { nativeName: 'English' },
  fr: { nativeName: 'Français' },
  ar: { nativeName: 'العربية' },
};

export function LanguageSwitcher() {
  const { i18n } = useTranslation();

  const changeLanguage = (lng: string) => {
    i18n.changeLanguage(lng);
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="text-primary hover:bg-primary/10">
          <Languages className="h-5 w-5" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent 
        align="end" 
        className="bg-card border border-border shadow-lg rounded-md p-1 min-w-[120px]"
      >
        {Object.entries(languages).map(([code, { nativeName }]) => (
          <DropdownMenuItem
            key={code}
            onClick={() => changeLanguage(code)}
            className={`cursor-pointer px-3 py-2 rounded-sm transition-colors ${
              code === i18n.language
                ? 'bg-primary/10 text-primary font-medium'
                : 'text-foreground hover:bg-accent hover:text-accent-foreground'
            }`}
          >
            {nativeName}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}