import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";

export function LanguageSwitcher({ variant = "default", className = "" }: { variant?: string; className?: string }) {
  const { t } = useTranslation();
  return (
    <div className={className}>
      <Button variant="ghost">{t ? t('common.language') : 'Lang'}</Button>
    </div>
  );
}
