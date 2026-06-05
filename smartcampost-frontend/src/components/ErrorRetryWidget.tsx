import React from 'react';

type Props = {
  message?: string;
  onRetry?: () => void;
};

export const ErrorRetryWidget: React.FC<Props> = ({ message = 'Une erreur est survenue', onRetry }) => {
  return (
    <div style={{ padding: 12, textAlign: 'center' }}>
      <p>{message}</p>
      {onRetry ? (
        <button onClick={onRetry} style={{ padding: '6px 12px', borderRadius: 6 }}>
          Réessayer
        </button>
      ) : null}
    </div>
  );
};

export default ErrorRetryWidget;
