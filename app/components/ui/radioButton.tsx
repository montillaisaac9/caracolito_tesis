import React from 'react';
import { cn } from "@/lib/utils";

interface RadioButtonProps {
  name: string;
  label: string;
  value: string;
  checked?: boolean;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

const RadioButton: React.FC<RadioButtonProps> = ({ name, label, value, checked, onChange }) => {
  return (
    <label className="flex items-center space-x-2 cursor-pointer">
      <input
        name={name}
        type="radio"
        value={value}
        checked={checked}
        onChange={onChange}
        className="hidden peer"
      />
      <div
        className={cn(
          "w-5 h-5 flex items-center justify-center border rounded-full cursor-pointer",
          checked ? "bg-green-500 border-green-500" : "border-gray-500",
        )}
        onClick={() => onChange?.({ target: { name, value, checked: !checked } } as React.ChangeEvent<HTMLInputElement>)}
      >
        {checked && <div className="w-3 h-3 bg-white rounded-full" />}
      </div>
      <span className="text-white">{label}</span>
    </label>
  );
};

export default RadioButton;
