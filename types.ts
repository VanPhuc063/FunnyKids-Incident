
export enum Severity {
  HIGH = 'HIGH',
  MEDIUM = 'MEDIUM',
  LOW = 'LOW'
}

export enum IncidentType {
  DEVICE = 'DEVICE',   // Sự cố thiết bị
  GAME = 'GAME',       // Sự cố máy game
  ACCIDENT = 'ACCIDENT' // Sự cố tai nạn
}

export enum DeviceStatus {
  UNSAFE = 'UNSAFE',         // Không an toàn
  BROKEN = 'BROKEN',         // Hỏng hẳn
  WAITING_PARTS = 'WAITING_PARTS', // Chờ đồ thay
  FIXED = 'FIXED'            // Đã sửa
}

export interface Incident {
  id: string;
  branchId: string;
  title: string;
  description: string;
  severity: Severity;
  type: IncidentType; // New field for incident classification
  timestamp: number;
  imageUrls: string[]; 
  reporterName: string;
  reporterRole: string; 
  isResolved: boolean;
  
  // Device specific fields
  deviceStatus?: DeviceStatus;
  setupResponse?: string;

  // Resolution details
  resolutionNote?: string;
  resolutionImageUrls?: string[];
}

export interface Branch {
  id: string;
  name: string;
}

// Danh sách 33 chi nhánh FunnyKids
export const BRANCHES: Branch[] = [
  { id: 'b1', name: 'CN Go Thái Bình' },
  { id: 'b2', name: 'CN Vincom Bắc Từ Liêm' },
  { id: 'b3', name: 'CN Vincom Trần Duy Hưng' },
  { id: 'b4', name: 'CN Time City' },
  { id: 'b5', name: 'CN Royal City' },
  { id: 'b6', name: 'CN Vincom Bắc Giang' },
  { id: 'b7', name: 'CN Vincom Điện Biên' },
  { id: 'b8', name: 'CN Vincom Bắc Ninh' },
  { id: 'b9', name: 'CN Yên Bái' },
  { id: 'b10', name: 'CN Sơn La' },
  { id: 'b11', name: 'CN Lào Cai' },
  { id: 'b12', name: 'CN Hoà Bình' },
  { id: 'b13', name: 'CN Uông Bí' },
  { id: 'b14', name: 'CN Bắc Kạn' },
  { id: 'b15', name: 'CN Cẩm Phả' },
  { id: 'b16', name: 'CN Móng Cái' },
  { id: 'b17', name: 'CN Vincom Quảng Bình' },
  { id: 'b18', name: 'CN Vincom Đà Nẵng' },
  { id: 'b19', name: 'CN Lotte Phan Thiết' },
  { id: 'b20', name: 'CN Lotte Vinh' },
  { id: 'b21', name: 'CN Quãng Ngãi' },
  { id: 'b22', name: 'CN Ninh Thuận' },
  { id: 'b23', name: 'CN Thái Hoà' },
  { id: 'b24', name: 'CN Kon Tum' },
  { id: 'b25', name: 'CN Kỳ Anh' },
  { id: 'b26', name: 'CN Hà Tĩnh' },
  { id: 'b27', name: 'CN Vincom Thanh Hoá' },
  { id: 'b28', name: 'CN Go Bà Rịa' },
  { id: 'b29', name: 'CN Land Mark 81' },
  { id: 'b30', name: 'CN Biên Hoà' },
  { id: 'b31', name: 'CN Sóc Trăng' },
  { id: 'b32', name: 'CN Đồng Tháp' },
  { id: 'b33', name: 'CN Bến Tre' },
];