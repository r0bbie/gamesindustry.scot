import * as React from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

interface AccordionContextValue {
  expandedItems: Set<string>;
  toggle: (value: string) => void;
}

const AccordionContext = React.createContext<AccordionContextValue | null>(null);

function useAccordion() {
  const context = React.useContext(AccordionContext);
  if (!context) throw new Error("Accordion compound components must be used within <Accordion>");
  return context;
}

interface AccordionProps extends React.HTMLAttributes<HTMLDivElement> {
  type?: "single" | "multiple";
  defaultValue?: string | string[];
  collapsible?: boolean;
}

const Accordion = React.forwardRef<HTMLDivElement, AccordionProps>(
  ({ type = "single", defaultValue, collapsible = true, className, children, ...props }, ref) => {
    const [expandedItems, setExpandedItems] = React.useState<Set<string>>(() => {
      if (!defaultValue) return new Set();
      return new Set(Array.isArray(defaultValue) ? defaultValue : [defaultValue]);
    });

    const toggle = React.useCallback(
      (value: string) => {
        setExpandedItems((prev) => {
          const next = new Set(prev);
          if (next.has(value)) {
            if (collapsible || type === "multiple") next.delete(value);
          } else {
            if (type === "single") next.clear();
            next.add(value);
          }
          return next;
        });
      },
      [type, collapsible],
    );

    return (
      <AccordionContext.Provider value={{ expandedItems, toggle }}>
        <div ref={ref} className={cn("w-full", className)} {...props}>
          {children}
        </div>
      </AccordionContext.Provider>
    );
  },
);
Accordion.displayName = "Accordion";

const AccordionItemContext = React.createContext<string>("");

interface AccordionItemProps extends React.HTMLAttributes<HTMLDivElement> {
  value: string;
}

const AccordionItem = React.forwardRef<HTMLDivElement, AccordionItemProps>(
  ({ value, className, ...props }, ref) => (
    <AccordionItemContext.Provider value={value}>
      <div ref={ref} className={cn("border-b border-border", className)} {...props} />
    </AccordionItemContext.Provider>
  ),
);
AccordionItem.displayName = "AccordionItem";

const AccordionTrigger = React.forwardRef<
  HTMLButtonElement,
  React.ButtonHTMLAttributes<HTMLButtonElement>
>(({ className, children, ...props }, ref) => {
  const ctx = useAccordion();
  const value = React.useContext(AccordionItemContext);
  const isExpanded = ctx.expandedItems.has(value);

  return (
    <h3 className="flex">
      <button
        ref={ref}
        type="button"
        aria-expanded={isExpanded}
        onClick={() => ctx.toggle(value)}
        className={cn(
          "flex flex-1 items-center justify-between py-4 text-sm font-medium transition-all hover:underline [&[data-state=open]>svg]:rotate-180",
          className,
        )}
        data-state={isExpanded ? "open" : "closed"}
        {...props}
      >
        {children}
        <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground transition-transform duration-200" />
      </button>
    </h3>
  );
});
AccordionTrigger.displayName = "AccordionTrigger";

const AccordionContent = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, children, ...props }, ref) => {
    const ctx = useAccordion();
    const value = React.useContext(AccordionItemContext);
    const isExpanded = ctx.expandedItems.has(value);

    if (!isExpanded) return null;

    return (
      <div
        ref={ref}
        role="region"
        className={cn("overflow-hidden text-sm", className)}
        {...props}
      >
        <div className="pb-4 pt-0">{children}</div>
      </div>
    );
  },
);
AccordionContent.displayName = "AccordionContent";

export { Accordion, AccordionItem, AccordionTrigger, AccordionContent };
