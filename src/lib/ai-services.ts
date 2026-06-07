/**
 * Phase 7: AI Service Layer
 * Integrates with OpenAI and vector database patterns
 * 
 * Features:
 * - AI Chat with knowledge base
 * - Semantic search
 * - Content generation
 * - Smart analytics
 */

import { createClient } from '@supabase/supabase-js';
import { experimentsRepository } from '@/lib/repositories/experiments.repository';
import { journeyRepository } from '@/lib/repositories/journey.repository';
import { labNotesRepository } from '@/lib/repositories/labnotes.repository';
import { projectsRepository } from '@/lib/repositories/projects.repository';
import type { Experiment, JourneyItem, LabNote, Project } from '@/types/content';

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

// ============================================================================
// 1. AI CHAT SERVICE
// ============================================================================

interface AIMessage {
  role: 'user' | 'assistant';
  content: string;
}

interface AIConversation {
  id: string;
  userId: string | null;
  messages: AIMessage[];
  topic: 'projects' | 'blog' | 'experiments' | 'general';
  context: Record<string, any>;
}

/**
 * AI Chat Service - Main orchestrator for chat functionality
 */
export class AIChatService {
  private model: string = 'gpt-4';
  private temperature: number = 0.7;
  private maxTokens: number = 2000;

  private conversationHistory: Map<string, AIConversation> = new Map();

  constructor() {
    this.initializeAI();
  }

  private initializeAI() {
    console.log('AI Chat Service initialized');
  }

