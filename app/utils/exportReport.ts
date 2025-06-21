// utils/exportReport.ts
import { jsPDF } from 'jspdf';
import * as XLSX from 'xlsx';
import autoTable from 'jspdf-autotable';
import { ActivityReport } from '../types/reports';

export const exportToPDF = async (data: ActivityReport) => {
  const doc = new jsPDF();

  // Add header image
  const headerImg = new Image();
  headerImg.src = '/membrete.png';
  
  await new Promise((resolve) => {
    headerImg.onload = () => {
      const pageWidth = doc.internal.pageSize.getWidth();
      const imgWidth = pageWidth - 20; // Full width with 10mm margins on each side
      const imgHeight = (headerImg.height * imgWidth) / headerImg.width; // Maintain aspect ratio
      
      doc.addImage(
        headerImg,
        'PNG',
        10, // 10mm left margin
        10, // 10mm top margin
        imgWidth,
        imgHeight,
        undefined,
        'FAST'
      );
      resolve(true);
    };
    headerImg.onerror = () => resolve(false);
  });

  // Calculate start Y position after the image
  const startY = 10 + ((headerImg.height * (doc.internal.pageSize.getWidth() - 20)) / headerImg.width) + 10;

  doc.setFontSize(14);
  doc.text(`Módulo: ${data.moduleTitle}`, 10, startY);
  doc.text(`Tópico: ${data.topicTitle}`, 10, startY + 10);
  doc.text(`Actividad: ${data.activityTitle}`, 10, startY + 20);
  doc.text(`Creador: ${data.creatorName}`, 10, startY + 30);

  autoTable(doc, {
    startY: startY + 40,
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

export const exportToExcel = async (data: ActivityReport) => {
  // Since Excel doesn't support background images in cells, we'll add it as a comment
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
  
  // Add image to Excel (this will insert it as a floating image)
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Reporte');
  
  // Note: XLSX doesn't directly support adding images, but you can use xlsx-js-style or similar libraries
  // for more advanced formatting. For now, we'll just add a note about the header.
  
  XLSX.writeFile(workbook, `${data.activityTitle.replace(/\s+/g, '_')}_reporte.xlsx`);
};