const express = require('express');
const multer = require('multer');
const XLSX = require('xlsx');
const path = require('path');
const fs = require('fs');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// Configure multer for file uploads
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

// Serve the main HTML page
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Process Excel file
app.post('/process', upload.single('excelFile'), (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No file uploaded' });
        }

        // Read the Excel file
        const workbook = XLSX.read(req.file.buffer, { type: 'buffer' });
        
        // Get the mapping sheet
        const mappingSheet = workbook.Sheets['Mapping'];
        if (!mappingSheet) {
            return res.status(400).json({ error: 'Mapping sheet not found' });
        }

        // Get the data sheet
        const dataSheet = workbook.Sheets['45+ facturen Incasso Debtt Mana'];
        if (!dataSheet) {
            return res.status(400).json({ error: '45+ facturen Incasso Debtt Mana sheet not found' });
        }

        // Parse mapping data
        const mappingData = XLSX.utils.sheet_to_json(mappingSheet);
        console.log('Mapping data:', mappingData);

        // Create email to name mapping
        const emailToName = {};
        mappingData.forEach(row => {
            if (row.Email && row.Name) {
                emailToName[row.Email.toLowerCase()] = row.Name;
            }
        });

        console.log('Email to name mapping:', emailToName);

        // Parse financial data
        const financialData = XLSX.utils.sheet_to_json(dataSheet);
        console.log('Financial data sample:', financialData.slice(0, 3));

        // Calculate totals per user
        const userTotals = {};
        
        financialData.forEach(row => {
            const portefeuille = row.portefeuille; 
            const saldo = parseFloat(row.saldo) || 0;
            
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

        console.log('User totals:', userTotals);

        // Convert to array and format for Excel
        const resultData = Object.entries(userTotals).map(([name, total]) => ({
            'Naam': name,
            'Omzet': total
        }));

        // Sort by name
        resultData.sort((a, b) => a.Naam.localeCompare(b.Naam));

        // Create new workbook
        const newWorkbook = XLSX.utils.book_new();
        const newWorksheet = XLSX.utils.json_to_sheet(resultData);

        // Format the Omzet column as currency
        const range = XLSX.utils.decode_range(newWorksheet['!ref']);
        for (let R = range.s.r + 1; R <= range.e.r; ++R) {
            const cellAddress = XLSX.utils.encode_cell({ r: R, c: 1 }); // Column B (Omzet)
            if (newWorksheet[cellAddress]) {
                newWorksheet[cellAddress].z = '"€ "#,##0.00_-';
            }
        }

        XLSX.utils.book_append_sheet(newWorkbook, newWorksheet, 'User Totals');

        // Generate Excel buffer
        const excelBuffer = XLSX.write(newWorkbook, { type: 'buffer', bookType: 'xlsx' });

        // Set response headers
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', 'attachment; filename=user_totals.xlsx');

        // Send the Excel file
        res.send(excelBuffer);

    } catch (error) {
        console.error('Error processing file:', error);
        res.status(500).json({ error: 'Error processing file: ' + error.message });
    }
});

// For local development
if (process.env.NODE_ENV !== 'production') {
    app.listen(PORT, () => {
        console.log(`Server running on port ${PORT}`);
    });
}

// Export for Vercel
module.exports = app; 