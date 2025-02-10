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
        bodyParser: {
            sizeLimit: '10mb',
        }
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
        res.setHeader('Content-Type', 'application/json');
        return res.status(405).json({ error: 'Method Not Allowed' });
    }
     try {
    const {image} = JSON.parse(req.body)
    const mimeType = image.split(';')[0].split(':')[1]
   if (req.method === "POST") {
    try {
      const { image } = JSON.parse(req.body)
      const contentType = image.split(';')[0].split(':')[1];
        const imagePart = {
            inlineData: {
                data: image.split(',')[1],
                mimeType: contentType,
            },
        };
      let file = null;
      let data = null;
      const genAI = new GoogleGenerativeAI(apiKey);
      const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

      const result = await model.generateContent([
        `Convert all the data from image to a single big HTML table code`,
        imagePart,
      ]);
        console.log("result: ", result)
      data = result.response.text();
      res.status(200).json({ data });
    } catch (err) {
      console.log("CATCH", err);
      res.status(500).json({ err: "Failed!" });
    }
  }
} catch (e) {
    console.log(e);
  }
}