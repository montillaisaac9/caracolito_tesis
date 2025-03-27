// components/DashboardCard.tsx
import React from "react";

interface DashboardCardProps {
  title: string;
  value: string | number;
}

const DashboardCard: React.FC<DashboardCardProps> = ({ title, value }) => {
  return (
    <div className="bg-white shadow-md rounded-xl p-6 text-center">
      <p className="text-3xl font-bold">{value}</p>
      <p className="text-gray-600">{title}</p>
    </div>
  );
};

export default DashboardCard;
