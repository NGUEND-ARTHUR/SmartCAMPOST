import { useState, useCallback } from "react";
import {
  verifyQrCodeContent,
  QrVerificationResponse,
  parseSecureQrPayload,
  isSecureQrCode,
  isForgeryAttempt,
  getVerificationStatusMessage,
} from "@/services/scan/qrVerification.api";

interface UseQrVerificationState {
  isVerifying: boolean;
  result: QrVerificationResponse | null;
  error: string | null;
  isForgery: boolean;
}

interface UseQrVerificationReturn extends UseQrVerificationState {
  verifyQr: (qrContent: string) => Promise<QrVerificationResponse | null>;
  reset: () => void;
  getStatusMessage: () => string;
}

/**
 * Hook for verifying QR codes with anti-forgery protection
 */
export function useQrVerification(): UseQrVerificationReturn {
  const [state, setState] = useState<UseQrVerificationState>({
    isVerifying: false,
    result: null,
    error: null,
    isForgery: false,
  });

  const verifyQr = useCallback(
    async (qrContent: string): Promise<QrVerificationResponse | null> => {
      if (!qrContent) {
        setState((prev) => ({
          ...prev,
          error: "Contenu du QR code vide",
          result: null,
        }));
        return null;
      }

      setState((prev) => ({
        ...prev,
        isVerifying: true,
        error: null,
        result: null,
        isForgery: false,
      }));

      try {
        // Check if this is a secure QR code format
        if (!isSecureQrCode(qrContent)) {
          // Legacy QR code - might be just a tracking reference
          // We can still try to verify, but warn about potential issues
          console.warn(
            "Legacy QR code format detected. Consider upgrading to secure format.",
          );
        }

        // Parse the payload for local validation
        const payload = parseSecureQrPayload(qrContent);
        if (!payload && isSecureQrCode(qrContent)) {
          setState((prev) => ({
            ...prev,
            isVerifying: false,
            error: "Format de QR code invalide",
            isForgery: true,
          }));
          return null;
        }

        // Server-side verification (the real anti-forgery check)
        const response = await verifyQrCodeContent(qrContent);

        const forgeryDetected = isForgeryAttempt(response);

        setState({
          isVerifying: false,
          result: response,
          error: response.valid ? null : response.message,
          isForgery: forgeryDetected,
        });

        // Log forgery attempts for security monitoring
        if (forgeryDetected) {
          console.error("⚠️ QR Code forgery attempt detected!", {
            status: response.status,
            message: response.message,
            riskLevel: response.riskLevel,
          });
        }

        return response;
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Erreur de vérification";

        setState({
          isVerifying: false,
          result: null,
          error: errorMessage,
          isForgery: false,
        });

        return null;
      }
    },
    [],
  );

  const reset = useCallback(() => {
    setState({
      isVerifying: false,
      result: null,
      error: null,
      isForgery: false,
    });
  }, []);

  const getStatusMessage = useCallback((): string => {
    if (state.error) return state.error;
    if (state.result) {
      return getVerificationStatusMessage(state.result.status);
    }
    return "";
  }, [state.error, state.result]);

  return {
    ...state,
    verifyQr,
    reset,
    getStatusMessage,
  };
}

export default useQrVerification;
