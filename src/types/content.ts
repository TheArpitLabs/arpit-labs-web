export type JourneyEntryType = 'work' | 'education' | 'achievement' | 'milestone' | 'competition' | 'hackathon' | 'certification';

export interface Project {
  id: string;
  title: string;
  slug: string;
  description: string;
  category: string;
  content?: string | null;
  overview?: string | null;
  problem_statement?: string | null;
  architecture?: string | null;
  tech_stack: string[];
  github_url?: string | null;
  demo_url?: string | null;
  cover_image?: string | null;
  screenshots: string[];
  lessons_learned?: string[] | null;
  tags: string[];
  featured: boolean;
  published: boolean;
  created_at: string;
  updated_at: string;
}

export interface ProductFeature {
  id: string;
  product_id: string;
  title: string;
  description: string;
  created_at: string;
  updated_at: string;
}

export interface ProductScreenshot {
  id: string;
  product_id: string;
  image_url: string;
  sort_order: number;
  created_at: string;
}

export interface Product {
  id: string;
  title: string;
  slug: string;
  description: string;
  overview?: string | null;
  category: string;
  pricing_type: string;
  pricing_details?: string | null;
  demo_url?: string | null;
  documentation_url?: string | null;
  cover_image?: string | null;
  featured: boolean;
  published: boolean;
  created_at: string;
  updated_at: string;
  // Join fields
  features?: ProductFeature[];
  screenshots?: ProductScreenshot[];
}

export interface Experiment {
  id: string;
  title: string;
  slug: string;
  description: string;
  content?: string | null;
  category?: string | null;
  difficulty?: string | null;
  tech_stack: string[];
  status: string;
  featured: boolean;
  published: boolean;
  cover_image?: string | null;
  created_at: string;
  updated_at: string;
}

export interface LabNote {
  id: string;
  title: string;
  slug: string;
  excerpt?: string | null;
  content?: string | null;
  category?: string | null;
  cover_image?: string | null;
  tags: string[];
  published: boolean;
  reading_time?: number | null;
  created_at: string;
  updated_at: string;
}

export interface JourneyItem {
  id: string;
  year: number;
  title: string;
  description: string;
  entry_type: JourneyEntryType;
  organization?: string | null;
  location?: string | null;
  icon?: string | null;
  display_order: number;
  created_at: string;
  updated_at: string;
}

export interface ContactMessage {
  id: string;
  name: string;
  email: string;
  subject: string;
  message: string;
  is_read: boolean;
  created_at: string;
}

export interface NewsletterSubscriber {
  id: string;
  email: string;
  subscribed_at: string;
}

export interface Hackathon {
  id: string;
  title: string;
  slug: string;
  description: string;
  organizer: string;
  start_date?: string | null;
  end_date?: string | null;
  registration_deadline?: string | null;
  status: string;
  created_at: string;
}

export interface HackathonTeam {
  id: string;
  hackathon_id: string;
  team_name: string;
  leader_id: string;
  description?: string | null;
  created_at: string;
}

export interface HackathonTeamMember {
  id: string;
  team_id: string;
  user_id: string;
}

export interface HackathonSubmission {
  id: string;
  hackathon_id: string;
  team_id: string;
  title: string;
  description?: string | null;
  github_url?: string | null;
  demo_url?: string | null;
  documentation_url?: string | null;
  score?: number | null;
  submitted_at: string;
}

export interface AdminStats {
  projectsCount: number;
  articlesCount: number;
  experimentsCount: number;
  subscribersCount: number;
  messagesCount: number;
  draftCount: number;
  publishedCount: number;
}

// ============================================================================
// LEARNING PLATFORM TYPES
// ============================================================================

export type LearningCategory = 'IoT' | 'AI' | 'Cybersecurity' | 'Web Development';
export type LearningDifficulty = 'beginner' | 'intermediate' | 'advanced';

export interface Course {
  id: string;
  title: string;
  slug: string;
  description: string;
  content?: string | null;
  category: LearningCategory;
  difficulty: LearningDifficulty;
  duration: number; // in minutes
  thumbnail?: string | null;
  published: boolean;
  created_at: string;
  updated_at: string;
}

export interface CourseModule {
  id: string;
  course_id: string;
  title: string;
  content: string;
  order_index: number;
  created_at: string;
  updated_at: string;
}

export interface Lab {
  id: string;
  title: string;
  slug: string;
  description: string;
  instructions: string;
  difficulty: LearningDifficulty;
  category: LearningCategory;
  published: boolean;
  created_at: string;
  updated_at: string;
}

export interface Roadmap {
  id: string;
  title: string;
  slug: string;
  description: string;
  category: LearningCategory;
  content: string;
  published: boolean;
  created_at: string;
  updated_at: string;
}

export interface UserCourseProgress {
  id: string;
  user_id: string;
  course_id: string;
  progress_percentage: number;
  completed: boolean;
  updated_at: string;
}

export interface CourseWithProgress extends Course {
  progress?: UserCourseProgress | null;
}
