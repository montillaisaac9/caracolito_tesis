// components/ModuleCard.tsx
import React from "react";

interface ModuleCardProps {
  title: string;
}

const ModuleCard: React.FC<ModuleCardProps> = ({ title }) => {
  return (
    <div className="bg-white shadow-md rounded-lg p-4 text-center cursor-pointer hover:bg-gray-100 transition">
      <p className="font-medium">{title}</p>
    </div>
  );
};

export default ModuleCard;
