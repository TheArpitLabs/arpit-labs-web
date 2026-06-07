"use client";

import React, { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { projectSchema } from "@/lib/validation/project.schema";
import { supabaseClient } from "@/lib/supabase/client";
import { useRouter, useParams } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { X, Plus, Upload, Save, Eye, ArrowLeft, Loader2 } from "lucide-react";
import Link from "next/link";

const PROJECT_TYPES = [
  { value: 'software', label: 'Software' },
  { value: 'hardware', label: 'Hardware' },
  { value: 'research', label: 'Research' },
  { value: 'opensource', label: 'Open Source' },
  { value: 'hackathon', label: 'Hackathon' },
  { value: 'hybrid', label: 'Hybrid' },
] as const;

export default function EditProjectPage() {
  const router = useRouter();
  const params = useParams();
  const projectSlug = params.slug as string;
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any | null>(null);
  const [coverImage, setCoverImage] = useState<string>("");
  const [technologies, setTechnologies] = useState<Record<string, string[]>>({});
  const [languages, setLanguages] = useState<string[]>([]);
  const [frameworks, setFrameworks] = useState<string[]>([]);
  const [tools, setTools] = useState<Record<string, string[]>>({});
  const [uploading, setUploading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
    reset,
  } = useForm({
    resolver: zodResolver(projectSchema),
  });

  useEffect(() => {
    async function loadData() {
      const { data: userData } = await supabaseClient.auth.getUser();
      setUser(userData?.user ?? null);

      if (projectSlug) {
        const { data: project } = await supabaseClient
          .from('projects')
          .select('*')
          .eq('slug', projectSlug)
          .single();

        if (project) {
          reset({
            title: project.title,
            slug: project.slug,
            description: project.description,
            project_type: project.project_type,
            branch: project.branch,
            domain: project.domain,
            category: project.category,
            github_url: project.github_url,
            demo_url: project.demo_url,
            status: project.status,
            featured: project.featured,
          });
          setCoverImage(project.cover_image || '');
          setTechnologies(project.technologies || {});
          setLanguages(project.languages || []);
          setFrameworks(project.frameworks || []);
          setTools(project.tools || {});
        }
      }
      setLoading(false);
    }

    loadData();
  }, [projectSlug, reset]);

  const addToArray = (list: string[], setList: React.Dispatch<React.SetStateAction<string[]>>, value: string) => {
    if (value && !list.includes(value)) {
      setList([...list, value]);
    }
  };

  const removeFromArray = (list: string[], setList: React.Dispatch<React.SetStateAction<string[]>>, index: number) => {
    setList(list.filter((_, i) => i !== index));
  };

  const handleImageUpload = async (file: File) => {
    try {
      setUploading(true);
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}.${fileExt}`;
      const filePath = `${fileName}`;

      const { error: uploadError } = await supabaseClient.storage
        .from('project-images')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data } = supabaseClient.storage
        .from('project-images')
        .getPublicUrl(filePath);

      return data.publicUrl;
    } catch (error) {
      console.error('Error uploading image:', error);
      alert('Failed to upload image. Please try again.');
      return null;
    } finally {
      setUploading(false);
    }
  };

  const onSubmit = async (data: any) => {
    try {
      setIsSubmitting(true);

      if (!user) {
        alert('You must be logged in to edit a project.');
        return;
      }

      const payload = {
        ...data,
        cover_image: coverImage || null,
        technologies: technologies,
        languages: languages,
        frameworks: frameworks,
        tools: tools,
      };

      const { error } = await supabaseClient
        .from('projects')
        .update(payload)
        .eq('slug', projectSlug);

      if (error) throw error;

      router.push('/profile/projects');
    } catch (error) {
      console.error('Error updating project:', error);
      alert('Failed to update project. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSaveDraft = async (data: any) => {
    await onSubmit({ ...data, status: 'draft' });
  };

  const handlePublish = async (data: any) => {
    await onSubmit({ ...data, status: 'published' });
  };

  if (loading) {
    return (
      <main className="mx-auto max-w-5xl px-4 py-12">
        <div className="flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </main>
    );
  }

  const projectType = watch('project_type');

  return (
    <main className="mx-auto max-w-5xl px-4 py-12">
      <div className="mb-8">
        <Link href="/profile/projects" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary">
          <ArrowLeft className="h-4 w-4" />
          Back to Projects
        </Link>
        <h1 className="mt-4 text-3xl font-semibold">Edit Project</h1>
        <p className="mt-2 text-muted-foreground">Update your project details.</p>
      </div>

      <form onSubmit={handleSubmit(handleSaveDraft)} className="space-y-8">
        {/* Basic Information */}
        <Card className="border-border/70 bg-card p-6">
          <h2 className="mb-4 text-xl font-semibold">Basic Information</h2>
          
          <div className="grid gap-6 md:grid-cols-2">
            <div className="space-y-2">
              <label className="text-sm font-medium">Title *</label>
              <input
                {...register('title')}
                placeholder="e.g. Nexus AI Platform"
                className="w-full rounded-xl border border-border/70 bg-background px-4 py-3 text-sm outline-none focus:border-primary"
              />
              {errors.title && <p className="text-xs text-red-500">{errors.title.message as string}</p>}
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Slug *</label>
              <input
                {...register('slug')}
                placeholder="nexus-ai-platform"
                className="w-full rounded-xl border border-border/70 bg-background px-4 py-3 text-sm outline-none focus:border-primary"
              />
              {errors.slug && <p className="text-xs text-red-500">{errors.slug.message as string}</p>}
            </div>
          </div>

          <div className="mt-6 space-y-2">
            <label className="text-sm font-medium">Description *</label>
            <textarea
              {...register('description')}
              rows={3}
              placeholder="Brief description of your project..."
              className="w-full rounded-xl border border-border/70 bg-background px-4 py-3 text-sm outline-none focus:border-primary"
            />
            {errors.description && <p className="text-xs text-red-500">{errors.description.message as string}</p>}
          </div>

          <div className="mt-6 grid gap-6 md:grid-cols-2">
            <div className="space-y-2">
              <label className="text-sm font-medium">Project Type *</label>
              <select
                {...register('project_type')}
                className="w-full rounded-xl border border-border/70 bg-background px-4 py-3 text-sm outline-none focus:border-primary"
              >
                {PROJECT_TYPES.map(type => (
                  <option key={type.value} value={type.value}>{type.label}</option>
                ))}
              </select>
              {errors.project_type && <p className="text-xs text-red-500">{errors.project_type.message as string}</p>}
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Branch</label>
              <input
                {...register('branch')}
                placeholder="e.g. main, develop"
                className="w-full rounded-xl border border-border/70 bg-background px-4 py-3 text-sm outline-none focus:border-primary"
              />
            </div>
          </div>

          <div className="mt-6 grid gap-6 md:grid-cols-2">
            <div className="space-y-2">
              <label className="text-sm font-medium">Domain</label>
              <input
                {...register('domain')}
                placeholder="e.g. AI, IoT, Web"
                className="w-full rounded-xl border border-border/70 bg-background px-4 py-3 text-sm outline-none focus:border-primary"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Category</label>
              <input
                {...register('category')}
                placeholder="e.g. Fullstack, Embedded Systems"
                className="w-full rounded-xl border border-border/70 bg-background px-4 py-3 text-sm outline-none focus:border-primary"
              />
            </div>
          </div>
        </Card>

        {/* Technical Stack */}
        <Card className="border-border/70 bg-card p-6">
          <h2 className="mb-4 text-xl font-semibold">Technical Stack</h2>

          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Languages</label>
              <div className="flex flex-wrap gap-2">
                {languages.map((lang, i) => (
                  <Badge key={i} variant="outline" className="flex items-center gap-1">
                    {lang}
                    <button type="button" onClick={() => removeFromArray(languages, setLanguages, i)}>
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
                <input
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      addToArray(languages, setLanguages, e.currentTarget.value);
                      e.currentTarget.value = "";
                    }
                  }}
                  placeholder="Add language..."
                  className="rounded-full border border-border/70 bg-transparent px-3 py-1 text-xs outline-none focus:border-primary"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Frameworks</label>
              <div className="flex flex-wrap gap-2">
                {frameworks.map((fw, i) => (
                  <Badge key={i} variant="outline" className="flex items-center gap-1">
                    {fw}
                    <button type="button" onClick={() => removeFromArray(frameworks, setFrameworks, i)}>
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
                <input
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      addToArray(frameworks, setFrameworks, e.currentTarget.value);
                      e.currentTarget.value = "";
                    }
                  }}
                  placeholder="Add framework..."
                  className="rounded-full border border-border/70 bg-transparent px-3 py-1 text-xs outline-none focus:border-primary"
                />
              </div>
            </div>
          </div>
        </Card>

        {/* Links */}
        <Card className="border-border/70 bg-card p-6">
          <h2 className="mb-4 text-xl font-semibold">Links</h2>

          <div className="grid gap-6 md:grid-cols-2">
            <div className="space-y-2">
              <label className="text-sm font-medium">GitHub URL</label>
              <input
                {...register('github_url')}
                placeholder="https://github.com/username/repo"
                className="w-full rounded-xl border border-border/70 bg-background px-4 py-3 text-sm outline-none focus:border-primary"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Demo URL</label>
              <input
                {...register('demo_url')}
                placeholder="https://demo.example.com"
                className="w-full rounded-xl border border-border/70 bg-background px-4 py-3 text-sm outline-none focus:border-primary"
              />
            </div>
          </div>
        </Card>

        {/* Cover Image */}
        <Card className="border-border/70 bg-card p-6">
          <h2 className="mb-4 text-xl font-semibold">Cover Image</h2>
          
          <div className="flex items-center gap-4">
            {coverImage ? (
              <div className="relative h-32 w-32 overflow-hidden rounded-xl border border-border/70">
                <img src={coverImage} alt="Cover" className="h-full w-full object-cover" />
                <button
                  type="button"
                  onClick={() => setCoverImage("")}
                  className="absolute right-2 top-2 rounded-full bg-red-500 p-1 text-white"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            ) : (
              <div className="flex h-32 w-32 items-center justify-center rounded-xl border-2 border-dashed border-border/70">
                <Upload className="h-8 w-8 text-muted-foreground" />
              </div>
            )}
            <div className="flex-1">
              <p className="text-sm text-muted-foreground">Upload a cover image for your project.</p>
              <p className="mt-1 text-xs text-muted-foreground">Recommended size: 1200x630px</p>
              <input
                type="file"
                accept="image/*"
                onChange={async (e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    const url = await handleImageUpload(file);
                    if (url) setCoverImage(url);
                  }
                }}
                disabled={uploading}
                className="mt-2 text-sm"
              />
            </div>
          </div>
        </Card>

        {/* Actions */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" {...register('featured')} className="h-4 w-4 rounded border-gray-300" />
              Featured Project
            </label>
          </div>

          <div className="flex items-center gap-4">
            <Button
              type="button"
              variant="outline"
              onClick={handleSubmit(handleSaveDraft)}
              disabled={isSubmitting}
            >
              <Save className="mr-2 h-4 w-4" />
              Save Draft
            </Button>
            <Button
              type="button"
              onClick={handleSubmit(handlePublish)}
              disabled={isSubmitting}
            >
              <Eye className="mr-2 h-4 w-4" />
              Publish
            </Button>
          </div>
        </div>
      </form>
    </main>
  );
}
