// utils/exportReport.ts
import { jsPDF } from 'jspdf';
import * as XLSX from 'xlsx';
import autoTable from 'jspdf-autotable';
import { ActivityReport } from '../types/reports';

export const exportToPDF = (data: ActivityReport) => {
  const doc = new jsPDF();

  doc.setFontSize(14);
  doc.text(`Módulo: ${data.moduleTitle}`, 10, 10);
  doc.text(`Tópico: ${data.topicTitle}`, 10, 20);
  doc.text(`Actividad: ${data.activityTitle}`, 10, 30);
  doc.text(`Creador: ${data.creatorName}`, 10, 40);

  autoTable(doc, {
    startY: 50,
    head: [['#', 'Estudiante', 'Puntuación', 'Retroalimentación', 'Completado']],
    body: data.scores.map((s, i) => [
      i + 1,
      s.student.name,
      s.score.toString(),
      s.feedback,
      s.completed ? 'Sí' : 'No',
    ]),
    styles: { halign: 'center' },
  });

  doc.save(`${data.activityTitle.replace(/\s+/g, '_')}_reporte.pdf`);
};

export const exportToExcel = (data: ActivityReport) => {
  const worksheetData = [
    ['Módulo:', data.moduleTitle],
    ['Tópico:', data.topicTitle],
    ['Actividad:', data.activityTitle],
    ['Creador:', data.creatorName],
    [],
    ['#', 'Estudiante', 'Puntuación', 'Retroalimentación', 'Completado'],
    ...data.scores.map((s, i) => [
      i + 1,
      s.student.name,
      s.score,
      s.feedback,
      s.completed ? 'Sí' : 'No',
    ]),
  ];

  const worksheet = XLSX.utils.aoa_to_sheet(worksheetData);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Reporte');
  XLSX.writeFile(workbook, `${data.activityTitle.replace(/\s+/g, '_')}_reporte.xlsx`);
};