import { Layers } from 'lucide-react';

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex flex-col bg-[--color-background-secondary]">
      {/* Centered content with logo */}
      <main className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-md animate-fade-in">
          {/* Centered logo */}
          <div className="flex flex-col items-center gap-2 mb-8">
            <div className="w-12 h-12 rounded-xl bg-[--color-accent-blue] flex items-center justify-center">
              <Layers className="w-7 h-7 text-white" />
            </div>
            <span className="font-semibold text-xl text-[--color-label-primary]">
              Data2Decision
            </span>
          </div>
          {children}
        </div>
      </main>

      {/* Footer */}
      <footer className="py-6 px-8 text-center text-sm text-[--color-label-tertiary]">
        <p>The AI-native data intelligence platform for enterprises</p>
      </footer>
    </div>
  );
}
