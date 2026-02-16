import PDFDocument from 'pdfkit';

/**
 * Generate PDF report from scores data
 * @param {Array} scores - Array of score records
 * @returns {Buffer} PDF file buffer
 */
export const generatePDFReport = async (scores) => {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({
        size: 'A4',
        margin: 40,
        font: 'Helvetica'
      });

      const chunks = [];

      doc.on('data', chunk => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));

      // Header
      doc.fontSize(18)
        .font('Helvetica-Bold')
        .text('Provincial Sports Event Score Records', { align: 'center' })
        .fontSize(10)
        .font('Helvetica')
        .text(`Generated: ${new Date().toLocaleDateString()}`, { align: 'center' })
        .moveDown(1);

      // Summary
      doc.fontSize(11)
        .font('Helvetica-Bold')
        .text(`Total Records: ${scores.length}`)
        .moveDown(0.5);

      // Table header
      doc.fontSize(9)
        .font('Helvetica-Bold')
        .rect(40, doc.y, 515, 20)
        .stroke();

      const headerY = doc.y;
      doc.text('Event', 50, headerY + 5);
      doc.text('Athlete', 150, headerY + 5);
      doc.text('Cert #', 280, headerY + 5);
      doc.text('District', 340, headerY + 5);
      doc.text('Place', 420, headerY + 5);
      doc.text('Record', 460, headerY + 5);

      doc.moveDown(1.5);

      // Table rows
      let rowY = doc.y;
      const rowHeight = 15;

      doc.font('Helvetica')
        .fontSize(8);

      scores.forEach((score, index) => {
        // Check if we need a new page
        if (rowY > doc.page.height - 80) {
          doc.addPage();
          rowY = 40;
        }

        // Alternate row background color
        if (index % 2 === 0) {
          doc.rect(40, rowY - 5, 515, rowHeight)
            .fill('#f0f0f0')
            .stroke();
        } else {
          doc.rect(40, rowY - 5, 515, rowHeight)
            .stroke();
        }

        // Reset fill to black for text
        doc.fillColor('black');

        // Truncate text if too long
        const eventName = score.event_code ? `${score.event_code}: ${score.event_name}`.substring(0, 20) : score.event_name.substring(0, 20);
        const athleteName = score.athlete_name.substring(0, 25);
        const certNo = score.certificate_no.substring(0, 8);
        const district = score.district_name.substring(0, 12);
        const place = score.place === 1 ? '1st' : score.place === 2 ? '2nd' : '3rd';
        const record = score.record_value.substring(0, 10);

        doc.text(eventName, 50, rowY);
        doc.text(athleteName, 150, rowY);
        doc.text(certNo, 280, rowY);
        doc.text(district, 340, rowY);
        doc.text(place, 420, rowY);
        doc.text(record, 460, rowY);

        rowY += rowHeight;
      });

      // Footer
      doc.moveDown(2);
      doc.fontSize(8)
        .font('Helvetica')
        .text('Provincial Sports Event Management System - Score Records Report', { align: 'center' });

      doc.end();

    } catch (error) {
      reject(error);
    }
  });
};

/**
 * Generate PDF summary report with statistics
 * @param {Object} data - Summary data including totals and breakdowns
 * @returns {Buffer} PDF file buffer
 */
export const generatePDFSummary = async (data) => {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({
        size: 'A4',
        margin: 40,
        font: 'Helvetica'
      });

      const chunks = [];

      doc.on('data', chunk => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));

      // Header
      doc.fontSize(18)
        .font('Helvetica-Bold')
        .text('Provincial Sports Event - Summary Report', { align: 'center' })
        .fontSize(10)
        .font('Helvetica')
        .text(`Generated: ${new Date().toLocaleDateString()}`, { align: 'center' })
        .moveDown(1.5);

      // Overview Section
      doc.fontSize(12)
        .font('Helvetica-Bold')
        .text('Overview')
        .moveDown(0.5)
        .fontSize(10)
        .font('Helvetica')
        .text(`Total Records: ${data.totalRecords || 0}`)
        .text(`Unique Athletes: ${data.uniqueAthletes || 0}`)
        .text(`Events Covered: ${data.eventsCovered || 0}`)
        .moveDown(1);

      // By District Section
      if (data.byDistrict && data.byDistrict.length > 0) {
        doc.fontSize(12)
          .font('Helvetica-Bold')
          .text('Records by District')
          .moveDown(0.5)
          .fontSize(9);

        data.byDistrict.forEach(item => {
          doc.text(`${item.district_name}: ${item.count} records`);
        });

        doc.moveDown(1);
      }

      // By Event Section
      if (data.byEvent && data.byEvent.length > 0) {
        doc.fontSize(12)
          .font('Helvetica-Bold')
          .text('Top Events by Records')
          .moveDown(0.5)
          .fontSize(9);

        // Show top 10 events
        data.byEvent.slice(0, 10).forEach(item => {
          doc.text(`${item.event_name}: ${item.count} records`);
        });

        if (data.byEvent.length > 10) {
          doc.text(`... and ${data.byEvent.length - 10} more events`);
        }

        doc.moveDown(1);
      }

      // Footer
      doc.fontSize(8)
        .font('Helvetica')
        .text('Provincial Sports Event Management System - Summary Report', { align: 'center' });

      doc.end();

    } catch (error) {
      reject(error);
    }
  });
};

export default {
  generatePDFReport,
  generatePDFSummary
};
