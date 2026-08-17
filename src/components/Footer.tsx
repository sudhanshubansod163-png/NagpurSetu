import React from 'react';

interface FooterProps {
  onOpenHelp?: () => void;
  onOpenPrivacy?: () => void;
  onOpenTerms?: () => void;
  onOpenAccessibility?: () => void;
}

export const Footer: React.FC<FooterProps> = ({
  onOpenHelp,
  onOpenPrivacy,
  onOpenTerms,
  onOpenAccessibility,
}) => {
  return (
    <footer className="w-full bg-[#EAEFF5] border-t border-slate-200 py-6 px-4 sm:px-6 lg:px-8 mt-auto" id="app-footer">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-slate-600">
        {/* Brand and Copyright */}
        <div className="flex flex-col sm:flex-row items-center gap-2 sm:gap-6 text-center sm:text-left">
          <span className="font-bold text-sm text-[#0B1E38]">NagpurSetu</span>
          <span className="text-slate-500">
            © 2024 Nagpur Municipal Corporation. NagpurSetu - Connecting Citizens.
          </span>
        </div>

        {/* Footer links */}
        <div className="flex items-center gap-6 text-slate-600 font-medium">
          <button
            onClick={onOpenPrivacy}
            className="hover:text-slate-900 transition-colors focus:outline-hidden"
            id="footer-link-privacy"
          >
            Privacy
          </button>
          <button
            onClick={onOpenAccessibility}
            className="hover:text-slate-900 transition-colors focus:outline-hidden"
            id="footer-link-accessibility"
          >
            Accessibility
          </button>
          <button
            onClick={onOpenHelp}
            className="hover:text-slate-900 transition-colors focus:outline-hidden"
            id="footer-link-help"
          >
            Help
          </button>
          <button
            onClick={onOpenTerms}
            className="hover:text-slate-900 transition-colors focus:outline-hidden"
            id="footer-link-terms"
          >
            Terms
          </button>
        </div>
      </div>
    </footer>
  );
};
