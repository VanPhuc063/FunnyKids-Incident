import { createClient, SupabaseClient } from '@supabase/supabase-js';

let supabaseInstance: SupabaseClient | null = null;

// Hàm lấy client hiện tại (hoặc null nếu chưa cấu hình)
export const getSupabase = (): SupabaseClient | null => {
  if (supabaseInstance) return supabaseInstance;

  const url = localStorage.getItem('sb_url');
  const key = localStorage.getItem('sb_key');

  if (url && key) {
    try {
      supabaseInstance = createClient(url, key);
      return supabaseInstance;
    } catch (e) {
      console.error("Invalid Supabase config", e);
      return null;
    }
  }
  return null;
};

// Hàm khởi tạo/lưu cấu hình mới
export const initSupabase = (url: string, key: string) => {
  // Simple validation
  if (!url.startsWith('http') || key.length < 20) {
    throw new Error("Cấu hình không hợp lệ");
  }
  
  localStorage.setItem('sb_url', url);
  localStorage.setItem('sb_key', key);
  supabaseInstance = createClient(url, key);
  return supabaseInstance;
};

// Hàm xóa cấu hình (Đăng xuất khỏi project)
export const resetSupabaseConfig = () => {
  localStorage.removeItem('sb_url');
  localStorage.removeItem('sb_key');
  supabaseInstance = null;
};