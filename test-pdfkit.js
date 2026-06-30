const PDFDocument = require('pdfkit');
const path = require('path');

const pdfkitResolved = require.resolve('pdfkit');
const pdfkitDir = path.dirname(pdfkitResolved);
const dataPath = path.join(pdfkitDir, 'js', 'data');
console.log('PDFKit resolved to:', pdfkitResolved);
console.log('Data path:', dataPath);

const doc = new PDFDocument({ font: dataPath });
doc.text('Hello from PDFKit', 50, 50);
doc.end();
const chunks = [];
doc.on('data', chunk => chunks.push(chunk));
doc.on('end', () => {
  const pdf = Buffer.concat(chunks);
  console.log('PDF size:', pdf.length, 'bytes | valid:', pdf.slice(0,5).toString() === '%PDF-');
});
