import { useState } from 'react';
import { Loader2, Link } from 'lucide-react';
import { scrapeURL } from '../services/api.service';

type URLInputProps = {
  onContentExtracted: (content: string) => void;
  disabled?: boolean;
};

export default function URLInput({
  onContentExtracted,
  disabled = false,
}: URLInputProps) {
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const validateURL = (urlString: string): boolean => {
    try {
      new URL(urlString);
      return true;
    } catch {
      return false;
    }
  };

  const handleScrape = async () => {
    setError(null);

    if (!url.trim()) {
      setError('Please enter a URL');
      return;
    }

    if (!validateURL(url)) {
      setError('Please enter a valid URL (e.g., https://example.com)');
      return;
    }

    setLoading(true);

    try {
      const content = await scrapeURL(url);
      onContentExtracted(content);
      setError(null);
    } catch (err: any) {
      setError(err.message || 'Failed to scrape URL');
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !loading && !disabled) {
      handleScrape();
    }
  };

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <label className="block text-sm font-medium text-bnp-text">
          Full URL
        </label>
        <input
          type="url"
          placeholder="https://news.bnp.paribas.com/article-url..."
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          onKeyPress={handleKeyPress}
          disabled={loading || disabled}
          className="bnp-input"
        />
      </div>

      <button
        onClick={handleScrape}
        disabled={loading || disabled || !url.trim()}
        className="bnp-btn-accent w-full flex items-center justify-center gap-2"
      >
        {loading ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            Scraping URL...
          </>
        ) : (
          <>
            <Link className="w-4 h-4" />
            Scrape URL
          </>
        )}
      </button>

      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600">
          {error}
        </div>
      )}

      {loading && (
        <p className="text-sm text-bnp-text-muted animate-pulse-soft">
          Fetching content from URL...
        </p>
      )}
    </div>
  );
}
