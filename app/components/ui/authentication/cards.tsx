import React from "react";
import { cn } from "@/lib/utils";

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  className?: string;
}

export const Card = ({ children, className, ...props }: CardProps) => {
  return (
    <div className={cn("bg-gray-800 shadow-lg rounded-lg p-4", className)} {...props}>
      {children}
    </div>
  );
};

export const CardHeader = ({ children, className, ...props }: CardProps) => {
  return (
    <div className={cn("pb-2 relative", className)} {...props}>
      {children}
    </div>
  );
};

export const CardTitle = ({ children, className, ...props }: CardProps) => {
  return (
    <h2 className={cn("text-xl font-bold text-white text-center", className)} {...props}>
      {children}
    </h2>
  );
};

export const CardDescription = ({ children, className, ...props }: CardProps) => {
  return (
    <p className={cn("text-gray-400 text-center", className)} {...props}>
      {children}
    </p>
  );
};

export const CardContent = ({ children, className, ...props }: CardProps) => {
  return (
    <div className={cn("p-4", className)} {...props}>
      {children}
    </div>
  );
};

export const CardFooter = ({ children, className, ...props }: CardProps) => {
  return (
    <div className={cn("flex justify-between p-4", className)} {...props}>
      {children}
    </div>
  );
};
