"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { X, Plus, Tag as TagIcon } from "lucide-react";
import { tagsRepository } from "@/lib/repositories/tags.repository";
import { logger } from '@/lib/logger';

interface ProjectTag {
  id: string;
  project_id: string;
  tag: string;
  created_at: string;
}

interface TagManagerProps {
  projectId: string;
  projectSlug: string;
  isOwner: boolean;
}

export function TagManager({ projectId, projectSlug, isOwner }: TagManagerProps) {
  const [tags, setTags] = useState<ProjectTag[]>([]);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [newTag, setNewTag] = useState("");

  const loadTags = useCallback(async () => {
    try {
      const data = await tagsRepository.getTags(projectId);
      setTags(data);
    } catch (error) {
      logger.error('Error loading tags:', error);
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    loadTags();
  }, [loadTags]);

  const handleAddTag = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTag.trim()) return;

    try {
      setAdding(true);
      await tagsRepository.addTag({
        project_id: projectId,
        tag: newTag.trim(),
      });
      
      setNewTag("");
      loadTags();
    } catch (error) {
      logger.error('Error adding tag:', error);
      alert('Failed to add tag. Please try again.');
    } finally {
      setAdding(false);
    }
  };

  const handleRemoveTag = async (tag: string) => {
    try {
      await tagsRepository.removeTag(projectId, tag);
      loadTags();
    } catch (error) {
      logger.error('Error removing tag:', error);
      alert('Failed to remove tag.');
    }
  };

  if (loading) {
    return <div className="text-sm text-muted-foreground">Loading tags...</div>;
  }

  return (
    <Card className="border-border/70 bg-card p-6">
      <h3 className="mb-4 text-lg font-semibold">Tags</h3>

      <div className="space-y-4">
        <div className="flex flex-wrap gap-2">
          {tags.map((tag) => (
            <span
              key={tag.id}
              className="flex items-center gap-1 rounded-full bg-primary/10 px-3 py-1 text-sm font-medium text-primary"
            >
              <TagIcon className="h-3 w-3" />
              {tag.tag}
              {isOwner && (
                <button
                  type="button"
                  onClick={() => handleRemoveTag(tag.tag)}
                  className="ml-1 text-primary hover:text-red-500"
                >
                  <X className="h-3 w-3" />
                </button>
              )}
            </span>
          ))}
          {tags.length === 0 && (
            <p className="text-sm text-muted-foreground">No tags added yet.</p>
          )}
        </div>

        {isOwner && (
          <form onSubmit={handleAddTag} className="flex items-center gap-2">
            <input
              type="text"
              placeholder="Add a tag..."
              value={newTag}
              onChange={(e) => setNewTag(e.target.value)}
              className="flex-1 rounded-lg border border-border/70 bg-background px-3 py-2 text-sm outline-none focus:border-primary"
            />
            <Button type="submit" size="sm" disabled={adding || !newTag.trim()}>
              {adding ? 'Adding...' : <Plus className="h-4 w-4" />}
            </Button>
          </form>
        )}
      </div>
    </Card>
  );
}
