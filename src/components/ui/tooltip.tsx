import * as React from "react";
import { cn } from "@/lib/utils";

const TooltipProviderContext = React.createContext<{ delayDuration: number }>({ delayDuration: 300 });

interface TooltipProviderProps {
  children: React.ReactNode;
  delayDuration?: number;
}

function TooltipProvider({ children, delayDuration = 300 }: TooltipProviderProps) {
  return (
    <TooltipProviderContext.Provider value={{ delayDuration }}>
      {children}
    </TooltipProviderContext.Provider>
  );
}

interface TooltipContextValue {
  open: boolean;
  setOpen: (open: boolean) => void;
  triggerRef: React.RefObject<HTMLElement | null>;
  delayDuration: number;
}

const TooltipContext = React.createContext<TooltipContextValue | null>(null);

function useTooltip() {
  const context = React.useContext(TooltipContext);
  if (!context) throw new Error("Tooltip compound components must be used within <Tooltip>");
  return context;
}

interface TooltipProps {
  children: React.ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  delayDuration?: number;
}

function Tooltip({ children, open: controlledOpen, onOpenChange, delayDuration: propDelay }: TooltipProps) {
  const providerCtx = React.useContext(TooltipProviderContext);
  const [uncontrolledOpen, setUncontrolledOpen] = React.useState(false);
  const open = controlledOpen ?? uncontrolledOpen;
  const triggerRef = React.useRef<HTMLElement>(null);
  const delayDuration = propDelay ?? providerCtx.delayDuration;

  const setOpen = React.useCallback(
    (value: boolean) => {
      onOpenChange?.(value);
      if (controlledOpen === undefined) setUncontrolledOpen(value);
    },
    [controlledOpen, onOpenChange],
  );

  return (
    <TooltipContext.Provider value={{ open, setOpen, triggerRef, delayDuration }}>
      <div className="relative inline-flex">{children}</div>
    </TooltipContext.Provider>
  );
}

const TooltipTrigger = React.forwardRef<HTMLButtonElement, React.ButtonHTMLAttributes<HTMLButtonElement>>(
  ({ onMouseEnter, onMouseLeave, onFocus, onBlur, ...props }, ref) => {
    const ctx = useTooltip();
    const timeoutRef = React.useRef<ReturnType<typeof setTimeout>>();

    const handleEnter = React.useCallback(() => {
      timeoutRef.current = setTimeout(() => ctx.setOpen(true), ctx.delayDuration);
    }, [ctx]);

    const handleLeave = React.useCallback(() => {
      clearTimeout(timeoutRef.current);
      ctx.setOpen(false);
    }, [ctx]);

    React.useEffect(() => () => clearTimeout(timeoutRef.current), []);

    return (
      <button
        ref={(node) => {
          (ctx.triggerRef as React.MutableRefObject<HTMLElement | null>).current = node;
          if (typeof ref === "function") ref(node);
          else if (ref) (ref as React.MutableRefObject<HTMLButtonElement | null>).current = node;
        }}
        type="button"
        onMouseEnter={(e) => {
          handleEnter();
          onMouseEnter?.(e);
        }}
        onMouseLeave={(e) => {
          handleLeave();
          onMouseLeave?.(e);
        }}
        onFocus={(e) => {
          handleEnter();
          onFocus?.(e);
        }}
        onBlur={(e) => {
          handleLeave();
          onBlur?.(e);
        }}
        {...props}
      />
    );
  },
);
TooltipTrigger.displayName = "TooltipTrigger";

interface TooltipContentProps extends React.HTMLAttributes<HTMLDivElement> {
  side?: "top" | "right" | "bottom" | "left";
  sideOffset?: number;
}

const TooltipContent = React.forwardRef<HTMLDivElement, TooltipContentProps>(
  ({ className, side = "top", sideOffset = 4, ...props }, ref) => {
    const ctx = useTooltip();

    if (!ctx.open) return null;

    return (
      <div
        ref={ref}
        role="tooltip"
        className={cn(
          "absolute z-50 overflow-hidden rounded-md bg-primary px-3 py-1.5 text-xs text-primary-foreground shadow-md",
          side === "top" && "bottom-full left-1/2 -translate-x-1/2 mb-1",
          side === "bottom" && "top-full left-1/2 -translate-x-1/2 mt-1",
          side === "left" && "right-full top-1/2 -translate-y-1/2 mr-1",
          side === "right" && "left-full top-1/2 -translate-y-1/2 ml-1",
          className,
        )}
        style={{ [`margin${side === "top" ? "Bottom" : side === "bottom" ? "Top" : side === "left" ? "Right" : "Left"}`]: sideOffset }}
        {...props}
      />
    );
  },
);
TooltipContent.displayName = "TooltipContent";

export { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider };
