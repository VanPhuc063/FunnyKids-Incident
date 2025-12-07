import React, { useRef, useState, useEffect } from 'react';

interface WatermarkCameraProps {
  images: string[];
  onImagesChange: (images: string[]) => void;
}

const WatermarkCamera: React.FC<WatermarkCameraProps> = ({ images, onImagesChange }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [viewingIndex, setViewingIndex] = useState<number | null>(null);

  // Handle keyboard navigation for modal
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (viewingIndex === null) return;
      
      if (e.key === 'Escape') setViewingIndex(null);
      if (e.key === 'ArrowLeft' && viewingIndex > 0) setViewingIndex(viewingIndex - 1);
      if (e.key === 'ArrowRight' && viewingIndex < images.length - 1) setViewingIndex(viewingIndex + 1);
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [viewingIndex, images.length]);

  const processImage = (file: File): Promise<string> => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d');
          
          if (!ctx) {
            resolve('');
            return;
          }

          // Resize for performance/storage (max 1280px width)
          const maxWidth = 1280;
          const scale = maxWidth / img.width;
          const width = scale < 1 ? maxWidth : img.width;
          const height = scale < 1 ? img.height * scale : img.height;

          canvas.width = width;
          canvas.height = height;

          // Draw Image
          ctx.drawImage(img, 0, 0, width, height);

          // Add Watermark
          const dateStr = new Date().toLocaleString('vi-VN', { 
            hour12: false,
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit'
          });

          const fontSize = Math.max(16, width * 0.03);
          ctx.font = `bold ${fontSize}px sans-serif`;
          ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
          ctx.shadowColor = 'rgba(0, 0, 0, 0.8)';
          ctx.shadowBlur = 4;
          ctx.shadowOffsetX = 2;
          ctx.shadowOffsetY = 2;
          
          const textMetrics = ctx.measureText(dateStr);
          const padding = 20;
          const x = width - textMetrics.width - padding;
          const y = height - padding;

          ctx.fillText(dateStr, x, y);

          resolve(canvas.toDataURL('image/jpeg', 0.8));
        };
        img.src = e.target?.result as string;
      };
      reader.readAsDataURL(file);
    });
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setIsProcessing(true);
      const remainingSlots = 6 - images.length;
      const filesToProcess = Array.from(e.target.files).slice(0, remainingSlots);
      
      const newImages = await Promise.all(filesToProcess.map(processImage));
      onImagesChange([...images, ...newImages]);
      setIsProcessing(false);
      
      // Reset input so same file can be selected again if needed
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const removeImage = (index: number) => {
    const newImages = images.filter((_, i) => i !== index);
    onImagesChange(newImages);
    
    // Close modal if the deleted image was being viewed
    if (viewingIndex === index) {
      setViewingIndex(null);
    } else if (viewingIndex !== null && viewingIndex > index) {
      // Adjust index if a previous image was deleted
      setViewingIndex(viewingIndex - 1);
    }
  };

  return (
    <div className="space-y-4">
      {/* Grid of images */}
      {images.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {images.map((img, idx) => (
            <div key={idx} className="relative group rounded-lg overflow-hidden border border-gray-200 shadow-sm aspect-video bg-gray-100 cursor-pointer" onClick={() => setViewingIndex(idx)}>
              <img src={img} alt={`Evidence ${idx + 1}`} className="w-full h-full object-cover transition-transform group-hover:scale-105" />
              
              {/* Delete Button */}
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); removeImage(idx); }}
                className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs shadow-md hover:bg-red-600 transition-colors z-10"
                title="Xóa ảnh"
              >
                <i className="fas fa-times"></i>
              </button>

              {/* Hover Overlay */}
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center pointer-events-none">
                <i className="fas fa-search-plus text-white opacity-0 group-hover:opacity-100 text-2xl drop-shadow-lg transform scale-50 group-hover:scale-100 transition-all"></i>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Upload Button */}
      {images.length < 6 && (
        <div 
          onClick={() => !isProcessing && fileInputRef.current?.click()}
          className={`border-2 border-dashed border-indigo-500 bg-white rounded-lg p-6 flex flex-col items-center justify-center transition-colors ${
            isProcessing ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:bg-indigo-50'
          }`}
        >
          <input 
            type="file" 
            accept="image/*" 
            multiple
            className="hidden" 
            ref={fileInputRef}
            onChange={handleFileChange}
          />
          {isProcessing ? (
            <div className="text-indigo-600 font-medium animate-pulse">Đang xử lý ảnh...</div>
          ) : (
            <>
              <i className="fas fa-camera text-3xl text-indigo-600 mb-2"></i>
              <p className="text-sm text-black font-medium text-center">
                Thêm ảnh ({images.length}/6)<br/>
                <span className="text-xs font-normal text-gray-500">(Tự động đóng dấu ngày giờ)</span>
              </p>
            </>
          )}
        </div>
      )}

      {/* Fullscreen Image Modal */}
      {viewingIndex !== null && (
        <div 
          className="fixed inset-0 z-[100] bg-black/95 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in"
          onClick={() => setViewingIndex(null)}
        >
          {/* Close Button */}
          <button 
            className="absolute top-4 right-4 text-white/70 hover:text-white text-4xl z-50 focus:outline-none transition-colors"
            onClick={(e) => { e.stopPropagation(); setViewingIndex(null); }}
          >
            &times;
          </button>

          {/* Image Container */}
          <div className="relative max-w-7xl max-h-screen w-full flex flex-col items-center" onClick={(e) => e.stopPropagation()}>
            <img 
              src={images[viewingIndex]} 
              alt={`Evidence Full ${viewingIndex + 1}`} 
              className="max-h-[85vh] max-w-full object-contain rounded shadow-2xl"
            />
            
            <div className="mt-4 text-white text-sm bg-white/10 px-4 py-2 rounded-full backdrop-blur-md border border-white/20">
              Hình ảnh {viewingIndex + 1} / {images.length}
            </div>

            {/* Navigation Buttons */}
            {images.length > 1 && (
              <>
                <button 
                  className={`absolute left-2 md:left-4 top-1/2 -translate-y-1/2 w-12 h-12 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 text-white backdrop-blur transition-all ${viewingIndex === 0 ? 'opacity-30 cursor-not-allowed' : 'hover:scale-110'}`}
                  onClick={(e) => {
                    e.stopPropagation();
                    if (viewingIndex > 0) setViewingIndex(viewingIndex - 1);
                  }}
                  disabled={viewingIndex === 0}
                >
                  <i className="fas fa-chevron-left text-xl"></i>
                </button>
                <button 
                  className={`absolute right-2 md:right-4 top-1/2 -translate-y-1/2 w-12 h-12 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 text-white backdrop-blur transition-all ${viewingIndex === images.length - 1 ? 'opacity-30 cursor-not-allowed' : 'hover:scale-110'}`}
                  onClick={(e) => {
                    e.stopPropagation();
                    if (viewingIndex < images.length - 1) setViewingIndex(viewingIndex + 1);
                  }}
                  disabled={viewingIndex === images.length - 1}
                >
                  <i className="fas fa-chevron-right text-xl"></i>
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default WatermarkCamera;