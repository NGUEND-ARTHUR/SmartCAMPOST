import React from "react";
import { useTranslation } from "react-i18next";

type Props = {
  message?: string;
  onRetry?: () => void;
};

export const ErrorRetryWidget: React.FC<Props> = ({
  message,
  onRetry,
}) => {
  const { t } = useTranslation();
  const displayMessage = message ?? t("common.errorOccurred");

  return (
    <div style={{ padding: 12, textAlign: "center" }}>
      <p>{displayMessage}</p>
      {onRetry ? (
        <button
          onClick={onRetry}
          style={{ padding: "6px 12px", borderRadius: 6 }}
        >
          {t("common.tryAgain")}
        </button>
      ) : null}
    </div>
  );
};

export default ErrorRetryWidget;
