import React from "react";

export const LoadingIndicator: React.FC<{ size?: number }> = ({
  size = 24,
}) => {
  const style: React.CSSProperties = {
    width: size,
    height: size,
    borderRadius: "50%",
    border: "3px solid rgba(0,0,0,0.1)",
    borderTop: "3px solid rgba(0,0,0,0.6)",
    animation: "spin 1s linear infinite",
  };

  return (
    <div style={{ display: "inline-block" }} aria-label="loading">
      <div style={style} />
      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </div>
  );
};

export default LoadingIndicator;
