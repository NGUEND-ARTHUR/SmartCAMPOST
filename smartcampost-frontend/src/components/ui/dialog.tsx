import * as React from "react";
import { createPortal } from "react-dom";

import { cn } from "@/lib/utils";

type OpenChangeHandler = (open: boolean) => void;

type DialogContextValue = {
  open: boolean;
  setOpen: OpenChangeHandler;
};

const DialogContext = React.createContext<DialogContextValue | null>(null);

function useDialogContext(componentName: string) {
  const ctx = React.useContext(DialogContext);
  if (!ctx) {
    throw new Error(`${componentName} must be used within <Dialog>`);
  }
  return ctx;
}

type DialogProps = React.PropsWithChildren<{
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: OpenChangeHandler;
}>;

export function Dialog({
  children,
  open: openProp,
  defaultOpen,
  onOpenChange,
}: DialogProps) {
  const [uncontrolledOpen, setUncontrolledOpen] = React.useState(
    defaultOpen ?? false,
  );

  const isControlled = openProp !== undefined;
  const open = isControlled ? Boolean(openProp) : uncontrolledOpen;

  const setOpen = React.useCallback<OpenChangeHandler>(
    (nextOpen) => {
      if (!isControlled) {
        setUncontrolledOpen(nextOpen);
      }
      onOpenChange?.(nextOpen);
    },
    [isControlled, onOpenChange],
  );

  return (
    <DialogContext.Provider value={{ open, setOpen }}>
      {children}
    </DialogContext.Provider>
  );
}

type DialogTriggerProps = React.PropsWithChildren<{
  asChild?: boolean;
  className?: string;
}> &
  Omit<React.HTMLAttributes<HTMLElement>, "children">;

export function DialogTrigger({
  children,
  asChild,
  className,
  ...rest
}: DialogTriggerProps) {
  const { setOpen } = useDialogContext("DialogTrigger");

  const triggerProps = {
    ...rest,
    className,
    onClick: (e: React.MouseEvent<HTMLElement>) => {
      (rest.onClick as ((evt: React.MouseEvent<HTMLElement>) => void) | undefined)?.(
        e,
      );
      if (!e.defaultPrevented) setOpen(true);
    },
  };

  if (asChild && React.isValidElement(children)) {
    const child = children as React.ReactElement<Record<string, unknown>>;
    const existingOnClick = child.props.onClick as
      | ((evt: React.MouseEvent<HTMLElement>) => void)
      | undefined;

    return React.cloneElement(child, {
      ...triggerProps,
      onClick: (e: React.MouseEvent<HTMLElement>) => {
        existingOnClick?.(e);
        triggerProps.onClick(e);
      },
      className: cn(child.props.className as string | undefined, className),
    });
  }

  return (
    <span role="button" tabIndex={0} {...triggerProps}>
      {children}
    </span>
  );
}

type DialogContentProps = React.PropsWithChildren<{
  className?: string;
  onEscapeKeyDown?: () => void;
  onPointerDownOutside?: () => void;
}> &
  Omit<React.HTMLAttributes<HTMLDivElement>, "children">;

export function DialogContent({
  children,
  className,
  onEscapeKeyDown,
  onPointerDownOutside,
  ...rest
}: DialogContentProps) {
  const { open, setOpen } = useDialogContext("DialogContent");
  const contentRef = React.useRef<HTMLDivElement | null>(null);

  React.useEffect(() => {
    if (!open) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onEscapeKeyDown?.();
        setOpen(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [open, onEscapeKeyDown, setOpen]);

  React.useEffect(() => {
    if (!open) return;
    // Focus the content container for basic accessibility
    contentRef.current?.focus();
  }, [open]);

  if (!open) return null;
  if (typeof document === "undefined") return null;

  return createPortal(
    <div className="fixed inset-0 z-50">
      <div
        className="fixed inset-0 bg-black/50"
        onMouseDown={() => {
          onPointerDownOutside?.();
          setOpen(false);
        }}
      />
      <div
        role="dialog"
        aria-modal="true"
        tabIndex={-1}
        ref={contentRef}
        className={cn(
          "fixed left-1/2 top-1/2 z-50 w-[calc(100%-2rem)] -translate-x-1/2 -translate-y-1/2 rounded-lg border bg-background p-6 text-foreground shadow-lg outline-none sm:w-full",
          className,
        )}
        onMouseDown={(e) => e.stopPropagation()}
        {...rest}
      >
        {children}
      </div>
    </div>,
    document.body,
  );
}

type SectionProps = React.PropsWithChildren<{ className?: string }> &
  Omit<React.HTMLAttributes<HTMLDivElement>, "children">;

export function DialogHeader({ children, className, ...rest }: SectionProps) {
  return (
    <div
      className={cn("flex flex-col space-y-1.5 text-center sm:text-left", className)}
      {...rest}
    >
      {children}
    </div>
  );
}

export function DialogFooter({ children, className, ...rest }: SectionProps) {
  return (
    <div
      className={cn(
        "flex flex-col-reverse gap-2 sm:flex-row sm:justify-end",
        className,
      )}
      {...rest}
    >
      {children}
    </div>
  );
}

type DialogTitleProps = React.PropsWithChildren<{ className?: string }> &
  Omit<React.HTMLAttributes<HTMLHeadingElement>, "children">;

export function DialogTitle({ children, className, ...rest }: DialogTitleProps) {
  return (
    <h2
      className={cn("text-lg font-semibold leading-none tracking-tight", className)}
      {...rest}
    >
      {children}
    </h2>
  );
}

type DialogDescriptionProps = React.PropsWithChildren<{ className?: string }> &
  Omit<React.HTMLAttributes<HTMLParagraphElement>, "children">;

export function DialogDescription({
  children,
  className,
  ...rest
}: DialogDescriptionProps) {
  return (
    <p className={cn("text-sm text-muted-foreground", className)} {...rest}>
      {children}
    </p>
  );
}

export default Dialog;
