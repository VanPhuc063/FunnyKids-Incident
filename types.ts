export enum Severity {
  HIGH = 'HIGH',
  MEDIUM = 'MEDIUM',
  LOW = 'LOW'
}

export enum IncidentType {
  DEVICE = 'DEVICE',   // Sự cố thiết bị
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

export const BRANCHES: Branch[] = [
  { id: 'b1', name: 'FunnyKids Chi Nhánh 1' },
  { id: 'b2', name: 'FunnyKids Chi Nhánh 2' },
  { id: 'b3', name: 'FunnyKids Chi Nhánh 3' },
  { id: 'b4', name: 'FunnyKids Chi Nhánh 4' },
];