import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  CheckCircle,
  Loader2,
  Settings,
  Eye,
  Download,
  RefreshCw,
  Share2,
  FileText,
  Upload,
  Link,
  AlignLeft,
} from 'lucide-react';
import Header from '../components/Header';
import RequirementsForm, { validateRequirements } from '../components/RequirementsForm';
import URLInput from '../components/URLInput';
import FileUpload from '../components/FileUpload';
import RawTextInput from '../components/RawTextInput';
import { generateDocument } from '../services/api.service';
import type { DocumentRequirements } from '../types';

type SourceTab = 'url' | 'file' | 'text';

export default function DocumentBuilderPage() {
  const navigate = useNavigate();
  const [sourceContent, setSourceContent] = useState<string>('');
  const [activeTab, setActiveTab] = useState<SourceTab>('url');
  const [contentReady, setContentReady] = useState(false);
  const [requirements, setRequirements] = useState<DocumentRequirements>({
    purpose: 'Educational',
    tone: 'Professional',
    length: '4',
    format: 'Report',
    sections: '',
    audience: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showGeneratedDoc, setShowGeneratedDoc] = useState(false);
  const [generatedDoc, setGeneratedDoc] = useState<{
    title: string;
    description: string;
    company: string;
  } | null>(null);

  const handleContentExtracted = (content: string) => {
    setSourceContent(content);
    setContentReady(true);
    setError(null);
  };

  const handleClear = () => {
    setSourceContent('');
    setContentReady(false);
    setShowGeneratedDoc(false);
    setGeneratedDoc(null);
    setError(null);
  };

  const handleRequirementsChange = (newRequirements: DocumentRequirements) => {
    setRequirements(newRequirements);
    setError(null);
  };

  const handleGenerate = async () => {
    setError(null);

    // Validate source content
    if (!sourceContent.trim()) {
      setError('Please provide source material (URL, file, or text)');
      return;
    }

    // Validate requirements
    const validation = validateRequirements(requirements);
    if (!validation.isValid) {
      setError(`Please fill in all required fields: ${validation.errors.join(', ')}`);
      return;
    }

    setLoading(true);

    try {
      const generatedDocument = await generateDocument(sourceContent, requirements);

      // Store the generated document in sessionStorage for the preview page
      sessionStorage.setItem('generatedDocument', generatedDocument);
      sessionStorage.setItem('documentRequirements', JSON.stringify(requirements));
      sessionStorage.setItem('sourceContent', sourceContent);

      // Set generated document for display
      setGeneratedDoc({
        company: 'BNP PARIBAS',
        title: "Generating Sustainable Value: BNP Paribas' Strategic Insights",
        description:
          'BNP Paribas is at the forefront of sustainable finance, innovating to create long-term value for stakeholders while addressing global environmental and social challenges.',
      });
      
      // Show generated document section
      setShowGeneratedDoc(true);

      // Navigate to preview page after a brief delay
      setTimeout(() => {
        navigate('/preview');
      }, 2000);
    } catch (err: any) {
      setError(err.message || 'Failed to generate document');
    } finally {
      setLoading(false);
    }
  };

  const handlePreview = () => {
    if (generatedDoc || sourceContent) {
      navigate('/preview');
    }
  };

  const canGenerate = sourceContent.trim().length > 0 && !loading;

  const tabs = [
    { id: 'url', label: 'Upload File', icon: Link },
    { id: 'file', label: 'Upload File', icon: Upload },
    { id: 'text', label: 'Raw Text', icon: AlignLeft },
  ];

  return (
    <div className="min-h-screen bg-bnp-bg">
      {/* Header */}
      <Header />

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Two Column Grid */}
        <div className="bnp-main-grid">
          {/* Left Section - Source Material */}
          <div className="bnp-card overflow-hidden">
            {/* Card Header */}
            <div className="bnp-card-header">
              <CheckCircle className="w-5 h-5" />
              <span>Source Material</span>
            </div>

            {/* Card Content */}
            <div className="p-5 space-y-5">
              {/* Tab Toggle */}
              <div className="bnp-tabs">
                {tabs.map((tab) => {
                  const Icon = tab.icon;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id as SourceTab)}
                      className={`bnp-tab ${activeTab === tab.id ? 'bnp-tab-active' : ''}`}
                    >
                      <Icon className="w-4 h-4" />
                      <span className="hidden sm:inline">{tab.label}</span>
                    </button>
                  );
                })}
              </div>

              {/* Tab Content */}
              <div className="space-y-4">
                {activeTab === 'url' && (
                  <URLInput
                    onContentExtracted={handleContentExtracted}
                    disabled={loading}
                  />
                )}
                {activeTab === 'file' && (
                  <FileUpload
                    onContentExtracted={handleContentExtracted}
                    disabled={loading}
                  />
                )}
                {activeTab === 'text' && (
                  <RawTextInput
                    onContentExtracted={handleContentExtracted}
                    disabled={loading}
                  />
                )}
              </div>

              {/* Action Buttons - Only Clear Button */}
              <div className="flex flex-wrap gap-3 pt-2">
                <button
                  onClick={handleClear}
                  disabled={loading}
                  className="bnp-btn-secondary flex items-center gap-2 text-sm"
                >
                  <RefreshCw className="w-4 h-4" />
                  Clear
                </button>
              </div>

              {/* Status Indicator */}
              <div className="bnp-status">
                {contentReady ? (
                  <>
                    <CheckCircle className="w-4 h-4 text-bnp-green" />
                    <span className="bnp-status-success font-medium">
                      Status: Content Ready
                    </span>
                  </>
                ) : (
                  <>
                    <div className="w-4 h-4 rounded-full border-2 border-gray-300" />
                    <span className="text-gray-500">Status: Waiting for content...</span>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Right Section - Document Requirements */}
          <div className="bnp-card overflow-hidden">
            {/* Card Header */}
            <div className="bnp-card-header">
              <FileText className="w-5 h-5" />
              <span>Document Requirements</span>
            </div>

            {/* Card Content */}
            <div className="p-5">
              <RequirementsForm
                onRequirementsChange={handleRequirementsChange}
                disabled={loading}
                values={requirements}
              />
            </div>
          </div>
        </div>

        {/* Primary Action Buttons */}
        <div className="flex items-center gap-3 mt-6">
          <button
            onClick={handleGenerate}
            disabled={!canGenerate}
            className="bnp-btn-primary flex-1 flex items-center justify-center gap-2 py-4 text-base"
          >
            {loading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Generating Document...
              </>
            ) : (
              <>
                <Settings className="w-5 h-5" />
                Generate Document
              </>
            )}
          </button>
          <button
            onClick={handlePreview}
            disabled={!sourceContent}
            className="bnp-btn-accent flex-1 flex items-center justify-center gap-2 py-4 text-base"
          >
            <Eye className="w-5 h-5" />
            Preview Document
          </button>
        </div>

        {/* Error Display */}
        {error && (
          <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
            {error}
          </div>
        )}

        {/* Loading State Info */}
        {loading && (
          <div className="mt-4 text-center text-bnp-text-muted text-sm animate-pulse-soft">
            <p>This may take 30-60 seconds depending on the content size...</p>
          </div>
        )}

        {/* Generated Document Section - Only shown after generation */}
        {showGeneratedDoc && generatedDoc && (
          <div className="mt-6 animate-fade-in transition-all duration-300 ease-out">
            {/* Section Title */}
            <h2 className="bnp-section-title mb-4">
              <FileText className="w-5 h-5 text-bnp-green" />
              Generated Document
            </h2>

            {/* Document Card */}
            <div className="bnp-doc-card">
              {/* Left Side - Document Info */}
              <div className="flex items-start gap-4">
                {/* Company Logo */}
                <div className="flex-shrink-0 w-12 h-12 bg-bnp-green rounded-lg flex items-center justify-center">
                  <FileText className="w-6 h-6 text-white" />
                </div>

                {/* Document Details */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-bnp-green uppercase tracking-wide">
                    {generatedDoc?.company || 'BNP PARIBAS'}
                  </p>
                  <h3 className="text-lg font-bold text-bnp-text mt-1">
                    {generatedDoc?.title ||
                      "Generating Sustainable Value: BNP Paribas' Strategic Insights"}
                  </h3>
                  <p className="text-sm text-bnp-text-muted mt-2 line-clamp-2">
                    {generatedDoc?.description ||
                      'BNP Paribas is at the forefront of sustainable finance, innovating to create long-term value for stakeholders while addressing global environmental and social challenges.'}
                  </p>
                </div>
              </div>

              {/* Right Side - Action Buttons */}
              <div className="flex flex-wrap gap-2 sm:flex-nowrap">
                <button className="bnp-btn-primary flex items-center gap-2 text-sm whitespace-nowrap">
                  <Download className="w-4 h-4" />
                  Download Document
                </button>
                <button className="bnp-btn-secondary flex items-center gap-2 text-sm whitespace-nowrap">
                  <RefreshCw className="w-4 h-4" />
                  Regenerate
                </button>
                <button className="bnp-btn-outline flex items-center gap-2 text-sm whitespace-nowrap">
                  <Share2 className="w-4 h-4" />
                  Share
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}