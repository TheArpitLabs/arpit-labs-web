import { supabaseServer } from '@/lib/supabase/server';
import { handleDatabaseError } from '@/lib/errors';
import {
  ResearchPaper,
  ResearchDataset,
  Certification,
  Startup,
  CommunityChapter,
  CommunityEvent,
} from '@/types/content';

export const ecosystemRepository = {
  // RESEARCH
  async getResearchPapers(division?: string) {
    let query = supabaseServer
      .from('research_papers')
      .select('*')
      .order('published_at', { ascending: false });
    if (division) query = query.eq('division', division);
    const { data, error } = await query;
    if (error) throw handleDatabaseError(error);
    return data as ResearchPaper[];
  },

  async getResearchDatasets() {
    const { data, error } = await supabaseServer
      .from('research_datasets')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) throw handleDatabaseError(error);
    return data as ResearchDataset[];
  },

  // UNIVERSITY
  async getCertifications() {
    const { data, error } = await supabaseServer
      .from('certifications')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) throw handleDatabaseError(error);
    return data as Certification[];
  },

  async getCertificationBySlug(slug: string) {
    const { data, error } = await supabaseServer
      .from('certifications')
      .select('*, exams(*)')
      .eq('slug', slug)
      .single();
    if (error) throw handleDatabaseError(error);
    return data;
  },

  // INNOVATION
  async getStartups() {
    const { data, error } = await supabaseServer
      .from('startups')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) throw handleDatabaseError(error);
    return data as Startup[];
  },

  // COMMUNITY
  async getCommunityChapters() {
    const { data, error } = await supabaseServer
      .from('community_chapters')
      .select('*')
      .order('member_count', { ascending: false });
    if (error) throw handleDatabaseError(error);
    return data as CommunityChapter[];
  },

  async getCommunityEvents(chapterId?: string) {
    let query = supabaseServer
      .from('community_events')
      .select('*, community_chapters(name, city, country_name)')
      .order('start_date', { ascending: true });
    if (chapterId) query = query.eq('chapter_id', chapterId);
    const { data, error } = await query;
    if (error) throw handleDatabaseError(error);
    return data as (CommunityEvent & {
      community_chapters: { name: string; city: string; country_name: string };
    })[];
  },
};
