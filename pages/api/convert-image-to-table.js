/*import multer from 'multer';
import { GoogleGenerativeAI } from '@google/generative-ai';
import fs from 'node:fs';
import path from 'path';
import dotenv from 'dotenv';
dotenv.config();

const apiKey = process.env.GEMINI_API_KEY;

const storage = multer.memoryStorage();
const upload = multer({
    storage: storage,
    limits: { fileSize: 10 * 1024 * 1024 },
    fileFilter: function (req, file, cb) {
        const allowedMimeTypes = [
            'image/png',
            'image/jpg',
            'image/jpeg',
            'image/webp'
        ];
        if (allowedMimeTypes.includes(file.mimetype)) {
            cb(null, true);
        } else {
            cb(new Error('Invalid file type. Only image files (PNG, JPG, JPEG, WEBP) are allowed.'));
        }
    }
});

export const config = {
    api: {
        bodyParser: false,
    },
};

function fileToGenerativePart(buffer, mimeType) { // Accepts buffer directly
    return {
        inlineData: {
            data: buffer.toString("base64"),
            mimeType,
        },
    };
}


export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method Not Allowed' });
    }
    await new Promise((resolve, reject) => {


        upload.single('imageFile')(req, res, async (err) => {
            if (err) {
                console.error("Multer error:", err);
                return res.status(500).json({ error: err.message });
            }

            if (!req.file) {
                return res.status(400).json({ error: 'Please upload an image file.' });
            }
            try {
                const imageBuffer = req.file.buffer;  // Get the buffer
                const mimeType = req.file.mimetype;


                const imagePart = fileToGenerativePart(imageBuffer, mimeType); // Pass buffer directly

                const genAI = new GoogleGenerativeAI(apiKey);
                const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

                const prompt = `Analyze the table in this image and convert it into a single, long, scrollable HTML table. Ensure flawless accuracy in data representation. The table must be one continuous HTML table encompassing all data rows and columns from the image. Under no circumstances should you split the information into multiple tables. The table must be vertically scrollable to accommodate all content. Importantly: Do not include any checkboxes or interactive form elements in the generated table. Ensure that the HTML table includes borders to clearly delineate rows and columns.`;

                const result = await model.generateContent([prompt, imagePart]);
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
                console.error("Error processing image file:", error);
                res.status(500).json({ error: 'Failed to process image file and get table.' });
            }
            finally {
                resolve();
            }
        });
    });
}*/