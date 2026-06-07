import clsx from "clsx";
import { statusLabel } from "@/src/lib/display";

export function StatusPill({ value }: { value: string }) {
  return (
    <span
      className={clsx("inline-flex rounded px-2 py-1 text-xs font-medium", {
        "bg-terminal-yellow/15 text-terminal-yellow": value === "prematch",
        "bg-terminal-green/15 text-terminal-green": value === "live",
        "bg-white/10 text-terminal-muted": value === "finished"
      })}
    >
      {statusLabel(value)}
    </span>
  );
}
