"use client";

import React, { useState, useEffect } from "react";
import { supabaseClient } from "@/lib/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { User, MapPin, Briefcase, Linkedin, Twitter, Youtube, Instagram, Globe, Github, Save, X, Plus, Trash2 } from "lucide-react";

interface Profile {
  id: string;
  full_name?: string;
  bio?: string;
  location?: string;
  job_title?: string;
  company?: string;
  availability?: string;
  github_url?: string;
  linkedin_url?: string;
  twitter_url?: string;
  youtube_url?: string;
  instagram_url?: string;
  website_url?: string;
  stackoverflow_url?: string;
  skills?: (string | { name: string; level?: string })[];
  experience?: Experience[];
  education?: Education[];
}

interface Experience {
  id?: number;
  title?: string;
  company?: string;
  location?: string;
  start_date?: string;
  end_date?: string;
  current?: boolean;
  description?: string;
}

interface Education {
  id?: number;
  degree?: string;
  institution?: string;
  location?: string;
  start_date?: string;
  end_date?: string;
  field_of_study?: string;
}

interface ProfileCustomizationProps {
  profile: Profile;
  onProfileUpdate: (profile: Profile) => void;
}

export function ProfileCustomization({ profile, onProfileUpdate }: ProfileCustomizationProps) {
  const [formData, setFormData] = useState<Profile>(profile);
  const [saving, setSaving] = useState(false);
  const [newSkill, setNewSkill] = useState("");
  const [showExperienceForm, setShowExperienceForm] = useState(false);
  const [showEducationForm, setShowEducationForm] = useState(false);
  const [newExperience, setNewExperience] = useState({
    title: "",
    company: "",
    location: "",
    start_date: "",
    end_date: "",
    current: false,
    description: ""
  });
  const [newEducation, setNewEducation] = useState({
    degree: "",
    institution: "",
    location: "",
    start_date: "",
    end_date: "",
    field_of_study: ""
  });

  useEffect(() => {
    setFormData(profile);
  }, [profile]);

  const handleSave = async () => {
    setSaving(true);
    try {
      const { error } = await supabaseClient
        .from("profiles")
        .update({
          full_name: formData.full_name,
          bio: formData.bio,
          location: formData.location,
          job_title: formData.job_title,
          company: formData.company,
          availability: formData.availability,
          github_url: formData.github_url,
          linkedin_url: formData.linkedin_url,
          twitter_url: formData.twitter_url,
          youtube_url: formData.youtube_url,
          instagram_url: formData.instagram_url,
          website_url: formData.website_url,
          stackoverflow_url: formData.stackoverflow_url,
          skills: formData.skills,
          experience: formData.experience,
          education: formData.education,
          updated_at: new Date().toISOString(),
        })
        .eq("id", profile.id);

      if (error) throw error;

      onProfileUpdate(formData);
    } catch (error) {
      console.error("Error saving profile:", error);
    } finally {
      setSaving(false);
    }
  };

  const handleAddSkill = () => {
    if (newSkill.trim() && formData.skills) {
      setFormData({
        ...formData,
        skills: [...formData.skills, { name: newSkill.trim(), level: "intermediate" }]
      });
      setNewSkill("");
    }
  };

  const handleRemoveSkill = (index: number) => {
    if (formData.skills) {
      setFormData({
        ...formData,
        skills: formData.skills.filter((_, i) => i !== index)
      });
    }
  };

  const handleAddExperience = () => {
    if (formData.experience) {
      setFormData({
        ...formData,
        experience: [...formData.experience, { ...newExperience, id: Date.now() }]
      });
      setNewExperience({
        title: "",
        company: "",
        location: "",
        start_date: "",
        end_date: "",
        current: false,
        description: ""
      });
      setShowExperienceForm(false);
    }
  };

  const handleRemoveExperience = (index: number) => {
    if (formData.experience) {
      setFormData({
        ...formData,
        experience: formData.experience.filter((_, i) => i !== index)
      });
    }
  };

  const handleAddEducation = () => {
    if (formData.education) {
      setFormData({
        ...formData,
        education: [...formData.education, { ...newEducation, id: Date.now() }]
      });
      setNewEducation({
        degree: "",
        institution: "",
        location: "",
        start_date: "",
        end_date: "",
        field_of_study: ""
      });
      setShowEducationForm(false);
    }
  };

  const handleRemoveEducation = (index: number) => {
    if (formData.education) {
      setFormData({
        ...formData,
        education: formData.education.filter((_, i) => i !== index)
      });
    }
  };

  return (
    <div className="space-y-6">
      {/* Basic Information */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <User className="h-5 w-5 text-purple-400" />
          Basic Information
        </h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Full Name</label>
            <Input
              value={formData.full_name || ""}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, full_name: e.target.value })}
              placeholder="Your full name"
              className="bg-purple-950/50 border-purple-500/30 text-white placeholder-gray-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Bio</label>
            <Textarea
              value={formData.bio || ""}
              onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setFormData({ ...formData, bio: e.target.value })}
              placeholder="Tell us about yourself..."
              rows={4}
              className="bg-purple-950/50 border-purple-500/30 text-white placeholder-gray-500"
            />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Location</label>
              <Input
                value={formData.location || ""}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, location: e.target.value })}
                placeholder="City, Country"
                className="bg-purple-950/50 border-purple-500/30 text-white placeholder-gray-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Job Title</label>
              <Input
                value={formData.job_title || ""}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, job_title: e.target.value })}
                placeholder="Software Engineer"
                className="bg-purple-950/50 border-purple-500/30 text-white placeholder-gray-500"
              />
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Company</label>
              <Input
                value={formData.company || ""}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, company: e.target.value })}
                placeholder="Company name"
                className="bg-purple-950/50 border-purple-500/30 text-white placeholder-gray-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Availability</label>
              <select
                value={formData.availability || "open"}
                onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setFormData({ ...formData, availability: e.target.value })}
                className="w-full bg-purple-950/50 border-purple-500/30 text-white rounded-lg px-4 py-2"
              >
                <option value="open">Open to opportunities</option>
                <option value="busy">Busy</option>
                <option value="closed">Not looking</option>
              </select>
            </div>
          </div>
        </div>
      </Card>

      {/* Skills */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold text-white mb-4">Skills</h3>
        <div className="flex gap-2 mb-4">
          <Input
            value={newSkill}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewSkill(e.target.value)}
            onKeyPress={(e: React.KeyboardEvent) => e.key === "Enter" && handleAddSkill()}
            placeholder="Add a skill..."
            className="bg-purple-950/50 border-purple-500/30 text-white placeholder-gray-500"
          />
          <Button onClick={handleAddSkill} size="sm">
            <Plus className="h-4 w-4" />
          </Button>
        </div>
        <div className="flex flex-wrap gap-2">
          {formData.skills?.map((skill: any, index: number) => (
            <Badge key={index} variant="secondary" className="flex items-center gap-2">
              {skill.name}
              <button
                onClick={() => handleRemoveSkill(index)}
                className="ml-1 hover:text-red-400"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          ))}
        </div>
      </Card>

      {/* Social Links */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold text-white mb-4">Social Links</h3>
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Github className="h-5 w-5 text-gray-400" />
            <Input
              value={formData.github_url || ""}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, github_url: e.target.value })}
              placeholder="GitHub URL"
              className="bg-purple-950/50 border-purple-500/30 text-white placeholder-gray-500"
            />
          </div>
          <div className="flex items-center gap-2">
            <Linkedin className="h-5 w-5 text-gray-400" />
            <Input
              value={formData.linkedin_url || ""}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, linkedin_url: e.target.value })}
              placeholder="LinkedIn URL"
              className="bg-purple-950/50 border-purple-500/30 text-white placeholder-gray-500"
            />
          </div>
          <div className="flex items-center gap-2">
            <Twitter className="h-5 w-5 text-gray-400" />
            <Input
              value={formData.twitter_url || ""}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, twitter_url: e.target.value })}
              placeholder="Twitter URL"
              className="bg-purple-950/50 border-purple-500/30 text-white placeholder-gray-500"
            />
          </div>
          <div className="flex items-center gap-2">
            <Youtube className="h-5 w-5 text-gray-400" />
            <Input
              value={formData.youtube_url || ""}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, youtube_url: e.target.value })}
              placeholder="YouTube URL"
              className="bg-purple-950/50 border-purple-500/30 text-white placeholder-gray-500"
            />
          </div>
          <div className="flex items-center gap-2">
            <Instagram className="h-5 w-5 text-gray-400" />
            <Input
              value={formData.instagram_url || ""}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, instagram_url: e.target.value })}
              placeholder="Instagram URL"
              className="bg-purple-950/50 border-purple-500/30 text-white placeholder-gray-500"
            />
          </div>
          <div className="flex items-center gap-2">
            <Globe className="h-5 w-5 text-gray-400" />
            <Input
              value={formData.website_url || ""}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, website_url: e.target.value })}
              placeholder="Website URL"
              className="bg-purple-950/50 border-purple-500/30 text-white placeholder-gray-500"
            />
          </div>
        </div>
      </Card>

      {/* Experience */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-white flex items-center gap-2">
            <Briefcase className="h-5 w-5 text-purple-400" />
            Experience
          </h3>
          <Button onClick={() => setShowExperienceForm(!showExperienceForm)} size="sm" variant="outline">
            <Plus className="h-4 w-4 mr-2" />
            Add Experience
          </Button>
        </div>

        {showExperienceForm && (
          <div className="space-y-4 mb-4 p-4 bg-purple-900/30 rounded-lg">
            <Input
              value={newExperience.title}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewExperience({ ...newExperience, title: e.target.value })}
              placeholder="Job Title"
              className="bg-purple-950/50 border-purple-500/30 text-white placeholder-gray-500"
            />
            <Input
              value={newExperience.company}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewExperience({ ...newExperience, company: e.target.value })}
              placeholder="Company"
              className="bg-purple-950/50 border-purple-500/30 text-white placeholder-gray-500"
            />
            <Input
              value={newExperience.location}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewExperience({ ...newExperience, location: e.target.value })}
              placeholder="Location"
              className="bg-purple-950/50 border-purple-500/30 text-white placeholder-gray-500"
            />
            <div className="grid grid-cols-2 gap-4">
              <Input
                type="date"
                value={newExperience.start_date}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewExperience({ ...newExperience, start_date: e.target.value })}
                className="bg-purple-950/50 border-purple-500/30 text-white"
              />
              <Input
                type="date"
                value={newExperience.end_date}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewExperience({ ...newExperience, end_date: e.target.value })}
                disabled={newExperience.current}
                className="bg-purple-950/50 border-purple-500/30 text-white"
              />
            </div>
            <label className="flex items-center gap-2 text-sm text-gray-300">
              <input
                type="checkbox"
                checked={newExperience.current}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewExperience({ ...newExperience, current: e.target.checked })}
                className="rounded"
              />
              Currently working here
            </label>
            <Textarea
              value={newExperience.description}
              onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setNewExperience({ ...newExperience, description: e.target.value })}
              placeholder="Job description..."
              rows={3}
              className="bg-purple-950/50 border-purple-500/30 text-white placeholder-gray-500"
            />
            <div className="flex gap-2">
              <Button onClick={handleAddExperience} size="sm">
                Add
              </Button>
              <Button onClick={() => setShowExperienceForm(false)} size="sm" variant="outline">
                Cancel
              </Button>
            </div>
          </div>
        )}

        <div className="space-y-3">
          {formData.experience?.map((exp: any, index: number) => (
            <div key={exp.id || index} className="p-4 bg-purple-900/30 rounded-lg flex items-start justify-between">
              <div>
                <h4 className="font-medium text-white">{exp.title}</h4>
                <p className="text-sm text-gray-400">{exp.company}</p>
                <p className="text-xs text-gray-500">{exp.start_date} - {exp.current ? "Present" : exp.end_date}</p>
              </div>
              <button
                onClick={() => handleRemoveExperience(index)}
                className="text-red-400 hover:text-red-300"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
      </Card>

      {/* Education */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-white">Education</h3>
          <Button onClick={() => setShowEducationForm(!showEducationForm)} size="sm" variant="outline">
            <Plus className="h-4 w-4 mr-2" />
            Add Education
          </Button>
        </div>

        {showEducationForm && (
          <div className="space-y-4 mb-4 p-4 bg-purple-900/30 rounded-lg">
            <Input
              value={newEducation.degree}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewEducation({ ...newEducation, degree: e.target.value })}
              placeholder="Degree (e.g., B.S. Computer Science)"
              className="bg-purple-950/50 border-purple-500/30 text-white placeholder-gray-500"
            />
            <Input
              value={newEducation.institution}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewEducation({ ...newEducation, institution: e.target.value })}
              placeholder="Institution"
              className="bg-purple-950/50 border-purple-500/30 text-white placeholder-gray-500"
            />
            <Input
              value={newEducation.field_of_study}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewEducation({ ...newEducation, field_of_study: e.target.value })}
              placeholder="Field of Study"
              className="bg-purple-950/50 border-purple-500/30 text-white placeholder-gray-500"
            />
            <Input
              value={newEducation.location}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewEducation({ ...newEducation, location: e.target.value })}
              placeholder="Location"
              className="bg-purple-950/50 border-purple-500/30 text-white placeholder-gray-500"
            />
            <div className="grid grid-cols-2 gap-4">
              <Input
                type="date"
                value={newEducation.start_date}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewEducation({ ...newEducation, start_date: e.target.value })}
                className="bg-purple-950/50 border-purple-500/30 text-white"
              />
              <Input
                type="date"
                value={newEducation.end_date}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewEducation({ ...newEducation, end_date: e.target.value })}
                className="bg-purple-950/50 border-purple-500/30 text-white"
              />
            </div>
            <div className="flex gap-2">
              <Button onClick={handleAddEducation} size="sm">
                Add
              </Button>
              <Button onClick={() => setShowEducationForm(false)} size="sm" variant="outline">
                Cancel
              </Button>
            </div>
          </div>
        )}

        <div className="space-y-3">
          {formData.education?.map((edu: any, index: number) => (
            <div key={edu.id || index} className="p-4 bg-purple-900/30 rounded-lg flex items-start justify-between">
              <div>
                <h4 className="font-medium text-white">{edu.degree}</h4>
                <p className="text-sm text-gray-400">{edu.institution}</p>
                <p className="text-xs text-gray-500">{edu.start_date} - {edu.end_date}</p>
              </div>
              <button
                onClick={() => handleRemoveEducation(index)}
                className="text-red-400 hover:text-red-300"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
      </Card>

      {/* Save Button */}
      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={saving} className="bg-purple-600 hover:bg-purple-700">
          <Save className="h-4 w-4 mr-2" />
          {saving ? "Saving..." : "Save Changes"}
        </Button>
      </div>
    </div>
  );
}
