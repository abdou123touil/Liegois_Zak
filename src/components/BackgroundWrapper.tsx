import { ReactNode } from "react";

interface BackgroundWrapperProps {
  children: ReactNode;
}

export default function BackgroundWrapper({ children }: BackgroundWrapperProps) {
  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Image de fond pains */}
      <div 
        className="absolute inset-0 bg-cover bg-center"
        style={{ backgroundImage: "url('https://images.unsplash.com/photo-1509440159596-0249088772ff?q=80&w=2072&auto=format&fit=crop')" }}
      />
      {/* Superposition turquoise avec opacité adaptée au thème */}
      <div className="absolute inset-0 bg-primary/60 backdrop-blur-sm" />
      
      {/* Contenu au-dessus */}
      <div className="relative z-10">
        {children}
      </div>
    </div>
  );
}