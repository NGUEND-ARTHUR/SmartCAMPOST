import { ReactNode } from "react";
import { AuthProvider as BaseAuthProvider } from "../../context/AuthContext";

interface Props {
  children: ReactNode;
}

export function AuthProvider({ children }: Props) {
  return <BaseAuthProvider>{children}</BaseAuthProvider>;
}


