import { Loader2 } from 'lucide-react';
import { Button } from './ui/button';

type GenerateButtonProps = {
  onClick: () => void;
  disabled?: boolean;
  loading?: boolean;
};

export default function GenerateButton({
  onClick,
  disabled = false,
  loading = false,
}: GenerateButtonProps) {
  return (
    <Button
      onClick={onClick}
      disabled={disabled || loading}
      size="lg"
      className="w-full"
    >
      {loading ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Generating Document...
        </>
      ) : (
        'Generate Document'
      )}
    </Button>
  );
}
