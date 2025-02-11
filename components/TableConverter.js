import { useState, useRef } from 'react';
import { CheckCircle, Copy } from 'lucide-react';
import { FileCheck } from 'lucide-react';

const TableConverter = () => {
    const [tableHTML, setTableHTML] = useState('');
    const [loading, setLoading] = useState(false);
    const [errorMessage, setErrorMessage] = useState('');
    const [copied, setCopied] = useState(false);
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
            const formData = new FormData();
            formData.append('file', file);

            const response = await fetch('/api/convert-to-table', {
                method: 'POST',
                body: formData,
            });

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`Помилка обробки файлу: ${response.status} ${errorText}`);
            }

            const data = await response.json();
            if (data.table) {
                setTableHTML(data.table);
            } else {
                setErrorMessage("Не вдалося отримати таблицю з файлу.");
            }
        } catch (error) {
            setErrorMessage(error.message);
        } finally {
            setLoading(false);
        }
    };

    const handleCopyTable = async () => {
        try {
            await navigator.clipboard.write([
                new ClipboardItem({
                    'text/html': new Blob([tableHTML], { type: 'text/html' }),
                }),
            ]);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch (err) {
            console.error('Failed to copy table:', err);
        }
    };

    // Parsing the table's HTML to get the headers and rows
    const parseTableHTML = (html) => {
        const parser = new DOMParser();
        const doc = parser.parseFromString(html, 'text/html');
        const headers = Array.from(doc.querySelectorAll('th')).map(th => th.innerText);
        const rows = Array.from(doc.querySelectorAll('tr')).slice(1).map(tr => 
            Array.from(tr.querySelectorAll('td')).map(td => td.innerText)
        );
        return { headers, rows };
    };

    const { headers, rows } = tableHTML ? parseTableHTML(tableHTML) : { headers: [], rows: [] };

    return (
        <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-blue-100">
            <div className="container mx-auto px-4 py-8">
                <header className="text-center mb-12">
                    <h1 className="text-4xl font-bold text-indigo-900 mb-4">Конвертер Таблиць</h1>
                    <p className="text-slate-600 max-w-2xl mx-auto mb-4">
                        Конвертуйте ваші документи та зображення в структуровані таблиці.
                        Підтримка PDF, DOC та зображень.
                    </p>
                </header>

                <div className="max-w-4xl mx-auto bg-white rounded-xl shadow-lg p-8">
                    <div className="flex flex-col items-center justify-center border-2 border-dashed border-indigo-200 rounded-lg bg-indigo-50/50 p-6 mb-4">
                        <label className="relative cursor-pointer mb-4">
                            <input
                                type="file"
                                className="hidden"
                                accept=".docx, .doc, image/png, image/jpeg, image/jpg, image/webp, .pdf"
                                ref={fileInputRef}
                                onChange={handleSubmit}
                            />
                            <span className="inline-flex items-center px-8 py-4 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors">
                                <FileCheck className="w-5 h-5 mr-2" />
                                Вибрати файл
                            </span>
                        </label>
                        <p className="text-sm text-slate-600">Підтримувані формати: PDF, DOC, DOCX, JPG, PNG</p>
                    </div>

                    {loading && (
                        <div className="flex items-center justify-center py-12 mb-4">
                            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
                        </div>
                    )}

                    {errorMessage && <div className="error-message text-red-500 text-center mb-4">{errorMessage}</div>}

                    <div className="overflow-hidden mb-4">
                        {/* Excel-like table */}
                        {rows.length > 0 && ( 
                            <div className="overflow-x-auto border border-gray-200 rounded-lg mb-4">
                                <div className="min-w-full inline-block align-middle">
                                    <div className="overflow-hidden">
                                        <table className="min-w-full divide-y divide-gray-200">
                                            {/* Headers */}
                                            <thead className="bg-indigo-600 text-white">
                                                <tr>
                                                    {headers.map((header, index) => (
                                                        <th
                                                            key={index}
                                                            className="px-4 py-3 text-left text-xs font-medium border-r border-gray-200"
                                                        >
                                                            {header}
                                                        </th>
                                                    ))}
                                                </tr>
                                            </thead>
                                            {/* Table body */}
                                            <tbody className="bg-white divide-y divide-gray-200">
                                                {rows.map((row, rowIndex) => (
                                                    <tr
                                                        key={rowIndex}
                                                        className="hover:bg-blue-50 transition-colors"
                                                    >
                                                        {row.map((cell, cellIndex) => (
                                                            <td
                                                                key={cellIndex}
                                                                className="px-4 py-3 text-sm text-gray-900 border-r border-gray-200"
                                                            >
                                                                {cell}
                                                            </td>
                                                        ))}
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* The copy button appears only if there are rows in the table */}
                        {rows.length > 0 && (
                            <div className="mb-4">
                                <button
                                    onClick={handleCopyTable}
                                    className="inline-flex items-center px-4 py-2 bg-indigo-100 text-indigo-700 rounded-lg hover:bg-indigo-200 transition-colors"
                                >
                                    {copied ? (
                                        <CheckCircle className="w-5 h-5 mr-2" />
                                    ) : (
                                        <Copy className="w-5 h-5 mr-2" />
                                    )}
                                    {copied ? 'Скопійовано!' : 'Скопіювати Таблицю'}
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default TableConverter;