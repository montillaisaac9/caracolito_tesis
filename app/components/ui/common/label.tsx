import React from "react";
import { cn } from "@/lib/utils";

type LabelProps = React.LabelHTMLAttributes<HTMLLabelElement>

export const Label: React.FC<LabelProps> = ({ className, children, ...props }) => {
  return (
    <label className={cn("text-sm font-medium text-gray-300", className)} {...props}>
      {children}
    </label>
  );
};