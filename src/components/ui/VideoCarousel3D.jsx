import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

const VIDEOS = [
  { id: 0, src: '/videos/ClubDigital.mp4', label: 'Club Digital' },
  { id: 1, src: '/videos/Gamificacion.mp4', label: 'Gamificación' },
  { id: 2, src: '/videos/GestionTotal.mp4', label: 'Gestión Total' },
  { id: 3, src: '/videos/OperativaAutomatizada.mp4', label: 'Operativa Automatizada' },
];

/**
 * Componente que muestra un carrusel interactivo en formato 3D (Coverflow).
 * Gira alrededor de un eje central imitando la órbita de un planeta.
 */
export default function VideoCarousel3D() {
  const [currentIndex, setCurrentIndex] = useState(0);

  const [hoverPos, setHoverPos] = useState({ x: 50, y: 50 });
  const [hoveredId, setHoveredId] = useState(null);

  const handleNext = () => setCurrentIndex((prev) => (prev + 1) % 4);
  const handlePrev = () => setCurrentIndex((prev) => (prev - 1 + 4) % 4);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'ArrowRight') handleNext();
      if (e.key === 'ArrowLeft') handlePrev();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const getTransform = (index) => {
    const diff = (index - currentIndex + 4) % 4;
    if (diff === 0) return { transform: 'translateX(0) scale(1)', zIndex: 50, opacity: 1, filter: 'blur(0px)' };
    if (diff === 1) return { transform: 'translateX(85%) scale(0.75)', zIndex: 30, opacity: 0.5, filter: 'blur(4px)' };
    if (diff === 2) return { transform: 'translateX(0) scale(0.5)', zIndex: 10, opacity: 0, filter: 'blur(10px)' };
    if (diff === 3) return { transform: 'translateX(-85%) scale(0.75)', zIndex: 30, opacity: 0.5, filter: 'blur(4px)' };
    return {};
  };

  const handleMouseMove = (e, videoId) => {
    if (currentIndex !== videoId) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    setHoverPos({ x, y });
  };

  return (
    <div className="relative w-full max-w-6xl mx-auto h-[350px] sm:h-[450px] md:h-[600px] flex items-center justify-center overflow-hidden">

      {VIDEOS.map((video, index) => {
        const style = getTransform(index);
        const isActive = index === currentIndex;
        const isHovered = isActive && hoveredId === video.id;

        return (
          <div
            key={video.id}
            className="absolute top-1/2 left-1/2 w-[170px] sm:w-[230px] md:w-[300px] aspect-[9/16] rounded-3xl overflow-hidden shadow-2xl transition-all duration-700 ease-[cubic-bezier(0.5,-0.2,0.3,1.25)] cursor-pointer"
            style={{
              ...style,
              transform: `translate(-50%, -50%) ${style.transform}`,
              border: isActive ? '2px solid rgba(204,255,0,0.4)' : '1px solid rgba(255,255,255,0.05)'
            }}
            onClick={() => setCurrentIndex(index)}
            onMouseMove={(e) => handleMouseMove(e, index)}
            onMouseEnter={() => setHoveredId(video.id)}
            onMouseLeave={() => { setHoveredId(null); setHoverPos({ x: 50, y: 50 }); }}
            title={!isActive ? "Haz clic para traer al frente" : ""}
          >
            {/* Oscurecedor para vídeos en segundo plano */}
            <div className={`absolute inset-0 bg-[#0F0F1A] transition-opacity duration-700 pointer-events-none z-20 ${isActive ? 'opacity-0' : 'opacity-60'}`} />

            <video
              src={video.src}
              autoPlay
              loop
              muted
              playsInline
              className="w-full h-full object-cover transition-transform duration-300 ease-out z-10"
              style={{
                transformOrigin: `${hoverPos.x}% ${hoverPos.y}%`,
                transform: isHovered ? 'scale(1.3)' : 'scale(1)'
              }}
            />
          </div>
        );
      })}

      {/* Controles Laterales */}
      <div className="absolute top-1/2 -translate-y-1/2 w-full flex justify-between px-2 sm:px-8 md:px-12 z-50 pointer-events-none">
        <button
          onClick={handlePrev}
          aria-label="Vídeo anterior"
          className="w-10 h-10 sm:w-14 sm:h-14 rounded-full bg-black/40 border border-white/10 flex items-center justify-center text-white pointer-events-auto hover:bg-brand-lime hover:text-black hover:scale-110 hover:shadow-[0_0_20px_rgba(204,255,0,0.3)] transition-all backdrop-blur-md"
        >
          <ChevronLeft size={24} />
        </button>
        <button
          onClick={handleNext}
          aria-label="Siguiente vídeo"
          className="w-10 h-10 sm:w-14 sm:h-14 rounded-full bg-black/40 border border-white/10 flex items-center justify-center text-white pointer-events-auto hover:bg-brand-lime hover:text-black hover:scale-110 hover:shadow-[0_0_20px_rgba(204,255,0,0.3)] transition-all backdrop-blur-md"
        >
          <ChevronRight size={24} />
        </button>
      </div>

    </div>
  );
}