  /**
   * Start new conversation
   */
  async startConversation(
    userId: string | null,
    topic: 'projects' | 'blog' | 'experiments' | 'general' = 'general'
  ): Promise<AIConversation> {
    const conversationId = `conv_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    const conversation: AIConversation = {
      id: conversationId,
      userId,
      messages: [],
      topic,
      context: this.buildContext(topic),
    };

    this.conversationHistory.set(conversationId, conversation);

    // Persist to database
    try {
      await supabase.from('ai_conversations').insert({
        id: conversationId,
        user_id: userId,
        title: `Chat about ${topic}`,
        topic,
        created_at: new Date().toISOString(),
      });
    } catch (error) {
      console.error('Failed to save conversation to DB:', error);
    }

    return conversation;
  }

  /**
   * Send message and get response
   */
  async sendMessage(
    conversationId: string,
    userMessage: string
  ): Promise<{ response: string; conversationId: string }> {
    const conversation = this.conversationHistory.get(conversationId);
    if (!conversation) {
      throw new Error(`Conversation ${conversationId} not found`);
    }

    // Add user message
    conversation.messages.push({
      role: 'user',
      content: userMessage,
    });

    // Save user message to DB
    try {
      await supabase.from('ai_messages').insert({
        conversation_id: conversationId,
        role: 'user',
        content: userMessage,
        model: this.model,
        created_at: new Date().toISOString(),
      });
    } catch (error) {
      console.error('Failed to save message to DB:', error);
    }

    // Generate AI response
    const response = await this.generateResponse(conversation);

    // Add assistant response
    conversation.messages.push({
      role: 'assistant',
      content: response,
    });

    // Save assistant message to DB
    try {
      await supabase.from('ai_messages').insert({
        conversation_id: conversationId,
        role: 'assistant',
        content: response,
        model: this.model,
        created_at: new Date().toISOString(),
      });
    } catch (error) {
      console.error('Failed to save response to DB:', error);
    }

    return {
      response,
      conversationId,
    };
  }

  /**
   * Generate response using OpenAI
   */
  private async generateResponse(conversation: AIConversation): Promise<string> {
    const knowledgeContext = await this.searchKnowledgeBase(
      conversation.messages[conversation.messages.length - 1].content,
      conversation.topic
    );

    const systemPrompt = this.buildSystemPrompt(conversation.topic, knowledgeContext);
    const messages = conversation.messages.map(msg => ({
      role: msg.role,
      content: msg.content,
    }));

    try {
      return await this.callOpenAI(systemPrompt, messages);
    } catch (error) {
      console.error('OpenAI call failed:', error);
      return this.generateFallbackResponse(conversation.topic);
    }
  }

  /**
   * Search knowledge base for relevant content
   */
  private async searchKnowledgeBase(query: string, topic: string): Promise<string[]> {
    try {
      // Use semantic search service to retrieve relevant chunks
      // semanticSearchService instance is created at module export time below
      // @ts-ignore
      const results = typeof semanticSearchService !== 'undefined' ? await semanticSearchService.search(query, 3) : null;

      if (Array.isArray(results) && results.length > 0) {
        return results.map((r: any) => r.preview || r.chunk || '');
      }

      // Fallback: direct DB query for matching source_type
      const { data } = await supabase
        .from('ai_knowledge_base')
        .select('content')
        .eq('source_type', topic)
        .eq('is_active', true)
        .limit(3);

      return data ? data.map((item: any) => item.content) : [];
    } catch (error) {
      console.error('Failed to search knowledge base:', error);
      return [];
    }
  }

  /**
   * Build system prompt with context
   */
  private buildSystemPrompt(topic: string, context: string[]): string {
    const topicDescriptions: Record<string, string> = {
      projects: 'You are an AI assistant helping with software projects and technical solutions.',
      blog: 'You are an AI assistant discussing blog articles and technical writing.',
      experiments: 'You are an AI assistant explaining experiments and research.',
      general: 'You are a helpful AI assistant.',
    };

    let prompt = topicDescriptions[topic] || topicDescriptions.general;

    if (context.length > 0) {
      prompt += `\n\nRelevant context:\n${context.join('\n\n')}`;
    }

    return prompt;
  }

  /**
   * Build context for conversation
   */
  private buildContext(topic: string): Record<string, any> {
    return {
      topic,
      createdAt: new Date().toISOString(),
      model: this.model,
    };
  }

  /**
   * Call OpenAI API
   */
  private async callOpenAI(systemPrompt: string, messages: any[]): Promise<string> {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      return this.generateFallbackResponse('general');
    }

    try {
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: this.model,
          messages: [
            { role: 'system', content: systemPrompt },
            ...messages,
          ],
          max_tokens: this.maxTokens,
          temperature: this.temperature,
        }),
      });

      if (!response.ok) {
        throw new Error(`OpenAI API error: ${response.status}`);
      }

      const data = await response.json();
      return data?.choices?.[0]?.message?.content?.trim() || 'Unable to generate response';
    } catch (error) {
      console.error('OpenAI call error:', error);
      throw error;
    }
  }

  /**
   * Generate fallback response when OpenAI is unavailable
   */
  private generateFallbackResponse(topic: string): string {
    const fallbacks: Record<string, string> = {
      projects: 'I can help you explore various software projects and technical solutions. What would you like to know?',
      blog: 'I can discuss blog articles on various technical topics. What interests you?',
      experiments: 'I can explain experiments and research concepts. What would you like to explore?',
      general: 'I am an AI assistant ready to help. How can I assist you today?',
    };

    return fallbacks[topic] || fallbacks.general;
  }

  /**
   * Get conversation history
   */
  getConversation(conversationId: string): AIConversation | undefined {
    return this.conversationHistory.get(conversationId);
  }

  /**
   * Save conversation to database
   */
  async saveConversation(conversationId: string): Promise<void> {
    const conversation = this.conversationHistory.get(conversationId);
    if (!conversation) {
      throw new Error(`Conversation ${conversationId} not found`);
    }

    try {
      await supabase.from('ai_conversations').update({
        updated_at: new Date().toISOString(),
      }).eq('id', conversationId);
    } catch (error) {
      console.error('Failed to save conversation:', error);
    }
  }
}

// ============================================================================
// 2. KNOWLEDGE BASE SERVICE
// ============================================================================

interface KnowledgeBaseItem {
  id: string;
  sourceType: 'project' | 'blog' | 'experiment' | 'journey';
  sourceId: string;
  title: string;
  content: string;
  url: string;
}

interface GeneratedProject {
  title: string;
  description: string;
  techStack: Record<string, string[]>;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  estimatedBudget: number;
  estimatedDuration: string;
  learningOutcomes: string[];
  features: string[];
  architecture: string;
  roadmap: string[];
  learningPath: string[];
}

interface GeneratedBlogContent {
  title: string;
  excerpt: string;
  content: string;
  metaDescription: string;
  tags: string[];
}

interface GeneratedSocialContent {
  linkedin: string;
  twitter: string;
  announcement: string;
  launch: string;
}

interface NewsletterPayload {
  title: string;
  summary: string;
  highlights: string[];
  newProjects: Array<{ title: string; summary: string; url?: string }>;
  recentArticles: Array<{ title: string; summary: string; url?: string }>;
  experimentUpdates: Array<{ title: string; summary: string; url?: string }>;
  newsletterHtml: string;
}

interface WeeklyReportPayload {
  title: string;
  visitorInsights: string;
  popularProjects: string[];
  popularArticles: string[];
  searchTrends: string[];
  recruiterActivity: string;
  summary: string;
  reportContent: string;
  metrics: Record<string, any>;
}

interface EnhanceContentPayload {
  seoDescription: string;
  metaTags: string[];
  openGraph: {
    title: string;
    description: string;
    image?: string;
  };
  keywords: string[];
}

interface AiGenerationRecord {
  id: string;
  generation_type: string;
  source_type?: string;
  source_id?: string;
  status: string;
  output: Record<string, any>;
  tokens_used?: number;
  created_at: string;
  updated_at: string;
  metadata: Record<string, any>;
}

interface AiReportRecord {
  id: string;
  report_type: string;
  period: string;
  title: string;
  summary?: string;
  content?: string;
  metrics: Record<string, any>;
  generated_at: string;
  updated_at: string;
  metadata: Record<string, any>;
}

interface AiJobRecord {
  id: string;
  type: string;
  status: string;
  payload: Record<string, any>;
  result: Record<string, any>;
  error_message?: string;
  tokens_used?: number;
  started_at?: string;
  completed_at?: string;
  created_at: string;
  updated_at: string;
  metadata: Record<string, any>;
}

/**
 * Knowledge Base Service - Manages indexed content for AI
 */
export class KnowledgeBaseService {
  private chunkSize = 800;
  private chunkOverlap = 100;

  constructor() {}

  /**
   * Index new content
   */
  async indexContent(item: KnowledgeBaseItem): Promise<void> {
    console.log(`Indexing ${item.sourceType}: ${item.title}`);

    await this.deleteExistingEmbeddings(item);

    // 1. Split content into chunks
    const chunks = await this.splitText(item.content);

    if (chunks.length === 0) {
      console.warn(`No content to index for ${item.sourceType}:${item.sourceId}`);
      return;
    }

    // 2. Generate embeddings for each chunk
    const embeddings = await this.generateEmbeddings(chunks);

    // 3. Store embeddings in Supabase
    for (let i = 0; i < chunks.length; i++) {
      await this.storeEmbedding({
        content: chunks[i],
        embedding: embeddings[i],
        sourceType: item.sourceType,
        sourceId: item.sourceId,
        title: item.title,
        url: item.url,
        chunkNumber: i,
      });
    }
  }

  private async splitText(text: string): Promise<string[]> {
    const normalized = text.trim().replace(/\s+/g, ' ');
    const chunks: string[] = [];
    let start = 0;

    while (start < normalized.length) {
      const end = Math.min(start + this.chunkSize, normalized.length);
      const chunk = normalized.slice(start, end).trim();
      if (chunk) {
        chunks.push(chunk);
      }
      if (end >= normalized.length) {
        break;
      }
      start = Math.max(0, end - this.chunkOverlap);
    }

    return chunks;
  }

  /**
   * Generate embeddings for content chunks
   */
  private async generateEmbeddings(chunks: string[]): Promise<number[][]> {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      throw new Error('Missing OPENAI_API_KEY for embedding generation');
    }

    try {
      const res = await fetch('https://api.openai.com/v1/embeddings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({ model: 'text-embedding-3-small', input: chunks }),
      });

      if (!res.ok) {
        const text = await res.text();
        throw new Error(`OpenAI Embeddings error: ${res.status} ${text}`);
      }

      const data = await res.json();
      return data.data.map((d: any) => d.embedding as number[]);
    } catch (error) {
      console.error('Embedding generation failed:', error);
      return chunks.map(() => Array(1536).fill(0));
    }
  }

  /**
   * Store embedding in database
   */
  private async storeEmbedding(data: {
    content: string;
    embedding: number[];
    sourceType: string;
    sourceId: string;
    title: string;
    url: string;
    chunkNumber: number;
  }): Promise<void> {
    try {
      const metadata = {
        title: data.title,
        url: data.url,
        chunkNumber: data.chunkNumber,
      };

      const { error } = await supabase.from('content_embeddings').insert([
        {
          content_type: data.sourceType,
          content_id: data.sourceId,
          title: data.title,
          chunk: data.content,
          embedding: data.embedding,
          metadata,
        },
      ]);

      if (error) {
        console.error('Failed to store embedding in Supabase:', error.message || error);
      }
    } catch (err) {
      console.error('Error storing embedding:', err);
    }
  }

  private async deleteExistingEmbeddings(item: KnowledgeBaseItem): Promise<void> {
    try {
      const { error } = await supabase
        .from('content_embeddings')
        .delete()
        .match({ content_type: item.sourceType, content_id: item.sourceId });

      if (error) {
        console.error('Failed to delete existing embeddings:', error.message || error);
      }
    } catch (error) {
      console.error('Error deleting existing embeddings:', error);
    }
  }

  private buildProjectContent(project: Project): string {
    return [
      project.title,
      project.description,
      project.overview,
      project.problem_statement,
      project.architecture,
      project.lessons_learned?.join(' '),
      `Tech stack: ${project.tech_stack?.join(', ')}`,
      project.github_url,
      project.demo_url,
    ]
      .filter(Boolean)
      .join(' ');
  }

  private buildLabNoteContent(note: LabNote): string {
    return [
      note.title,
      note.excerpt,
      note.content,
      note.category,
      note.tags?.join(', '),
    ]
      .filter(Boolean)
      .join(' ');
  }

  private buildExperimentContent(experiment: Experiment): string {
    return [
      experiment.title,
      experiment.description,
      experiment.content,
      experiment.category,
      `Tech stack: ${experiment.tech_stack.join(', ')}`,
      `Status: ${experiment.status}`,
    ]
      .filter(Boolean)
      .join(' ');
  }

  private buildJourneyContent(entry: JourneyItem): string {
    return [
      entry.title,
      entry.description,
      entry.organization,
      entry.location,
      entry.entry_type,
      `Year: ${entry.year}`,
    ]
      .filter(Boolean)
      .join(' ');
  }

  /**
   * Update knowledge base from projects/blog/experiments
   */
  async refreshKnowledgeBase(): Promise<{ count: number; timestamp: string }> {
    console.log('Refreshing knowledge base...');

    const [projects, labNotes, experiments, journey] = await Promise.all([
      projectsRepository.getProjects(),
      labNotesRepository.getLabNotes({ published: true }),
      experimentsRepository.getExperiments({ published: true }),
      journeyRepository.getJourneyTimeline(),
    ]);

    const items: KnowledgeBaseItem[] = [
      ...projects.map((project) => ({
        id: project.id,
        sourceType: 'project' as const,
        sourceId: project.id,
        title: project.title,
        url: `/projects/${project.slug}`,
        content: this.buildProjectContent(project),
      })),
      ...labNotes.map((note) => ({
        id: note.id,
        sourceType: 'blog' as const,
        sourceId: note.id,
        title: note.title,
        url: `/blog/${note.slug}`,
        content: this.buildLabNoteContent(note),
      })),
      ...experiments.map((experiment) => ({
        id: experiment.id,
        sourceType: 'experiment' as const,
        sourceId: experiment.id,
        title: experiment.title,
        url: `/experiments/${experiment.slug}`,
        content: this.buildExperimentContent(experiment),
      })),
      ...journey.map((entry) => ({
        id: entry.id,
        sourceType: 'journey' as const,
        sourceId: entry.id,
        title: entry.title,
        url: `/journey`,
        content: this.buildJourneyContent(entry),
      })),
    ];

    let count = 0;

    for (const item of items) {
      await this.indexContent(item);
      count += await this.splitText(item.content).then((chunks) => chunks.length);
    }

    return {
      count,
      timestamp: new Date().toISOString(),
    };
  }
}

// ============================================================================
// 3. SEMANTIC SEARCH SERVICE
// ============================================================================

interface SearchResult {
  id: string;
  title: string;
  sourceType: string;
  sourceId: string;
  similarity: number;
  preview: string;
  url: string;
}

/**
 * Semantic Search Service - Find content by meaning
 */
export class SemanticSearchService {
  /**
   * Search content by semantic similarity
   */
  async search(query: string, limit: number = 5): Promise<SearchResult[]> {
    console.log(`Semantic search for: ${query}`);

    try {
      // 1) Generate embedding for query
      const queryEmbedding = await this.generateQueryEmbedding(query);

      // 2) Call Supabase RPC to search content_embeddings
      const rpc = await supabase.rpc('search_content_embeddings', {
        query_embedding: queryEmbedding,
        match_count: limit,
        similarity_threshold: 0.0,
      });

      const rows = Array.isArray(rpc.data) ? rpc.data : [];

      // 3) Map RPC results to SearchResult
      const results: SearchResult[] = rows.map((r: any) => ({
        id: r.id,
        title: r.title || (r.metadata && r.metadata.title) || 'Untitled',
        sourceType: r.content_type || 'unknown',
        sourceId: r.content_id,
        similarity: r.similarity || 0,
        preview: (r.chunk || '').substring(0, 200),
        url: r.metadata?.url || '#',
      }));

      return results;
    } catch (error) {
      console.error('Search failed:', error);
      return [];
    }
  }

  /**
   * Calculate similarity between query and text (simple keyword-based)
   */
  private calculateSimilarity(query: string, text: string): number {
    const queryWords = query.toLowerCase().split(/\s+/).filter(w => w.length > 2);
    const textWords = text.toLowerCase().split(/\s+/);

    if (queryWords.length === 0) return 0;

    const matches = queryWords.filter(qw => textWords.some(tw => tw.includes(qw) || qw.includes(tw))).length;

    return matches / queryWords.length;
  }

  /**
   * Generate embedding for search query
   */
  private async generateQueryEmbedding(query: string): Promise<number[]> {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      return Array(1536).fill(0);
    }

    try {
      const res = await fetch('https://api.openai.com/v1/embeddings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({ model: 'text-embedding-3-small', input: query }),
      });

      if (!res.ok) {
        const text = await res.text();
        console.error('OpenAI embedding error:', res.status, text);
        return Array(1536).fill(0);
      }

      const data = await res.json();
      return data?.data?.[0]?.embedding || Array(1536).fill(0);
    } catch (err) {
      console.error('Failed to generate query embedding:', err);
      return Array(1536).fill(0);
    }
  }

  /**
   * Search vector database
   */
  private async searchVectorDatabase(embedding: number[], limit: number): Promise<any[]> {
    return [];
  }

  /**
   * Enrich search results with metadata
   */
  private async enrichResults(results: any[]): Promise<SearchResult[]> {
    return results.map((r) => ({
      id: r.id,
      title: r.title || 'Untitled',
      sourceType: r.sourceType,
      sourceId: r.sourceId,
      similarity: r.similarity || 0.9,
      preview: r.preview || '',
      url: r.url || '#',
    }));
  }
}

// ============================================================================
// 4. CONTENT GENERATION SERVICE
// ============================================================================

/**
 * Content Generation Service - Generate content with AI
 */
export class ContentGenerationService {
  /**
   * Generate project ideas
   */
  async generateProjectIdeas(category: string, count: number = 5): Promise<string[]> {
    console.log(`Generating ${count} project ideas for ${category}`);

    const prompt = `Generate ${count} creative and practical project ideas for ${category} (IoT, AI, Cybersecurity, or Web Development). 
    Each idea should be unique, interesting, and achievable.
    Format as a numbered list with just the project titles, no descriptions.`;

    try {
      const response = await this.callOpenAI(prompt);
      return response.split('\n').filter((idea) => idea.trim().length > 0);
    } catch (error) {
      console.error('Failed to generate ideas:', error);
      return this.getFallbackIdeas(category);
    }
  }

  /**
   * Generate tech stack suggestions
   */
  async generateTechStack(projectDescription: string): Promise<Record<string, string[]>> {
    console.log('Generating tech stack suggestions...');

    const prompt = `Based on this project: "${projectDescription}", suggest a modern tech stack with categories for:
    - frontend
    - backend
    - database
    - devops
    Format as JSON with these exact keys.`;

    try {
      const response = await this.callOpenAI(prompt);
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
    } catch (error) {
      console.error('Failed to generate tech stack:', error);
    }

    return {
      frontend: ['React', 'TypeScript', 'Tailwind CSS'],
      backend: ['Node.js', 'Express', 'PostgreSQL'],
      database: ['PostgreSQL', 'Redis'],
      devops: ['Docker', 'GitHub Actions', 'Vercel'],
    };
  }

  /**
   * Generate a single project idea payload
   */
  async generateProject(
    category: string,
    difficulty: 'beginner' | 'intermediate' | 'advanced' = 'beginner',
    budget: number = 5000,
    techStack: string[] = []
  ): Promise<GeneratedProject> {
    console.log(`Generating project idea for category: ${category}`);

    const ideas = await this.generateProjectIdeas(category, 1);
    const title = ideas[0]?.replace(/^\d+\.\s*/, '') || `${category} project idea`;
    const description = `A ${category} project idea designed to showcase ${category.toLowerCase()} innovation, practical architecture, and real-world impact.`;
    const generatedTechStack = await this.generateTechStack(description);
    const techStackPayload: Record<string, string[]> = techStack.length > 0 ? {
      frontend: techStack.filter((item) => /react|next|vue|angular|svelte/i.test(item)) || generatedTechStack.frontend,
      backend: techStack.filter((item) => /node|express|fastify|python|django|flask|go|rust|java|spring/i.test(item)) || generatedTechStack.backend,
      database: techStack.filter((item) => /postgre|mysql|mongo|redis|supabase|sqlite|cassandra/i.test(item)) || generatedTechStack.database,
      devops: techStack.filter((item) => /docker|kubernetes|terraform|vercel|github actions|aws|gcp|azure/i.test(item)) || generatedTechStack.devops,
    } : generatedTechStack;
    const projectDifficulty = difficulty as GeneratedProject['difficulty'];
    const durationMap = {
      beginner: '4-6 weeks',
      intermediate: '6-10 weeks',
      advanced: '10-16 weeks',
    } as const;

    return {
      title,
      description,
      techStack: {
        frontend: techStackPayload.frontend.length ? techStackPayload.frontend : generatedTechStack.frontend,
        backend: techStackPayload.backend.length ? techStackPayload.backend : generatedTechStack.backend,
        database: techStackPayload.database.length ? techStackPayload.database : generatedTechStack.database,
        devops: techStackPayload.devops.length ? techStackPayload.devops : generatedTechStack.devops,
      },
      difficulty: projectDifficulty,
      estimatedBudget: budget,
      estimatedDuration: durationMap[projectDifficulty],
      learningOutcomes: [
        'Apply practical engineering skills',
        'Learn system design and architecture',
        'Implement end-to-end workflows',
        'Deploy and measure a production-ready solution',
      ],
      features: [
        'Core feature set tailored to the selected domain',
        'Responsive UI and polished UX',
        'Reliable backend and data persistence',
        'Monitoring and deployment pipeline',
      ],
      architecture: `Frontend → API layer → Database\n      Services: ${projectDifficulty} architecture`,
      roadmap: [
        'Phase 1: Design and planning',
        'Phase 2: Core development',
        'Phase 3: Integration and testing',
        'Phase 4: Deployment and launch',
      ],
      learningPath: [
        'Review foundational concepts for the chosen domain',
        'Build the core components incrementally',
        'Add integrations and polish the user experience',
        'Deploy the app and validate the solution',
      ],
    };
  }

  /**
   * Generate architecture diagram description
   */
  async generateArchitectureDiagram(projectDescription: string): Promise<string> {
    console.log('Generating architecture diagram...');

    const prompt = `Create a detailed ASCII architecture diagram for: "${projectDescription}". 
    Include components, data flow, and external services. Keep it concise but complete.`;

    try {
      return await this.callOpenAI(prompt);
    } catch (error) {
      return 'Frontend → Backend → Database';
    }
  }

  /**
   * Get fallback ideas for demo
   */
  private getFallbackIdeas(category: string): string[] {
    const fallbacks: Record<string, string[]> = {
      IoT: [
        'Smart Home Energy Monitor',
        'IoT Weather Station',
        'Connected Fitness Tracker',
        'Smart Plant Watering System',
        'IoT Fire Safety System',
      ],
      AI: [
        'AI Image Classification System',
        'Chatbot for Customer Support',
        'Sentiment Analysis Tool',
        'Recommendation Engine',
        'Predictive Analytics Dashboard',
      ],
      Cybersecurity: [
        'Network Intrusion Detection System',
        'Password Manager with Encryption',
        'Vulnerability Scanner',
        'Secure File Sharing Platform',
        'Security Audit Tool',
      ],
      ['Web Development']: [
        'Multi-tenant SaaS Platform',
        'Real-time Collaboration Tool',
        'E-commerce Platform',
        'Project Management Tool',
        'Social Media Analytics Dashboard',
      ],
    };

    return fallbacks[category] || fallbacks['Web Development'] || [];
  }

  /**
   * Call OpenAI API
   */
  private async callOpenAI(prompt: string): Promise<string> {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      console.log('OpenAI key missing');
      return 'Generated content placeholder';
    }

    try {
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: 'gpt-4',
          messages: [
            {
              role: 'system',
              content: 'You are a helpful AI assistant for generating technical content and project ideas.',
            },
            { role: 'user', content: prompt },
          ],
          max_tokens: 500,
          temperature: 0.7,
        }),
      });

      const text = await response.text();

      if (!response.ok) {
        console.error('OpenAI API error:', response.status, text);
        return 'Generated content placeholder';
      }

      try {
        const data = JSON.parse(text);
        return data?.choices?.[0]?.message?.content?.trim() ?? 'Generated content placeholder';
      } catch (error) {
        console.error('Failed to parse OpenAI response:', error);
        return 'Generated content placeholder';
      }
    } catch (error) {
      console.error('OpenAI call failed:', error);
      return 'Generated content placeholder';
    }
  }

  async generateNewsletter(period: 'weekly' | 'monthly' = 'weekly'): Promise<NewsletterPayload> {
    const job = await this.createJobRecord('newsletter', 'running', { period });
    try {
      const recentProjects = await this.fetchRecentProjects();
      const recentArticles = await this.fetchRecentArticles();
      const recentExperiments = await this.fetchRecentExperiments();
      const recentJourney = await this.fetchRecentJourney();
      const title = `${period.charAt(0).toUpperCase()}${period.slice(1)} AI Newsletter`;

      const prompt = `Create a ${period} Arpit Labs newsletter with highlights, new projects, recent articles, and experiment updates. Use the following source content to build each section.

Projects:
${recentProjects
        .map((project) => `- ${project.title}: ${project.description}`)
        .join('\n')}

Articles:
${recentArticles
        .map((article) => `- ${article.title}: ${article.excerpt || article.description || ''}`)
        .join('\n')}

Experiments:
${recentExperiments
        .map((experiment) => `- ${experiment.title}: ${experiment.description}`)
        .join('\n')}

Journey updates:
${recentJourney.map((entry) => `- ${entry.title}: ${entry.description}`).join('\n')}

Return JSON with keys: title, summary, highlights, newProjects, recentArticles, experimentUpdates, newsletterHtml.`;

      const aiResponse = await this.callOpenAI(prompt);
      const parsed = this.parseJSON<NewsletterPayload>(aiResponse);
      const newsletter = parsed ?? {
        title,
        summary: `Your ${period} update from Arpit Labs, including recent projects, articles, and experiments.`,
        highlights: recentProjects.slice(0, 3).map((project) => project.title),
        newProjects: recentProjects.slice(0, 3).map((project) => ({ title: project.title, summary: project.description, url: project.github_url || undefined })),
        recentArticles: recentArticles.slice(0, 3).map((article) => ({ title: article.title, summary: article.excerpt || '', url: article.url || undefined })),
        experimentUpdates: recentExperiments.slice(0, 3).map((experiment) => ({ title: experiment.title, summary: experiment.description, url: experiment.url || undefined })),
        newsletterHtml: `<h1>${title}</h1><p>${recentProjects.length} projects, ${recentArticles.length} articles, and ${recentExperiments.length} experiments were reviewed.</p>`,
      };

      await this.createGenerationRecord('newsletter', 'newsletter', null, newsletter, this.estimateTokens(aiResponse), { period });
      await this.updateJobStatus(job?.id, 'completed', newsletter, null, this.estimateTokens(aiResponse));
      return newsletter;
    } catch (error) {
      await this.updateJobStatus(job?.id, 'failed', null, error instanceof Error ? error.message : 'Unknown error', null);
      throw error;
    }
  }

  async generateBlogContent(topic: string, category: string, difficulty: 'beginner' | 'intermediate' | 'advanced'): Promise<GeneratedBlogContent> {
    const job = await this.createJobRecord('blog', 'running', { topic, category, difficulty });
    try {
      const prompt = `Generate blog content for Arpit Labs about the topic '${topic}' in the category '${category}'. Create a title, excerpt, full content, meta description, and tags. Use a ${difficulty} developer audience and return JSON with keys title, excerpt, content, metaDescription, tags.`;
      const aiResponse = await this.callOpenAI(prompt);
      const parsed = this.parseJSON<GeneratedBlogContent>(aiResponse);

      const content = parsed ?? {
        title: `${topic} for ${category}`,
        excerpt: `A ${difficulty}-level overview of ${topic} for technical readers.`,
        content: `This article explores ${topic} within the ${category} category. It includes practical guidance, examples, and actionable insights for ${difficulty} engineers.`,
        metaDescription: `Learn how ${topic} fits into ${category} with a ${difficulty}-level technical approach from Arpit Labs.`,
        tags: [topic, category, difficulty],
      };

      await this.createGenerationRecord('blog', 'blog', null, content, this.estimateTokens(aiResponse), { topic, category, difficulty });
      await this.updateJobStatus(job?.id, 'completed', content, null, this.estimateTokens(aiResponse));
      return content;
    } catch (error) {
      await this.updateJobStatus(job?.id, 'failed', null, error instanceof Error ? error.message : 'Unknown error', null);
      throw error;
    }
  }

  async generateSocialContent(
    sourceType: 'project' | 'blog' | 'experiment',
    sourceId: string,
    postType: 'linkedin' | 'twitter' | 'announcement' | 'launch'
  ): Promise<GeneratedSocialContent> {
    const job = await this.createJobRecord('social', 'running', { sourceType, sourceId, postType });
    try {
      const item = await this.fetchSourceItem(sourceType, sourceId);
      if (!item) {
        throw new Error(`Unable to load ${sourceType} item for social content generation`);
      }

      const prompt = `Create social media posts for a ${postType} based on the following ${sourceType} entry:

Title: ${item.title}
Summary: ${item.excerpt || item.description || ''}
Category: ${item.category || ''}

Return JSON with keys linkedin, twitter, announcement, launch.`;
      const aiResponse = await this.callOpenAI(prompt);
      const parsed = this.parseJSON<GeneratedSocialContent>(aiResponse);

      const socialContent = parsed ?? {
        linkedin: `Introducing ${item.title} — an update from Arpit Labs. ${item.excerpt || item.description || ''}`,
        twitter: `${item.title} — read the latest update from Arpit Labs. #tech #ai`,
        announcement: `Announcing ${item.title} from Arpit Labs. Learn more about the latest developments and why it matters.`,
        launch: `Launching ${item.title}! Explore the new update and see what’s next from Arpit Labs.`,
      };

