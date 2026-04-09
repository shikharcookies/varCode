import { useState } from 'react';
import { Section } from '../lib/section-utils';

interface SectionControlsProps {
  sections: Section[];
  onRegenerateSection: (sectionId: string) => Promise<void>;
}

export function SectionControls({ sections, onRegenerateSection }: SectionControlsProps) {
  const [regeneratingSection, setRegeneratingSection] = useState<string | null>(null);

  const handleRegenerate = async (sectionId: string) => {
    setRegeneratingSection(sectionId);
    try {
      await onRegenerateSection(sectionId);
    } finally {
      setRegeneratingSection(null);
    }
  };

  if (sections.length === 0) {
    return null;
  }

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">Document Sections</h3>
      <div className="space-y-2">
        {sections.map((section) => (
          <div
            key={section.id}
            className="flex items-center justify-between p-3 border rounded-lg bg-white hover:bg-gray-50"
          >
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-gray-500">
                  H{section.level}
                </span>
                <h4 className="font-medium">{section.title}</h4>
              </div>
              <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                {section.content.substring(0, 100)}
                {section.content.length > 100 ? '...' : ''}
              </p>
            </div>
            <button
              onClick={() => handleRegenerate(section.id)}
              disabled={regeneratingSection === section.id}
              className="ml-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              {regeneratingSection === section.id ? (
                <span className="flex items-center gap-2">
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
                  Regenerating...
                </span>
              ) : (
                'Regenerate'
              )}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
