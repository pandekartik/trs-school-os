import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface ListItemProps {
  title: string;
  subtitle?: string;
  badges?: React.ReactNode;
  onDelete?: () => void;
  highlighted?: boolean;
  onClick?: () => void;
}

export function ListItem({
  title,
  subtitle,
  badges,
  onDelete,
  highlighted,
  onClick,
}: ListItemProps) {
  return (
    <div
      onClick={onClick}
      className={cn(
        "flex items-center justify-between px-3 py-2.5 rounded-lg border transition-all",
        onClick && "cursor-pointer",
        highlighted
          ? "bg-[#fce8ea] border-[#f0b0b7]"
          : "bg-secondary/40 border-border hover:border-border/80 hover:bg-secondary/60"
      )}
    >
      <div className="flex flex-col gap-0.5 min-w-0">
        <span
          className="text-xs font-medium truncate"
          style={{ color: highlighted ? "#a01b2b" : "var(--color-foreground)" }}
        >
          {title}
        </span>
        {subtitle && (
          <span
            className="text-xs truncate"
            style={{ color: highlighted ? "#c9506b" : "var(--color-text-secondary)" }}
          >
            {subtitle}
          </span>
        )}
      </div>
      <div className="flex items-center gap-1.5 shrink-0 ml-2">
        {badges}
        {onDelete && (
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6 rounded-md text-muted-foreground hover:text-destructive hover:bg-destructive/10"
            onClick={(e) => {
              e.stopPropagation();
              onDelete();
            }}
          >
            <Trash2 className="h-3 w-3" />
          </Button>
        )}
      </div>
    </div>
  );
}
