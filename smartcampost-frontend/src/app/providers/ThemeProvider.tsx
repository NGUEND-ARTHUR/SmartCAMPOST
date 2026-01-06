import { ReactNode } from "react";

interface Props {
  children: ReactNode;
}

// Placeholder theme provider (extend with real theming later if needed)
export function ThemeProvider({ children }: Props) {
  return <>{children}</>;
}


