'use client';

import React, { useEffect, useState } from 'react';
import { Container } from '@/components/layout/Container';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { DownloadIcon, LinkIcon } from 'lucide-react';
import { supabaseClient } from '@/lib/supabase/client';
import { analytics } from '@/lib/analytics';

interface RecruiterData {
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
  experienceOverview: string;
  engineeringCapabilities: string;
  leadershipIndicators: string;
  innovationScore: string;
}

const predefinedQuestions = [
  'What technologies does Arpit use?',
  'Show IoT projects',
  'Show AI projects',
  'What is his strongest domain?',
];

export default function RecruiterPage() {
  const [data, setData] = useState<RecruiterData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [shareLink, setShareLink] = useState('');
  const [copied, setCopied] = useState(false);
  const [queryAnswer, setQueryAnswer] = useState<string | null>(null);
  const [queryLoading, setQueryLoading] = useState(false);
  const [queryError, setQueryError] = useState<string | null>(null);

  useEffect(() => {
    fetchRecruiterData();
    if (typeof window !== 'undefined') {
      setShareLink(window.location.href);
    }
  }, []);

  const fetchRecruiterData = async () => {
    setIsLoading(true);

    try {
      const { data: session } = await supabaseClient.auth.getSession();
      const accessToken = session?.session?.access_token;

      if (!accessToken) {
        window.location.href = '/login';
        return;
      }

      const response = await fetch('/api/recruiter/report', {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });
      const payload = await response.json();

      if (!response.ok || !payload.success) {
        throw new Error(payload?.error || 'Unable to load recruiter report');
      }

      setData(payload.report as RecruiterData);
      analytics.featureUsage('recruiter_assistant', 'premium');
    } catch (error) {
      console.error('Failed to fetch recruiter data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuestion = async (question: string) => {
    setQueryLoading(true);
    setQueryError(null);
    setQueryAnswer(null);

    try {
      const { data: session } = await supabaseClient.auth.getSession();
      const accessToken = session?.session?.access_token;

      if (!accessToken) {
        window.location.href = '/login';
        return;
      }

      const response = await fetch('/api/recruiter/query', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({ question }),
      });

      const payload = await response.json();

      if (!response.ok || !payload.success) {
        throw new Error(payload?.error || 'Unable to answer this question');
      }

      setQueryAnswer(payload.answer as string);
      analytics.aiUsageByPlan('recruiter_assistant', 'premium');
    } catch (error) {
      setQueryError(error instanceof Error ? error.message : 'Something went wrong');
      console.error(error);
    } finally {
      setQueryLoading(false);
    }
  };

  const generatePDF = () => {
    window.print();
  };

  const copyShareLink = () => {
    if (!shareLink) return;

    navigator.clipboard.writeText(shareLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center px-4 py-20 text-white">
        <div className="text-lg">Loading recruiter assistant...</div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center px-4 py-20 text-white">
        <div className="max-w-xl rounded-3xl border border-slate-700 bg-slate-900/90 p-8 text-center">
          <h1 className="text-2xl font-semibold">Recruiter Assistant</h1>
          <p className="mt-4 text-slate-300">Unable to load recruiter insights at this time. Please try again later.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 pb-20 text-white">
      <Container className="py-20">
        <div className="space-y-10">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-3xl">
              <p className="text-sm uppercase tracking-[0.32em] text-blue-300">Recruiter Assistant</p>
              <h1 className="mt-4 text-4xl font-bold">Arpit Kumar — Engineering Report</h1>
              <p className="mt-4 max-w-2xl text-slate-300">Recruiter-focused overview of technical capabilities, product delivery, and leadership strengths drawn from the live Arpit Labs portfolio.</p>
            </div>
            <div className="flex flex-wrap gap-3">
              <Button onClick={generatePDF} variant="primary" className="flex items-center gap-2">
                <DownloadIcon className="h-4 w-4" /> Export PDF
              </Button>
              <Button onClick={copyShareLink} variant="outline" className="flex items-center gap-2">
                <LinkIcon className="h-4 w-4" /> {copied ? 'Copied!' : 'Share'}
              </Button>
            </div>
          </div>

          <Card className="rounded-[2rem] border border-slate-800 bg-slate-900/90 p-8">
            <h2 className="text-3xl font-semibold">Professional Summary</h2>
            <p className="mt-4 text-slate-300 leading-relaxed">{data.resumeSummary}</p>
          </Card>

          <Card className="rounded-[2rem] border border-slate-800 bg-slate-900/90 p-8">
            <h2 className="text-3xl font-semibold">Skills Matrix</h2>
            <div className="mt-6 grid gap-6 md:grid-cols-2 lg:grid-cols-4">
              {Object.entries(data.skills).map(([category, skills]) => (
                <div key={category}>
                  <h3 className="text-sm uppercase tracking-[0.24em] text-blue-300">{category}</h3>
                  <div className="mt-4 flex flex-wrap gap-2">
                    {skills.length ? (
                      skills.map((skill) => (
                        <span key={skill} className="rounded-full bg-slate-800 px-3 py-2 text-sm text-slate-200">
                          {skill}
                        </span>
                      ))
                    ) : (
                      <span className="text-slate-500">No items available</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </Card>

          <div className="grid gap-6 lg:grid-cols-2">
            <Card className="rounded-[2rem] border border-slate-800 bg-slate-900/90 p-8">
              <h2 className="text-3xl font-semibold">Project Showcase</h2>
              <div className="mt-6 space-y-6">
                {data.projects.map((project) => (
                  <div key={project.title} className="rounded-3xl border border-slate-800 bg-slate-950/70 p-6">
                    <h3 className="text-xl font-semibold">{project.title}</h3>
                    <p className="mt-3 text-slate-300">{project.description}</p>
                    <p className="mt-3 text-sm text-blue-300">Impact: {project.impact}</p>
                    <div className="mt-4 flex flex-wrap gap-2">
                      {project.technologies.map((tech) => (
                        <span key={tech} className="rounded-full bg-slate-800 px-3 py-2 text-xs text-slate-200">
                          {tech}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </Card>

            <Card className="rounded-[2rem] border border-slate-800 bg-slate-900/90 p-8">
              <h2 className="text-3xl font-semibold">Hiring Report</h2>
              <div className="mt-6 space-y-5 text-slate-300">
                <div>
                  <h3 className="text-lg font-semibold text-white">Experience Overview</h3>
                  <p className="mt-2">{data.experienceOverview}</p>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-white">Engineering Capabilities</h3>
                  <p className="mt-2">{data.engineeringCapabilities}</p>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-white">Leadership Indicators</h3>
                  <p className="mt-2">{data.leadershipIndicators}</p>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-white">Innovation Score</h3>
                  <p className="mt-2">{data.innovationScore}</p>
                </div>
              </div>
            </Card>
          </div>

          <Card className="rounded-[2rem] border border-slate-800 bg-slate-900/90 p-8">
            <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
              <div>
                <h2 className="text-3xl font-semibold">Recruiter Questions</h2>
                <p className="mt-2 text-slate-400">Ask common recruiter prompts about technologies and project focus.</p>
              </div>
            </div>

            <div className="mt-6 flex flex-wrap gap-3">
              {predefinedQuestions.map((question) => (
                <Button
                  key={question}
                  variant="secondary"
                  size="sm"
                  onClick={() => handleQuestion(question)}
                  isLoading={queryLoading}
                >
                  {question}
                </Button>
              ))}
            </div>

            <div className="mt-6">
              {queryLoading && <p className="text-sm text-blue-300">Answering question…</p>}
              {queryError && <p className="text-sm text-red-300">{queryError}</p>}
              {queryAnswer && (
                <div className="rounded-3xl border border-slate-800 bg-slate-950/70 p-6">
                  <h3 className="text-lg font-semibold text-white">Answer</h3>
                  <p className="mt-3 text-slate-300 whitespace-pre-wrap">{queryAnswer}</p>
                </div>
              )}
            </div>
          </Card>
        </div>
      </Container>
    </div>
  );
}
