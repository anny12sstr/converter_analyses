import multer from 'multer';
import { GoogleGenerativeAI } from '@google/generative-ai';
import fs from 'node:fs';
import path from 'path';
import dotenv from 'dotenv';
import mammoth from 'mammoth';
import pdfParse from 'pdf-parse';

dotenv.config();

const apiKey = process.env.GEMINI_API_KEY;

const storage = multer.memoryStorage();
const upload = multer({
    storage: storage,
    limits: { fileSize: 10 * 1024 * 1024 },
});

export const config = {
    api: {
        bodyParser: false,
    },
};

async function processDocx(buffer) {
    try {
        const textResult = await mammoth.extractRawText({ buffer: buffer });
        return textResult.value;
    } catch (error) {
        console.error("Error processing DOCX:", error);
        throw new Error("Error processing DOCX file");
    }
}

async function processImage(buffer, mimeType) {
    try {
        const imagePart = {
            inlineData: {
                data: buffer.toString("base64"),
                mimeType,
            },
        };
        return imagePart;
    } catch (error) {
        console.error("Error processing Image:", error);
        throw new Error("Error processing image file");
    }
}

async function processPdf(buffer) {
    try {
        const pdfData = await pdfParse(buffer);
        return pdfData.text;
    } catch (error) {
        console.error("Error processing PDF:", error);
        throw new Error("Error processing PDF file");
    }
}

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method Not Allowed' });
    }

    await new Promise((resolve, reject) => {
        upload.single('universalFile')(req, res, async (err) => {
            if (err) {
                console.error("Multer error:", err);
                return res.status(500).json({ error: err.message });
            }

            if (!req.file) {
                return res.status(400).json({ error: 'Please upload a file.' });
            }

            try {
                const fileBuffer = req.file.buffer;
                const mimeType = req.file.mimetype;
                let extractedContent;

                if (mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' || mimeType === 'application/msword') {
                    extractedContent = await processDocx(fileBuffer);
                } else if (mimeType.startsWith('image/')) {
                    extractedContent = await processImage(fileBuffer, mimeType);
                } else if (mimeType === 'application/pdf') {
                    extractedContent = await processPdf(fileBuffer);
                } else {
                    return res.status(400).json({ error: 'Unsupported file type.' });
                }

                const genAI = new GoogleGenerativeAI(apiKey);
                const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

                let prompt = `Convert the following content into a single, long, scrollable HTML table. Ensure all data is accurately represented. Do not add any extra text or headers. Focus solely on the tabular data.`;
                 if (mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' || mimeType === 'application/msword') {
                    prompt = `Convert ONLY the medical analysis results section from the following Word document into a single, long, scrollable HTML table. Ensure flawless accuracy. Focus EXCLUSIVELY on the tabular data. Do not include any text that is NOT part of the results table. The table must be vertically scrollable.`;
                } else if (mimeType === 'application/pdf') {
                    prompt = `Extract the tabular data from the following PDF document and convert it into a single, long, scrollable HTML table. Ensure that all rows and columns are accurately represented. Focus solely on the tabular data. Do not add extra text, headers, or footers.`;
                }


                const result = await model.generateContent([prompt, extractedContent]);
                let responseText = result.response.text();

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
                console.error("Error processing file:", error);
                res.status(500).json({ error: 'Failed to process file and get table.' });
            } finally {
                resolve();
            }
        });
    });
}