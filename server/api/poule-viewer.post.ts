import * as XLSX from 'xlsx';
import type { Poule } from '~/types/poule-viewer';

export default defineEventHandler(async (event) => {
  const formData = await readMultipartFormData(event);
  const file = formData?.find(el => el.name === 'excelFile');

  if (!file || !file.data) {
    throw createError({
      statusCode: 400,
      statusMessage: 'No file uploaded',
    });
  }

  try {
    const workbook = XLSX.read(file.data, { type: 'buffer' });

    const pouleSheetNames = ['Poule A', 'Poule B', 'Poule C', 'Verliezerseiland'];

    const poules: Poule[] = pouleSheetNames.map(sheetName => {
      const worksheet = workbook.Sheets[sheetName];
      if (!worksheet) {
        // If a sheet is not found, we'll just skip it
        return null;
      }

      const data: any[][] = XLSX.utils.sheet_to_json(worksheet, {
        header: 1,
        defval: ''
      });

      if (data.length < 1) {
        return { name: sheetName, headers: [], data: [] };
      }

      const headers = data[0].map(String);
      const rows = data.slice(1);

      return {
        name: sheetName,
        headers: headers,
        data: rows,
      };
    }).filter((p): p is Poule => p !== null);

    if (poules.length === 0) {
       throw createError({
        statusCode: 400,
        statusMessage: 'No valid poule sheets found in the uploaded file.',
      });
    }

    return poules;
  } catch (error: any) {
    console.error('Error processing Excel file:', error);
    throw createError({
      statusCode: 500,
      statusMessage: error.message || 'Failed to process Excel file',
    });
  }
}); 