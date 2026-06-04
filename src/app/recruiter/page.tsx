/**
 * Recruiter Portal
 * Route: /recruiter
 * Resume showcase, skills overview, project highlights
 */

'use client';

import React, { useState, useEffect } from 'react';
import { Container } from '@/components/layout/Container';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { DownloadIcon, LinkIcon, MailIcon } from 'lucide-react';

interface RecruiterData {
  name: string;
  title: string;
  email: string;
  phone?: string;
  resumeSummary: string;
  skills: {
    languages: string[];
    frameworks: string[];
    tools: string[];
    specialties: string[];
  };
  projects: Array<{
    title: string;
    description: string;
    impact: string;
    technologies: string[];
  }>;
  experience: Array<{
    company: string;
    position: string;
    duration: string;
    description: string;
  }>;
  shareableLink: string;
}

export default function RecruiterPage() {
  const [data, setData] = useState<RecruiterData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [shareLink, setShareLink] = useState('');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    fetchRecruiterData();
  }, []);

  const fetchRecruiterData = async () => {
    try {
      // In production, fetch from API
      setData({
        name: 'Arpit Kumar',
        title: 'Full Stack Engineer | AI/ML | Cloud',
        email: 'arpitkumar0211@gmail.com',
        phone: '+1 (555) 123-4567',
        resumeSummary:
          'Experienced full-stack engineer with expertise in AI, IoT, and cybersecurity. Passionate about building scalable solutions and mentoring teams.',
        skills: {
          languages: ['TypeScript', 'Python', 'JavaScript', 'Go'],
          frameworks: ['React', 'Next.js', 'FastAPI', 'Django', 'Node.js'],
          tools: ['Docker', 'Kubernetes', 'PostgreSQL', 'Redis', 'Git', 'Supabase'],
          specialties: ['AI/ML', 'IoT Systems', 'Cybersecurity', 'Cloud Architecture'],
        },
        projects: [
          {
            title: 'Arpit Labs Portfolio',
            description: 'Full-stack portfolio with AI chat, CMS, and analytics',
            impact: 'Showcases 50+ projects with intelligent content discovery',
            technologies: ['Next.js', 'Supabase', 'TypeScript', 'Tailwind CSS', 'OpenAI'],
          },
          {
            title: 'AI Semantic Search',
            description: 'Vector-based content search with RAG',
            impact: 'Enables intelligent discovery of portfolio content',
            technologies: ['pgvector', 'OpenAI Embeddings', 'Supabase', 'TypeScript'],
          },
          {
            title: 'IoT Security Framework',
            description: 'End-to-end encryption for IoT devices',
            impact: 'Protects 10k+ devices with zero compromise on latency',
            technologies: ['Python', 'Go', 'PKI', 'TLS 1.3', 'Kubernetes'],
          },
        ],
        experience: [
          {
            company: 'Tech Startup XYZ',
            position: 'Senior Full Stack Engineer',
            duration: '2022 - Present',
            description: 'Led development of cloud-native platform serving 100k+ users',
          },
          {
            company: 'Enterprise Corp',
            position: 'AI/ML Engineer',
            duration: '2020 - 2022',
            description: 'Built ML pipelines and recommendation systems',
          },
          {
            company: 'StartupABC',
            position: 'Full Stack Developer',
            duration: '2018 - 2020',
            description: 'Built MVP and scaled to production',
          },
        ],
        shareableLink: typeof window !== 'undefined' ? window.location.href : '',
      });
    } catch (error) {
      console.error('Failed to fetch recruiter data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const generatePDF = () => {
    if (!data) return;
    // Simple print to PDF approach
    window.print();
  };

  const copyShareLink = () => {
    if (!data) return;
    navigator.clipboard.writeText(data.shareableLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
        <div className="text-white">Loading...</div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
        <div className="text-white">Failed to load recruiter data</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900">
      <Container className="py-20">
        <div id="recruiter-content" className="space-y-8">
          {/* Header */}
          <div className="flex justify-between items-start mb-8">
            <div>
              <h1 className="text-4xl font-bold text-white mb-2">{data.name}</h1>
              <p className="text-xl text-blue-400 mb-4">{data.title}</p>
              <div className="flex gap-4 text-slate-300">
                <a href={`mailto:${data.email}`} className="hover:text-white flex items-center gap-1">
                  <MailIcon className="w-4 h-4" />
                  {data.email}
                </a>
                {data.phone && (
                  <span>
                    <span className="w-4 h-4 inline">📞</span>
                    {data.phone}
                  </span>
                )}
              </div>
            </div>
            <div className="flex gap-2">
              <Button
                onClick={generatePDF}
                className="bg-blue-600 hover:bg-blue-700 flex items-center gap-2"
              >
                <DownloadIcon className="w-5 h-5" />
                Export PDF
              </Button>
              <Button
                onClick={copyShareLink}
                variant="outline"
                className="flex items-center gap-2"
              >
                <LinkIcon className="w-5 h-5" />
                {copied ? 'Copied!' : 'Share'}
              </Button>
            </div>
          </div>

          {/* Resume Summary */}
          <Card className="bg-slate-800/50 border-slate-700 p-6">
            <h2 className="text-2xl font-bold text-white mb-4">Professional Summary</h2>
            <p className="text-slate-300 leading-relaxed">{data.resumeSummary}</p>
          </Card>

          {/* Skills */}
          <Card className="bg-slate-800/50 border-slate-700 p-6">
            <h2 className="text-2xl font-bold text-white mb-6">Skills & Expertise</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {Object.entries(data.skills).map(([category, skills]) => (
                <div key={category}>
                  <h3 className="text-sm font-semibold text-blue-400 mb-3 capitalize">
                    {category.replace(/([A-Z])/g, ' $1').trim()}
                  </h3>
                  <div className="space-y-2">
                    {skills.map((skill) => (
                      <div
                        key={skill}
                        className="px-3 py-1 bg-slate-700 border border-slate-600 rounded-full text-sm text-slate-300 inline-block mr-2 mb-2"
                      >
                        {skill}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </Card>

          {/* Projects */}
          <Card className="bg-slate-800/50 border-slate-700 p-6">
            <h2 className="text-2xl font-bold text-white mb-6">Key Projects</h2>
            <div className="space-y-6">
              {data.projects.map((project, idx) => (
                <div
                  key={idx}
                  className="border-l-2 border-blue-600 pl-4 pb-4 last:pb-0"
                >
                  <h3 className="text-xl font-bold text-white mb-2">{project.title}</h3>
                  <p className="text-slate-300 mb-3">{project.description}</p>
                  <p className="text-sm text-blue-400 mb-3">
                    <strong>Impact:</strong> {project.impact}
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {project.technologies.map((tech) => (
                      <span
                        key={tech}
                        className="px-3 py-1 bg-slate-700 text-xs text-slate-300 rounded-full"
                      >
                        {tech}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </Card>

          {/* Experience */}
          <Card className="bg-slate-800/50 border-slate-700 p-6">
            <h2 className="text-2xl font-bold text-white mb-6">Experience</h2>
            <div className="space-y-6">
              {data.experience.map((job, idx) => (
                <div
                  key={idx}
                  className="border-l-2 border-blue-600 pl-4 pb-4 last:pb-0"
                >
                  <h3 className="text-xl font-bold text-white mb-1">{job.position}</h3>
                  <p className="text-blue-400 font-semibold mb-2">{job.company}</p>
                  <p className="text-sm text-slate-400 mb-2">{job.duration}</p>
                  <p className="text-slate-300">{job.description}</p>
                </div>
              ))}
            </div>
          </Card>

          {/* Call to Action */}
          <Card className="bg-gradient-to-r from-blue-600 to-blue-800 border-0 p-8 text-center">
            <h2 className="text-2xl font-bold text-white mb-4">Let's Work Together</h2>
            <p className="text-blue-100 mb-6">
              Interested in collaborating? Reach out to discuss opportunities.
            </p>
            <Button className="bg-white text-blue-600 hover:bg-slate-100">
              Contact Me
            </Button>
          </Card>
        </div>
      </Container>
    </div>
  );
}
