import { RefreshCw } from "lucide-react";

interface FormRetryButtonProps {
  label: string;
  onRetry: () => void;
}

export function FormRetryButton({ label, onRetry }: FormRetryButtonProps) {
  return (
    <button onClick={onRetry} className="flex items-center gap-2 text-xs text-gray-400 mt-1">
      <RefreshCw size={12} />
      {label}
    </button>
  );
}
