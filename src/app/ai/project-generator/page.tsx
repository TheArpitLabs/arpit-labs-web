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
import { supabaseClient } from '@/lib/supabase/client';
import { analytics } from '@/lib/analytics/analytics';
import { logger } from '@/lib/logger';

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
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const domains: Domain[] = ['IoT', 'AI', 'Cybersecurity', 'Web Development'];

  const handleGenerate = async () => {
    if (!domain) {
      alert('Please select a domain');
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);
    try {
      const { data: session } = await supabaseClient.auth.getSession();
      const accessToken = session?.session?.access_token;

      if (!accessToken) {
        window.location.href = '/login';
        return;
      }

      const response = await fetch('/api/ai/generate/project', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          domain,
          difficulty,
          budget,
          techStack: techStackInput.split(',').map((item) => item.trim()).filter(Boolean),
        }),
      });

      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data?.error || 'Unable to generate a project right now.');
      }

      setGeneratedProject(data.project);
      analytics.featureUsage('ai_project_generator', 'premium');
      analytics.aiUsageByPlan('ai_project_generator', 'premium');
    } catch (error) {
      logger.error('Failed to generate project:', error);
      setGeneratedProject(null);
      setErrorMessage(error instanceof Error ? error.message : 'Unable to generate a project right now.');
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
                {errorMessage && (
                  <p className="mt-4 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
                    {errorMessage}
                  </p>
                )}
              </Card>
            </div>

            {/* Project Display */}
            <div className="lg:col-span-2">
              {!generatedProject ? (
                <Card className="bg-slate-800/50 border-slate-700 p-12 flex items-center justify-center min-h-96">
                  <div className="text-center">
                    <p className="text-slate-400 text-lg">
                      Configure your preferences and click &quot;Generate Project&quot; to get started
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
