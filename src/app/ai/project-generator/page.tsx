/**
 * AI Project Generator
 * Route: /ai/project-generator
 * Generate project ideas with domain, difficulty, budget, and tech stack
 */

'use client';

import React, { useState } from 'react';
import { Container } from '@/components/layout/Container';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { SparklesIcon, CopyIcon, RefreshCwIcon } from 'lucide-react';

interface GeneratedProject {
  title: string;
  description: string;
  techStack: {
    frontend: string[];
    backend: string[];
    database: string[];
    devops: string[];
  };
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  estimatedBudget: number;
  estimatedDuration: string;
  learningOutcomes: string[];
  features: string[];
  architecture: string;
  roadmap: string[];
  learningPath: string[];
}

type Domain = 'IoT' | 'AI' | 'Cybersecurity' | 'Web Development' | '';

export default function ProjectGeneratorPage() {
  const [domain, setDomain] = useState<Domain>('');
  const [difficulty, setDifficulty] = useState<'beginner' | 'intermediate' | 'advanced'>('beginner');
  const [budget, setBudget] = useState(5000);
  const [techStackInput, setTechStackInput] = useState('React, Supabase, TypeScript');
  const [generatedProject, setGeneratedProject] = useState<GeneratedProject | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  const domains: Domain[] = ['IoT', 'AI', 'Cybersecurity', 'Web Development'];

  const handleGenerate = async () => {
    if (!domain) {
      alert('Please select a domain');
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch('/api/ai/generate/project', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          domain,
          difficulty,
          budget,
          techStack: techStackInput.split(',').map((item) => item.trim()).filter(Boolean),
        }),
      });

      const data = await response.json();
      if (data.success) {
        setGeneratedProject(data.project);
      } else {
        // Fallback to mock data for demo
        setGeneratedProject(generateMockProject(domain, difficulty, budget, techStackInput));
      }
    } catch (error) {
      console.error('Failed to generate project:', error);
      setGeneratedProject(generateMockProject(domain, difficulty, budget, techStackInput));
    } finally {
      setIsLoading(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900">
      <Container className="py-20">
        <div className="max-w-5xl mx-auto">
          {/* Header */}
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold text-white mb-4">
              <SparklesIcon className="inline-block mr-2 w-8 h-8 text-blue-400" />
              AI Project Generator
            </h1>
            <p className="text-slate-300 text-lg">
              Generate unique project ideas tailored to your interests, skill level, and budget
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Configuration Panel */}
            <div className="lg:col-span-1">
              <Card className="bg-slate-800/50 border-slate-700 p-6 sticky top-20">
                <h2 className="text-xl font-bold text-white mb-6">Configure Project</h2>

                {/* Domain */}
                <div className="mb-6">
                  <label className="block text-sm font-semibold text-slate-300 mb-3">
                    Domain
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {domains.map((d) => (
                      <button
                        key={d}
                        onClick={() => setDomain(d)}
                        className={`px-4 py-2 rounded text-sm font-semibold transition ${
                          domain === d
                            ? 'bg-blue-600 text-white'
                            : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                        }`}
                      >
                        {d}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Difficulty */}
                <div className="mb-6">
                  <label className="block text-sm font-semibold text-slate-300 mb-3">
                    Difficulty: {difficulty}
                  </label>
                  <input
                    type="range"
                    min="0"
                    max="2"
                    value={{ beginner: 0, intermediate: 1, advanced: 2 }[difficulty]}
                    onChange={(e) => {
                      const levels: ('beginner' | 'intermediate' | 'advanced')[] = [
                        'beginner',
                        'intermediate',
                        'advanced',
                      ];
                      setDifficulty(levels[parseInt(e.target.value)]);
                    }}
                    className="w-full"
                  />
                  <div className="flex justify-between text-xs text-slate-400 mt-2">
                    <span>Beginner</span>
                    <span>Intermediate</span>
                    <span>Advanced</span>
                  </div>
                </div>

                {/* Budget */}
                <div className="mb-6">
                  <label className="block text-sm font-semibold text-slate-300 mb-3">
                    Budget: ${budget.toLocaleString()}
                  </label>
                  <input
                    type="range"
                    min="1000"
                    max="100000"
                    step="1000"
                    value={budget}
                    onChange={(e) => setBudget(parseInt(e.target.value))}
                    className="w-full"
                  />
                  <div className="flex justify-between text-xs text-slate-400 mt-2">
                    <span>$1K</span>
                    <span>$50K</span>
                    <span>$100K</span>
                  </div>
                </div>

                {/* Tech stack */}
                <div className="mb-8">
                  <label className="block text-sm font-semibold text-slate-300 mb-3">
                    Preferred Tech Stack
                  </label>
                  <input
                    value={techStackInput}
                    onChange={(e) => setTechStackInput(e.target.value)}
                    placeholder="React, Next.js, Supabase, TypeScript"
                    className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded text-sm text-white placeholder-slate-400 focus:outline-none focus:border-blue-500"
                  />
                  <p className="text-xs text-slate-500 mt-2">
                    Use comma-separated values for frameworks, platforms, and tools.
                  </p>
                </div>

                {/* Generate Button */}
                <Button
                  onClick={handleGenerate}
                  disabled={isLoading || !domain}
                  className="w-full bg-blue-600 hover:bg-blue-700 flex items-center justify-center gap-2"
                >
                  <SparklesIcon className="w-5 h-5" />
                  {isLoading ? 'Generating...' : 'Generate Project'}
                </Button>
              </Card>
            </div>

            {/* Project Display */}
            <div className="lg:col-span-2">
              {!generatedProject ? (
                <Card className="bg-slate-800/50 border-slate-700 p-12 flex items-center justify-center min-h-96">
                  <div className="text-center">
                    <p className="text-slate-400 text-lg">
                      Configure your preferences and click "Generate Project" to get started
                    </p>
                  </div>
                </Card>
              ) : (
                <div className="space-y-6">
                  {/* Title and Quick Info */}
                  <Card className="bg-slate-800/50 border-slate-700 p-6">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h2 className="text-3xl font-bold text-white mb-2">
                          {generatedProject.title}
                        </h2>
                        <div className="flex gap-3 flex-wrap">
                          <span className="px-3 py-1 bg-blue-600 text-white text-sm rounded-full">
                            {generatedProject.difficulty}
                          </span>
                          <span className="px-3 py-1 bg-green-600/20 text-green-300 text-sm rounded-full">
                            ${generatedProject.estimatedBudget.toLocaleString()}
                          </span>
                          <span className="px-3 py-1 bg-purple-600/20 text-purple-300 text-sm rounded-full">
                            {generatedProject.estimatedDuration}
                          </span>
                        </div>
                      </div>
                      <Button
                        onClick={() => handleGenerate()}
                        variant="outline"
                        className="flex items-center gap-2"
                      >
                        <RefreshCwIcon className="w-4 h-4" />
                        Regenerate
                      </Button>
                    </div>

                    <p className="text-slate-300 leading-relaxed">
                      {generatedProject.description}
                    </p>
                  </Card>

                  {/* Tech Stack */}
                  <Card className="bg-slate-800/50 border-slate-700 p-6">
                    <h3 className="text-xl font-bold text-white mb-4">Tech Stack</h3>
                    <div className="grid grid-cols-2 gap-4">
                      {Object.entries(generatedProject.techStack).map(([category, techs]) => (
                        <div key={category}>
                          <h4 className="font-semibold text-blue-400 mb-2 capitalize">
                            {category}
                          </h4>
                          <div className="space-y-1">
                            {techs.map((tech) => (
                              <div
                                key={tech}
                                className="px-3 py-1 bg-slate-700 text-slate-300 rounded text-sm"
                              >
                                {tech}
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </Card>

                  {/* Features */}
                  <Card className="bg-slate-800/50 border-slate-700 p-6">
                    <h3 className="text-xl font-bold text-white mb-4">Key Features</h3>
                    <ul className="space-y-2">
                      {generatedProject.features.map((feature, idx) => (
                        <li
                          key={idx}
                          className="flex gap-3 text-slate-300"
                        >
                          <span className="text-blue-400 font-bold">✓</span>
                          {feature}
                        </li>
                      ))}
                    </ul>
                  </Card>

                  {/* Architecture */}
                  <Card className="bg-slate-800/50 border-slate-700 p-6">
                    <h3 className="text-xl font-bold text-white mb-4">Architecture</h3>
                    <div className="bg-slate-900 p-4 rounded border border-slate-700">
                      <pre className="text-xs text-slate-300 overflow-x-auto whitespace-pre-wrap break-words">
                        {generatedProject.architecture}
                      </pre>
                    </div>
                    <Button
                      onClick={() => copyToClipboard(generatedProject.architecture)}
                      className="mt-4 flex items-center gap-2"
                      variant="outline"
                    >
                      <CopyIcon className="w-4 h-4" />
                      {copied ? 'Copied!' : 'Copy Architecture'}
                    </Button>
                  </Card>

                  {/* Roadmap */}
                  <Card className="bg-slate-800/50 border-slate-700 p-6">
                    <h3 className="text-xl font-bold text-white mb-4">Development Roadmap</h3>
                    <div className="space-y-3">
                      {generatedProject.roadmap.map((step, idx) => (
                        <div
                          key={idx}
                          className="flex gap-4 items-start"
                        >
                          <div className="flex-shrink-0">
                            <div className="flex items-center justify-center h-8 w-8 rounded-full bg-blue-600 text-white font-bold text-sm">
                              {idx + 1}
                            </div>
                          </div>
                          <div className="text-slate-300">{step}</div>
                        </div>
                      ))}
                    </div>
                  </Card>

                  {/* Learning Path */}
                  <Card className="bg-slate-800/50 border-slate-700 p-6">
                    <h3 className="text-xl font-bold text-white mb-4">Learning Path</h3>
                    <div className="space-y-3">
                      {generatedProject.learningPath.map((step, idx) => (
                        <div key={idx} className="text-slate-300 text-sm">
                          <span className="font-semibold text-blue-400">Step {idx + 1}:</span> {step}
                        </div>
                      ))}
                    </div>
                  </Card>

                  {/* Learning Outcomes */}
                  <Card className="bg-slate-800/50 border-slate-700 p-6">
                    <h3 className="text-xl font-bold text-white mb-4">Learning Outcomes</h3>
                    <ul className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {generatedProject.learningOutcomes.map((outcome, idx) => (
                        <li
                          key={idx}
                          className="px-4 py-2 bg-slate-700 rounded text-slate-300 text-sm"
                        >
                          • {outcome}
                        </li>
                      ))}
                    </ul>
                  </Card>
                </div>
              )}
            </div>
          </div>
        </div>
      </Container>
    </div>
  );
}

// Mock project generator for demo purposes
function generateMockProject(domain: string, difficulty: string, budget: number, techStackInput: string): GeneratedProject {
  const projects: Record<string, any> = {
    IoT_beginner: {
      title: 'Smart Temperature Monitor with Cloud Sync',
      description:
        'Build an IoT temperature monitoring system using Arduino/ESP32 that syncs data to the cloud with real-time alerts.',
      techStack: {
        frontend: ['React', 'Tailwind CSS', 'Charts.js'],
        backend: ['Node.js', 'Express', 'MQTT'],
        database: ['PostgreSQL', 'Supabase'],
        devops: ['Docker', 'Raspberry Pi'],
      },
      difficulty: 'beginner',
      estimatedBudget: budget,
      estimatedDuration: '4-6 weeks',
      learningOutcomes: [
        'IoT fundamentals and protocols',
        'Arduino/ESP32 programming',
        'Cloud integration basics',
        'Real-time data visualization',
      ],
      features: [
        'Temperature and humidity sensors',
        'Real-time data collection',
        'Cloud storage and sync',
        'Alert notifications',
        'Data visualization dashboard',
      ],
      architecture: `IoT Device (Arduino/ESP32)
        ↓ (MQTT/HTTP)
    MQTT Broker / Cloud API
        ↓
    PostgreSQL + Supabase
        ↓
    React Dashboard`,
      roadmap: [
        'Phase 1: Set up hardware and sensors',
        'Phase 2: Implement local data collection',
        'Phase 3: Cloud connection and storage',
        'Phase 4: Build dashboard UI',
        'Phase 5: Add alerts and notifications',
      ],
      learningPath: [
        'Understand IoT sensors and microcontrollers',
        'Build firmware and connectivity logic',
        'Create a cloud service for data ingestion',
        'Design a responsive monitoring dashboard',
        'Add notification and alert workflows',
      ],
    } as GeneratedProject,
    AI_beginner: {
      title: 'AI Recommendation Engine for Personal Content',
      description:
        'Create a machine learning recommendation system that suggests content based on user preferences using collaborative filtering.',
      techStack: {
        frontend: ['React', 'Tailwind CSS', 'Recharts'],
        backend: ['Python', 'FastAPI', 'scikit-learn'],
        database: ['PostgreSQL', 'Redis'],
        devops: ['Docker', 'GitHub Actions'],
      },
      difficulty: 'beginner',
      estimatedBudget: budget,
      estimatedDuration: '6-8 weeks',
      learningOutcomes: [
        'Machine learning basics',
        'Recommendation algorithms',
        'Data processing and feature engineering',
        'Model training and evaluation',
      ],
      features: [
        'User preference tracking',
        'Collaborative filtering algorithm',
        'Content recommendations',
        'Performance analytics',
        'A/B testing framework',
      ],
      architecture: `User Interaction
        ↓
    FastAPI Backend
        ↓ (scikit-learn)
    ML Model
        ↓
    PostgreSQL + Redis Cache
        ↓
    React Frontend`,
      roadmap: [
        'Phase 1: Data collection and preprocessing',
        'Phase 2: Feature engineering',
        'Phase 3: Algorithm implementation and training',
        'Phase 4: API endpoints',
        'Phase 5: Frontend integration and optimization',
      ],
      learningPath: [
        'Learn machine learning fundamentals and recommendation models',
        'Understand data pipelines and feature engineering',
        'Implement model training and evaluation',
        'Build backend APIs for model inference',
        'Design dashboards to visualize insights',
      ],
    } as GeneratedProject,
    Cybersecurity_intermediate: {
      title: 'End-to-End Encrypted Chat Application',
      description:
        'Build a secure messaging platform with end-to-end encryption using WebSocket for real-time communication.',
      techStack: {
        frontend: ['React', 'TypeScript', 'TweetNaCl.js'],
        backend: ['Node.js', 'Express', 'Socket.io'],
        database: ['MongoDB', 'Redis'],
        devops: ['Docker', 'nginx', 'Let\'s Encrypt'],
      },
      difficulty: 'intermediate',
      estimatedBudget: budget,
      estimatedDuration: '8-10 weeks',
      learningOutcomes: [
        'Cryptography fundamentals',
        'End-to-end encryption',
        'WebSocket implementation',
        'Security best practices',
      ],
      features: [
        'User authentication',
        'End-to-end encryption',
        'Real-time messaging',
        'Message history',
        'User verification',
      ],
      architecture: `React Client
        ↓ (WebSocket + E2E Encryption)
    Node.js Server
        ↓
    MongoDB (Encrypted)
        ↓
    Message Queue (Redis)`,
      roadmap: [
        'Phase 1: Setup project structure and dependencies',
        'Phase 2: Implement user authentication',
        'Phase 3: Add encryption/decryption logic',
        'Phase 4: WebSocket communication',
        'Phase 5: Message storage and retrieval',
      ],
      learningPath: [
        'Study cryptography and secure communication',
        'Implement authentication and authorization',
        'Build encrypted messaging flows',
        'Secure data storage and session handling',
        'Test security and threat protection mechanisms',
      ],
    } as GeneratedProject,
    'Web Development_advanced': {
      title: 'Multi-Tenant SaaS Platform with AI Features',
      description:
        'Develop a comprehensive SaaS platform supporting multiple tenants with AI-powered features, analytics, and automated workflows.',
      techStack: {
        frontend: ['Next.js', 'TypeScript', 'Tailwind CSS', 'Zustand'],
        backend: ['Node.js', 'Fastify', 'Prisma', 'OpenAI API'],
        database: ['PostgreSQL', 'Supabase', 'Redis'],
        devops: ['Docker', 'Kubernetes', 'CI/CD', 'Terraform'],
      },
      difficulty: 'advanced',
      estimatedBudget: budget,
      estimatedDuration: '12-16 weeks',
      learningOutcomes: [
        'Multi-tenant architecture',
        'Advanced TypeScript patterns',
        'AI integration',
        'Production deployment',
      ],
      features: [
        'Multi-tenant isolation',
        'Role-based access control',
        'AI-powered automation',
        'Analytics dashboard',
        'API ecosystem',
      ],
      architecture: `Next.js Frontend (Multi-tenant)
        ↓
    Fastify API Gateway
        ↓
    Microservices (Auth, AI, Analytics)
        ↓
    PostgreSQL + Redis + S3
        ↓
    Kubernetes Cluster`,
      roadmap: [
        'Phase 1: Architecture planning and setup',
        'Phase 2: Core authentication and multi-tenancy',
        'Phase 3: Admin dashboard and management',
        'Phase 4: AI feature integration',
        'Phase 5: Analytics and reporting',
        'Phase 6: Production deployment and scaling',
      ],
      learningPath: [
        'Research multi-tenant SaaS patterns and AI workflows',
        'Design the tenant model and secure data boundaries',
        'Build the core platform and admin experience',
        'Integrate AI automation and reporting features',
        'Deploy and optimize for scale and reliability',
      ],
    } as GeneratedProject,
  };

  const key = `${domain}_${difficulty}`;
  return (
    projects[key] || {
      title: 'Custom Project',
      description: 'A custom project tailored to your specifications',
      techStack: {
        frontend: ['React', 'TypeScript', 'Tailwind CSS'],
        backend: ['Node.js', 'Express'],
        database: ['PostgreSQL'],
        devops: ['Docker'],
      },
      difficulty: difficulty as any,
      estimatedBudget: budget,
      estimatedDuration: '8 weeks',
      learningOutcomes: ['Problem solving', 'Architecture design', 'Implementation'],
      features: ['Core functionality', 'User interface', 'Data persistence'],
      architecture: 'Frontend → Backend → Database',
      roadmap: [
        'Setup and planning',
        'Core development',
        'Testing',
        'Deployment',
      ],
      learningPath: [
        'Research the domain and core technologies',
        'Sketch the architecture and wireframes',
        'Build the core MVP features',
        'Test and refine the user experience',
        'Deploy and measure the outcome',
      ],
    }
  );
}
