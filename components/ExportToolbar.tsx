import { useState } from 'react';
import { exportPDF, exportDOCX } from '../services/api.service';

interface ExportToolbarProps {
  content: string;
  documentTitle?: string;
}

export function ExportToolbar({ content, documentTitle = 'document' }: ExportToolbarProps) {
  const [exporting, setExporting] = useState<string | null>(null);

  const handleExportPDF = async () => {
    setExporting('pdf');
    try {
      const blob = await exportPDF(content);
      downloadFile(blob, `${documentTitle}.pdf`);
    } catch (error) {
      console.error('PDF export failed:', error);
      alert('Failed to export PDF. Please try again.');
    } finally {
      setExporting(null);
    }
  };

  const handleExportDOCX = async () => {
    setExporting('docx');
    try {
      const blob = await exportDOCX(content);
      downloadFile(
        blob,
        `${documentTitle}.docx`
      );
    } catch (error) {
      console.error('DOCX export failed:', error);
      alert('Failed to export DOCX. Please try again.');
    } finally {
      setExporting(null);
    }
  };

  const handleExportMarkdown = () => {
    setExporting('markdown');
    try {
      const blob = new Blob([content], { type: 'text/markdown' });
      downloadFile(blob, `${documentTitle}.md`);
    } finally {
      setExporting(null);
    }
  };

  const handleExportTXT = () => {
    setExporting('txt');
    try {
      // Convert HTML/Markdown to plain text by removing tags
      const plainText = content
        .replace(/<[^>]*>/g, '')
        .replace(/\*\*/g, '')
        .replace(/\*/g, '')
        .replace(/#{1,6}\s/g, '')
        .replace(/>\s/g, '')
        .trim();
      
      const blob = new Blob([plainText], { type: 'text/plain' });
      downloadFile(blob, `${documentTitle}.txt`);
    } finally {
      setExporting(null);
    }
  };

  const downloadFile = (blob: Blob, filename: string) => {
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  };

  return (
    <div className="flex gap-2 flex-wrap">
      <button
        onClick={handleExportPDF}
        disabled={exporting !== null}
        className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center gap-2"
      >
        {exporting === 'pdf' ? (
          <>
            <svg
              className="animate-spin h-4 w-4"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              ></circle>
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              ></path>
            </svg>
            Exporting...
          </>
        ) : (
          'Export PDF'
        )}
      </button>

      <button
        onClick={handleExportDOCX}
        disabled={exporting !== null}
        className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center gap-2"
      >
        {exporting === 'docx' ? (
          <>
            <svg
              className="animate-spin h-4 w-4"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              ></circle>
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              ></path>
            </svg>
            Exporting...
          </>
        ) : (
          'Export DOCX'
        )}
      </button>

      <button
        onClick={handleExportMarkdown}
        disabled={exporting !== null}
        className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center gap-2"
      >
        {exporting === 'markdown' ? (
          <>
            <svg
              className="animate-spin h-4 w-4"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              ></circle>
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              ></path>
            </svg>
            Exporting...
          </>
        ) : (
          'Export Markdown'
        )}
      </button>

      <button
        onClick={handleExportTXT}
        disabled={exporting !== null}
        className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center gap-2"
      >
        {exporting === 'txt' ? (
          <>
            <svg
              className="animate-spin h-4 w-4"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              ></circle>
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              ></path>
            </svg>
            Exporting...
          </>
        ) : (
          'Export TXT'
        )}
      </button>
    </div>
  );
}
