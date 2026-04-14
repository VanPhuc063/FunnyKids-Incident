import { createClient, SupabaseClient } from '@supabase/supabase-js';

let supabaseInstance: SupabaseClient | null = null;

// Hàm lấy client hiện tại (hoặc null nếu chưa cấu hình)
export const getSupabase = (): SupabaseClient | null => {
  if (supabaseInstance) return supabaseInstance;

  // 1. Ưu tiên đọc từ biến môi trường (Cấu hình trên Vercel)
  // Use type assertion to avoid TS errors when vite types are missing
  const env = (import.meta as any).env;
  const envUrl = env?.VITE_SUPABASE_URL;
  const envKey = env?.VITE_SUPABASE_KEY;

  if (envUrl && envKey) {
    try {
      supabaseInstance = createClient(envUrl, envKey, {
        global: {
          fetch: (...args) => fetch(...args)
        }
      });
      return supabaseInstance;
    } catch (e) {
      console.error("Invalid Environment Variables Config", e);
    }
  }

  // 2. Fallback sang LocalStorage (Cấu hình thủ công trên trình duyệt)
  const url = localStorage.getItem('sb_url');
  const key = localStorage.getItem('sb_key');

  if (url && key) {
    try {
      supabaseInstance = createClient(url, key, {
        global: {
          fetch: (...args) => fetch(...args)
        }
      });
      return supabaseInstance;
    } catch (e) {
      console.error("Invalid Local Storage Config", e);
      return null;
    }
  }
  return null;
};

// Hàm khởi tạo/lưu cấu hình mới (Dùng cho nhập thủ công)
export const initSupabase = (url: string, key: string) => {
  // Simple validation
  if (!url.startsWith('http') || key.length < 20) {
    throw new Error("Cấu hình không hợp lệ");
  }
  
  localStorage.setItem('sb_url', url);
  localStorage.setItem('sb_key', key);
  supabaseInstance = createClient(url, key, {
    global: {
      fetch: (...args) => fetch(...args)
    }
  });
  return supabaseInstance;
};

// Hàm xóa cấu hình
export const resetSupabaseConfig = () => {
  localStorage.removeItem('sb_url');
  localStorage.removeItem('sb_key');
  // Nếu có biến môi trường, instance sẽ được tạo lại từ biến môi trường ở lần gọi getSupabase tiếp theo
  supabaseInstance = null;
};