      await this.createGenerationRecord('social', sourceType, sourceId, socialContent, this.estimateTokens(aiResponse), { postType });
      await this.updateJobStatus(job?.id, 'completed', socialContent, null, this.estimateTokens(aiResponse));
      return socialContent;
    } catch (error) {
      await this.updateJobStatus(job?.id, 'failed', null, error instanceof Error ? error.message : 'Unknown error', null);
      throw error;
    }
  }

  async generateWeeklyReport(): Promise<WeeklyReportPayload> {
    const job = await this.createJobRecord('report', 'running', { reportType: 'weekly' });
    try {
      const projectCount = await this.fetchCount('projects', { published: true });
      const articleCount = await this.fetchCount('lab_notes', { published: true });
      const experimentCount = await this.fetchCount('experiments', { published: true });
      const journeyCount = await this.fetchCount('journey');
      const recruiterCount = await this.fetchCount('recruiter_interactions');
      const knowledgeBaseCount = await this.fetchCount('ai_knowledge_base');
      const embeddingCount = await this.fetchCount('ai_embeddings');
      const visitorPrediction = await analyticsService.predictVisitorInterests(null);
      const contentPrediction = await analyticsService.predictPopularContent();
      const technologyPrediction = await analyticsService.predictTrendingTechnologies();

      const prompt = `Generate a weekly report for Arpit Labs. Include visitor insights, popular projects, popular articles, search trends, and recruiter activity.

Metrics:
- Published projects: ${projectCount}
- Published articles: ${articleCount}
- Published experiments: ${experimentCount}
- Journey entries: ${journeyCount}
- Recruiter interactions: ${recruiterCount}
- Knowledge base entries: ${knowledgeBaseCount}
- Embeddings: ${embeddingCount}

Predictions:
- Visitor interests: ${visitorPrediction.predictions.join(', ')}
- Popular content: ${contentPrediction.predictions.join(', ')}
- Technology trends: ${technologyPrediction.predictions.join(', ')}

Return JSON with keys title, visitorInsights, popularProjects, popularArticles, searchTrends, recruiterActivity, summary, reportContent, metrics.`;

      const aiResponse = await this.callOpenAI(prompt);
      const parsed = this.parseJSON<WeeklyReportPayload>(aiResponse);
      const report = parsed ?? {
        title: 'Weekly AI Insights Report',
        visitorInsights: `Visitor interest is trending toward ${visitorPrediction.predictions.join(', ')}.`,
        popularProjects: [contentPrediction.predictions[0] || 'AI product', contentPrediction.predictions[1] || 'Developer tools'],
        popularArticles: [contentPrediction.predictions[0] || 'AI trends', contentPrediction.predictions[1] || 'Platform engineering'],
        searchTrends: technologyPrediction.predictions,
        recruiterActivity: `Recruiter engagement remains steady with ${recruiterCount} interactions this week.`,
        summary: 'This weekly report provides a concise review of performance metrics and content highlights.',
        reportContent: `Projects: ${projectCount}, Articles: ${articleCount}, Experiments: ${experimentCount}, Recruiter interactions: ${recruiterCount}.`,
        metrics: {
          projectCount,
          articleCount,
          experimentCount,
          journeyCount,
          recruiterCount,
          knowledgeBaseCount,
          embeddingCount,
        },
      };

      await this.createReportRecord('weekly', 'weekly', report.title, report.summary, report.reportContent, report.metrics);
      await this.updateJobStatus(job?.id, 'completed', report, null, this.estimateTokens(aiResponse));
      return report;
    } catch (error) {
      await this.updateJobStatus(job?.id, 'failed', null, error instanceof Error ? error.message : 'Unknown error', null);
      throw error;
    }
  }

  async enhanceContent(sourceType: 'project' | 'blog' | 'experiment', sourceId: string): Promise<EnhanceContentPayload> {
    const job = await this.createJobRecord('enhancement', 'running', { sourceType, sourceId });
    try {
      const item = await this.fetchSourceItem(sourceType, sourceId);
      if (!item) {
        throw new Error(`Unable to load ${sourceType} item for enhancement`);
      }

      const sourceDescription = `${item.title} - ${item.excerpt || item.description || ''}`;
      const prompt = `Create SEO metadata and OpenGraph content for this content item:

${sourceDescription}

Return JSON with keys seoDescription, metaTags, openGraph, keywords.`;
      const aiResponse = await this.callOpenAI(prompt);
      const parsed = this.parseJSON<EnhanceContentPayload>(aiResponse);

      const enhancement = parsed ?? {
        seoDescription: `Learn about ${item.title} at Arpit Labs, with expert insights and practical guidance.`,
        metaTags: [item.title, sourceType, 'Arpit Labs', 'technical article'],
        openGraph: {
          title: item.title,
          description: item.excerpt || item.description || '',
        },
        keywords: [item.title, sourceType, 'AI', 'engineering'],
      };

      await this.createGenerationRecord('enhancement', sourceType, sourceId, enhancement, this.estimateTokens(aiResponse), {});
      await this.updateJobStatus(job?.id, 'completed', enhancement, null, this.estimateTokens(aiResponse));
      return enhancement;
    } catch (error) {
      await this.updateJobStatus(job?.id, 'failed', null, error instanceof Error ? error.message : 'Unknown error', null);
      throw error;
    }
  }

  private async fetchSourceItem(sourceType: string, sourceId: string) {
    const table = sourceType === 'blog' ? 'lab_notes' : sourceType === 'experiment' ? 'experiments' : 'projects';
    const { data } = await supabase.from(table).select('*').eq('id', sourceId).single();
    return data as any;
  }

  private async fetchRecentProjects() {
    const { data } = await supabase
      .from('projects')
      .select('id,title,description,github_url')
      .eq('published', true)
      .order('updated_at', { ascending: false })
      .limit(5);
    return data || [];
  }

  private async fetchRecentArticles() {
    const { data } = await supabase
      .from('lab_notes')
      .select('id,title,excerpt,url,description')
      .eq('published', true)
      .order('updated_at', { ascending: false })
      .limit(5);
    return data || [];
  }

  private async fetchRecentExperiments() {
    const { data } = await supabase
      .from('experiments')
      .select('id,title,description,url')
      .eq('published', true)
      .order('updated_at', { ascending: false })
      .limit(5);
    return data || [];
  }

  private async fetchRecentJourney() {
    const { data } = await supabase
      .from('journey')
      .select('id,title,description')
      .order('created_at', { ascending: false })
      .limit(5);
    return data || [];
  }

  private async fetchCount(table: string, filters: Record<string, any> = {}) {
    let query = supabase.from(table).select('id', { count: 'exact', head: true });
    for (const [key, value] of Object.entries(filters)) {
      query = query.eq(key, value);
    }
    const { count } = await query;
    return count ?? 0;
  }

  private async createGenerationRecord(
    generationType: string,
    sourceType: string | null,
    sourceId: string | null,
    output: Record<string, any>,
    tokensUsed: number | null,
    metadata: Record<string, any>
  ): Promise<AiGenerationRecord | null> {
    // Store output as text to match migration schema; stringify objects.
    const outputText = typeof output === 'string' ? output : JSON.stringify(output);

    const { data, error } = await supabase
      .from('ai_generations')
      .insert([
        {
          generation_type: generationType,
          source_type: sourceType,
          source_id: sourceId,
          status: 'completed',
          prompt: null,
          output: outputText,
          tokens_used: tokensUsed,
          metadata,
          created_at: new Date().toISOString(),
        },
      ])
      .select()
      .single();

    if (error || !data) {
      console.error('Failed to create AI generation record:', error);
      return null;
    }

    // Try to parse output back into object for the caller
    try {
      if (data.output && typeof data.output === 'string') {
        data.output = JSON.parse(data.output);
      }
    } catch (e) {
      // keep as string if JSON parse fails
    }

    return data as AiGenerationRecord;
  }

  private async createReportRecord(
    reportType: string,
    period: string,
    title: string,
    summary: string,
    content: string,
    metrics: Record<string, any>
  ): Promise<AiReportRecord | null> {
    const { data, error } = await supabase
      .from('ai_reports')
      .insert([
        {
          report_type: reportType,
          period,
          title,
          summary,
          content,
          metrics,
        },
      ])
      .select()
      .single();

    if (error || !data) {
      console.error('Failed to create AI report record:', error);
      return null;
    }

    return data as AiReportRecord;
  }

  private async createJobRecord(type: string, status: string, payload: Record<string, any>): Promise<AiJobRecord | null> {
    const { data, error } = await supabase
      .from('ai_jobs')
      .insert([
        {
          type,
          status,
          payload,
          started_at: new Date().toISOString(),
        },
      ])
      .select()
      .single();

    if (error || !data) {
      console.error('Failed to create AI job record:', error);
      return null;
    }

    return data as AiJobRecord;
  }

  private async updateJobStatus(
    jobId: string | undefined,
    status: string,
    result: Record<string, any> | null,
    errorMessage: string | null,
    tokensUsed: number | null
  ): Promise<void> {
    if (!jobId) {
      return;
    }

    await supabase.from('ai_jobs').update({
      status,
      result,
      error_message: errorMessage,
      tokens_used: tokensUsed,
      completed_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }).eq('id', jobId);
  }

  private parseJSON<T>(raw: string): T | null {
    const jsonMatch = raw.match(/\{[\s\S]*\}/m);
    if (!jsonMatch) {
      return null;
    }

    try {
      return JSON.parse(jsonMatch[0]) as T;
    } catch (error) {
      console.error('JSON parse failed:', error);
      return null;
    }
  }

  private estimateTokens(content: string): number {
    return Math.max(1, Math.ceil(content.length / 4));
  }
}

