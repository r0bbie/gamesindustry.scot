import * as React from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

interface SheetContextValue {
  open: boolean;
  setOpen: React.Dispatch<React.SetStateAction<boolean>>;
}

const SheetContext = React.createContext<SheetContextValue | null>(null);

function useSheet() {
  const context = React.useContext(SheetContext);
  if (!context) throw new Error("Sheet compound components must be used within <Sheet>");
  return context;
}

interface SheetProps {
  children: React.ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

function Sheet({ children, open: controlledOpen, onOpenChange }: SheetProps) {
  const [uncontrolledOpen, setUncontrolledOpen] = React.useState(false);
  const open = controlledOpen ?? uncontrolledOpen;

  const setOpen = React.useCallback(
    (value: React.SetStateAction<boolean>) => {
      const next = typeof value === "function" ? value(open) : value;
      onOpenChange?.(next);
      if (controlledOpen === undefined) setUncontrolledOpen(next);
    },
    [open, controlledOpen, onOpenChange],
  );

  return <SheetContext.Provider value={{ open, setOpen }}>{children}</SheetContext.Provider>;
}

const SheetTrigger = React.forwardRef<
  HTMLButtonElement,
  React.ButtonHTMLAttributes<HTMLButtonElement>
>(({ onClick, ...props }, ref) => {
  const ctx = useSheet();
  return (
    <button
      ref={ref}
      type="button"
      onClick={(e) => {
        ctx.setOpen(true);
        onClick?.(e);
      }}
      {...props}
    />
  );
});
SheetTrigger.displayName = "SheetTrigger";

interface SheetContentProps extends React.HTMLAttributes<HTMLDivElement> {
  side?: "top" | "right" | "bottom" | "left";
}

const sheetVariants: Record<string, string> = {
  top: "inset-x-0 top-0 border-b",
  right: "inset-y-0 right-0 h-full w-3/4 max-w-sm border-l",
  bottom: "inset-x-0 bottom-0 border-t",
  left: "inset-y-0 left-0 h-full w-3/4 max-w-sm border-r",
};

const SheetContent = React.forwardRef<HTMLDivElement, SheetContentProps>(
  ({ className, side = "right", children, ...props }, ref) => {
    const ctx = useSheet();

    React.useEffect(() => {
      if (!ctx.open) return;

      const prev = document.body.style.overflow;
      document.body.style.overflow = "hidden";

      function handleEscape(e: KeyboardEvent) {
        if (e.key === "Escape") ctx.setOpen(false);
      }
      document.addEventListener("keydown", handleEscape);

      return () => {
        document.body.style.overflow = prev;
        document.removeEventListener("keydown", handleEscape);
      };
    }, [ctx.open, ctx]);

    if (!ctx.open) return null;

    return createPortal(
      <div className="fixed inset-0 z-50">
        <div
          className="fixed inset-0 bg-black/80"
          onClick={() => ctx.setOpen(false)}
          aria-hidden="true"
        />
        <div
          ref={ref}
          role="dialog"
          aria-modal="true"
          className={cn(
            "fixed z-50 gap-4 bg-background p-6 shadow-lg transition-transform duration-300",
            sheetVariants[side],
            className,
          )}
          {...props}
        >
          {children}
          <button
            type="button"
            onClick={() => ctx.setOpen(false)}
            className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
          >
            <X className="h-4 w-4" />
            <span className="sr-only">Close</span>
          </button>
        </div>
      </div>,
      document.body,
    );
  },
);
SheetContent.displayName = "SheetContent";

function SheetHeader({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("flex flex-col space-y-2 text-center sm:text-left", className)} {...props} />;
}

const SheetTitle = React.forwardRef<HTMLHeadingElement, React.HTMLAttributes<HTMLHeadingElement>>(
  ({ className, ...props }, ref) => (
    <h2 ref={ref} className={cn("text-lg font-semibold text-foreground", className)} {...props} />
  ),
);
SheetTitle.displayName = "SheetTitle";

const SheetClose = React.forwardRef<
  HTMLButtonElement,
  React.ButtonHTMLAttributes<HTMLButtonElement>
>(({ onClick, ...props }, ref) => {
  const ctx = useSheet();
  return (
    <button
      ref={ref}
      type="button"
      onClick={(e) => {
        ctx.setOpen(false);
        onClick?.(e);
      }}
      {...props}
    />
  );
});
SheetClose.displayName = "SheetClose";

export { Sheet, SheetTrigger, SheetContent, SheetHeader, SheetTitle, SheetClose };
