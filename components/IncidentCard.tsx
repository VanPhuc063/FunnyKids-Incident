import React, { useState, useEffect } from 'react';
import { Incident, Severity } from '../types';

interface IncidentCardProps {
  incident: Incident;
  onResolve: (id: string) => void;
}

const IncidentCard: React.FC<IncidentCardProps> = ({ incident, onResolve }) => {
  const isHighSeverity = incident.severity === Severity.HIGH;
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const images = incident.imageUrls || [];
  
  // Dynamic styles based on severity
  const severityStyles = {
    [Severity.HIGH]: "bg-red-50 border-fkRed text-red-800 shadow-red-200",
    [Severity.MEDIUM]: "bg-yellow-50 border-yellow-500 text-yellow-800",
    [Severity.LOW]: "bg-green-50 border-green-500 text-green-800",
  };

  const badgeStyles = {
    [Severity.HIGH]: "bg-fkRed text-white animate-pulse",
    [Severity.MEDIUM]: "bg-yellow-500 text-white",
    [Severity.LOW]: "bg-green-500 text-white",
  };

  const handlePrev = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentImageIndex(prev => (prev === 0 ? images.length - 1 : prev - 1));
  };

  const handleNext = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentImageIndex(prev => (prev === images.length - 1 ? 0 : prev + 1));
  };

  const openModal = () => setIsModalOpen(true);
  const closeModal = () => setIsModalOpen(false);

  // Keyboard navigation for modal
  useEffect(() => {
    if (!isModalOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeModal();
      if (e.key === 'ArrowLeft') setCurrentImageIndex(prev => (prev === 0 ? images.length - 1 : prev - 1));
      if (e.key === 'ArrowRight') setCurrentImageIndex(prev => (prev === images.length - 1 ? 0 : prev + 1));
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isModalOpen, images.length]);

  return (
    <div className={`
      relative p-4 rounded-xl border-l-8 shadow-sm transition-all duration-300
      ${severityStyles[incident.severity]}
      ${isHighSeverity && !incident.isResolved ? 'animate-flash-red ring-2 ring-red-400 ring-offset-2' : 'bg-white'}
      ${incident.isResolved ? 'opacity-60 grayscale-[50%]' : ''}
    `}>
      <div className="flex justify-between items-start mb-3">
        <div>
          <span className={`inline-block px-2 py-1 rounded text-xs font-bold uppercase tracking-wider mb-2 ${badgeStyles[incident.severity]}`}>
            {incident.severity === Severity.HIGH && <i className="fas fa-exclamation-circle mr-1"></i>}
            {incident.severity === 'HIGH' ? 'Nghiêm trọng' : incident.severity === 'MEDIUM' ? 'Trung bình' : 'Thấp'}
          </span>
          <h3 className="font-bold text-lg">{incident.title}</h3>
        </div>
        <span className="text-xs font-mono text-gray-500 bg-white/50 px-2 py-1 rounded">
          {new Date(incident.timestamp).toLocaleString('vi-VN')}
        </span>
      </div>

      <p className="mb-4 text-sm leading-relaxed whitespace-pre-line">{incident.description}</p>

      {/* Image Carousel */}
      {images.length > 0 && (
        <div className="mb-4">
          <div 
            className="relative rounded-lg overflow-hidden border border-black/10 bg-gray-100 aspect-video group cursor-zoom-in"
            onClick={openModal}
          >
            <img 
              src={images[currentImageIndex]} 
              alt={`Evidence ${currentImageIndex + 1}`} 
              className="w-full h-full object-cover transition-opacity duration-300" 
            />
            
            {/* Overlay Gradient on Hover */}
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors"></div>

            {/* Navigation Buttons for Card (only if > 1 image) */}
            {images.length > 1 && (
              <>
                <button 
                  onClick={handlePrev}
                  className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/40 hover:bg-black/60 text-white flex items-center justify-center transition-all opacity-0 group-hover:opacity-100 transform hover:scale-110"
                >
                  <i className="fas fa-chevron-left"></i>
                </button>
                <button 
                  onClick={handleNext}
                  className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/40 hover:bg-black/60 text-white flex items-center justify-center transition-all opacity-0 group-hover:opacity-100 transform hover:scale-110"
                >
                  <i className="fas fa-chevron-right"></i>
                </button>
                
                {/* Dots indicator */}
                <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex space-x-1.5 z-10">
                  {images.map((_, idx) => (
                    <div 
                      key={idx} 
                      className={`w-1.5 h-1.5 rounded-full shadow-sm transition-all ${idx === currentImageIndex ? 'bg-white scale-125' : 'bg-white/50'}`}
                    ></div>
                  ))}
                </div>
              </>
            )}
            
            {/* Image Counter Badge */}
            <div className="absolute top-2 right-2 bg-black/60 text-white text-[10px] px-2 py-0.5 rounded-full backdrop-blur-sm font-bold tracking-wide">
              {currentImageIndex + 1}/{images.length}
            </div>
            
            {/* Zoom Icon Hint */}
            <div className="absolute bottom-2 right-2 text-white/80 text-xs opacity-0 group-hover:opacity-100 transition-opacity">
               <i className="fas fa-search-plus"></i> Xem chi tiết
            </div>
          </div>
        </div>
      )}

      <div className="flex justify-between items-center border-t border-black/10 pt-3">
        <div className="flex flex-col">
          <span className="text-sm font-bold flex items-center">
            <i className="fas fa-user-circle mr-2 text-lg opacity-50"></i>
            {incident.reporterName}
          </span>
          {incident.reporterRole && (
            <span className="text-xs ml-7 opacity-70 uppercase tracking-wide">
              {incident.reporterRole}
            </span>
          )}
        </div>
        
        {!incident.isResolved ? (
          <button 
            onClick={() => onResolve(incident.id)}
            className="px-3 py-1 bg-white border border-gray-300 rounded text-sm hover:bg-gray-50 font-medium text-gray-600 transition-colors"
          >
            Đánh dấu đã xử lý
          </button>
        ) : (
          <span className="text-green-700 font-bold text-sm flex items-center">
            <i className="fas fa-check mr-1"></i> Đã xử lý
          </span>
        )}
      </div>

      {/* Fullscreen Modal */}
      {isModalOpen && (
        <div 
          className="fixed inset-0 z-[100] bg-black/95 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in"
          onClick={closeModal}
        >
          <button 
            className="absolute top-4 right-4 text-white/70 hover:text-white text-4xl z-50 focus:outline-none"
            onClick={closeModal}
          >
            &times;
          </button>

          <div className="relative w-full max-w-7xl max-h-screen flex flex-col items-center" onClick={e => e.stopPropagation()}>
            <img 
              src={images[currentImageIndex]} 
              alt="Evidence Full" 
              className="max-h-[85vh] max-w-full object-contain rounded shadow-2xl"
            />
            
            <div className="mt-4 text-white text-sm bg-white/10 px-4 py-2 rounded-full backdrop-blur-md border border-white/20">
              Hình ảnh {currentImageIndex + 1} / {images.length}
            </div>

            {images.length > 1 && (
              <>
                <button 
                  onClick={handlePrev}
                  className="absolute left-2 md:left-4 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center backdrop-blur transition-all hover:scale-110"
                >
                  <i className="fas fa-chevron-left text-2xl"></i>
                </button>
                <button 
                  onClick={handleNext}
                  className="absolute right-2 md:right-4 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center backdrop-blur transition-all hover:scale-110"
                >
                  <i className="fas fa-chevron-right text-2xl"></i>
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default IncidentCard;