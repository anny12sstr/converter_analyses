import { GoogleGenerativeAI } from '@google/generative-ai';
import dotenv from 'dotenv';
import mammoth from 'mammoth';
import pdfParse from 'pdf-parse';
import multer from 'multer';

dotenv.config();

const apiKey = process.env.GEMINI_API_KEY;
const upload = multer({ storage: multer.memoryStorage() });

export const config = {
    api: {
        bodyParser: false,
    },
};

// Unified content extraction function
async function extractContent(buffer, mimeType) {
    try {
        if (mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' || mimeType === 'application/msword') {
            const textResult = await mammoth.extractRawText({ buffer: buffer });
            return textResult.value;
        } else if (mimeType.startsWith('image/')) {
            return {
                inlineData: {
                    data: buffer.toString("base64"),
                    mimeType,
                },
            };
        } else if (mimeType === 'application/pdf') {
            const pdfData = await pdfParse(buffer);
            return pdfData.text;
        } else {
            throw new Error('Unsupported file type.');
        }
    } catch (error) {
        console.error("Error extracting content:", error);
        throw new Error("Failed to extract content from the file.");
    }
}

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        res.setHeader('Content-Type', 'application/json');
        return res.status(405).json({ error: 'Method Not Allowed' });
    }

    try {
        // Handle file upload using multer
        await new Promise((resolve, reject) => {
            upload.single('file')(req, res, (err) => {
                if (err) {
                    console.error("Multer error:", err);
                    return res.status(500).json({ error: `File upload failed: ${err.message}` });
                }
                resolve();
            });
        });

        const fileBuffer = req.file.buffer;
        const mimeType = req.file.mimetype;

        const extractedContent = await extractContent(fileBuffer, mimeType);

        const genAI = new GoogleGenerativeAI(apiKey);
        const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

        // Unified prompt for JSON output to Gemini API
        const prompt = `
            I am giving you the results of my medical tests.
            Extract ONLY the MEDICAL ANALYSIS RESULTS TABLE from the document.
             The table should contain rows of medical tests with their corresponding results, units, and reference ranges.
            Convert the tabular data into JSON format with "headers" and "rows".
            The JSON structure should be:
            {
                "headers": ["Column 1", "Column 2", ...],
                "rows": [
                    ["Row 1 Cell 1", "Row 1 Cell 2", ...],
                    ["Row 2 Cell 1", "Row 2 Cell 2", ...]
                ]
            }
            IGNORE any text that is NOT part of the medical results. 
            If no medical analysis results are found, return an empty JSON array []
            Return only the JSON.
        `;

        const result = await model.generateContent([prompt, extractedContent]);
        const rawText = result.response.text();
        const cleanedText = rawText
            .replace(/```json/g, '')
            .replace(/```/g, '')
            .trim();

        const jsonOutput = JSON.parse(cleanedText);

        // Check for empty array indicating no medical analysis data found
        if (Array.isArray(jsonOutput) && jsonOutput.length === 0) {
            return res.status(400).json({ error: 'No medical analysis data found in the document.' });
        }

        res.setHeader('Content-Type', 'application/json');
        res.status(200).json(jsonOutput);

    } catch (error) {
        console.error("Error processing file:", error);
        res.setHeader('Content-Type', 'application/json');
        res.status(500).json({ error: 'Failed to process file and get JSON.' });
    }
}