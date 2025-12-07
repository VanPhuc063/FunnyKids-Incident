export enum Severity {
  HIGH = 'HIGH',
  MEDIUM = 'MEDIUM',
  LOW = 'LOW'
}

export interface Incident {
  id: string;
  branchId: string;
  title: string;
  description: string;
  severity: Severity;
  timestamp: number;
  imageUrls: string[]; // Changed from single imageUrl to array
  reporterName: string;
  reporterRole: string; // Added role
  isResolved: boolean;
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