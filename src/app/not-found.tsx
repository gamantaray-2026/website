import Link from "next/link";
import { Ship } from "lucide-react";

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center flex-1 w-full min-h-[70vh] font-mono text-sage-dingin">
      <div className="flex items-center space-x-10">
        <Ship 
          className="w-20 h-20 text-sage-dingin/80" 
          strokeWidth={1.5}
          style={{ animation: 'float 3s ease-in-out infinite' }}
        />
        <div className="flex items-center space-x-8">
          <h1 className="text-6xl font-medium tracking-tight border-r-2 border-sage-dingin/30 pr-8 text-kapur-muda">
            404
          </h1>
          <h2 className="text-2xl font-normal">
            Halaman tidak ditemukan.
          </h2>
        </div>
      </div>
      
      <div className="mt-16">
        <Link 
          href="/" 
          className="text-lg hover:text-lime-neon transition-colors underline underline-offset-8"
        >
          Kembali ke Beranda
        </Link>
      </div>

      <style>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px) rotate(-3deg); }
          50% { transform: translateY(-10px) rotate(3deg); }
        }
      `}</style>
    </div>
  );
}
