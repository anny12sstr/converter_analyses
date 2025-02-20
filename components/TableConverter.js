import { useState, useRef, useCallback } from 'react';
import { CheckCircle, Copy, FileCheck, Microscope, X, Ghost } from 'lucide-react';

const TableConverter = () => {
    const [tableData, setTableData] = useState({ headers: [], rows: [] });
    const [loading, setLoading] = useState(false);
    const [errorMessage, setErrorMessage] = useState('');
    const [copied, setCopied] = useState(false);
    const fileInputRef = useRef(null);
    const [fileDropped, setFileDropped] = useState(false);
    const [imageDescription, setImageDescription] = useState('');
    const [selectedFileName, setSelectedFileName] = useState(false);
    const [isDragging, setIsDragging] = useState(false);
    const [isErrorModalOpen, setIsErrorModalOpen] = useState(false);

    // Function to convert tableData to HTML for richer formatting
    const tableDataToHTML = (data) => {
        if (!data || !data.headers || !data.rows) {
            return '<p>No data to display.</p>';
        }

        let htmlTable = '<table style="border-collapse: collapse; width: 100%;">';
        htmlTable += '<thead style="background-color: #4f46e5; color: white;"><tr>';

        data.headers.forEach(header => {
            htmlTable += `<th style="border: 1px solid #e5e7eb; padding: 8px; text-align: left; font-size: 14px; font-weight: medium; border-right: 1px solid #e5e7eb;">${header}</th>`;
        });
        htmlTable += '</tr></thead><tbody>';

        data.rows.forEach(row => {
            htmlTable += '<tr style="border-bottom: 1px solid #e5e7eb;">';
            row.forEach(cell => {
                htmlTable += `<td style="border: 1px solid #e5e7eb; padding: 8px; text-align: left; font-size: 14px; color: #4b5563; border-right: 1px solid #e5e7eb; word-wrap: break-word; white-space: normal;">${cell}</td>`;
            });
            htmlTable += '</tr>';
        });

        htmlTable += '</tbody></table>';
        return htmlTable;
    };

    const handleCopyTable = async () => {
        try {
            if (tableData && tableData.headers && tableData.rows && tableData.headers.length > 0 && tableData.rows.length > 0) {
                const htmlString = tableDataToHTML(tableData);

                const blob = new Blob([htmlString], { type: 'text/html' });
                const data = new ClipboardItem({ 'text/html': blob });

                await navigator.clipboard.write([data]);
                setCopied(true);
            } else {
                console.error('Cannot copy: tableData is empty or not in the correct format.');
                setCopied(false);
            }
            setTimeout(() => setCopied(false), 2000);
        } catch (err) {
            console.error('Failed to copy table data as HTML:', err);
            setCopied(false);
        }
    };

    const handleSubmit = async (event) => {
        event.preventDefault();
        setErrorMessage('');
        setTableData({ headers: [], rows: [] });
        setImageDescription('');
        setLoading(true);
        setFileDropped(false);
        setSelectedFileName(false);
        setIsDragging(false);
        setIsErrorModalOpen(false);

        const file = fileInputRef.current.files[0];

        if (!file) {
            setLoading(false);
            setErrorMessage("Please select a file.");
            return;
        }

        setSelectedFileName(file.name);
        setFileDropped(true);

        const formData = new FormData();
        formData.append('file', file);

        try {
            const response = await fetch('/api/convert-to-table', {
                method: 'POST',
                body: formData,
            });

            if (!response.ok) {
                const errorData = await response.json();
                if (errorData.error === "No medical analysis data found in the document.") {
                    setErrorMessage(errorData.error);
                    setIsErrorModalOpen(true); 
                } else {
                    setErrorMessage(errorData.error || `File processing error: ${response.status}`);
                    setIsErrorModalOpen(false);
                }
                return;
            }

            const data = await response.json();

            if (data.type === "image") {
                setImageDescription(data.description);
                setTableData({ headers: [], rows: [] });
            } else if (data.headers && data.rows) {
                setTableData(data);
                setImageDescription('');
            } else {
                console.log("Received JSON:", data);
                setTableData(data);
                setImageDescription('');
            }


        } catch (error) {
            setErrorMessage(error.message);
            setIsErrorModalOpen(true); // Модальне вікно для загальних помилок (наприклад, мережа)
        } finally {
            setLoading(false);
        }
    };

    const handleDrop = (event) => {
        event.preventDefault();
        setErrorMessage('');
        setFileDropped(true);
        setIsDragging(false);
        const file = event.dataTransfer.files[0];
        if (file) {
            fileInputRef.current.files = event.dataTransfer.files;
            setSelectedFileName(file.name);
            setFileDropped(true);
            handleSubmit(event);
        }
    };

    const handleDragOver = (event) => {
        event.preventDefault();
        setIsDragging(true);
    };

    const handleDragLeave = (event) => {
        event.preventDefault();
        setIsDragging(false);
    };

    const handleCellChange = useCallback((rowIndex, header, newValue) => {
        setTableData(prevData => {
            const newRows = prevData.rows.map((row, index) => {
                if (index === rowIndex) {
                    const updatedRow = [...row];
                    const headerIndex = prevData.headers.indexOf(header);
                    if (headerIndex !== -1) {
                        updatedRow[headerIndex] = newValue;
                    }
                    return updatedRow;
                }
                return row;
            });
            return { ...prevData, rows: newRows };
        });
    }, []);

    const closeErrorModal = () => {
        setIsErrorModalOpen(false);
        setErrorMessage('');
    };

    const formatCellContent = (cellContent) => {
        if (typeof cellContent === 'string') {
            return cellContent.replace(/\n/g, '<br />');
        }
        return cellContent;
    };

    const isOutOfRange = (result, range) => {
        if (!range || !result) return false; 

        try {
            const resultValue = parseFloat(result.replace(',', '.')); 
            if (isNaN(resultValue)) return false;

            const rangeParts = range.split('-').map(part => part.trim());
            if (rangeParts.length === 2) { 
                const minRange = parseFloat(rangeParts[0].replace(',', '.'));
                const maxRange = parseFloat(rangeParts[1].replace(',', '.'));
                if (!isNaN(minRange) && !isNaN(maxRange)) {
                    return resultValue < minRange || resultValue > maxRange;
                }
            } else {
                const parsedRange = parseFloat(range.replace(/[<>= ]/g, '').replace(',', '.'));
                const operator = range.match(/[<>=]/);

                if (!isNaN(parsedRange) && operator) {
                    switch (operator[0]) {
                        case '<': return resultValue >= parsedRange;
                        case '>': return resultValue <= parsedRange;
                        case '=': return resultValue !== parsedRange; 
                        case '>=': return resultValue < parsedRange;
                        case '<=': return resultValue > parsedRange;
                    }
                }
            }
        } catch (error) {
            console.error("Error parsing values for range check:", error);
            return false; 
        }
        return false; 
    };


    return (
        <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-blue-100">
            <div className="container mx-auto px-4 py-8">
                <header className="text-center mb-12">
                    <Microscope className="w-12 h-12 mx-auto mb-4 text-indigo-600" />
                    <h1 className="text-4xl font-bold text-indigo-900 mb-4">Converter of medical tests</h1>
                    <p className="text-slate-600 max-w-2xl mx-auto mb-4">
                        Convert your medical analyzes from various formats to structured tables.
                        PDF, DOCX and image support.
                    </p>
                </header>

                <div className="max-w-4xl mx-auto bg-white rounded-xl shadow-lg p-8 relative">
                    <div
                        className={`flex flex-col items-center justify-center border-2 border-dashed border-indigo-200 rounded-lg bg-indigo-50/50 p-6 mb-4
                            ${loading ? 'opacity-50 pointer-events-none' : ''}
                            ${isDragging ? 'border-indigo-700 bg-indigo-300 border-4 shadow-lg transition-transform duration-200' : ''}`}
                        onDrop={handleDrop}
                        onDragOver={handleDragOver}
                        onDragLeave={handleDragLeave}
                    >
                        {selectedFileName && fileDropped && (
                            <p className="mb-2 font-bold text-gray-900 text-center">
                                File "{selectedFileName}" added!
                            </p>
                        )}
                        {!selectedFileName && !fileDropped && !isDragging && (
                            <p className="text-sm text-slate-600 mb-4 text-center">
                                Drag a file here or click to select.
                            </p>
                        )}
                        {isDragging && (
                            <p className="mb-4 font-bold text-indigo-900 text-center animate-pulse">
                                Release file to upload!
                            </p>
                        )}
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
                                Select a file
                            </span>
                        </label>
                        <p className="text-sm text-slate-600 text-center">Supported formats: PDF, DOCX, JPG, PNG, WebP</p>
                    </div>

                    {loading && (
                        <div className="flex items-center justify-center fixed inset-0">
                            <div className="animate-spin rounded-full h-24 w-24 border-b-4 border-indigo-600"></div>
                        </div>
                    )}

                    {isErrorModalOpen && (
                        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex justify-center items-center z-50">
                            <div className="bg-white p-6 rounded-lg shadow-xl relative">
                                <div className="absolute top-2 right-2 cursor-pointer" onClick={closeErrorModal}>
                                    <X className="w-7 h-7 text-gray-700 hover:text-gray-900" />
                                </div>
                                <div className="flex justify-center mb-4">
                                    <Ghost className="w-20 h-20 text-indigo-900" />
                                </div>
                                <div className="text-center mb-4 text-indigo-900">
                                    <div className="text-xl font-bold">Error</div>
                                    <div>{errorMessage}</div>
                                </div>
                                <div className="flex flex-col items-center mt-6">
                                    <button
                                        onClick={() => fileInputRef.current.click()}
                                        className="inline-flex items-center justify-center px-8 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors w-full max-w-xs"
                                    >
                                        Select another file
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}

                    {errorMessage && !isErrorModalOpen && <div className="error-message text-red-500 text-center mb-4">{errorMessage}</div>}


                    <div className="overflow-hidden mb-4">
                        {/* Dynamic Table */}
                        {tableData.headers.length > 0 && (
                            <div className="overflow-x-auto border border-gray-200 rounded-lg mb-4">
                                <table className="min-w-full divide-y divide-gray-200">
                                    <thead className="bg-indigo-600 text-white">
                                        <tr>
                                            {tableData.headers.map((header, index) => (
                                                <th key={index} className="px-4 py-3 text-left text-xs font-medium border-r border-gray-200">{header}</th>
                                            ))}
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white divide-y divide-gray-200">
                                        {tableData.rows.map((row, rowIndex) => (
                                            <tr key={rowIndex} className="hover:bg-blue-50 transition-colors">
                                                {row.map((cell, cellIndex) => {
                                                    const header = tableData.headers[cellIndex];
                                                    const resultValue = header === "Результат" ? cell : null;
                                                    const referenceRange = header === "Референтні інтервали" ? cell : null;
                                                    const highlight = isOutOfRange(resultValue, referenceRange);

                                                    return (
                                                        <td
                                                            key={cellIndex}
                                                            className={`px-4 py-3 text-sm text-gray-900 border-r border-gray-200 ${highlight ? 'bg-red-100 font-semibold' : ''}`}
                                                            contentEditable
                                                            suppressContentEditableWarning
                                                            onBlur={(e) => handleCellChange(rowIndex, tableData.headers[cellIndex], e.target.innerText)}
                                                        >
                                                            <div dangerouslySetInnerHTML={{ __html: formatCellContent(cell) }} />
                                                        </td>
                                                    );
                                                })}
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}

                        {tableData.headers.length > 0 && (
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
                                    {copied ? 'Copied successfully' : 'Copy the table'}
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