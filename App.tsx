
import React, { useState, useEffect, useRef } from 'react';
import { BRANCHES, Incident, Severity, IncidentType, DeviceStatus } from './types';
import IncidentCard from './components/IncidentCard';
import WatermarkCamera from './components/WatermarkCamera';
import { playAlertSound } from './utils';
import { getSupabase, initSupabase, resetSupabaseConfig } from './utils/supabaseClient';
import { RealtimeChannel } from '@supabase/supabase-js';

// --- SUB-COMPONENT: Branch Section ---
interface BranchSectionProps {
  branch: { id: string; name: string };
  incidents: Incident[];
  onUpdate: (id: string, updates: Partial<Incident>) => Promise<void>;
}

const BranchSection: React.FC<BranchSectionProps> = ({ branch, incidents, onUpdate }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  
  // Mặc định hiển thị 3 item, nếu expanded thì hiện hết
  const visibleIncidents = isExpanded ? incidents : incidents.slice(0, 3);
  const hiddenCount = incidents.length - 3;
  const hasMore = incidents.length > 3;

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden mb-6 transition-all duration-300">
      {/* Branch Header */}
      <div className="px-4 py-3 bg-gray-50 border-b border-gray-200 flex justify-between items-center">
        <div className="flex items-center gap-3">
          <div className="w-1 h-6 bg-fkPurple rounded-full"></div>
          <h2 className="text-base md:text-lg font-bold text-gray-800">
            {branch.name}
          </h2>
          <span className="bg-indigo-100 text-indigo-700 text-xs font-bold px-2 py-0.5 rounded-full">
            {incidents.length}
          </span>
        </div>
        
        {hasMore && (
           <button 
             onClick={() => setIsExpanded(!isExpanded)}
             className="text-xs font-bold text-indigo-600 hover:text-indigo-800 flex items-center transition-colors px-2 py-1 rounded hover:bg-indigo-50"
           >
             {isExpanded ? 'Thu gọn' : `Xem thêm ${hiddenCount} sự cố`}
             <i className={`fas fa-chevron-${isExpanded ? 'up' : 'right'} ml-1.5`}></i>
           </button>
        )}
      </div>

      {/* Grid Content */}
      <div className="p-4 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 md:gap-6">
        {visibleIncidents
          .sort((a, b) => b.timestamp - a.timestamp) // Sort by time desc just in case
          .sort((a, b) => (a.severity === Severity.HIGH ? -1 : 1)) // High priority first
          .map(incident => (
          <IncidentCard key={incident.id} incident={incident} onUpdate={onUpdate} />
        ))}
      </div>
      
      {/* Footer "Show More" if list is collapsed and has more items */}
      {!isExpanded && hasMore && (
        <div className="px-4 pb-4 pt-0 text-center md:hidden">
           <button 
             onClick={() => setIsExpanded(true)}
             className="w-full py-2 bg-gray-50 hover:bg-gray-100 text-gray-500 text-sm font-medium rounded-lg border border-dashed border-gray-300 transition-colors"
           >
             Xem thêm {hiddenCount} sự cố khác <i className="fas fa-chevron-down ml-1"></i>
           </button>
        </div>
      )}
    </div>
  );
};

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'report' | 'export'>('dashboard');
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [isLoading, setIsLoading] = useState(false); // Default false until we try to fetch
  const [selectedBranchFilter, setSelectedBranchFilter] = useState<string>('all');
  const [selectedStatusFilter, setSelectedStatusFilter] = useState<'all' | 'unresolved' | 'resolved'>('unresolved');
  const [selectedTypeFilter, setSelectedTypeFilter] = useState<'all' | IncidentType>('all');
  
  // Last Updated State
  const [lastUpdated, setLastUpdated] = useState<number>(Date.now());

  // Audio Mute State
  const [isMuted, setIsMuted] = useState(false);

  // Supabase Config State
  const [isConfigured, setIsConfigured] = useState(false);
  const [showConfigModal, setShowConfigModal] = useState(false);
  const [configUrl, setConfigUrl] = useState('');
  const [configKey, setConfigKey] = useState('');
  const [connectionError, setConnectionError] = useState('');
  
  const subscriptionRef = useRef<RealtimeChannel | null>(null);

  // Initial Check for Config
  useEffect(() => {
    const sb = getSupabase();
    if (sb) {
      setIsConfigured(true);
      fetchIncidents();
      setupRealtime(sb);
    }
    
    // Cleanup subscription on unmount
    return () => {
      if (subscriptionRef.current) subscriptionRef.current.unsubscribe();
    };
  }, []);

  const setupRealtime = (sb: any) => {
    if (subscriptionRef.current) subscriptionRef.current.unsubscribe();
    
    subscriptionRef.current = sb
      .channel('incidents-channel')
      .on(
        'postgres_changes', 
        { event: '*', schema: 'public', table: 'incidents' }, 
        () => {
          fetchIncidents(); 
          playAlertSound(); 
        }
      )
      .subscribe();
  };

  const handleSaveConfig = () => {
    try {
      setConnectionError('');
      const sb = initSupabase(configUrl.trim(), configKey.trim());
      setIsConfigured(true);
      setShowConfigModal(false);
      fetchIncidents();
      setupRealtime(sb);
    } catch (e) {
      setConnectionError('URL hoặc Key không hợp lệ. Vui lòng kiểm tra lại.');
    }
  };

  const handleResetConfig = () => {
    if (window.confirm('Bạn có chắc chắn muốn xóa cấu hình kết nối hiện tại?')) {
      resetSupabaseConfig();
      setIsConfigured(false);
      setIncidents([]);
      setShowConfigModal(true);
      setConfigUrl('');
      setConfigKey('');
    }
  };

  // Helper: Upload base64 image to Supabase Storage
  const uploadImage = async (base64Image: string): Promise<string | null> => {
    const sb = getSupabase();
    if (!sb) return null;

    try {
      // Convert base64 to blob
      const base64Str = base64Image.split(',')[1];
      const byteCharacters = atob(base64Str);
      const byteNumbers = new Array(byteCharacters.length);
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
      }
      const byteArray = new Uint8Array(byteNumbers);
      const blob = new Blob([byteArray], { type: 'image/jpeg' });

      const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.jpg`;
      const { data, error } = await sb.storage
        .from('incident-images')
        .upload(fileName, blob, {
          contentType: 'image/jpeg',
          upsert: false
        });

      if (error) {
        console.error('Upload error:', error);
        return null;
      }

      // Get public URL
      const { data: { publicUrl } } = sb.storage
        .from('incident-images')
        .getPublicUrl(fileName);

      return publicUrl;
    } catch (error) {
      console.error('Error processing image:', error);
      return null;
    }
  };

  // Fetch Data from Supabase
  const fetchIncidents = async () => {
    const sb = getSupabase();
    if (!sb) return;

    setIsLoading(true);
    const { data, error } = await sb
      .from('incidents')
      .select('*')
      .order('timestamp', { ascending: false });

    if (error) {
      console.error('Error fetching incidents:', error);
      // If error is related to auth or connection
      if ((error as any).code === 'PGRST301' || (error as any).message?.includes('FetchError')) {
         setConnectionError('Không thể kết nối. Vui lòng kiểm tra lại URL và Key.');
      }
    } else {
      setIncidents(data as Incident[] || []);
      setLastUpdated(Date.now());
    }
    setIsLoading(false);
  };

  // Audio Alert Logic
  useEffect(() => {
    const hasActiveHighSeverity = incidents.some(i => i.severity === Severity.HIGH && !i.isResolved);
    let interval: number;

    if (hasActiveHighSeverity && !isMuted) {
      const triggerSound = () => playAlertSound();
      triggerSound(); // Play immediately
      interval = window.setInterval(triggerSound, 5000); // Loop every 5s
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [incidents, isMuted]);

  // Form State
  const [formBranchId, setFormBranchId] = useState(BRANCHES[0].id);
  const [formType, setFormType] = useState<IncidentType>(IncidentType.DEVICE);
  const [formTitle, setFormTitle] = useState('');
  const [formDesc, setFormDesc] = useState('');
  const [formSeverity, setFormSeverity] = useState<Severity>(Severity.LOW);
  const [formImages, setFormImages] = useState<string[]>([]); // Base64 strings
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // New Fields
  const [formReporterName, setFormReporterName] = useState('');
  const [formReporterRole, setFormReporterRole] = useState('');

  // Export State
  const [exportType, setExportType] = useState<'week' | 'month' | 'year'>('month');
  const [exportValue, setExportValue] = useState<string>(new Date().toISOString().slice(0, 7)); 
  const [exportBranch, setExportBranch] = useState<string>('all');

  // Generic Update Handler
  const handleUpdateIncident = async (id: string, updates: Partial<Incident>) => {
    const sb = getSupabase();
    if (!sb) return;

    try {
      let finalUpdates = { ...updates };

      // Check if resolution images need uploading (they might be base64)
      if (updates.resolutionImageUrls && updates.resolutionImageUrls.length > 0) {
        const uploadedUrls = await Promise.all(
          updates.resolutionImageUrls.map(async (img) => {
            if (img.startsWith('data:')) {
              return await uploadImage(img) || img;
            }
            return img; // Already a URL
          })
        );
        finalUpdates.resolutionImageUrls = uploadedUrls.filter(url => url !== null) as string[];
      }

      const { error } = await sb
        .from('incidents')
        .update(finalUpdates)
        .eq('id', id);

      if (error) throw error;

      // Reload data immediately after update
      await fetchIncidents();
      
    } catch (error) {
      console.error('Error updating incident:', error);
      alert('Có lỗi xảy ra khi cập nhật!');
    }
  };

  const handleRefresh = () => {
    fetchIncidents();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const sb = getSupabase();
    if (!sb) {
      alert("Chưa kết nối đến cơ sở dữ liệu!");
      setShowConfigModal(true);
      return;
    }
    
    if (!formReporterName || !formReporterRole) {
      alert('Vui lòng nhập tên và chức vụ người báo cáo');
      return;
    }

    setIsSubmitting(true);

    // 1. Upload Images
    const uploadedImageUrls: string[] = [];
    if (formImages.length > 0) {
      for (const base64 of formImages) {
        const url = await uploadImage(base64);
        if (url) uploadedImageUrls.push(url);
      }
    }

    // 2. Insert into DB
    const newIncident = {
      branchId: formBranchId,
      title: formTitle,
      description: formDesc,
      severity: formSeverity,
      type: formType,
      timestamp: Date.now(),
      imageUrls: uploadedImageUrls,
      reporterName: formReporterName,
      reporterRole: formReporterRole,
      isResolved: false
    };

    const { error } = await sb.from('incidents').insert([newIncident]);

    setIsSubmitting(false);

    if (error) {
      console.error('Error creating incident:', error);
      alert('Lỗi: Không thể gửi báo cáo. Vui lòng thử lại.');
      return;
    }

    // Reload data immediately after insert
    await fetchIncidents();
    
    // Reset Form
    setFormTitle('');
    setFormDesc('');
    setFormSeverity(Severity.LOW);
    setFormImages([]);
    setFormReporterName('');
    setFormReporterRole('');
    setFormType(IncidentType.DEVICE);
    setActiveTab('dashboard');
  };

  // Grouping logic for Dashboard
  const filteredIncidents = incidents.filter(i => {
    const branchMatch = selectedBranchFilter === 'all' || i.branchId === selectedBranchFilter;
    const statusMatch = selectedStatusFilter === 'all' 
      ? true 
      : selectedStatusFilter === 'resolved' ? i.isResolved : !i.isResolved;
    const typeMatch = selectedTypeFilter === 'all' || i.type === selectedTypeFilter;
    
    return branchMatch && statusMatch && typeMatch;
  });

  // Export Logic
  const getExportData = () => {
    let startDate = 0;
    let endDate = 0;

    if (exportType === 'week') {
      const [yearStr, weekStr] = exportValue.split('-W');
      const year = parseInt(yearStr);
      const week = parseInt(weekStr);
      const simpleDate = new Date(year, 0, 1 + (week - 1) * 7);
      const dow = simpleDate.getDay();
      const isoWeekStart = simpleDate;
      if (dow <= 4) isoWeekStart.setDate(simpleDate.getDate() - simpleDate.getDay() + 1);
      else isoWeekStart.setDate(simpleDate.getDate() + 8 - simpleDate.getDay());
          
      startDate = isoWeekStart.getTime();
      endDate = startDate + 7 * 24 * 60 * 60 * 1000 - 1; 
    } else if (exportType === 'month') {
      const [year, month] = exportValue.split('-').map(Number);
      startDate = new Date(year, month - 1, 1).getTime();
      endDate = new Date(year, month, 0, 23, 59, 59).getTime();
    } else if (exportType === 'year') {
      const year = parseInt(exportValue);
      startDate = new Date(year, 0, 1).getTime();
      endDate = new Date(year, 11, 31, 23, 59, 59).getTime();
    }

    return incidents.filter(i => {
      const timeMatch = i.timestamp >= startDate && i.timestamp <= endDate;
      const branchMatch = exportBranch === 'all' || i.branchId === exportBranch;
      return timeMatch && branchMatch;
    });
  };

  const downloadCSV = () => {
    const data = getExportData();
    if (data.length === 0) {
      alert("Không có dữ liệu để xuất trong khoảng thời gian này.");
      return;
    }

    const BOM = "\uFEFF";
    const headers = ["ID", "Chi nhánh", "Loại sự cố", "Người báo cáo", "Chức vụ", "Thời gian", "Tiêu đề", "Mức độ", "Trạng thái", "Nội dung xử lý", "Mô tả chi tiết"];
    
    const csvContent = data.map(i => {
      const branchName = BRANCHES.find(b => b.id === i.branchId)?.name || i.branchId;
      const dateStr = new Date(i.timestamp).toLocaleString('vi-VN');
      const status = i.isResolved ? "Đã xử lý" : (i.deviceStatus || "Chưa xử lý");
      const severityMap = { [Severity.HIGH]: "Cao", [Severity.MEDIUM]: "Trung bình", [Severity.LOW]: "Thấp" };
      const typeMap = { [IncidentType.DEVICE]: "Thiết bị", [IncidentType.ACCIDENT]: "Tai nạn" };
      
      const escape = (text: string | null | undefined) => `"${(text || '').replace(/"/g, '""')}"`;

      return [
        i.id,
        escape(branchName),
        escape(typeMap[i.type as IncidentType]),
        escape(i.reporterName),
        escape(i.reporterRole),
        escape(dateStr),
        escape(i.title),
        escape(severityMap[i.severity as Severity]),
        escape(status),
        escape(i.resolutionNote),
        escape(i.description)
      ].join(",");
    }).join("\n");

    const blob = new Blob([BOM + headers.join(",") + "\n" + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `bao_cao_su_co_${exportType}_${exportValue}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const inputStyle = "w-full rounded-lg border border-indigo-500 bg-white text-black text-base p-3 focus:border-indigo-700 focus:ring-2 focus:ring-indigo-200 outline-none transition-all placeholder-gray-400 font-medium appearance-none";
  const labelStyle = "block text-sm font-bold text-gray-700 mb-2";

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col font-sans">
      {/* Header */}
      <header className="bg-gradient-to-r from-fkRed to-fkPurple text-white shadow-lg sticky top-0 z-50">
        <div className="max-w-screen-xl mx-auto px-4 py-3 flex justify-between items-center">
          <div className="flex items-center space-x-3">
            <div className="bg-white/20 p-2 rounded-full">
              <i className="fas fa-child text-xl md:text-2xl"></i>
            </div>
            <div>
              <h1 className="text-lg md:text-xl font-bold tracking-tight leading-none">FunnyKids</h1>
              <span className="text-xs font-light opacity-80 block md:inline">Incident Manager</span>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <button 
              onClick={() => setShowConfigModal(true)}
              className="p-2 rounded-lg bg-white/10 hover:bg-white/20 text-white border border-white/20 transition-all"
              title="Cấu hình kết nối"
            >
              <i className="fas fa-cog"></i>
            </button>
            
            <button 
              onClick={() => setIsMuted(!isMuted)} 
              className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-all border ${
                isMuted 
                  ? 'bg-red-500/20 text-red-100 border-red-400/50 hover:bg-red-500/30' 
                  : 'bg-white/10 hover:bg-white/20 text-white border-white/20'
              }`}
            >
              <i className={`fas ${isMuted ? 'fa-volume-mute' : 'fa-volume-up'} text-lg`}></i>
              <span className="text-xs font-bold hidden md:inline">{isMuted ? 'Đã tắt loa' : 'Đang bật loa'}</span>
            </button>
          </div>
        </div>
      </header>

      {/* Tabs */}
      <nav className="bg-white shadow-sm border-b sticky top-[60px] z-40">
        <div className="max-w-screen-xl mx-auto flex">
          <button
            onClick={() => setActiveTab('dashboard')}
            className={`flex-1 py-3 md:py-4 text-center font-medium text-xs md:text-sm transition-colors border-b-2 ${
              activeTab === 'dashboard' 
                ? 'border-fkPurple text-fkPurple bg-indigo-50/50' 
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            <div className="mb-1"><i className="fas fa-th-large text-lg"></i></div>
            Theo dõi
          </button>
          <button
            onClick={() => setActiveTab('report')}
            className={`flex-1 py-3 md:py-4 text-center font-medium text-xs md:text-sm transition-colors border-b-2 ${
              activeTab === 'report' 
                ? 'border-fkRed text-fkRed bg-red-50/50' 
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
             <div className="mb-1"><i className="fas fa-plus-circle text-lg"></i></div>
            Báo cáo
          </button>
          <button
            onClick={() => setActiveTab('export')}
            className={`flex-1 py-3 md:py-4 text-center font-medium text-xs md:text-sm transition-colors border-b-2 ${
              activeTab === 'export' 
                ? 'border-green-600 text-green-700 bg-green-50/50' 
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
             <div className="mb-1"><i className="fas fa-file-export text-lg"></i></div>
            Xuất file
          </button>
        </div>
      </nav>

      <main className="flex-grow max-w-screen-xl w-full mx-auto px-4 py-4 md:py-6">
        
        {/* DASHBOARD */}
        {activeTab === 'dashboard' && (
          <div className="space-y-4 md:space-y-6">
            
            <div className="flex justify-end items-center gap-2 text-[10px] md:text-xs text-gray-500">
               <span>Last Updated: {new Date(lastUpdated).toLocaleString('vi-VN')}</span>
               <button onClick={handleRefresh} className="hover:text-indigo-600 transition-colors p-1">
                  <i className={`fas fa-sync-alt ${isLoading ? 'animate-spin' : ''}`}></i>
               </button>
            </div>

            <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="text-xs font-bold text-gray-500 uppercase mb-1 block">Trạng thái xử lý</label>
                  <div className="relative">
                    <select
                      value={selectedStatusFilter}
                      onChange={(e) => setSelectedStatusFilter(e.target.value as any)}
                      className={inputStyle}
                    >
                      <option value="unresolved">Chưa xử lý (Mặc định)</option>
                      <option value="resolved">Đã xử lý (Lịch sử)</option>
                      <option value="all">Tất cả trạng thái</option>
                    </select>
                    <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-gray-700"><i className="fas fa-filter text-xs"></i></div>
                  </div>
                </div>

                <div>
                  <label className="text-xs font-bold text-gray-500 uppercase mb-1 block">Loại sự cố</label>
                  <div className="relative">
                    <select
                      value={selectedTypeFilter}
                      onChange={(e) => setSelectedTypeFilter(e.target.value as any)}
                      className={inputStyle}
                    >
                      <option value="all">Tất cả các loại</option>
                      <option value={IncidentType.DEVICE}>Sự cố thiết bị</option>
                      <option value={IncidentType.ACCIDENT}>Tai nạn / Y tế</option>
                    </select>
                    <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-gray-700"><i className="fas fa-tag text-xs"></i></div>
                  </div>
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-gray-500 uppercase mb-1 block">Lọc theo chi nhánh</label>
                <div className="relative">
                  <select
                    value={selectedBranchFilter}
                    onChange={(e) => setSelectedBranchFilter(e.target.value)}
                    className={`${inputStyle} font-bold text-indigo-900 bg-indigo-50/50`}
                  >
                    <option value="all">Hiển thị tất cả chi nhánh ({BRANCHES.length} chi nhánh)</option>
                    {BRANCHES.map(b => (
                      <option key={b.id} value={b.id}>{b.name}</option>
                    ))}
                  </select>
                  <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-indigo-700"><i className="fas fa-store text-sm"></i></div>
                </div>
              </div>
            </div>

            {isLoading ? (
              <div className="text-center py-20 text-gray-400">
                <i className="fas fa-circle-notch fa-spin text-3xl mb-3"></i>
                <p>Đang tải dữ liệu...</p>
              </div>
            ) : (
              <div>
                {BRANCHES.filter(b => selectedBranchFilter === 'all' || b.id === selectedBranchFilter).map(branch => {
                  const branchIncidents = filteredIncidents.filter(i => i.branchId === branch.id);
                  if (branchIncidents.length === 0) {
                     if (selectedBranchFilter !== 'all') {
                        return <div key={branch.id} className="text-center text-gray-400 py-10 bg-white rounded-lg border border-dashed border-gray-300 mx-1">Không tìm thấy sự cố nào.</div>;
                     }
                     return null;
                  }

                  return (
                    <BranchSection 
                      key={branch.id} 
                      branch={branch} 
                      incidents={branchIncidents} 
                      onUpdate={handleUpdateIncident} 
                    />
                  );
                })}
                
                {filteredIncidents.length === 0 && (
                  <div className="text-center text-gray-500 py-12 bg-white rounded-xl shadow-sm border border-gray-100">
                    <i className="fas fa-clipboard-check text-4xl text-gray-300 mb-3"></i>
                    <p>{selectedStatusFilter === 'unresolved' ? 'Tuyệt vời! Không có sự cố nào chưa xử lý.' : 'Không có dữ liệu phù hợp.'}</p>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* REPORT TAB */}
        {activeTab === 'report' && (
          <div className="max-w-4xl mx-auto bg-white rounded-xl shadow-lg border border-gray-100 p-4 md:p-6 animate-fade-in-up">
            <h2 className="text-xl md:text-2xl font-bold text-gray-800 mb-6 border-b pb-4">Báo cáo sự cố mới</h2>
            
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                 <label className={labelStyle}>Loại sự cố <span className="text-red-500">*</span></label>
                 <div className="grid grid-cols-2 gap-3 md:gap-4">
                    <div 
                      onClick={() => setFormType(IncidentType.DEVICE)}
                      className={`cursor-pointer rounded-lg border-2 p-3 md:p-4 flex flex-col items-center justify-center transition-all ${formType === IncidentType.DEVICE ? 'border-indigo-600 bg-indigo-50 text-indigo-700' : 'border-gray-200 hover:border-indigo-300'}`}
                    >
                       <i className="fas fa-tools text-2xl md:text-3xl mb-2"></i>
                       <span className="font-bold text-sm md:text-base">Thiết bị</span>
                    </div>
                    <div 
                      onClick={() => setFormType(IncidentType.ACCIDENT)}
                      className={`cursor-pointer rounded-lg border-2 p-3 md:p-4 flex flex-col items-center justify-center transition-all ${formType === IncidentType.ACCIDENT ? 'border-rose-600 bg-rose-50 text-rose-700' : 'border-gray-200 hover:border-rose-300'}`}
                    >
                       <i className="fas fa-user-injured text-2xl md:text-3xl mb-2"></i>
                       <span className="font-bold text-sm md:text-base">Tai nạn</span>
                    </div>
                 </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                 <div>
                  <label className={labelStyle}>Họ và tên người báo cáo <span className="text-red-500">*</span></label>
                  <input type="text" required value={formReporterName} onChange={(e) => setFormReporterName(e.target.value)} className={inputStyle} placeholder="Nhập họ tên..." />
                </div>
                <div>
                  <label className={labelStyle}>Chức vụ tại chi nhánh <span className="text-red-500">*</span></label>
                  <input type="text" required value={formReporterRole} onChange={(e) => setFormReporterRole(e.target.value)} className={inputStyle} placeholder="VD: Quản lý, Giám sát..." />
                </div>
              </div>

              <div>
                <label className={labelStyle}>Chi nhánh xảy ra sự cố</label>
                <div className="relative">
                  <select value={formBranchId} onChange={(e) => setFormBranchId(e.target.value)} className={inputStyle}>
                    {BRANCHES.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                  </select>
                  <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-gray-700"><i className="fas fa-chevron-down text-xs"></i></div>
                </div>
              </div>

              <div>
                <label className={labelStyle}>Hình ảnh hiện trường</label>
                <WatermarkCamera images={formImages} onImagesChange={setFormImages} />
              </div>

              <div>
                <label className={labelStyle}>Tiêu đề sự cố <span className="text-red-500">*</span></label>
                <input type="text" required value={formTitle} onChange={(e) => setFormTitle(e.target.value)} className={inputStyle} placeholder="VD: Hỏng cầu trượt..." />
              </div>

              <div>
                <label className={labelStyle}>Mô tả chi tiết</label>
                <textarea value={formDesc} onChange={(e) => setFormDesc(e.target.value)} rows={4} className={inputStyle} placeholder="Mô tả chi tiết sự cố..." />
              </div>

              <div>
                <label className={labelStyle}>Mức độ nghiêm trọng</label>
                <div className="relative">
                  <select value={formSeverity} onChange={(e) => setFormSeverity(e.target.value as Severity)} className={inputStyle}>
                    <option value={Severity.LOW}>Thấp (Màu xanh)</option>
                    <option value={Severity.MEDIUM}>Trung Bình (Màu vàng)</option>
                    <option value={Severity.HIGH}>KHẨN CẤP (Màu đỏ)</option>
                  </select>
                  <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-gray-700"><i className="fas fa-chevron-down text-xs"></i></div>
                </div>
              </div>

              <div className="pt-6 border-t border-gray-100 flex flex-col items-center gap-4">
                <button 
                  type="submit"
                  disabled={isSubmitting}
                  className={`w-full bg-fkRed hover:bg-rose-700 text-white font-bold py-3.5 px-10 rounded-lg shadow-lg active:scale-95 transition-all text-base md:text-lg flex items-center justify-center ${isSubmitting ? 'opacity-70 cursor-wait' : ''}`}
                >
                  {isSubmitting ? <><i className="fas fa-circle-notch fa-spin mr-2"></i> Đang gửi...</> : <><i className="fas fa-paper-plane mr-2"></i> Gửi báo cáo</>}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* EXPORT TAB */}
        {activeTab === 'export' && (
          <div className="space-y-6 animate-fade-in-up max-w-4xl mx-auto">
            <div className="bg-white rounded-xl shadow-md border border-gray-100 p-4 md:p-6">
              <h2 className="text-xl font-bold text-gray-800 mb-4 border-b pb-2"><i className="fas fa-filter text-indigo-600 mr-2"></i>Xuất dữ liệu</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div>
                  <label className={labelStyle}>Loại báo cáo</label>
                  <div className="relative">
                    <select 
                      value={exportType}
                      onChange={(e) => {
                        setExportType(e.target.value as any);
                        if (e.target.value === 'week') setExportValue('2023-W01');
                        if (e.target.value === 'month') setExportValue(new Date().toISOString().slice(0, 7));
                        if (e.target.value === 'year') setExportValue(new Date().getFullYear().toString());
                      }}
                      className={inputStyle}
                    >
                      <option value="week">Theo Tuần</option>
                      <option value="month">Theo Tháng</option>
                      <option value="year">Theo Năm</option>
                    </select>
                     <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-gray-700"><i className="fas fa-chevron-down text-xs"></i></div>
                  </div>
                </div>

                <div>
                  <label className={labelStyle}>Thời gian</label>
                  {exportType === 'week' && <input type="week" value={exportValue} onChange={(e) => setExportValue(e.target.value)} className={inputStyle} />}
                  {exportType === 'month' && <input type="month" value={exportValue} onChange={(e) => setExportValue(e.target.value)} className={inputStyle} />}
                  {exportType === 'year' && <input type="number" min="2020" max="2030" value={exportValue} onChange={(e) => setExportValue(e.target.value)} className={inputStyle} />}
                </div>

                <div>
                  <label className={labelStyle}>Chi nhánh</label>
                  <div className="relative">
                    <select value={exportBranch} onChange={(e) => setExportBranch(e.target.value)} className={inputStyle}>
                      <option value="all">Tất cả chi nhánh</option>
                      {BRANCHES.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                    </select>
                     <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-gray-700"><i className="fas fa-chevron-down text-xs"></i></div>
                  </div>
                </div>
              </div>

              <div className="bg-indigo-50 rounded-lg p-4 border border-indigo-100 mb-6">
                <h3 className="text-xs font-bold text-indigo-900 mb-3 uppercase tracking-wide">Tổng quan</h3>
                {(() => {
                  const data = getExportData();
                  const total = data.length;
                  const resolved = data.filter(i => i.isResolved).length;
                  const device = data.filter(i => i.type === IncidentType.DEVICE).length;
                  const accident = data.filter(i => i.type === IncidentType.ACCIDENT).length;

                  return (
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      <div className="bg-white p-2 md:p-3 rounded border border-indigo-100 shadow-sm text-center">
                        <div className="text-xl md:text-2xl font-bold text-gray-800">{total}</div>
                        <div className="text-[10px] md:text-xs text-gray-500 font-medium">Tổng số</div>
                      </div>
                      <div className="bg-white p-2 md:p-3 rounded border border-green-100 shadow-sm text-center">
                        <div className="text-xl md:text-2xl font-bold text-green-600">{resolved}</div>
                        <div className="text-[10px] md:text-xs text-gray-500 font-medium">Đã xử lý</div>
                      </div>
                      <div className="bg-white p-2 md:p-3 rounded border border-indigo-200 shadow-sm text-center">
                        <div className="text-xl md:text-2xl font-bold text-indigo-600">{device}</div>
                        <div className="text-[10px] md:text-xs text-gray-500 font-medium">Thiết bị</div>
                      </div>
                      <div className="bg-white p-2 md:p-3 rounded border border-rose-200 shadow-sm text-center">
                        <div className="text-xl md:text-2xl font-bold text-rose-600">{accident}</div>
                        <div className="text-[10px] md:text-xs text-gray-500 font-medium">Tai nạn</div>
                      </div>
                    </div>
                  );
                })()}
              </div>

              <div className="flex justify-end">
                <button onClick={downloadCSV} className="w-full md:w-auto bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-6 rounded-lg shadow flex items-center justify-center gap-2 transition-transform active:scale-95">
                  <i className="fas fa-file-excel"></i> Tải file Excel
                </button>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* SUPABASE CONFIG MODAL */}
      {showConfigModal && (
        <div className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md p-6 animate-fade-in-up">
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-3 text-3xl">
                <i className="fas fa-database"></i>
              </div>
              <h2 className="text-2xl font-bold text-gray-800">Kết nối cơ sở dữ liệu</h2>
              <p className="text-gray-500 text-sm mt-1">Vui lòng nhập thông tin từ Supabase để bắt đầu</p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Project URL</label>
                <input 
                  type="text" 
                  value={configUrl} 
                  onChange={(e) => setConfigUrl(e.target.value)} 
                  className="w-full rounded border border-gray-300 p-3 focus:ring-2 focus:ring-green-500 outline-none"
                  placeholder="https://your-project.supabase.co"
                />
              </div>
              
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">API Key (Anon/Public)</label>
                <input 
                  type="password" 
                  value={configKey} 
                  onChange={(e) => setConfigKey(e.target.value)} 
                  className="w-full rounded border border-gray-300 p-3 focus:ring-2 focus:ring-green-500 outline-none"
                  placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI..."
                />
              </div>
              
              {connectionError && (
                <div className="text-red-600 text-sm bg-red-50 p-3 rounded flex items-center">
                  <i className="fas fa-exclamation-circle mr-2"></i> {connectionError}
                </div>
              )}

              <div className="pt-4 flex gap-3">
                 {isConfigured && (
                    <button onClick={() => handleResetConfig()} className="flex-1 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold rounded-lg transition-colors">
                      Xóa cấu hình
                    </button>
                 )}
                 {isConfigured && (
                    <button onClick={() => setShowConfigModal(false)} className="flex-1 py-3 border border-gray-300 hover:bg-gray-50 text-gray-700 font-bold rounded-lg transition-colors">
                      Đóng
                    </button>
                 )}
                 <button onClick={handleSaveConfig} className="flex-1 py-3 bg-green-600 hover:bg-green-700 text-white font-bold rounded-lg shadow-lg transition-transform active:scale-95">
                   Lưu & Kết nối
                 </button>
              </div>
              
              <div className="text-center mt-4">
                <a href="https://supabase.com/dashboard" target="_blank" rel="noopener noreferrer" className="text-xs text-indigo-600 hover:underline">
                  <i className="fas fa-external-link-alt mr-1"></i> Lấy thông tin tại Supabase Dashboard
                </a>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default App;
