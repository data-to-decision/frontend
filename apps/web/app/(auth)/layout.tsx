import { Layers } from 'lucide-react';

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex flex-col bg-[--color-background-secondary]">
      {/* Header with logo */}
      <header className="py-6 px-8">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-[--color-accent-blue] flex items-center justify-center">
            <Layers className="w-5 h-5 text-white" />
          </div>
          <span className="font-semibold text-lg text-[--color-label-primary]">
            Data2Decision
          </span>
        </div>
      </header>

      {/* Centered content */}
      <main className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-md animate-fade-in">{children}</div>
      </main>

      {/* Footer */}
      <footer className="py-6 px-8 text-center text-sm text-[--color-label-tertiary]">
        <p>The AI-native data intelligence platform for enterprises</p>
      </footer>
    </div>
  );
}
