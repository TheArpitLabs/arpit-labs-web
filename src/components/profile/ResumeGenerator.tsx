"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Download, FileText, Loader2, Check } from "lucide-react";
import { supabaseClient } from "@/lib/supabase/client";

interface Profile {
  full_name?: string;
  username?: string;
  email?: string;
  location?: string;
  bio?: string;
  github_url?: string;
  linkedin_url?: string;
  website_url?: string;
  skills?: string[] | { name: string }[];
  experience?: Array<{
    title?: string;
    role?: string;
    company?: string;
    organization?: string;
    startDate?: string;
    endDate?: string;
    description?: string;
  }>;
  education?: Array<{
    degree?: string;
    qualification?: string;
    institution?: string;
    school?: string;
    graduationYear?: number;
    graduationDate?: string;
    description?: string;
    field?: string;
  }>;
}

interface Project {
  title: string;
  description?: string;
  project_type?: string;
  status?: string;
  views_count?: number;
  likes_count?: number;
  created_at?: string;
  featured?: boolean;
}

interface GamificationData {
  points?: number;
  level?: number;
  current_streak?: number;
  longest_streak?: number;
}

interface UserBadge {
  badges?: {
    name?: string;
    description?: string;
    icon?: string;
  };
  earned_at?: string;
}

interface UserAchievement {
  achievements?: {
    name?: string;
    description?: string;
    category?: string;
    difficulty?: string;
  };
  completed_at?: string;
}

interface EngineeringScore {
  total?: number;
  rank?: string;
  breakdown?: {
    projects?: number;
    points?: number;
    badges?: number;
    achievements?: number;
    streak?: number;
  };
}

interface ResumeGeneratorProps {
  profile: Profile;
  projects: Project[];
  gamificationData?: GamificationData;
  userBadges: UserBadge[];
  userAchievements: UserAchievement[];
  engineeringScore?: EngineeringScore;
}

