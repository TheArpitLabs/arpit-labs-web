export interface Project {
  id: string;
  title: string;
  slug: string;
  description: string;
  content?: string | null;
  overview?: string | null;
  problem_statement?: string | null;
  architecture?: string | null;
  tech_stack?: string[] | null;
  screenshots?: string[] | null;
  lessons_learned?: string[] | null;
  category: string;
  tags: string[];
  github_url?: string | null;
  demo_url?: string | null;
  cover_image?: string | null;
  published?: boolean | null;
  featured: boolean;
  created_at: string;
  updated_at: string;
}

export interface Experiment {
  id: string;
  title: string;
  slug: string;
  description: string;
  status: string;
  difficulty?: string | null;
  category?: string | null;
  tech_stack?: string[] | null;
  featured: boolean;
  cover_image?: string | null;
  content?: string | null;
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

export type JourneyEntryType =
  | "education"
  | "competition"
  | "hackathon"
  | "certification"
  | "milestone";

export interface JourneyItem {
  id: string;
  year: number;
  title: string;
  description: string;
  entry_type?: JourneyEntryType | null;
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
  created_at: string;
}

export interface NewsletterSubscriber {
  id: string;
  email: string;
  subscribed_at: string;
}
