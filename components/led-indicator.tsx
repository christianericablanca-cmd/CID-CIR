import { cn } from "@/lib/utils";

export function LedIndicator({
  status,
  className,
}: {
  status: "loading" | "online" | "offline" | "unknown";
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-block size-2 rounded-full transition-colors duration-500",
        status === "online" && "bg-green-500 shadow-[0_0_6px_rgba(34,197,94,0.6)]",
        status === "offline" && "bg-red-500 shadow-[0_0_6px_rgba(239,68,68,0.6)]",
        status === "unknown" && "bg-muted/50 shadow-none",
        status === "loading" && "bg-yellow-500 shadow-[0_0_6px_rgba(234,179,8,0.6)]",
        className
      )}
      title={
        status === "online"
          ? "Reachable"
          : status === "offline"
            ? "Unreachable"
            : status === "unknown"
              ? "Could not determine"
              : "Checking..."
      }
    />
  );
}
