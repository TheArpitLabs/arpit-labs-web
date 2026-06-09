"use client";

import React, { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { X, Plus, User as UserIcon, Shield } from "lucide-react";
import { contributorsRepository } from "@/lib/repositories/contributors.repository";

interface Contributor {
  id: string;
  project_id: string;
  user_id: string;
  role: 'owner' | 'maintainer' | 'contributor' | 'collaborator';
  contribution_type: string[];
  joined_at: string;
  profiles: {
    id: string;
    email: string;
    full_name: string | null;
    avatar_url: string | null;
  };
}

interface ContributorManagerProps {
  projectId: string;
  projectSlug: string;
  isOwner: boolean;
}

export function ContributorManager({ projectId, projectSlug, isOwner }: ContributorManagerProps) {
  const [contributors, setContributors] = useState<Contributor[]>([]);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [newContributorEmail, setNewContributorEmail] = useState("");
  const [newContributorRole, setNewContributorRole] = useState<'owner' | 'maintainer' | 'contributor' | 'collaborator'>('contributor');

  const loadContributors = useCallback(async () => {
    try {
      const data = await contributorsRepository.getContributors(projectId);
      setContributors(data);
    } catch (error) {
      console.error('Error loading contributors:', error);
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    loadContributors();
  }, [loadContributors]);

  const handleAddContributor = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newContributorEmail) return;

    try {
      setAdding(true);
      // In a real implementation, you'd need to look up the user_id from the email
      // For now, this is a placeholder that shows the UI pattern
      const userId = newContributorEmail; // This should be a real UUID lookup
      
      await contributorsRepository.addContributor({
        project_id: projectId,
        user_id: userId,
        role: newContributorRole,
      });
      
      setNewContributorEmail("");
      setNewContributorRole('contributor');
      loadContributors();
    } catch (error) {
      console.error('Error adding contributor:', error);
      alert('Failed to add contributor. Please check the email and try again.');
    } finally {
      setAdding(false);
    }
  };

  const handleRemoveContributor = async (userId: string) => {
    if (!confirm('Are you sure you want to remove this contributor?')) return;

    try {
      await contributorsRepository.removeContributor(projectId, userId);
      loadContributors();
    } catch (error) {
      console.error('Error removing contributor:', error);
      alert('Failed to remove contributor.');
    }
  };

  const handleUpdateRole = async (userId: string, newRole: 'owner' | 'maintainer' | 'contributor' | 'collaborator') => {
    try {
      await contributorsRepository.updateContributorRole(projectId, userId, newRole);
      loadContributors();
    } catch (error) {
      console.error('Error updating role:', error);
      alert('Failed to update role.');
    }
  };

  if (loading) {
    return <div className="text-sm text-muted-foreground">Loading contributors...</div>;
  }

  return (
    <Card className="border-border/70 bg-card p-6">
      <h3 className="mb-4 text-lg font-semibold">Contributors</h3>

      <div className="space-y-4">
        {contributors.map((contributor) => (
          <div key={contributor.id} className="flex items-center justify-between rounded-lg border border-border/50 bg-muted/20 p-3">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                {contributor.profiles.avatar_url ? (
                  <Image src={contributor.profiles.avatar_url} alt="" width={40} height={40} className="h-10 w-10 rounded-full object-cover" />
                ) : (
                  <UserIcon className="h-5 w-5 text-primary" />
                )}
              </div>
              <div>
                <p className="text-sm font-medium">{contributor.profiles.full_name || contributor.profiles.email}</p>
                <p className="text-xs text-muted-foreground">{contributor.profiles.email}</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {isOwner && contributor.role !== 'owner' && (
                <>
                  <select
                    value={contributor.role}
                    onChange={(e) => handleUpdateRole(contributor.user_id, e.target.value as any)}
                    className="rounded-lg border border-border/70 bg-background px-3 py-1 text-sm outline-none focus:border-primary"
                  >
                    <option value="maintainer">Maintainer</option>
                    <option value="contributor">Contributor</option>
                    <option value="collaborator">Collaborator</option>
                  </select>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleRemoveContributor(contributor.user_id)}
                    className="h-8 w-8 p-0 text-red-500 hover:text-red-600"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </>
              )}
              {contributor.role === 'owner' && (
                <span className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Shield className="h-3 w-3" />
                  Owner
                </span>
              )}
            </div>
          </div>
        ))}

        {isOwner && (
          <form onSubmit={handleAddContributor} className="flex items-center gap-2">
            <input
              type="email"
              placeholder="Enter user email..."
              value={newContributorEmail}
              onChange={(e) => setNewContributorEmail(e.target.value)}
              className="flex-1 rounded-lg border border-border/70 bg-background px-3 py-2 text-sm outline-none focus:border-primary"
            />
            <select
              value={newContributorRole}
              onChange={(e) => setNewContributorRole(e.target.value as any)}
              className="rounded-lg border border-border/70 bg-background px-3 py-2 text-sm outline-none focus:border-primary"
            >
              <option value="maintainer">Maintainer</option>
              <option value="contributor">Contributor</option>
              <option value="collaborator">Collaborator</option>
            </select>
            <Button type="submit" size="sm" disabled={adding || !newContributorEmail}>
              {adding ? 'Adding...' : <Plus className="h-4 w-4" />}
            </Button>
          </form>
        )}
      </div>
    </Card>
  );
}