// ============================================================================
// 5. ANALYTICS SERVICE
// ============================================================================

interface Prediction {
  subject: string;
  predictions: string[];
  confidence: number;
}

/**
 * Analytics Service - Predict trends and interests
 */
export class AnalyticsService {
  /**
   * Predict visitor interests
   */
  async predictVisitorInterests(visitorData: any): Promise<Prediction> {
    console.log('Predicting visitor interests...');

    return {
      subject: 'visitor_interests',
      predictions: ['AI', 'Web Development', 'Cloud Architecture'],
      confidence: 0.85,
    };
  }

  /**
   * Predict popular content
   */
  async predictPopularContent(): Promise<Prediction> {
    console.log('Predicting popular content...');

    return {
      subject: 'popular_content',
      predictions: ['Latest AI trends', 'IoT security', 'Web performance'],
      confidence: 0.79,
    };
  }

  /**
   * Predict trending technologies
   */
  async predictTrendingTechnologies(): Promise<Prediction> {
    console.log('Predicting trending technologies...');

    return {
      subject: 'trending_technologies',
      predictions: ['TypeScript', 'Kubernetes', 'GraphQL', 'WebAssembly'],
      confidence: 0.82,
    };
  }

  /**
   * Track visitor behavior
   */
  async trackVisitorBehavior(event: any): Promise<void> {
    console.log('Tracking visitor behavior:', event);
    // Store in ai_analytics_events table
  }
}

