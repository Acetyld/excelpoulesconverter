import * as XLSX from 'xlsx';

export default defineEventHandler(async (event) => {
  try {
    const formData = await readMultipartFormData(event);
    if (!formData) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Invalid form data. No data received.'
      })
    }
    const fileEntry = formData.find(entry => entry.name === 'excelFile');

    if (!fileEntry || !fileEntry.data) {
      throw createError({
        statusCode: 400,
        statusMessage: 'No file uploaded',
      });
    }

    // Read the Excel file
    const workbook = XLSX.read(fileEntry.data, { type: 'buffer' });

    // Get the mapping sheet
    const mappingSheet = workbook.Sheets['Mapping'];
    if (!mappingSheet) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Mapping sheet not found',
      });
    }

    // Get the data sheet
    const dataSheetName = '45+ facturen Incasso Debtt Mana';
    const dataSheet = workbook.Sheets[dataSheetName];
    if (!dataSheet) {
      throw createError({
        statusCode: 400,
        statusMessage: `'${dataSheetName}' sheet not found`,
      });
    }

    // Parse mapping data
    const mappingData: { Email?: string, Name?: string }[] = XLSX.utils.sheet_to_json(mappingSheet);

    // Create email to name mapping
    const emailToName: { [key: string]: string } = {};
    mappingData.forEach((row) => {
      if (row.Email && row.Name) {
        emailToName[row.Email.toLowerCase()] = row.Name;
      }
    });

    // Parse financial data
    const financialData: { portefeuille?: string, saldo?: string | number }[] = XLSX.utils.sheet_to_json(dataSheet);

    // Calculate totals per user
    const userTotals: { [key: string]: number } = {};

    financialData.forEach((row) => {
      const portefeuille = row.portefeuille;
      // Convert comma to dot for decimal and parse
      const saldoStr = String(row.saldo || '0').replace(',', '.');
      const saldo = parseFloat(saldoStr) || 0;

      if (portefeuille) {
        const email = portefeuille.toLowerCase();
        const userName = emailToName[email];

        if (userName) {
          if (!userTotals[userName]) {
            userTotals[userName] = 0;
          }
          userTotals[userName] += saldo;
        }
      }
    });

    // Convert to array and format for Excel
    const resultData: { Naam: string, Omzet: number }[] = Object.entries(userTotals).map(([name, total]) => ({
      'Naam': name,
      'Omzet': total,
    }));
    
    // Sort by name
    resultData.sort((a, b) => (a.Naam || '').localeCompare(b.Naam || ''));

    // Create new workbook
    const newWorkbook = XLSX.utils.book_new();
    const newWorksheet = XLSX.utils.json_to_sheet(resultData);

    // Format the Omzet column as currency
    const range = XLSX.utils.decode_range(newWorksheet['!ref'] || '');
    for (let R = range.s.r + 1; R <= range.e.r; ++R) {
        const cellAddress = XLSX.utils.encode_cell({ r: R, c: 1 }); // Column B (Omzet)
        if (newWorksheet[cellAddress]) {
            newWorksheet[cellAddress].z = '"€ "#,##0.00_-';
        }
    }

    XLSX.utils.book_append_sheet(newWorkbook, newWorksheet, 'User Totals');

    // Generate Excel buffer
    const excelBuffer = XLSX.write(newWorkbook, { type: 'buffer', bookType: 'xlsx' });

    // Set response headers for file download
    setResponseHeaders(event, {
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': 'attachment; filename="user_totals.xlsx"',
    });

    return excelBuffer;

  } catch (error) {
    console.error('Error processing file:', error);
    const message = error instanceof Error ? error.message : String(error);
    throw createError({
      statusCode: 500,
      statusMessage: `Error processing file: ${message}`,
    });
  }
}); 