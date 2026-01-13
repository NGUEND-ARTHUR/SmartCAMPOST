import * as React from "react";

export const EmptyState = ({
  icon: Icon,
  title,
  description,
  actionLabel,
  onAction,
}: any) => {
  return (
    <div className="text-center py-12">
      {Icon && (
        <Icon className="w-12 h-12 mx-auto mb-4 text-muted-foreground/50" />
      )}
      <h3 className="text-lg font-semibold">{title}</h3>
      <p className="text-sm text-muted-foreground mt-2">{description}</p>
      {actionLabel && (
        <div className="mt-4">
          <button onClick={onAction} className="text-blue-600 hover:underline">
            {actionLabel}
          </button>
        </div>
      )}
    </div>
  );
};

export default EmptyState;
