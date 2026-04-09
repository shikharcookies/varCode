import { useState, useEffect } from 'react';
import type { DocumentRequirements } from '../types';

type RequirementsFormProps = {
  onRequirementsChange: (requirements: DocumentRequirements) => void;
  disabled?: boolean;
  values?: DocumentRequirements;
};

const PURPOSE_OPTIONS = [
  'Educational',
  'Marketing',
  'Technical Documentation',
  'Research Summary',
  'Business Report',
  'Legal',
  'Other',
];

const TONE_OPTIONS = [
  'Professional',
  'Casual',
  'Formal',
  'Friendly',
  'Technical',
  'Academic',
];

const FORMAT_OPTIONS = [
  'Report',
  'Article',
  'White Paper',
  'Blog Post',
  'Summary',
  'Presentation',
  'Structured with headings',
  'Bullet points',
  'Narrative',
];

export default function RequirementsForm({
  onRequirementsChange,
  disabled = false,
  values,
}: RequirementsFormProps) {
  const [requirements, setRequirements] = useState<DocumentRequirements>({
    purpose: values?.purpose || 'Educational',
    tone: values?.tone || 'Professional',
    length: values?.length || '4',
    format: values?.format || 'Report',
    sections: values?.sections || '',
    audience: values?.audience || '',
  });

  // Sync with external values
  useEffect(() => {
    if (values) {
      setRequirements(values);
    }
  }, [values]);

  const handleChange = (field: keyof DocumentRequirements, value: string) => {
    const updated = { ...requirements, [field]: value };
    setRequirements(updated);
    onRequirementsChange(updated);
  };

  return (
    <div className="space-y-5">
      {/* Document Purpose */}
      <div className="space-y-2">
        <label className="block text-sm font-medium text-bnp-text">
          Document Purpose
        </label>
        <select
          value={requirements.purpose}
          onChange={(e) => handleChange('purpose', e.target.value)}
          disabled={disabled}
          className="bnp-select"
        >
          {PURPOSE_OPTIONS.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
      </div>

      {/* Tone */}
      <div className="space-y-2">
        <label className="block text-sm font-medium text-bnp-text">
          Tone
        </label>
        <select
          value={requirements.tone}
          onChange={(e) => handleChange('tone', e.target.value)}
          disabled={disabled}
          className="bnp-select"
        >
          {TONE_OPTIONS.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
      </div>

      {/* Desired Length */}
      <div className="space-y-2">
        <label className="block text-sm font-medium text-bnp-text">
          Desired Length
        </label>
        <input
          type="number"
          value={requirements.length}
          onChange={(e) => handleChange('length', e.target.value)}
          disabled={disabled}
          placeholder="e.g., 4 pages"
          className="bnp-input"
          min="1"
        />
      </div>

      {/* Format Style */}
      <div className="space-y-2">
        <label className="block text-sm font-medium text-bnp-text">
          Format Style
        </label>
        <select
          value={requirements.format}
          onChange={(e) => handleChange('format', e.target.value)}
          disabled={disabled}
          className="bnp-select"
        >
          {FORMAT_OPTIONS.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}

// Export validation function for use by parent component
export function validateRequirements(
  requirements: DocumentRequirements
): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];
  const fields: (keyof DocumentRequirements)[] = [
    'purpose',
    'tone',
    'length',
    'format',
  ];

  fields.forEach((field) => {
    if (!requirements[field]?.trim()) {
      errors.push(`${field.charAt(0).toUpperCase() + field.slice(1)} is required`);
    }
  });

  return {
    isValid: errors.length === 0,
    errors,
  };
}
