import { useState, useRef } from 'react';

const TableConverter = () => {
    const [tableHTML, setTableHTML] = useState('');
    const [loading, setLoading] = useState(false);
    const [errorMessage, setErrorMessage] = useState('');
    const fileInputRef = useRef(null);

    const handleSubmit = async (event) => {
        event.preventDefault();
        setErrorMessage('');
        setTableHTML('');
        setLoading(true);

        const file = fileInputRef.current.files[0];

        if (!file) {
            setLoading(false);
            setErrorMessage("Будь ласка, виберіть файл для конвертації.");
            return;
        }

        try {
            // Call API with the download URL
            const uploadResponse = await fetch('/api/generate-upload-url', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    image: await toBase64(file),
                })
            });

            if (!response.ok) {
                const errorData = await response.json();
                let errorMessage = `HTTP error! status: ${response.status}`;
                if (errorData && errorData.error) {
                    errorMessage += `. Message: ${errorData.error}`;
                }
                throw new Error(errorMessage);
            }

            const data = await response.json();
            if (data.table) {
                setTableHTML(data.table);
            } else {
                setErrorMessage("Failed to get table from file.");
            }
        } catch (error) {
            console.error("Error:", error);
            setErrorMessage(error.message);
        } finally {
            setLoading(false);
        }
    };

    const copyTableToClipboard = () => {
        const table = document.querySelector('#tableOutput table');

        if (!table) {
            alert("Немає таблиці для копіювання.");
            return;
        }

        const tableHTML = table.outerHTML;

        function listener(e) {
            e.clipboardData.setData("text/html", tableHTML);
            e.clipboardData.setData("text/plain", table.innerText);
            e.preventDefault();
        }

        document.addEventListener("copy", listener);
        document.execCommand("copy");
            function listener(e) {
                e.clipboardData.setData("text/html", tableHTML);
                e.clipboardData.setData("text/plain", table.innerText);
                e.preventDefault();
            }

            document.addEventListener("copy", listener);
            document.execCommand("copy");
            document.removeEventListener("copy", listener);

            alert("Таблицю скопійовано в буфер обміну!");
        };
       const toBase64 = (file) => {
        return new Promise((resolve, reject) => {
          const fileReader = new FileReader();
          fileReader.readAsDataURL(file);
          fileReader.onload = () => {
              resolve(fileReader.result);
          };
          fileReader.onerror = (err) => {
            reject(err);
          };
        });
      };

        // Predefined CSS styles for the table
        const tableStyles = `
            <style>
                table {
                    border-collapse: collapse;
                    width: 100%;
                }

                th,
                td {
                    border: 1px solid #ddd;
                    padding: 8px;
                    text-align: left;
                }

                th {
                    background-color: #f2f2f2;
                    font-weight: bold;
                }
            </style>
        `;

        return (
            <div className="container">
                <h1 className="title">Table Converter</h1>
                <h2 className="subtitle">Convert to Table</h2>
                <form onSubmit={handleSubmit}>
                    <input
                        type="file"
                        id="universalFile"
                        name="universalFile"
                        accept=".docx, .doc, image/png, image/jpeg, image/jpg, image/webp, .pdf"
                        ref={fileInputRef}
                        className="file-input"
                    />
                    <br />
                    <br />
                    <button type="submit" disabled={loading} className="button">
                        {loading ? 'Converting...' : 'Convert to Table'}
                    </button>
                </form>

                {loading && (
                    <div className="loading-overlay">
                        <div class="loading-spinner"></div>
                    </div>
                )}

                {errorMessage && <div class="error-message">{errorMessage}</div>}

                <div id="tableOutput" dangerouslySetInnerHTML={{ __html: tableStyles + tableHTML }} className="table-output" />

                {tableHTML && (
                    <button id="copyTableButton" onClick={copyTableToClipboard} className="button">
                        Copy Table
                    </button>
                )}

                <style jsx>{`
                    .container {
                        max-width: 800px;
                        margin: 20px auto;
                        padding: 20px;
                        background-color: #f9f9f9;
                        border-radius: 8px;
                        box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
                        font-family: 'Arial', sans-serif;
                        color: #333;
                    }

                    .title {
                        text-align: center;
                        color: #2563eb;
                    }

                    .subtitle {
                        color: #4b5563;
                        margin-bottom: 15px;
                    }

                    .file-input {
                        margin-bottom: 15px;
                        padding: 10px;
                        border: 1px solid #d1d5db;
                        border-radius: 4px;
                        width: 100%;
                        box-sizing: border-box;
                        background-color: #fff;
                    }

                    .button {
                        background-color: #2563eb;
                        color: white;
                        padding: 10px 20px;
                        border: none;
                        border-radius: 5px;
                        cursor: pointer;
                        transition: background-color 0.3s ease;
                    }

                    .button:hover {
                        background-color: #1e40af;
                    }

                    .button:disabled {
                        background-color: #9ca3af;
                        cursor: not-allowed;
                    }

                    .loading-overlay {
                        position: fixed;
                        top: 0;
                        left: 0;
                        width: 100%;
                        height: 100%;
                        background-color: rgba(255, 255, 255, 0.7);
                        display: flex;
                        justify-content: center;
                        align-items: center;
                        z-index: 1000;
                    }

                    .loading-spinner {
                        border: 4px solid rgba(0, 0, 0, 0.3);
                        border-top: 4px solid #2563eb;
                        border-radius: 50%;
                        width: 50px;
                        height: 50px;
                        animation: spin 1s linear infinite;
                    }

                    @keyframes spin {
                        0% {
                            transform: rotate(0deg);
                        }
                        100% {
                            transform: rotate(360deg);
                        }
                    }

                    .error-message {
                        color: #dc2626;
                        margin-top: 10px;
                    }

                    .table-output {
                        margin-top: 20px;
                    }

                    .table-output table {
                        border-collapse: collapse;
                        width: 100%;

                    }

                    .table-output th,
                    .table-output td {
                        border: 1px solid #94a3b8;
                        padding: 8px;
                        text-align: left;
                    }

                    .table-output th {
                        background-color: #e5e7eb;
                        color: #374151;
                    }

                    .form-group {
                        margin-bottom: 20px;
                    }
                `}</style>
        </div>
    );
};

export default TableConverter;