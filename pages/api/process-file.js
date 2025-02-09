import { GoogleGenerativeAI } from '@google/generative-ai';
import fs from 'node:fs';
import path from 'path';
import dotenv from 'dotenv';
import mammoth from 'mammoth';
import pdfParse from 'pdf-parse';

dotenv.config();

const apiKey = process.env.GEMINI_API_KEY;

export const config = {
    api: {
        bodyParser: true,
    },
};

async function fetchFileContent(objectURL) {
    try {
        const response = await fetch(objectURL);
        if (!response.ok) {
            throw new Error(`Failed to fetch file: ${response.status} ${response.statusText}`);
        }

        const arrayBuffer = await response.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);
        return buffer;
    } catch (error) {
        console.error("Error fetching file:", error);
        throw new Error("Failed to fetch file");
    }
}

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
        res.setHeader('Content-Type', 'application/json');
        return res.status(405).json({ error: 'Method Not Allowed' });
    }

    try {
        const { objectURL } = req.body;

        if (!objectURL) {
            res.setHeader('Content-Type', 'application/json');
            return res.status(400).json({ error: 'File URL is missing.' });
        }

        const fileBuffer = await fetchFileContent(objectURL);
        const mimeType = req.headers['content-type'];

        let extractedContent;
        const fileExtension = path.extname(new URL(objectURL).pathname).toLowerCase();

        if (fileExtension === '.docx' || fileExtension === '.doc') {
            extractedContent = await processDocx(fileBuffer);
        } else if (['.png', '.jpg', '.jpeg', '.webp'].includes(fileExtension)) {
            extractedContent = await processImage(fileBuffer, mimeType);
        } else if (fileExtension === '.pdf') {
            extractedContent = await processPdf(fileBuffer);
        } else {
            res.setHeader('Content-Type', 'application/json');
            return res.status(400).json({ error: 'Unsupported file type.' });
        }

        const genAI = new GoogleGenerativeAI(apiKey);
        const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
                let prompt = `Convert the data into a single, long, scrollable HTML table. Importantly: Do not include any checkboxes. Ensure that the HTML table includes borders.`;
         if (fileExtension === '.docx' || fileExtension === '.doc') {
            prompt = `Convert ONLY the medical analysis results section from the following Word document into a single, long, scrollable HTML table. Ensure flawless accuracy. Focus EXCLUSIVELY on the tabular data. Do not include any text that is NOT part of the results table. The table must be vertically scrollable. Do not include any checkboxes. Ensure that the HTML table includes borders.`;
        } else if (fileExtension === '.pdf') {
            prompt = `Extract the tabular data from the following PDF document and convert it into a single, long, scrollable HTML table. Ensure that all rows and columns are accurately represented. Focus solely on the tabular data. Do not add extra text, headers, or footers. Ensure the generated table has visible borders for all cells. Do not include any checkboxes or interactive elements.`;
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

        res.setHeader('Content-Type', 'application/json');
        res.status(200).json({ table: tableHTML });

    } catch (error) {
        console.error("Error processing file:", error);
        res.setHeader('Content-Type', 'application/json');
        res.status(500).json({ error: 'Failed to process file and get table.' });
    }
}