import { Toaster } from "sonner";
import { useTheme } from "@/theme/theme";

export function ThemedToaster() {
  const { resolvedTheme } = useTheme();
  return <Toaster theme={resolvedTheme} />;
}
