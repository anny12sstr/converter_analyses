/*import multer from 'multer';
import { GoogleGenerativeAI } from '@google/generative-ai';
import fs from 'node:fs';
import path from 'path';
import dotenv from 'dotenv';
import pdfParse from 'pdf-parse';
dotenv.config();

const apiKey = process.env.GEMINI_API_KEY;

const storage = multer.memoryStorage();  // Use memory storage
const upload = multer({
    storage: storage,
    limits: { fileSize: 10 * 1024 * 1024 },
    fileFilter: function (req, file, cb) {
        const allowedMimeTypes = [
            'application/pdf'
        ];
        if (allowedMimeTypes.includes(file.mimetype)) {
            cb(null, true);
        } else {
            cb(new Error('Invalid file type. Only PDF files are allowed.'));
        }
    }
});

export const config = {
    api: {
        bodyParser: false,
    },
};

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method Not Allowed' });
    }

    await new Promise((resolve, reject) => {
        upload.single('pdfFile')(req, res, async (err) => {
            if (err) {
                console.error("Multer error:", err);
                return res.status(500).json({ error: err.message });
            }

            if (!req.file) {
                return res.status(400).json({ error: 'Please upload a PDF file.' });
            }

            try {
                const pdfBuffer = req.file.buffer; // Get the buffer

                const pdfData = await pdfParse(pdfBuffer); // Pass the buffer
                const pdfText = pdfData.text;

                const genAI = new GoogleGenerativeAI(apiKey);
                const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

                const prompt = `Convert the tabular data from the following PDF document into a single, long, scrollable HTML table. Ensure flawless accuracy in data representation. The table must be one continuous HTML table encompassing all data rows and columns. Under no circumstances should you split the information into multiple tables. The table must be vertically scrollable to accommodate all content. Importantly: Do not include any checkboxes or interactive form elements in the generated table. Ensure that the HTML table includes borders to clearly delineate rows and columns.`;

                const result = await model.generateContent([prompt, { text: pdfText }]);
                const responseText = result.response.text();

                let tableHTML = responseText;
                const tableStartTag = "<table";
                const tableEndTag = "</table>";

                const startIndex = tableHTML.toLowerCase().indexOf(tableStartTag.toLowerCase());
                const endIndex = tableHTML.toLowerCase().lastIndexOf(tableEndTag.toLowerCase());

                if (startIndex !== -1 && endIndex !== -1) {
                    tableHTML = tableHTML.substring(startIndex, endIndex + tableEndTag.length);
                }


                res.status(200).json({ table: tableHTML });
            } catch (error) {
                console.error("Error processing PDF file:", error);
                res.status(500).json({ error: 'Failed to process PDF file and get table.' });
            } finally {
                resolve();
            }
        });
    });
}*/