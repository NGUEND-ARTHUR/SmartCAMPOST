import { useTranslation } from "react-i18next";
import { useState, useRef, useEffect } from "react";
import { Globe } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/store/authStore";
import { useUpdatePreferredLanguage } from "@/hooks/users/useClients";

interface LanguageSwitcherProps {
  variant?: "default" | "compact" | "full" | "toggle";
  className?: string;
}

export function LanguageSwitcher({
  variant = "default",
  className = "",
}: LanguageSwitcherProps) {
  const { i18n, t } = useTranslation();
  const { isAuthenticated, user } = useAuthStore();
  const updatePreferredLanguage = useUpdatePreferredLanguage();
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const languages = [
    { code: "fr", label: t("common.french"), flag: "🇫🇷" },
    { code: "en", label: t("common.english"), flag: "🇬🇧" },
  ];

  const currentLang =
    languages.find((l) => l.code === i18n.language) || languages[0];

  const changeLanguage = (langCode: string) => {
    i18n.changeLanguage(langCode);
    localStorage.setItem("i18nextLng", langCode);
    if (isAuthenticated && user?.role === "CLIENT") {
      updatePreferredLanguage.mutate(
        { language: langCode },
        {
          onError: () => {
            // Optional profile persistence; ignore failures
          },
        },
      );
    }
    setOpen(false);
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Toggle variant - simple FR | EN buttons
  if (variant === "toggle") {
    return (
      <div
        className={cn(
          "flex items-center gap-1 rounded-lg bg-muted p-1",
          className,
        )}
      >
        {languages.map((lang) => (
          <button
            key={lang.code}
            onClick={() => changeLanguage(lang.code)}
            className={cn(
              "px-3 py-1 text-sm font-medium rounded-md transition-colors",
              i18n.language === lang.code
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            {lang.code.toUpperCase()}
          </button>
        ))}
      </div>
    );
  }

  // Full variant - language selection with label (for registration)
  if (variant === "full") {
    return (
      <div className={cn("flex flex-col gap-2", className)}>
        <label className="text-sm font-medium">
          {t("auth.preferredLanguage")}
        </label>
        <div className="flex gap-2">
          {languages.map((lang) => (
            <Button
              key={lang.code}
              type="button"
              variant={i18n.language === lang.code ? "default" : "outline"}
              onClick={() => changeLanguage(lang.code)}
              className="flex-1"
            >
              <span className="mr-2">{lang.flag}</span>
              {lang.label}
            </Button>
          ))}
        </div>
      </div>
    );
  }

  // Compact variant - just globe icon with dropdown
  if (variant === "compact") {
    return (
      <div ref={dropdownRef} className="relative">
        <Button
          variant="ghost"
          size="icon"
          className={className}
          onClick={() => setOpen(!open)}
        >
          <Globe className="h-4 w-4" />
        </Button>
        {open && (
          <div className="absolute right-0 mt-2 w-40 rounded-md border bg-popover shadow-lg z-50">
            {languages.map((lang) => (
              <button
                key={lang.code}
                onClick={() => changeLanguage(lang.code)}
                className={cn(
                  "w-full px-3 py-2 text-left text-sm hover:bg-accent flex items-center gap-2",
                  i18n.language === lang.code && "bg-accent",
                )}
              >
                <span>{lang.flag}</span>
                {lang.label}
              </button>
            ))}
          </div>
        )}
      </div>
    );
  }

  // Default variant - globe + flag + label with dropdown
  return (
    <div ref={dropdownRef} className="relative">
      <Button
        variant="outline"
        size="sm"
        className={className}
        onClick={() => setOpen(!open)}
      >
        <Globe className="h-4 w-4 mr-2" />
        <span className="mr-1">{currentLang.flag}</span>
        {currentLang.label}
      </Button>
      {open && (
        <div className="absolute right-0 mt-2 w-40 rounded-md border bg-popover shadow-lg z-50">
          {languages.map((lang) => (
            <button
              key={lang.code}
              onClick={() => changeLanguage(lang.code)}
              className={cn(
                "w-full px-3 py-2 text-left text-sm hover:bg-accent flex items-center gap-2",
                i18n.language === lang.code && "bg-accent",
              )}
            >
              <span>{lang.flag}</span>
              {lang.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
