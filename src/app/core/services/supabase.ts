import { Injectable } from '@angular/core';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class SupabaseService {
  private supabase: SupabaseClient;

  constructor() {
    this.supabase = createClient(
      environment.supabaseUrl,
      environment.supabaseKey,
      {
        auth: {
          storage: localStorage,
          autoRefreshToken: true,
          persistSession: true,
          detectSessionInUrl: false,
          // Capacitor pausa el WebView durante el scanner de QR, lo que rompe
          // el Web Locks API que Supabase usa por defecto. Esto lo evita.
          lock: (_name, _timeout, fn) => fn(),
        },
      }
    );
  }

  get client() {
    return this.supabase;
  }
}
