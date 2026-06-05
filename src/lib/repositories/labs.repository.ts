import { createClient } from '@supabase/supabase-js';
import type { Lab } from '@/types/content';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

export const labsRepository = {
  async getAll(published = true): Promise<Lab[]> {
    const query = supabase.from('labs').select('*');
    
    if (published) {
      query.eq('published', true);
    }
    
    const { data, error } = await query.order('created_at', { ascending: false });
    
    if (error) {
      console.error('Error fetching labs:', error);
      throw error;
    }
    
    return data || [];
  },

  async getByCategory(category: string): Promise<Lab[]> {
    const { data, error } = await supabase
      .from('labs')
      .select('*')
      .eq('category', category)
      .eq('published', true)
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error('Error fetching labs by category:', error);
      throw error;
    }
    
    return data || [];
  },

  async getBySlug(slug: string): Promise<Lab | null> {
    const { data, error } = await supabase
      .from('labs')
      .select('*')
      .eq('slug', slug)
      .single();
    
    if (error && error.code !== 'PGRST116') {
      console.error('Error fetching lab:', error);
    }
    
    return data || null;
  },

  async getById(id: string): Promise<Lab | null> {
    const { data, error } = await supabase
      .from('labs')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error && error.code !== 'PGRST116') {
      console.error('Error fetching lab:', error);
    }
    
    return data || null;
  },

  async create(lab: Omit<Lab, 'id' | 'created_at' | 'updated_at'>): Promise<Lab> {
    const { data, error } = await supabase
      .from('labs')
      .insert([lab])
      .select()
      .single();
    
    if (error) {
      console.error('Error creating lab:', error);
      throw error;
    }
    
    return data;
  },

  async update(id: string, updates: Partial<Lab>): Promise<Lab> {
    const { data, error } = await supabase
      .from('labs')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    
    if (error) {
      console.error('Error updating lab:', error);
      throw error;
    }
    
    return data;
  },

  async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from('labs')
      .delete()
      .eq('id', id);
    
    if (error) {
      console.error('Error deleting lab:', error);
      throw error;
    }
  },
};
