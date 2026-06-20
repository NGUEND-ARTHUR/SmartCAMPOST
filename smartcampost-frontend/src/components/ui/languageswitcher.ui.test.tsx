import { describe, expect, it, beforeEach } from "vitest";
import type { ReactElement } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import "@/i18n";
import i18n from "@/i18n";
import { LanguageSwitcher } from "@/components/ui/languageswitcher";

function renderWithProviders(ui: ReactElement) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });

  return render(
    <QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>,
  );
}

describe("LanguageSwitcher", () => {
  beforeEach(async () => {
    localStorage.clear();
    await i18n.changeLanguage("fr");
  });

  it("changes language and persists the selected locale", async () => {
    const user = userEvent.setup();
    renderWithProviders(<LanguageSwitcher variant="default" />);

    await user.click(screen.getByRole("button", { name: /langue/i }));
    await user.click(screen.getByRole("button", { name: /english/i }));

    expect(i18n.resolvedLanguage).toBe("en");
    expect(localStorage.getItem("i18nextLng")).toBe("en");
    expect(document.documentElement.lang).toBe("en");
    expect(
      screen.getByRole("button", { name: /language/i }),
    ).toHaveTextContent("English");
  });
});
