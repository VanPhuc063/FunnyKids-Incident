
import React, { useState, useEffect } from 'react';
import { Incident, Severity, IncidentType, DeviceStatus, BRANCHES } from '../types';
import WatermarkCamera from './WatermarkCamera';

interface IncidentCardProps {
  incident: Incident;
  onUpdate: (id: string, updates: Partial<Incident>) => Promise<void>;
}

const IncidentCard: React.FC<IncidentCardProps> = ({ incident, onUpdate }) => {
  const isHighSeverity = incident.severity === Severity.HIGH;
  const [isExpanded, setIsExpanded] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  // Resolution Popup State
  const [isResolvePopupOpen, setIsResolvePopupOpen] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  
  // Form State for Popup
  const [resolutionNote, setResolutionNote] = useState('');
  const [resolutionImages, setResolutionImages] = useState<string[]>([]);
  const [setupResponse, setSetupResponse] = useState('');
  const [deviceStatus, setDeviceStatus] = useState<DeviceStatus | ''>('');
  
  const [resolveError, setResolveError] = useState('');

  const images = incident.imageUrls || [];
  
  const [resViewerIndex, setResViewerIndex] = useState<number | null>(null);

  // Helper: Check if incident is related to equipment (Device or Game)
  const isEquipmentIssue = incident.type === IncidentType.DEVICE || incident.type === IncidentType.GAME;

  useEffect(() => {
    if (isResolvePopupOpen) {
      setResolutionNote(incident.resolutionNote || '');
      setResolutionImages(incident.resolutionImageUrls || []);
      setSetupResponse(incident.setupResponse || '');
      setDeviceStatus(incident.deviceStatus || '');
      setResolveError('');
    }
  }, [isResolvePopupOpen, incident]);

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

  const deviceStatusLabels = {
    [DeviceStatus.UNSAFE]: 'Không an toàn',
    [DeviceStatus.BROKEN]: 'Hỏng hẳn',
    [DeviceStatus.WAITING_PARTS]: 'Chờ đồ thay',
    [DeviceStatus.FIXED]: 'Đã sửa',
  };

  const deviceStatusColors = {
    [DeviceStatus.UNSAFE]: 'bg-red-100 text-red-700 border-red-200',
    [DeviceStatus.BROKEN]: 'bg-gray-100 text-gray-700 border-gray-200',
    [DeviceStatus.WAITING_PARTS]: 'bg-orange-100 text-orange-700 border-orange-200',
    [DeviceStatus.FIXED]: 'bg-green-100 text-green-700 border-green-200',
  };

  const renderTypeBadge = () => {
    switch (incident.type) {
      case IncidentType.ACCIDENT:
        return (
          <span className="inline-block px-1.5 py-0.5 rounded text-[10px] md:text-xs font-bold uppercase tracking-wider border bg-rose-100 text-rose-800 border-rose-200">
            <i className="fas fa-user-injured mr-1"></i> Tai nạn
          </span>
        );
      case IncidentType.GAME:
        return (
          <span className="inline-block px-1.5 py-0.5 rounded text-[10px] md:text-xs font-bold uppercase tracking-wider border bg-purple-100 text-purple-800 border-purple-200">
            <i className="fas fa-gamepad mr-1"></i> Máy game
          </span>
        );
      case IncidentType.DEVICE:
      default:
        return (
          <span className="inline-block px-1.5 py-0.5 rounded text-[10px] md:text-xs font-bold uppercase tracking-wider border bg-indigo-100 text-indigo-800 border-indigo-200">
            <i className="fas fa-tools mr-1"></i> Thiết bị
          </span>
        );
    }
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

  const handleZaloShare = (e: React.MouseEvent) => {
    e.stopPropagation();
    const branchName = BRANCHES.find(b => b.id === incident.branchId)?.name || incident.branchId;
    const message = `🚨 BÁO CÁO SỰ CỐ KHẨN CẤP 🚨\n📍 Tại: ${branchName}\n⚠️ Mức độ: NGHIÊM TRỌNG\n📝 Tiêu đề: ${incident.title}\n📄 Mô tả: ${incident.description}\n👤 Người báo: ${incident.reporterName} (${incident.reporterRole})`;
    navigator.clipboard.writeText(message).then(() => {
      alert("Đã copy nội dung báo cáo vào bộ nhớ tạm!\nVui lòng mở Zalo và dán (Paste) để gửi.");
    }).catch(err => {
      console.error('Failed to copy: ', err);
      alert("Không thể copy tự động. Vui lòng copy thủ công.");
    });
  };

  const handleSubmitUpdate = async () => {
    setResolveError('');
    setIsUpdating(true);

    try {
      if (incident.type === IncidentType.ACCIDENT) {
        if (!resolutionNote.trim()) {
          setResolveError('Vui lòng nhập nội dung xử lý.');
          setIsUpdating(false);
          return;
        }
        await onUpdate(incident.id, {
          isResolved: true,
          resolutionNote,
          resolutionImageUrls: resolutionImages
        });
        setIsResolvePopupOpen(false);
      } else if (isEquipmentIssue) {
        if (!deviceStatus) {
          setResolveError('Vui lòng chọn trạng thái thiết bị.');
          setIsUpdating(false);
          return;
        }

        if (deviceStatus === DeviceStatus.FIXED) {
          if (!resolutionNote.trim()) {
            setResolveError('Vui lòng nhập nội dung xử lý khi đã sửa xong.');
            setIsUpdating(false);
            return;
          }
          if (resolutionImages.length < 2) {
            setResolveError('Vui lòng tải lên ít nhất 2 hình ảnh sau xử lý.');
            setIsUpdating(false);
            return;
          }

          await onUpdate(incident.id, {
            isResolved: true,
            deviceStatus,
            setupResponse,
            resolutionNote,
            resolutionImageUrls: resolutionImages
          });
        } else {
          await onUpdate(incident.id, {
            isResolved: false,
            deviceStatus,
            setupResponse
          });
        }
        setIsResolvePopupOpen(false);
      }
    } catch (error) {
      setResolveError('Lỗi cập nhật. Vui lòng thử lại.');
    } finally {
      setIsUpdating(false);
    }
  };

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
      relative p-3 md:p-4 rounded-xl border-l-8 shadow-sm transition-all duration-300 h-full flex flex-col
      ${severityStyles[incident.severity]}
      ${isHighSeverity && !incident.isResolved ? 'animate-flash-red ring-2 ring-red-400 ring-offset-2' : 'bg-white'}
      ${incident.isResolved ? 'opacity-80' : ''}
    `}>
      <div className="flex justify-between items-start mb-2">
        <div className="flex-1 pr-2">
          <div className="flex flex-wrap gap-1.5 mb-1.5">
            <span className={`inline-block px-1.5 py-0.5 rounded text-[10px] md:text-xs font-bold uppercase tracking-wider ${badgeStyles[incident.severity]}`}>
              {incident.severity === Severity.HIGH && <i className="fas fa-exclamation-circle mr-1"></i>}
              {incident.severity === 'HIGH' ? 'Nghiêm trọng' : incident.severity === 'MEDIUM' ? 'TB' : 'Thấp'}
            </span>

            {renderTypeBadge()}

            {!incident.isResolved ? (
              isEquipmentIssue && incident.deviceStatus ? (
                 <span className={`inline-block px-1.5 py-0.5 rounded text-[10px] md:text-xs font-bold uppercase tracking-wider border ${deviceStatusColors[incident.deviceStatus]}`}>
                    {deviceStatusLabels[incident.deviceStatus]}
                 </span>
              ) : (
                <span className="inline-block px-1.5 py-0.5 rounded text-[10px] md:text-xs font-bold uppercase tracking-wider bg-gray-100 text-gray-600 border border-gray-300">
                  Chưa xử lý
                </span>
              )
            ) : null}
          </div>

          <h3 className="font-bold text-base md:text-lg leading-tight">{incident.title}</h3>
        </div>
        <div className="flex flex-col items-end flex-shrink-0">
          <span className="text-[10px] md:text-xs font-mono text-gray-500 bg-white/50 px-1.5 py-0.5 rounded whitespace-nowrap">
            {new Date(incident.timestamp).toLocaleTimeString('vi-VN', {hour: '2-digit', minute:'2-digit'})}
          </span>
          <span className="text-[10px] md:text-xs text-gray-400 mt-0.5">
            {new Date(incident.timestamp).toLocaleDateString('vi-VN', {day: '2-digit', month: '2-digit'})}
          </span>
        </div>
      </div>

      <p className="mb-3 text-sm leading-snug md:leading-relaxed whitespace-pre-line text-gray-800 flex-grow">{incident.description}</p>
      
      {!incident.isResolved && incident.setupResponse && (
        <div className="mb-3 text-xs bg-indigo-50 border border-indigo-100 p-2 rounded text-indigo-800 italic">
          <i className="fas fa-reply mr-1"></i> Setup: {incident.setupResponse}
        </div>
      )}

      <div className="flex justify-between items-center border-t border-black/5 pt-3 mt-1 gap-2">
        <div className="flex items-center gap-2">
          {!incident.isResolved ? (
            <button 
              onClick={(e) => { e.stopPropagation(); setIsResolvePopupOpen(true); }}
              className="px-3 py-1.5 bg-white border border-gray-300 rounded text-xs md:text-sm hover:bg-gray-50 font-bold text-gray-700 transition-colors shadow-sm active:bg-gray-100"
            >
              {isEquipmentIssue && incident.deviceStatus 
                ? <><i className="fas fa-edit mr-1 text-indigo-600"></i> Cập nhật</>
                : <><i className="fas fa-check-circle mr-1 text-green-600"></i> Xử lý</>
              }
            </button>
          ) : (
            <span className="text-green-700 font-bold text-xs md:text-sm flex items-center bg-green-50 px-2 py-1 rounded border border-green-100">
              <i className="fas fa-check mr-1"></i> Đã xử lý
            </span>
          )}

          {incident.severity === Severity.HIGH && !incident.isResolved && (
            <button
              onClick={handleZaloShare}
              className="px-3 py-1.5 bg-blue-600 border border-blue-600 rounded text-xs md:text-sm hover:bg-blue-700 font-bold text-white transition-colors shadow-sm active:bg-blue-800 flex items-center animate-bounce-short"
              title="Copy nội dung báo cáo"
            >
              <i className="fas fa-copy mr-1"></i> Copy Zalo
            </button>
          )}
        </div>
        
        <button 
          onClick={() => setIsExpanded(!isExpanded)} 
          className="text-gray-500 hover:text-indigo-600 flex items-center text-xs font-bold uppercase tracking-wide py-2 px-2 rounded active:bg-black/5 transition-colors"
        >
          {isExpanded ? 'Thu gọn' : 'Chi tiết'}
          <i className={`fas fa-chevron-${isExpanded ? 'up' : 'down'} ml-1.5`}></i>
        </button>
      </div>

      {isExpanded && (
        <div className="mt-3 pt-3 border-t border-black/5 animate-fade-in">
          <div className="mb-4 flex items-center text-sm text-gray-700 bg-white/40 p-2 rounded">
             <i className="fas fa-user-circle text-2xl mr-3 opacity-60"></i>
             <div>
                <span className="font-bold block text-gray-900">{incident.reporterName}</span>
                <span className="text-xs opacity-80 uppercase tracking-wide">{incident.reporterRole}</span>
             </div>
          </div>

          {images.length > 0 ? (
            <div className="mb-4">
              <h4 className="text-[10px] md:text-xs font-bold uppercase text-gray-500 mb-2">Hình ảnh hiện trường ({images.length})</h4>
              <div className="relative rounded-lg overflow-hidden border border-black/10 bg-gray-100 aspect-video group cursor-zoom-in" onClick={openModal}>
                <img src={images[currentImageIndex]} alt={`Evidence ${currentImageIndex + 1}`} className="w-full h-full object-cover transition-opacity duration-300" />
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors"></div>
                {images.length > 1 && (
                  <>
                    <button onClick={handlePrev} className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/40 text-white flex items-center justify-center transition-all opacity-100 md:opacity-0 md:group-hover:opacity-100 transform active:scale-95"><i className="fas fa-chevron-left"></i></button>
                    <button onClick={handleNext} className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/40 text-white flex items-center justify-center transition-all opacity-100 md:opacity-0 md:group-hover:opacity-100 transform active:scale-95"><i className="fas fa-chevron-right"></i></button>
                    <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex space-x-1.5 z-10">
                      {images.map((_, idx) => (
                        <div key={idx} className={`w-1.5 h-1.5 rounded-full shadow-sm transition-all ${idx === currentImageIndex ? 'bg-white scale-125' : 'bg-white/50'}`}></div>
                      ))}
                    </div>
                  </>
                )}
                <div className="absolute top-2 right-2 bg-black/60 text-white text-[10px] px-2 py-0.5 rounded-full backdrop-blur-sm font-bold tracking-wide">{currentImageIndex + 1}/{images.length}</div>
              </div>
            </div>
          ) : (
            <div className="mb-4 text-sm text-gray-500 italic bg-gray-50 p-2 rounded text-center">Không có hình ảnh đính kèm.</div>
          )}

          {incident.isResolved && incident.resolutionNote && (
            <div className="mt-4 bg-green-50/80 rounded-lg p-3 border border-green-200">
              <h4 className="font-bold text-green-800 text-sm mb-2 flex items-center"><i className="fas fa-check-circle mr-2"></i> Kết quả xử lý</h4>
              <p className="text-sm text-gray-800 mb-3 whitespace-pre-line">{incident.resolutionNote}</p>
              {incident.resolutionImageUrls && incident.resolutionImageUrls.length > 0 && (
                <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                  {incident.resolutionImageUrls.map((url, idx) => (
                    <div key={idx} className="aspect-square rounded overflow-hidden border border-gray-200 cursor-pointer active:opacity-80" onClick={() => setResViewerIndex(idx)}>
                      <img src={url} alt="Resolved" className="w-full h-full object-cover" />
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {isModalOpen && (
        <div className="fixed inset-0 z-[100] bg-black/95 backdrop-blur-sm flex items-center justify-center p-0 md:p-4 animate-fade-in" onClick={closeModal}>
          <button className="absolute top-4 right-4 text-white/70 hover:text-white text-4xl z-50 focus:outline-none p-4" onClick={closeModal}>&times;</button>
          <div className="relative w-full max-w-7xl h-full flex flex-col items-center justify-center" onClick={e => e.stopPropagation()}>
            <img src={images[currentImageIndex]} alt="Evidence Full" className="max-h-[80vh] max-w-full object-contain md:rounded shadow-2xl" />
            <div className="absolute bottom-10 md:static md:mt-4 text-white text-sm bg-white/10 px-4 py-2 rounded-full backdrop-blur-md border border-white/20">Hình ảnh {currentImageIndex + 1} / {images.length}</div>
            {images.length > 1 && (
              <>
                <button onClick={handlePrev} className="absolute left-2 md:left-4 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center backdrop-blur transition-all active:scale-90"><i className="fas fa-chevron-left text-2xl"></i></button>
                <button onClick={handleNext} className="absolute right-2 md:right-4 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center backdrop-blur transition-all active:scale-90"><i className="fas fa-chevron-right text-2xl"></i></button>
              </>
            )}
          </div>
        </div>
      )}

      {resViewerIndex !== null && incident.resolutionImageUrls && (
        <div className="fixed inset-0 z-[110] bg-black/95 backdrop-blur-sm flex items-center justify-center p-0 md:p-4" onClick={() => setResViewerIndex(null)}>
          <button className="absolute top-4 right-4 text-white text-4xl z-50 p-4">&times;</button>
          <img src={incident.resolutionImageUrls[resViewerIndex]} alt="Res Full" className="max-h-[90vh] max-w-full object-contain"/>
        </div>
      )}

      {isResolvePopupOpen && (
        <div className="fixed inset-0 z-[90] bg-black/60 backdrop-blur-sm flex items-end md:items-center justify-center p-0 md:p-4 animate-fade-in">
          <div className="bg-white rounded-t-xl md:rounded-xl shadow-2xl w-full max-w-lg p-5 md:p-6 max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-4 border-b pb-3 sticky top-0 bg-white z-10">
              <h3 className="text-lg md:text-xl font-bold text-gray-800">
                {incident.type === IncidentType.ACCIDENT ? 'Xử lý sự cố tai nạn' : 'Cập nhật tình trạng'}
              </h3>
              <button onClick={() => setIsResolvePopupOpen(false)} className="text-gray-400 hover:text-gray-600 p-2"><i className="fas fa-times text-xl"></i></button>
            </div>

            <div className="space-y-4 pb-8 md:pb-0">
              {isEquipmentIssue && (
                <div className="bg-indigo-50 p-3 rounded-lg border border-indigo-100 mb-2">
                  <label className="block text-sm font-bold text-indigo-900 mb-2">Cập nhật tình trạng</label>
                  <div className="mb-3">
                     <label className="block text-xs font-semibold text-gray-600 mb-1">Phản hồi Setup (Nhập tay)</label>
                     <input type="text" className="w-full rounded border border-indigo-500 bg-white text-black p-2 text-sm focus:ring-2 focus:ring-indigo-200 outline-none placeholder-gray-400" placeholder="VD: Đã liên hệ setup, đang chờ linh kiện..." value={setupResponse} onChange={(e) => setSetupResponse(e.target.value)} />
                  </div>
                  <div>
                     <label className="block text-xs font-semibold text-gray-600 mb-1">Trạng thái hiện tại <span className="text-red-500">*</span></label>
                     <select className="w-full rounded border border-indigo-500 bg-white text-black p-2 text-sm focus:ring-2 focus:ring-indigo-200 outline-none" value={deviceStatus} onChange={(e) => setDeviceStatus(e.target.value as DeviceStatus)}>
                        <option value="">-- Chọn trạng thái --</option>
                        <option value={DeviceStatus.UNSAFE}>Không an toàn (Ngừng sử dụng)</option>
                        <option value={DeviceStatus.BROKEN}>Hỏng hẳn</option>
                        <option value={DeviceStatus.WAITING_PARTS}>Chờ đồ thay</option>
                        <option value={DeviceStatus.FIXED}>Đã sửa (Hoàn thành)</option>
                     </select>
                  </div>
                </div>
              )}

              {(incident.type === IncidentType.ACCIDENT || deviceStatus === DeviceStatus.FIXED) && (
                <div className="animate-fade-in-up">
                  {isEquipmentIssue && <div className="my-3 border-t border-gray-100"></div>}
                  <div className="mb-4">
                    <label className="block text-sm font-bold text-gray-700 mb-2">Nội dung xử lý <span className="text-red-500">*</span></label>
                    <textarea className="w-full rounded-lg border border-indigo-500 bg-white text-black p-3 text-base focus:border-indigo-700 focus:ring-2 focus:ring-indigo-200 outline-none transition-all placeholder-gray-400 font-medium" rows={4} placeholder={incident.type === IncidentType.ACCIDENT ? "Mô tả cách thức sơ cứu, xử lý..." : "Mô tả cách thức sửa chữa..."} value={resolutionNote} onChange={(e) => setResolutionNote(e.target.value)}></textarea>
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">Hình ảnh sau xử lý {isEquipmentIssue && <span className="text-red-500"> (Bắt buộc 2-6 ảnh)</span>}{incident.type === IncidentType.ACCIDENT && <span className="font-normal text-gray-500"> (Nếu có)</span>}</label>
                    <WatermarkCamera images={resolutionImages} onImagesChange={setResolutionImages} />
                  </div>
                </div>
              )}

              {resolveError && <div className="p-3 bg-red-100 text-red-700 rounded text-sm flex items-center"><i className="fas fa-exclamation-triangle mr-2"></i>{resolveError}</div>}

              <div className="flex flex-col-reverse md:flex-row justify-end gap-3 pt-4 border-t sticky bottom-0 bg-white">
                <button onClick={() => setIsResolvePopupOpen(false)} className="w-full md:w-auto px-4 py-3 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-100 font-medium" disabled={isUpdating}>Hủy bỏ</button>
                <button onClick={handleSubmitUpdate} disabled={isUpdating} className={`w-full md:w-auto px-4 py-3 rounded-lg text-white font-bold shadow-lg flex items-center justify-center ${(incident.type === IncidentType.ACCIDENT || deviceStatus === DeviceStatus.FIXED) ? 'bg-green-600 hover:bg-green-700' : 'bg-indigo-600 hover:bg-indigo-700'} ${isUpdating ? 'opacity-70 cursor-wait' : ''}`}>
                  {isUpdating ? <i className="fas fa-circle-notch fa-spin"></i> : (incident.type === IncidentType.ACCIDENT || deviceStatus === DeviceStatus.FIXED) ? <><i className="fas fa-check mr-2"></i> Hoàn thành</> : <><i className="fas fa-save mr-2"></i> Cập nhật trạng thái</>}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default IncidentCard;