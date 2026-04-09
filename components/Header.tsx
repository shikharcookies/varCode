import { HelpCircle, Settings, User, FileText } from 'lucide-react';

export default function Header() {
  return (
    <header className="bnp-header">
      {/* Left Side - Logo and Title */}
      <div className="flex items-center gap-3">
        <div className="flex items-center justify-center w-10 h-10 bg-white/20 rounded-lg">
          <FileText className="w-6 h-6 text-white" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-white">GenAI Document Creator</h1>
          <p className="text-xs text-white/80 hidden sm:block">
            AI-powered Structured Document Generation Platform
          </p>
        </div>
      </div>

      {/* Right Side - Icons */}
      <div className="flex items-center gap-2">
        <button
          className="p-2 rounded-lg hover:bg-white/20 transition-colors"
          aria-label="Help"
        >
          <HelpCircle className="w-5 h-5 text-white" />
        </button>
        <button
          className="p-2 rounded-lg hover:bg-white/20 transition-colors"
          aria-label="Settings"
        >
          <Settings className="w-5 h-5 text-white" />
        </button>
        <button
          className="p-2 rounded-lg hover:bg-white/20 transition-colors"
          aria-label="User Profile"
        >
          <User className="w-5 h-5 text-white" />
        </button>
      </div>
    </header>
  );
}
