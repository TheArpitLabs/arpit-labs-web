import { createClient } from '@supabase/supabase-js';
import type { Roadmap } from '@/types/content';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

export const roadmapsRepository = {
  async getAll(published = true): Promise<Roadmap[]> {
    const query = supabase.from('roadmaps').select('*');
    
    if (published) {
      query.eq('published', true);
    }
    
    const { data, error } = await query.order('created_at', { ascending: false });
    
    if (error) {
      console.error('Error fetching roadmaps:', error);
      throw error;
    }
    
    return data || [];
  },

  async getByCategory(category: string): Promise<Roadmap[]> {
    const { data, error } = await supabase
      .from('roadmaps')
      .select('*')
      .eq('category', category)
      .eq('published', true)
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error('Error fetching roadmaps by category:', error);
      throw error;
    }
    
    return data || [];
  },

  async getBySlug(slug: string): Promise<Roadmap | null> {
    const { data, error } = await supabase
      .from('roadmaps')
      .select('*')
      .eq('slug', slug)
      .single();
    
    if (error && error.code !== 'PGRST116') {
      console.error('Error fetching roadmap:', error);
    }
    
    return data || null;
  },

  async getById(id: string): Promise<Roadmap | null> {
    const { data, error } = await supabase
      .from('roadmaps')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error && error.code !== 'PGRST116') {
      console.error('Error fetching roadmap:', error);
    }
    
    return data || null;
  },

  async create(roadmap: Omit<Roadmap, 'id' | 'created_at' | 'updated_at'>): Promise<Roadmap> {
    const { data, error } = await supabase
      .from('roadmaps')
      .insert([roadmap])
      .select()
      .single();
    
    if (error) {
      console.error('Error creating roadmap:', error);
      throw error;
    }
    
    return data;
  },

  async update(id: string, updates: Partial<Roadmap>): Promise<Roadmap> {
    const { data, error } = await supabase
      .from('roadmaps')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    
    if (error) {
      console.error('Error updating roadmap:', error);
      throw error;
    }
    
    return data;
  },

  async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from('roadmaps')
      .delete()
      .eq('id', id);
    
    if (error) {
      console.error('Error deleting roadmap:', error);
      throw error;
    }
  },
};