export function ResumeGenerator({
  profile,
  projects,
  gamificationData,
  userBadges,
  userAchievements,
  engineeringScore
}: ResumeGeneratorProps) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [generated, setGenerated] = useState(false);

  const generateResume = async () => {
    setIsGenerating(true);
    try {
      // Create resume data object
      const resumeData = {
        personalInfo: {
          name: profile?.full_name || profile?.username || "Unknown",
          email: profile?.email || "",
          location: profile?.location || "",
          bio: profile?.bio || "",
          github: profile?.github_url || "",
          linkedin: profile?.linkedin_url || "",
          website: profile?.website_url || ""
        },
        engineeringScore: {
          total: engineeringScore?.total || 0,
          rank: engineeringScore?.rank || "Aspiring Engineer",
          breakdown: engineeringScore?.breakdown || {}
        },
        gamification: {
          points: gamificationData?.points || 0,
          level: gamificationData?.level || 1,
          currentStreak: gamificationData?.current_streak || 0,
          longestStreak: gamificationData?.longest_streak || 0
        },
        skills: profile?.skills || [],
        experience: profile?.experience || [],
        education: profile?.education || [],
        projects: projects.map(p => ({
          title: p.title,
          description: p.description || "",
          projectType: p.project_type,
          status: p.status,
          views: p.views_count || 0,
          likes: p.likes_count || 0,
          createdAt: p.created_at,
          featured: p.featured || false
        })),
        badges: userBadges.map(ub => ({
          name: ub.badges?.name || "",
          description: ub.badges?.description || "",
          icon: ub.badges?.icon || "",
          earnedAt: ub.earned_at
        })),
        achievements: userAchievements
          .filter(ua => ua.completed_at)
          .map(ua => ({
            name: ua.achievements?.name || "",
            description: ua.achievements?.description || "",
            category: ua.achievements?.category || "",
            difficulty: ua.achievements?.difficulty || "",
            completedAt: ua.completed_at
          }))
      };

      // Generate HTML resume
      const htmlContent = generateHTMLResume(resumeData);

      // Create blob and download
      const blob = new Blob([htmlContent], { type: 'text/html' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${profile?.username || profile?.full_name || 'resume'}.html`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      setGenerated(true);
    } catch (error) {
      console.error("Error generating resume:", error);
    } finally {
      setIsGenerating(false);
    }
  };

  const generateHTMLResume = (data: {
    personalInfo: {
      name: string;
      email: string;
      location: string;
      bio: string;
      github: string;
      linkedin: string;
      website: string;
    };
    engineeringScore: {
      total: number;
      rank: string;
      breakdown: Record<string, number>;
    };
    gamification: {
      points: number;
      level: number;
      currentStreak: number;
      longestStreak: number;
    };
    skills: string[] | { name: string }[];
    projects: Array<{
      title: string;
      description: string;
      projectType?: string;
      status?: string;
      views: number;
      likes: number;
      createdAt?: string;
      featured?: boolean;
    }>;
    badges: Array<{
      name: string;
      description: string;
      icon: string;
      earnedAt?: string;
    }>;
    achievements: Array<{
      name: string;
      description: string;
      category: string;
      difficulty: string;
      completedAt?: string;
    }>;
    experience: Array<{
      title?: string;
      role?: string;
      company?: string;
      organization?: string;
      startDate?: string;
      endDate?: string;
      description?: string;
    }>;
    education: Array<{
      degree?: string;
      qualification?: string;
      institution?: string;
      school?: string;
      graduationYear?: number;
      graduationDate?: string;
      description?: string;
      field?: string;
    }>;
  }) => {
    return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${data.personalInfo.name} - Resume</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            line-height: 1.6;
            color: #333;
            background: #f5f5f5;
            padding: 20px;
        }
        .resume-container {
            max-width: 800px;
            margin: 0 auto;
            background: white;
            padding: 40px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        }
        .header {
            border-bottom: 3px solid #6366f1;
            padding-bottom: 20px;
            margin-bottom: 30px;
        }
        .header h1 {
            color: #1e293b;
            font-size: 2.5em;
            margin-bottom: 10px;
        }
        .header .contact-info {
            color: #64748b;
            font-size: 0.95em;
        }
        .header .contact-info a {
            color: #6366f1;
            text-decoration: none;
        }
        .section {
            margin-bottom: 30px;
        }
        .section h2 {
            color: #1e293b;
            font-size: 1.5em;
            margin-bottom: 15px;
            padding-bottom: 8px;
            border-bottom: 2px solid #e2e8f0;
        }
        .engineering-score {
            background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
            color: white;
            padding: 20px;
            border-radius: 8px;
            margin-bottom: 20px;
        }
        .engineering-score .score {
            font-size: 3em;
            font-weight: bold;
        }
        .engineering-score .rank {
            font-size: 1.2em;
            opacity: 0.9;
        }
        .score-breakdown {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
            gap: 15px;
            margin-top: 15px;
        }
        .score-item {
            background: rgba(255,255,255,0.2);
            padding: 10px;
            border-radius: 6px;
            text-align: center;
        }
        .score-item .value {
            font-size: 1.5em;
            font-weight: bold;
        }
        .score-item .label {
            font-size: 0.8em;
            opacity: 0.9;
        }
        .project-item, .badge-item, .achievement-item {
            margin-bottom: 15px;
            padding: 15px;
            background: #f8fafc;
            border-radius: 6px;
            border-left: 3px solid #6366f1;
        }
        .project-item h3, .badge-item h3, .achievement-item h3 {
            color: #1e293b;
            margin-bottom: 5px;
        }
        .project-item .meta, .badge-item .meta, .achievement-item .meta {
            color: #64748b;
            font-size: 0.9em;
            margin-bottom: 8px;
        }
        .badge-grid {
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
            gap: 15px;
        }
        .gamification-stats {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
            gap: 15px;
            margin-bottom: 20px;
        }
        .stat-card {
            background: #f8fafc;
            padding: 15px;
            border-radius: 6px;
            text-align: center;
            border: 1px solid #e2e8f0;
        }
        .stat-card .value {
            font-size: 2em;
            font-weight: bold;
            color: #6366f1;
        }
        .stat-card .label {
            color: #64748b;
            font-size: 0.9em;
        }
        .skills-list {
            display: flex;
            flex-wrap: wrap;
            gap: 10px;
        }
        .skill-tag {
            background: #6366f1;
            color: white;
            padding: 5px 15px;
            border-radius: 20px;
            font-size: 0.9em;
        }
        @media print {
            body {
                background: white;
                padding: 0;
            }
            .resume-container {
                box-shadow: none;
                padding: 20px;
            }
        }
    </style>
</head>
<body>
    <div class="resume-container">
        <div class="header">
            <h1>${data.personalInfo.name}</h1>
            <div class="contact-info">
                ${data.personalInfo.email ? `<p>📧 ${data.personalInfo.email}</p>` : ''}
                ${data.personalInfo.location ? `<p>📍 ${data.personalInfo.location}</p>` : ''}
                ${data.personalInfo.github ? `<p><a href="${data.personalInfo.github}" target="_blank">GitHub</a></p>` : ''}
                ${data.personalInfo.linkedin ? `<p><a href="${data.personalInfo.linkedin}" target="_blank">LinkedIn</a></p>` : ''}
                ${data.personalInfo.website ? `<p><a href="${data.personalInfo.website}" target="_blank">Website</a></p>` : ''}
            </div>
            ${data.personalInfo.bio ? `<p style="margin-top: 15px; color: #64748b;">${data.personalInfo.bio}</p>` : ''}
        </div>

        <div class="section">
            <h2>Engineering Score</h2>
            <div class="engineering-score">
                <div class="score">${data.engineeringScore.total}</div>
                <div class="rank">${data.engineeringScore.rank}</div>
                <div class="score-breakdown">
                    <div class="score-item">
                        <div class="value">${data.engineeringScore.breakdown.projects || 0}</div>
                        <div class="label">Projects</div>
                    </div>
                    <div class="score-item">
                        <div class="value">${data.engineeringScore.breakdown.points || 0}</div>
                        <div class="label">Points</div>
                    </div>
                    <div class="score-item">
                        <div class="value">${data.engineeringScore.breakdown.badges || 0}</div>
                        <div class="label">Badges</div>
                    </div>
                    <div class="score-item">
                        <div class="value">${data.engineeringScore.breakdown.achievements || 0}</div>
                        <div class="label">Achievements</div>
                    </div>
                    <div class="score-item">
                        <div class="value">${data.engineeringScore.breakdown.streak || 0}</div>
                        <div class="label">Streak</div>
                    </div>
                </div>
            </div>
        </div>

        <div class="section">
            <h2>Gamification Progress</h2>
            <div class="gamification-stats">
                <div class="stat-card">
                    <div class="value">${data.gamification.points.toLocaleString()}</div>
                    <div class="label">Points</div>
                </div>
                <div class="stat-card">
                    <div class="value">${data.gamification.level}</div>
                    <div class="label">Level</div>
                </div>
                <div class="stat-card">
                    <div class="value">${data.gamification.currentStreak}</div>
                    <div class="label">Current Streak</div>
                </div>
                <div class="stat-card">
                    <div class="value">${data.gamification.longestStreak}</div>
                    <div class="label">Best Streak</div>
                </div>
            </div>
        </div>

        ${data.skills && data.skills.length > 0 ? `
        <div class="section">
            <h2>Skills</h2>
            <div class="skills-list">
                ${data.skills.map((skill: any) => `<span class="skill-tag">${typeof skill === 'string' ? skill : skill.name}</span>`).join('')}
            </div>
        </div>
        ` : ''}

        ${data.projects && data.projects.length > 0 ? `
        <div class="section">
            <h2>Projects</h2>
            ${data.projects.map((project: any) => `
                <div class="project-item">
                    <h3>${project.title} ${project.featured ? '⭐' : ''}</h3>
                    <div class="meta">
                        ${project.projectType} • ${project.status} • ${project.views.toLocaleString()} views • ${project.likes} likes
                    </div>
                    <p>${project.description}</p>
                </div>
            `).join('')}
        </div>
        ` : ''}

        ${data.badges && data.badges.length > 0 ? `
        <div class="section">
            <h2>Badges</h2>
            <div class="badge-grid">
                ${data.badges.map((badge: any) => `
                    <div class="badge-item">
                        <h3>${badge.icon} ${badge.name}</h3>
                        <div class="meta">Earned: ${new Date(badge.earnedAt).toLocaleDateString()}</div>
                        <p>${badge.description}</p>
                    </div>
                `).join('')}
            </div>
        </div>
        ` : ''}

        ${data.achievements && data.achievements.length > 0 ? `
        <div class="section">
            <h2>Achievements</h2>
            ${data.achievements.map((achievement: any) => `
                <div class="achievement-item">
                    <h3>${achievement.name}</h3>
                    <div class="meta">
                        ${achievement.category} • ${achievement.difficulty} • Completed: ${new Date(achievement.completedAt).toLocaleDateString()}
                    </div>
                    <p>${achievement.description}</p>
                </div>
            `).join('')}
        </div>
        ` : ''}

        ${data.experience && data.experience.length > 0 ? `
        <div class="section">
            <h2>Experience</h2>
            ${data.experience.map((exp: any) => `
                <div class="project-item">
                    <h3>${exp.title || exp.role}</h3>
                    <div class="meta">
                        ${exp.company || exp.organization} • ${exp.startDate ? new Date(exp.startDate).toLocaleDateString() : ''} - ${exp.endDate ? new Date(exp.endDate).toLocaleDateString() : 'Present'}
                    </div>
                    <p>${exp.description}</p>
                </div>
            `).join('')}
        </div>
        ` : ''}

        ${data.education && data.education.length > 0 ? `
        <div class="section">
            <h2>Education</h2>
            ${data.education.map((edu: any) => `
                <div class="project-item">
                    <h3>${edu.degree || edu.qualification}</h3>
                    <div class="meta">
                        ${edu.institution || edu.school} • ${edu.graduationYear || new Date(edu.graduationDate).getFullYear()}
                    </div>
                    <p>${edu.description || edu.field}</p>
                </div>
            `).join('')}
        </div>
        ` : ''}
    </div>
</body>
</html>
    `;
  };

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <FileText className="h-5 w-5 text-purple-400" />
          <h3 className="font-semibold text-white">Resume Generator</h3>
        </div>
        {generated && (
          <div className="flex items-center gap-2 text-green-400 text-sm">
            <Check className="h-4 w-4" />
            Generated
          </div>
        )}
      </div>
      <p className="text-sm text-gray-400 mb-4">
        Generate a professional HTML resume showcasing your engineering score, projects, badges, and achievements.
      </p>
      <Button
        onClick={generateResume}
        disabled={isGenerating}
        className="w-full"
        variant="primary"
      >
        {isGenerating ? (
          <>
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            Generating...
          </>
        ) : (
          <>
            <Download className="h-4 w-4 mr-2" />
            Download Resume
          </>
        )}
      </Button>
    </Card>
  );
}
