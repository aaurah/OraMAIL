import React from "react";
import { Badge } from "@/components/ui/badge";

type StatusType = 
  | "queued" | "sent" | "bounced" | "opened" | "clicked" | "spam" | "unsubscribed" // Email
  | "unverified" | "pending" | "verified" | "failed" // Domain
  | "manual" | "unsubscribe"; // Extra

interface StatusBadgeProps {
  status: string;
}

export function StatusBadge({ status }: StatusBadgeProps) {
  let variant: "default" | "secondary" | "destructive" | "outline" | "success" | "warning" | "info" = "default";

  switch (status.toLowerCase()) {
    case "sent":
    case "delivered":
    case "opened":
    case "verified":
      variant = "success";
      break;
    case "bounced":
    case "spam":
    case "failed":
      variant = "destructive";
      break;
    case "queued":
    case "pending":
      variant = "warning";
      break;
    case "clicked":
      variant = "info";
      break;
    case "unsubscribed":
    case "manual":
    case "unverified":
    default:
      variant = "secondary";
      break;
  }

  // Create custom variants since standard badge doesn't have success/warning/info by default
  const getBadgeClasses = (variant: string) => {
    switch (variant) {
      case "success":
        return "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400 border-green-200 dark:border-green-800/30";
      case "warning":
        return "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400 border-amber-200 dark:border-amber-800/30";
      case "info":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400 border-blue-200 dark:border-blue-800/30";
      case "destructive":
        return "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400 border-red-200 dark:border-red-800/30";
      default:
        return "bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-300 border-slate-200 dark:border-slate-700";
    }
  };

  return (
    <Badge variant="outline" className={`${getBadgeClasses(variant)} font-medium capitalize shadow-none`}>
      {status}
    </Badge>
  );
}
