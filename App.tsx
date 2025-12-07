import React, { useState, useEffect } from 'react';
import { BRANCHES, Incident, Severity } from './types';
import IncidentCard from './components/IncidentCard';
import WatermarkCamera from './components/WatermarkCamera';
import { playAlertSound } from './utils';

// Mock initial data
const INITIAL_DATA: Incident[] = [
  {
    id: '1',
    branchId: 'b1',
    title: 'Hỏng máy điều hòa khu vui chơi',
    description: 'Điều hòa khu nhà bóng bị chảy nước, nhiệt độ cao gây khó chịu cho bé.',
    severity: Severity.MEDIUM,
    timestamp: Date.now() - 3600000,
    reporterName: 'Nguyễn Văn A',
    reporterRole: 'Quản lý ca',
    isResolved: false,
    imageUrls: ['https://picsum.photos/400/300']
  }
];

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'report'>('dashboard');
  const [incidents, setIncidents] = useState<Incident[]>(INITIAL_DATA);
  const [selectedBranchFilter, setSelectedBranchFilter] = useState<string>('all');
  
  // Audio Alert Logic
  useEffect(() => {
    const hasActiveHighSeverity = incidents.some(i => i.severity === Severity.HIGH && !i.isResolved);
    let interval: number;

    if (hasActiveHighSeverity) {
      const triggerSound = () => playAlertSound();
      triggerSound(); 
      interval = window.setInterval(triggerSound, 5000);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [incidents]);

  // Form State
  const [formBranchId, setFormBranchId] = useState(BRANCHES[0].id);
  const [formTitle, setFormTitle] = useState('');
  const [formDesc, setFormDesc] = useState('');
  const [formSeverity, setFormSeverity] = useState<Severity>(Severity.LOW);
  const [formImages, setFormImages] = useState<string[]>([]);
  
  // New Fields
  const [formReporterName, setFormReporterName] = useState('');
  const [formReporterRole, setFormReporterRole] = useState('');

  const handleResolve = (id: string) => {
    setIncidents(prev => prev.map(inc => inc.id === id ? { ...inc, isResolved: true } : inc));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formReporterName || !formReporterRole) {
      alert('Vui lòng nhập tên và chức vụ người báo cáo');
      return;
    }

    const newIncident: Incident = {
      id: Date.now().toString(),
      branchId: formBranchId,
      title: formTitle,
      description: formDesc,
      severity: formSeverity,
      timestamp: Date.now(),
      imageUrls: formImages,
      reporterName: formReporterName,
      reporterRole: formReporterRole,
      isResolved: false
    };

    setIncidents([newIncident, ...incidents]);
    
    // Reset Form
    setFormTitle('');
    setFormDesc('');
    setFormSeverity(Severity.LOW);
    setFormImages([]);
    setFormReporterName('');
    setFormReporterRole('');
    setActiveTab('dashboard');
  };

  // Grouping logic
  const filteredIncidents = selectedBranchFilter === 'all' 
    ? incidents 
    : incidents.filter(i => i.branchId === selectedBranchFilter);

  // Styling for "Chữ đen - Nền trắng - Khung tím"
  const inputStyle = "w-full rounded-lg border border-indigo-500 bg-white text-black p-3 focus:border-indigo-700 focus:ring-2 focus:ring-indigo-200 outline-none transition-all placeholder-gray-400 font-medium";
  const labelStyle = "block text-sm font-bold text-gray-700 mb-2";

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col font-sans">
      {/* Header */}
      <header className="bg-gradient-to-r from-fkRed to-fkPurple text-white shadow-lg sticky top-0 z-50">
        <div className="max-w-4xl mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center space-x-3">
            <div className="bg-white/20 p-2 rounded-full">
              <i className="fas fa-child text-2xl"></i>
            </div>
            <h1 className="text-xl font-bold tracking-tight">FunnyKids <span className="font-light opacity-80">Incident Manager</span></h1>
          </div>
          <button 
            onClick={() => playAlertSound()} // Hack to enable audio context on user gesture
            className="text-xs bg-white/10 hover:bg-white/20 px-2 py-1 rounded transition"
          >
            <i className="fas fa-volume-up"></i>
          </button>
        </div>
      </header>

      {/* Navigation Tabs */}
      <nav className="bg-white shadow-sm border-b sticky top-16 z-40">
        <div className="max-w-4xl mx-auto flex">
          <button
            onClick={() => setActiveTab('dashboard')}
            className={`flex-1 py-4 text-center font-medium text-sm transition-colors border-b-2 ${
              activeTab === 'dashboard' 
                ? 'border-fkPurple text-fkPurple bg-indigo-50/50' 
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            <i className="fas fa-th-large mr-2"></i>
            Theo dõi sự cố
          </button>
          <button
            onClick={() => setActiveTab('report')}
            className={`flex-1 py-4 text-center font-medium text-sm transition-colors border-b-2 ${
              activeTab === 'report' 
                ? 'border-fkRed text-fkRed bg-red-50/50' 
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            <i className="fas fa-plus-circle mr-2"></i>
            Báo cáo mới
          </button>
        </div>
      </nav>

      {/* Main Content */}
      <main className="flex-grow max-w-4xl w-full mx-auto px-4 py-6">
        
        {activeTab === 'dashboard' && (
          <div className="space-y-6">
            {/* Filter */}
            <div className="flex overflow-x-auto pb-2 space-x-2 no-scrollbar">
              <button 
                onClick={() => setSelectedBranchFilter('all')}
                className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${selectedBranchFilter === 'all' ? 'bg-fkDark text-white' : 'bg-white border border-gray-200 text-gray-600'}`}
              >
                Tất cả chi nhánh
              </button>
              {BRANCHES.map(b => (
                <button 
                  key={b.id}
                  onClick={() => setSelectedBranchFilter(b.id)}
                  className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${selectedBranchFilter === b.id ? 'bg-fkDark text-white' : 'bg-white border border-gray-200 text-gray-600'}`}
                >
                  {b.name}
                </button>
              ))}
            </div>

            {/* Incident List */}
            {BRANCHES.filter(b => selectedBranchFilter === 'all' || b.id === selectedBranchFilter).map(branch => {
              const branchIncidents = filteredIncidents.filter(i => i.branchId === branch.id);
              if (branchIncidents.length === 0 && selectedBranchFilter !== 'all') return <div key={branch.id} className="text-center text-gray-400 py-10">Không có sự cố nào.</div>;
              if (branchIncidents.length === 0) return null;

              return (
                <div key={branch.id} className="space-y-4">
                  <h2 className="text-lg font-bold text-gray-700 flex items-center border-l-4 border-fkPurple pl-3">
                    {branch.name}
                    <span className="ml-2 bg-gray-200 text-gray-600 text-xs px-2 py-0.5 rounded-full">{branchIncidents.length}</span>
                  </h2>
                  <div className="grid grid-cols-1 gap-4">
                    {branchIncidents
                      .sort((a, b) => b.timestamp - a.timestamp) // Newest first
                      .sort((a, b) => (a.severity === Severity.HIGH ? -1 : 1)) // High priority top
                      .map(incident => (
                      <IncidentCard key={incident.id} incident={incident} onResolve={handleResolve} />
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {activeTab === 'report' && (
          <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-6 animate-fade-in-up">
            <h2 className="text-2xl font-bold text-gray-800 mb-6 border-b pb-4">Báo cáo sự cố mới</h2>
            
            <form onSubmit={handleSubmit} className="space-y-6">
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                 <div>
                  <label className={labelStyle}>Họ và tên người báo cáo <span className="text-red-500">*</span></label>
                  <input 
                    type="text"
                    required
                    value={formReporterName}
                    onChange={(e) => setFormReporterName(e.target.value)}
                    className={inputStyle}
                    placeholder="Nhập họ tên..."
                  />
                </div>
                <div>
                  <label className={labelStyle}>Chức vụ tại chi nhánh <span className="text-red-500">*</span></label>
                  <input 
                    type="text"
                    required
                    value={formReporterRole}
                    onChange={(e) => setFormReporterRole(e.target.value)}
                    className={inputStyle}
                    placeholder="VD: Quản lý, Giám sát, Nhân viên..."
                  />
                </div>
              </div>

              <div>
                <label className={labelStyle}>Chi nhánh xảy ra sự cố</label>
                <select 
                  value={formBranchId}
                  onChange={(e) => setFormBranchId(e.target.value)}
                  className={inputStyle}
                >
                  {BRANCHES.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                </select>
              </div>

              <div>
                <label className={labelStyle}>Hình ảnh hiện trường (Tự động đóng dấu)</label>
                <WatermarkCamera images={formImages} onImagesChange={setFormImages} />
              </div>

              <div>
                <label className={labelStyle}>Tiêu đề sự cố <span className="text-red-500">*</span></label>
                <input 
                  type="text"
                  required
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  className={inputStyle}
                  placeholder="VD: Hỏng cầu trượt, Vỡ kính..."
                />
              </div>

              <div>
                <label className={labelStyle}>Mô tả chi tiết</label>
                <textarea 
                  value={formDesc}
                  onChange={(e) => setFormDesc(e.target.value)}
                  rows={4}
                  className={inputStyle}
                  placeholder="Mô tả chi tiết diễn biến sự cố, nguyên nhân (nếu biết)..."
                />
              </div>

              <div>
                <label className={labelStyle}>Mức độ nghiêm trọng</label>
                <select 
                  value={formSeverity}
                  onChange={(e) => setFormSeverity(e.target.value as Severity)}
                  className={inputStyle}
                >
                  <option value={Severity.LOW}>Thấp (Màu xanh)</option>
                  <option value={Severity.MEDIUM}>Trung Bình (Màu vàng)</option>
                  <option value={Severity.HIGH}>KHẨN CẤP / NGHIÊM TRỌNG (Màu đỏ)</option>
                </select>
              </div>

              <div className="pt-6 border-t border-gray-100 flex flex-col md:flex-row items-center justify-between gap-4">
                <span className="text-xs text-gray-500 italic">
                  * Vui lòng kiểm tra kỹ thông tin trước khi gửi
                </span>
                <button 
                  type="submit"
                  className="w-full md:w-auto bg-fkRed hover:bg-rose-700 text-white font-bold py-3 px-10 rounded-lg shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all"
                >
                  <i className="fas fa-paper-plane mr-2"></i> Gửi báo cáo
                </button>
              </div>

            </form>
          </div>
        )}
      </main>
    </div>
  );
};

export default App;