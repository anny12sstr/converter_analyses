# Medical Test Table Converter

## Overview

This Next.js application is designed to extract medical test results from various document formats (PDF, DOCX, and images) and convert them into structured, editable tables. It uses the Google Gemini API to intelligently detect and extract tabular data related to medical tests from downloaded files.

**Key features:**

* **Different Format Support:** Accepts medical reports in PDF, DOCX, JPG, PNG and WebP formats.
* **Intelligent Data Extraction:** Uses the Google Gemini API to extract exactly the results of medical tests, ignoring irrelevant text.
* **Structured tabular output:** Converts extracted data into a clean, user-friendly tabular format with headers and rows.
* **Editable Tables:** Allows users to edit extracted table data directly in the browser.
* **Copy to Clipboard:** Allows users to copy the generated table as HTML to the clipboard for easy pasting into documents or reports.
* **Drag and drop file support:** Users can drag and drop files for fast download.

## Work demonstration

(public/2025-02-2017.22.48-ezgif.com-video-to-gif-converter.gif)

## Technologies used

* **Next.js:** React framework for creating server-side web applications.
* **React:** JavaScript library for creating user interfaces.
* **Tailwind CSS:** Utility-first CSS styling framework.
* **Google Gemini API:** AI model used to extract information from documents.
* **`@google/generative-ai`:** Google Generative AI SDK to interact with Gemini API.
* **`dotenv`:** To load environment variables (API key).
* **`mammoth`:** To extract text from DOCX files.
* **`pdf-parse`:** To extract text from PDF files.
* **`multer`:** Middleware for handling file uploads.
* **`lucide-react`:** Icon library for React.

## Getting Started

To run this project locally, you need to follow a few steps. Make sure you have **Node.js** (version 18 or higher recommended) and **npm** or **yarn** installed on your machine.

1. **Clone the repository:**

    ```bash
    git clone [repository-url]
    cd [repository-directory]
    ```

    *Replace `[repository-url]` with the URL of your repository and `[repository-directory]` with the name of the folder you are cloning the repository into.*

2. **Install dependencies:**

    Go to the folder with the cloned repository in the terminal and install the necessary packages:

    ```bash
    npm install
    # or
    yarn install
    ```
3. **Start the development server:**

    ```bash
    npm run dev
    # or
    yarn dev

    Open [http://localhost:3000] in your browser to see the app running.