import { useState } from 'react';
import { CheckCircle } from 'lucide-react';

type RawTextInputProps = {
  onContentExtracted: (content: string) => void;
  disabled?: boolean;
};

const MAX_TEXT_SIZE = 5 * 1024 * 1024; // 5MB in characters (roughly)

export default function RawTextInput({
  onContentExtracted,
  disabled = false,
}: RawTextInputProps) {
  const [text, setText] = useState('');
  const [error, setError] = useState<string | null>(null);

  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newText = e.target.value;
    setError(null);

    if (newText.length > MAX_TEXT_SIZE) {
      setError(`Text exceeds maximum size of ${(MAX_TEXT_SIZE / 1024 / 1024).toFixed(0)}MB`);
      return;
    }

    setText(newText);
  };

  const handleSubmit = () => {
    if (!text.trim()) {
      setError('Please enter some text');
      return;
    }

    if (text.length > MAX_TEXT_SIZE) {
      setError(`Text exceeds maximum size of ${(MAX_TEXT_SIZE / 1024 / 1024).toFixed(0)}MB`);
      return;
    }

    setError(null);
    onContentExtracted(text);
  };

  const characterCount = text.length;
  const percentUsed = (characterCount / MAX_TEXT_SIZE) * 100;

  return (
    <div className="space-y-4">
      {/* Text Area */}
      <div className="space-y-2">
        <textarea
          placeholder="Paste your raw text content here..."
          value={text}
          onChange={handleTextChange}
          disabled={disabled}
          className="bnp-input min-h-[200px] font-mono text-sm resize-y"
        />
        
        {/* Character Count */}
        <div className="flex justify-between items-center text-xs text-bnp-text-muted">
          <span>{characterCount.toLocaleString()} characters</span>
          <span className={percentUsed > 90 ? 'text-orange-600 font-medium' : ''}>
            {percentUsed.toFixed(1)}% of limit
          </span>
        </div>
      </div>

      {/* Submit Button */}
      <button
        onClick={handleSubmit}
        disabled={disabled || !text.trim()}
        className="bnp-btn-primary w-full flex items-center justify-center gap-2"
      >
        <CheckCircle className="w-4 h-4" />
        Use This Text
      </button>

      {/* Error Message */}
      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600">
          {error}
        </div>
      )}
    </div>
  );
}
