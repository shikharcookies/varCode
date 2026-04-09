import { useState, useRef } from 'react';
import { Upload, FileText, Loader2 } from 'lucide-react';
import { uploadFile } from '../services/api.service';

type FileUploadProps = {
  onContentExtracted: (content: string) => void;
  disabled?: boolean;
};

const SUPPORTED_EXTENSIONS = ['.pdf', '.docx', '.txt'];
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

export default function FileUpload({
  onContentExtracted,
  disabled = false,
}: FileUploadProps) {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const validateFile = (file: File): string | null => {
    if (file.size > MAX_FILE_SIZE) {
      return 'File size exceeds 10MB limit';
    }

    const extension = '.' + file.name.split('.').pop()?.toLowerCase();
    if (!SUPPORTED_EXTENSIONS.includes(extension)) {
      return 'Unsupported file type. Please upload PDF, DOCX, or TXT files.';
    }

    return null;
  };

  const handleFile = (selectedFile: File) => {
    setError(null);

    const validationError = validateFile(selectedFile);
    if (validationError) {
      setError(validationError);
      return;
    }

    setFile(selectedFile);
  };

  const handleUpload = async () => {
    if (!file) return;

    setLoading(true);
    setError(null);

    try {
      const content = await uploadFile(file);
      onContentExtracted(content);
      setError(null);
    } catch (err: any) {
      setError(err.message || 'Failed to upload file');
    } finally {
      setLoading(false);
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (disabled || loading) return;

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0]);
    }
  };

  const handleButtonClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="space-y-4">
      <div
        className={`relative border-2 border-dashed rounded-xl p-8 text-center transition-all duration-200 ${
          dragActive
            ? 'border-bnp-green bg-bnp-green/5'
            : 'border-bnp-border hover:border-bnp-green/50 bg-white'
        } ${disabled || loading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        onClick={handleButtonClick}
      >
        <input
          ref={fileInputRef}
          type="file"
          className="hidden"
          accept={SUPPORTED_EXTENSIONS.join(',')}
          onChange={handleChange}
          disabled={disabled || loading}
        />

        <div className="flex flex-col items-center gap-3">
          <div className="w-12 h-12 rounded-full bg-bnp-bg flex items-center justify-center">
            <Upload className="w-6 h-6 text-bnp-green" />
          </div>
          <div className="text-sm text-bnp-text">
            {file ? (
              <span className="font-medium flex items-center gap-2">
                <FileText className="w-4 h-4 text-bnp-green" />
                {file.name}
              </span>
            ) : (
              <>
                <span className="font-medium text-bnp-green">Click to upload</span>
                {' '}or drag and drop
              </>
            )}
          </div>
          <div className="text-xs text-bnp-text-muted">
            PDF, DOCX, or TXT (max 10MB)
          </div>
        </div>
      </div>

      {file && !loading && (
        <button
          onClick={handleUpload}
          disabled={disabled}
          className="bnp-btn-primary w-full flex items-center justify-center gap-2"
        >
          <Upload className="w-4 h-4" />
          Upload and Extract
        </button>
      )}

      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600">
          {error}
        </div>
      )}

      {loading && (
        <div className="flex items-center justify-center gap-2 text-bnp-text-muted">
          <Loader2 className="w-4 h-4 animate-spin" />
          <span className="text-sm">Uploading and extracting content...</span>
        </div>
      )}
    </div>
  );
}
