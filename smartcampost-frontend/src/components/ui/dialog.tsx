import * as React from "react";

type AnyProps = React.PropsWithChildren<Record<string, unknown>>;

export const Dialog: React.FC<AnyProps> = (props) => {
  // Render children directly; accept props like `open` and `onOpenChange` optionally
  return <div {...props}>{props.children}</div>;
};

export const DialogContent: React.FC<AnyProps> = ({ children, ...rest }) => {
  return (
    <div
      {...rest}
      className={`bg-white p-4 rounded shadow ${(rest as { className?: string }).className || ""}`}
    >
      {children}
    </div>
  );
};

export const DialogHeader: React.FC<AnyProps> = ({ children, ...rest }) => (
  <div
    {...rest}
    className={`mb-2 font-semibold ${(rest as { className?: string }).className || ""}`}
  >
    {children}
  </div>
);

export const DialogTitle: React.FC<AnyProps> = ({ children, ...rest }) => (
  <h3
    {...rest}
    className={`text-lg font-medium ${(rest as { className?: string }).className || ""}`}
  >
    {children}
  </h3>
);

export const DialogDescription: React.FC<AnyProps> = ({
  children,
  ...rest
}) => (
  <p
    {...rest}
    className={`text-sm text-muted-foreground ${(rest as { className?: string }).className || ""}`}
  >
    {children}
  </p>
);

export const DialogFooter: React.FC<AnyProps> = ({ children, ...rest }) => (
  <div
    {...rest}
    className={`mt-4 flex justify-end ${(rest as { className?: string }).className || ""}`}
  >
    {children}
  </div>
);

export const DialogTrigger: React.FC<AnyProps> = ({ children, ...rest }) => (
  <span {...rest}>{children}</span>
);

export default Dialog;