// ============================================================================
// 6. AUTOMATION SERVICE
// ============================================================================

interface AutomationWorkflow {
  id: string;
  name: string;
  type: 'blog_publish' | 'newsletter' | 'social_share' | 'report';
  triggers: Record<string, any>;
  actions: Record<string, any>[];
}

/**
 * Automation Service - Automate tasks
 */
export class AutomationService {
  /**
   * Schedule automation
   */
  async scheduleAutomation(workflow: AutomationWorkflow): Promise<{ id: string }> {
    console.log(`Scheduling automation: ${workflow.name}`);
    // Save to database and schedule with cron
    return { id: workflow.id };
  }

  /**
   * Execute automation
   */
  async executeAutomation(workflowId: string): Promise<{ status: string }> {
    console.log(`Executing automation: ${workflowId}`);

    // 1. Get workflow from database
    // 2. Execute each action
    // 3. Track results

    return { status: 'completed' };
  }

  /**
   * Auto-publish blog post
   */
  async autoPushBlogPost(postId: string): Promise<void> {
    console.log(`Auto-publishing blog post: ${postId}`);
    // Generate SEO metadata
    // Schedule social share
    // Add to newsletter queue
  }

  /**
   * Generate newsletter
   */
  async generateNewsletter(): Promise<string> {
    console.log('Generating newsletter...');
    // Collect top articles
    // Create summary
    // Format HTML
    return '<html>...</html>';
  }

