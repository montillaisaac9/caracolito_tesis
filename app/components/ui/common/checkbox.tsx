import { cn } from "@/lib/utils";
import { Check } from "lucide-react";
import React from "react";

interface CheckboxProps extends React.InputHTMLAttributes<HTMLInputElement> {
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
}

export const Checkbox: React.FC<CheckboxProps> = ({ checked, onCheckedChange, className, ...props }) => {
  return (
    <div className="flex items-center">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onCheckedChange(e.target.checked)}
        className="hidden peer"
        {...props}
      />
      <div
        className={cn(
          "w-5 h-5 flex items-center justify-center border rounded-md cursor-pointer",
          checked ? "bg-green-500 border-green-500" : "border-gray-500",
          className
        )}
        onClick={() => onCheckedChange(!checked)}
      >
        {checked && <Check className="text-white w-4 h-4" />}
      </div>
    </div>
  );
};
