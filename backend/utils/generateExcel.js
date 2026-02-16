import ExcelJS from 'exceljs';

/**
 * Generate Excel file from scores data
 * @param {Array} scores - Array of score records
 * @param {String} filename - Output filename
 * @returns {Buffer} Excel file buffer
 */
export const generateExcelReport = async (scores) => {
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet('Score Records');

  // Define columns
  worksheet.columns = [
    { header: 'ID', key: 'id', width: 8 },
    { header: 'Event', key: 'event_name', width: 20 },
    { header: 'Athlete Name', key: 'athlete_name', width: 25 },
    { header: 'Certificate #', key: 'certificate_no', width: 15 },
    { header: 'District', key: 'district_name', width: 15 },
    { header: 'DS Office', key: 'ds_office_name', width: 25 },
    { header: 'Gender', key: 'gender', width: 10 },
    { header: 'Place', key: 'place', width: 8 },
    { header: 'Record', key: 'record_value', width: 12 },
    { header: 'Entered By', key: 'entered_by', width: 15 },
    { header: 'Date', key: 'created_at', width: 18 }
  ];

  // Style header row
  worksheet.getRow(1).font = {
    bold: true,
    color: { argb: 'FFFFFFFF' }
  };

  worksheet.getRow(1).fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FF366092' }
  };

  worksheet.getRow(1).alignment = { horizontal: 'center', vertical: 'center' };

  // Add data rows
  scores.forEach((score, index) => {
    const row = worksheet.addRow({
      id: score.id,
      event_name: score.event_name,
      athlete_name: score.athlete_name,
      certificate_no: score.certificate_no,
      district_name: score.district_name,
      ds_office_name: score.ds_office_name,
      gender: score.gender.charAt(0).toUpperCase() + score.gender.slice(1),
      place: score.place === 1 ? '1st' : score.place === 2 ? '2nd' : '3rd',
      record_value: score.record_value,
      entered_by: score.entered_by,
      created_at: new Date(score.created_at).toLocaleDateString()
    });

    // Alternate row colors
    if (index % 2 === 0) {
      row.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFF2F2F2' }
      };
    }

    // Center align place column
    row.getCell('place').alignment = { horizontal: 'center' };
  });

  // Freeze header row
  worksheet.freezePane = 'A2';

  // Generate buffer
  const buffer = await workbook.xlsx.writeBuffer();
  return buffer;
};

/**
 * Generate Excel summary report (statistics)
 * @param {Object} data - Summary data
 * @returns {Buffer} Excel file buffer
 */
export const generateSummaryReport = async (data) => {
  const workbook = new ExcelJS.Workbook();

  // Sheet 1: Overview
  const overviewSheet = workbook.addWorksheet('Overview');

  overviewSheet.columns = [
    { header: 'Metric', key: 'metric', width: 30 },
    { header: 'Value', key: 'value', width: 20 }
  ];

  overviewSheet.getRow(1).font = { bold: true };
  overviewSheet.getRow(1).fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FF366092' }
  };
  overviewSheet.getRow(1).font.color = { argb: 'FFFFFFFF' };

  const overviewData = [
    { metric: 'Total Records', value: data.totalRecords || 0 },
    { metric: 'Unique Athletes', value: data.uniqueAthletes || 0 },
    { metric: 'Events Covered', value: data.eventsCovered || 0 }
  ];

  overviewData.forEach(item => overviewSheet.addRow(item));

  // Sheet 2: By District
  if (data.byDistrict && data.byDistrict.length > 0) {
    const districtSheet = workbook.addWorksheet('By District');

    districtSheet.columns = [
      { header: 'District', key: 'district', width: 20 },
      { header: 'Records', key: 'count', width: 15 }
    ];

    districtSheet.getRow(1).font = { bold: true };
    districtSheet.getRow(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF366092' }
    };
    districtSheet.getRow(1).font.color = { argb: 'FFFFFFFF' };

    data.byDistrict.forEach(item => {
      districtSheet.addRow({
        district: item.district_name,
        count: item.count
      });
    });
  }

  // Sheet 3: By Event
  if (data.byEvent && data.byEvent.length > 0) {
    const eventSheet = workbook.addWorksheet('By Event');

    eventSheet.columns = [
      { header: 'Event', key: 'event', width: 25 },
      { header: 'Records', key: 'count', width: 15 }
    ];

    eventSheet.getRow(1).font = { bold: true };
    eventSheet.getRow(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF366092' }
    };
    eventSheet.getRow(1).font.color = { argb: 'FFFFFFFF' };

    data.byEvent.forEach(item => {
      eventSheet.addRow({
        event: item.event_name,
        count: item.count
      });
    });
  }

  const buffer = await workbook.xlsx.writeBuffer();
  return buffer;
};

export default {
  generateExcelReport,
  generateSummaryReport
};
