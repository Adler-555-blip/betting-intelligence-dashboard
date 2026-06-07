import { ArrowDown, ArrowRight, ArrowUp } from "lucide-react";
import clsx from "clsx";
import type { Movement } from "@/src/lib/types";

export function MovementIndicator({ movement }: { movement: Movement }) {
  const Icon = movement === "up" ? ArrowUp : movement === "down" ? ArrowDown : ArrowRight;
  return (
    <span
      className={clsx("inline-flex items-center gap-1 rounded px-2 py-1 text-xs font-medium uppercase", {
        "bg-terminal-green/15 text-terminal-green": movement === "up",
        "bg-terminal-red/15 text-terminal-red": movement === "down",
        "bg-white/10 text-terminal-muted": movement === "stable"
      })}
    >
      <Icon size={14} /> {movement}
    </span>
  );
}
