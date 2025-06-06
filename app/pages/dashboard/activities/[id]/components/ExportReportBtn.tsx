// components/ExportButtons.tsx
'use client';

import { exportToPDF, exportToExcel } from '@/app/utils/exportReport';
import { ActivityReport } from '@/app/types/reports';

export default function ExportButtons({ reportData }: { reportData: ActivityReport }) {
  return (
    <div className="flex gap-4 mt-4">
      <button
        onClick={() => exportToPDF(reportData)}
        className="bg-red-500 text-white px-4 py-2 rounded"
      >
        Exportar PDF
      </button>
      <button
        onClick={() => exportToExcel(reportData)}
        className="bg-green-600 text-white px-4 py-2 rounded"
      >
        Exportar Excel
      </button>
    </div>
  );
}