  /**
   * Share to social media
   */
  async shareToSocialMedia(content: string, platforms: string[]): Promise<void> {
    console.log(`Sharing to: ${platforms.join(', ')}`);
    // Share to Twitter, LinkedIn, etc.
  }

  /**
   * Generate weekly report
   */
  async generateWeeklyReport(): Promise<string> {
    console.log('Generating weekly report...');
    return 'Weekly report content...';
  }
}

// ============================================================================
// 7. RECRUITER ASSISTANT SERVICE
// ============================================================================

/**
 * Recruiter Assistant Service - AI-powered recruiter tools
 */
export class RecruiterAssistantService {
  /**
   * Generate resume summary
   */
  async generateResumeSummary(userData: any): Promise<string> {
    console.log('Generating resume summary...');

    const prompt = `Create a professional resume summary for a developer with: ${JSON.stringify(userData)}`;
    return 'Professional resume summary...';
  }

  /**
   * Generate skills overview
   */
  async generateSkillsOverview(projects: any[]): Promise<Record<string, string[]>> {
    console.log('Generating skills overview...');

    return {
      languages: ['TypeScript', 'Python', 'JavaScript'],
      frameworks: ['React', 'Next.js', 'FastAPI'],
      tools: ['Docker', 'Kubernetes', 'Git'],
      specialties: ['AI/ML', 'IoT', 'Cybersecurity'],
    };
  }

  /**
   * Create project showcase
   */
  async createProjectShowcase(projects: any[]): Promise<string> {
    console.log('Creating project showcase...');
    return '<div>Project showcase HTML...</div>';
  }

  /**
   * Generate hiring report
   */
  async generateHiringReport(): Promise<string> {
    console.log('Generating hiring report...');
    return 'Hiring report content...';
  }
}

// ============================================================================
// Export all services
// ============================================================================

export const semanticSearchService = new SemanticSearchService();
export const aiChatService = new AIChatService();
export const knowledgeBaseService = new KnowledgeBaseService();
export const contentGenerationService = new ContentGenerationService();
export const analyticsService = new AnalyticsService();
export const automationService = new AutomationService();
export const recruiterAssistantService = new RecruiterAssistantService();
