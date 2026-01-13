import * as React from "react";

type AnyProps = React.PropsWithChildren<Record<string, any>>;

export const Dialog: React.FC<AnyProps> = (props) => {
  // Render children directly; accept props like `open` and `onOpenChange` optionally
  return <div {...(props as any)}>{props.children}</div>;
};

export const DialogContent: React.FC<AnyProps> = ({ children, ...rest }) => {
  return (
    <div
      {...(rest as any)}
      className={`bg-white p-4 rounded shadow ${(rest as any).className || ""}`}
    >
      {children}
    </div>
  );
};

export const DialogHeader: React.FC<AnyProps> = ({ children, ...rest }) => (
  <div
    {...(rest as any)}
    className={`mb-2 font-semibold ${(rest as any).className || ""}`}
  >
    {children}
  </div>
);

export const DialogTitle: React.FC<AnyProps> = ({ children, ...rest }) => (
  <h3
    {...(rest as any)}
    className={`text-lg font-medium ${(rest as any).className || ""}`}
  >
    {children}
  </h3>
);

export const DialogDescription: React.FC<AnyProps> = ({
  children,
  ...rest
}) => (
  <p
    {...(rest as any)}
    className={`text-sm text-gray-600 ${(rest as any).className || ""}`}
  >
    {children}
  </p>
);

export const DialogFooter: React.FC<AnyProps> = ({ children, ...rest }) => (
  <div
    {...(rest as any)}
    className={`mt-4 flex justify-end ${(rest as any).className || ""}`}
  >
    {children}
  </div>
);

export const DialogTrigger: React.FC<AnyProps> = ({ children, ...rest }) => (
  <span {...(rest as any)}>{children}</span>
);

export default Dialog;
