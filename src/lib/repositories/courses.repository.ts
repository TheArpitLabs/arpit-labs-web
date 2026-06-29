import { createClient } from '@supabase/supabase-js';
import type { Course, CourseModule, CourseWithProgress, UserCourseProgress } from '@/types/content';
import { logger } from '@/lib/logger';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

export const coursesRepository = {
  async getAll(published = true): Promise<Course[]> {
    const query = supabase.from('courses').select('*');
    
    if (published) {
      query.eq('published', true);
    }
    
    const { data, error } = await query.order('created_at', { ascending: false });
    
    if (error) {
      logger.error('Error fetching courses:', error);
      throw error;
    }
    
    return data || [];
  },

  async getByCategory(category: string): Promise<Course[]> {
    const { data, error } = await supabase
      .from('courses')
      .select('*')
      .eq('category', category)
      .eq('published', true)
      .order('created_at', { ascending: false });
    
    if (error) {
      logger.error('Error fetching courses by category:', error);
      throw error;
    }
    
    return data || [];
  },

  async getBySlug(slug: string): Promise<Course | null> {
    const { data, error } = await supabase
      .from('courses')
      .select('*')
      .eq('slug', slug)
      .single();
    
    if (error && error.code !== 'PGRST116') {
      logger.error('Error fetching course:', error);
    }
    
    return data || null;
  },

  async getById(id: string): Promise<Course | null> {
    const { data, error } = await supabase
      .from('courses')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error && error.code !== 'PGRST116') {
      logger.error('Error fetching course:', error);
    }
    
    return data || null;
  },

  async create(course: Omit<Course, 'id' | 'created_at' | 'updated_at'>): Promise<Course> {
    const { data, error } = await supabase
      .from('courses')
      .insert([course])
      .select()
      .single();
    
    if (error) {
      logger.error('Error creating course:', error);
      throw error;
    }
    
    return data;
  },

  async update(id: string, updates: Partial<Course>): Promise<Course> {
    const { data, error } = await supabase
      .from('courses')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    
    if (error) {
      logger.error('Error updating course:', error);
      throw error;
    }
    
    return data;
  },

  async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from('courses')
      .delete()
      .eq('id', id);
    
    if (error) {
      logger.error('Error deleting course:', error);
      throw error;
    }
  },
};

export const courseModulesRepository = {
  async getByCourseId(courseId: string): Promise<CourseModule[]> {
    const { data, error } = await supabase
      .from('course_modules')
      .select('*')
      .eq('course_id', courseId)
      .order('order_index', { ascending: true });
    
    if (error) {
      logger.error('Error fetching course modules:', error);
      throw error;
    }
    
    return data || [];
  },

  async create(module: Omit<CourseModule, 'id' | 'created_at' | 'updated_at'>): Promise<CourseModule> {
    const { data, error } = await supabase
      .from('course_modules')
      .insert([module])
      .select()
      .single();
    
    if (error) {
      logger.error('Error creating course module:', error);
      throw error;
    }
    
    return data;
  },

  async update(id: string, updates: Partial<CourseModule>): Promise<CourseModule> {
    const { data, error } = await supabase
      .from('course_modules')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    
    if (error) {
      logger.error('Error updating course module:', error);
      throw error;
    }
    
    return data;
  },

  async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from('course_modules')
      .delete()
      .eq('id', id);
    
    if (error) {
      logger.error('Error deleting course module:', error);
      throw error;
    }
  },
};

export const userCourseProgressRepository = {
  async getByUserId(userId: string): Promise<UserCourseProgress[]> {
    const { data, error } = await supabase
      .from('user_course_progress')
      .select('*')
      .eq('user_id', userId);
    
    if (error) {
      logger.error('Error fetching user course progress:', error);
      throw error;
    }
    
    return data || [];
  },

  async getByUserAndCourse(userId: string, courseId: string): Promise<UserCourseProgress | null> {
    const { data, error } = await supabase
      .from('user_course_progress')
      .select('*')
      .eq('user_id', userId)
      .eq('course_id', courseId)
      .single();
    
    if (error && error.code !== 'PGRST116') {
      logger.error('Error fetching user course progress:', error);
    }
    
    return data || null;
  },

  async upsert(userId: string, courseId: string, updates: Partial<UserCourseProgress>): Promise<UserCourseProgress> {
    const { data, error } = await supabase
      .from('user_course_progress')
      .upsert({
        user_id: userId,
        course_id: courseId,
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .select()
      .single();
    
    if (error) {
      logger.error('Error upserting user course progress:', error);
      throw error;
    }
    
    return data;
  },
};
