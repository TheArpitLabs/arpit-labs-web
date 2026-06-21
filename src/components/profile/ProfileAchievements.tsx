"use client";

import React, { useCallback, useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Trophy, Rocket, Heart, Users, Star, Award, Target, CheckCircle, Lock, Loader2, AlertCircle } from "lucide-react";
import { supabaseClient } from "@/lib/supabase/client";

interface ProfileAchievementsProps {
  profile: any;
  isOwnProfile?: boolean;
}

interface Achievement {
  id: string;
  achievement_type: string;
  achievement_name: string;
  achievement_description: string;
  achievement_icon: string;
  progress: number;
  target: number;
  completed_at: string | null;
  metadata: any;
}

export function ProfileAchievements({ profile, isOwnProfile = false }: ProfileAchievementsProps) {
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAchievements = useCallback(async () => {
    if (!profile?.id) return;

    setLoading(true);
    try {
      const { data, error } = await supabaseClient
        .from("profile_achievements")
        .select("*")
        .eq("profile_id", profile.id)
        .order("completed_at", { ascending: false, nullsFirst: false });

      if (error) throw error;
      setAchievements(data || []);
    } catch (err) {
      console.error("Error fetching achievements:", err);
      setError("Failed to load achievements");
    } finally {
      setLoading(false);
    }
  }, [profile?.id]);

  useEffect(() => {
    fetchAchievements();
  }, [fetchAchievements]);

  const getAchievementIcon = (achievementType: string) => {
    const iconMap: Record<string, any> = {
      first_project: Rocket,
      ten_projects: Trophy,
      hundred_likes: Heart,
      first_follower: Users,
      mentor: Star,
      top_contributor: Award,
      early_adopter: Target,
      verified_profile: CheckCircle,
    };
    return iconMap[achievementType] || Trophy;
  };

  const getProgressPercentage = (progress: number, target: number) => {
    return Math.min((progress / target) * 100, 100);
  };

  const isCompleted = (achievement: Achievement) => {
    return achievement.completed_at !== null;
  };

  if (loading) {
    return (
      <Card className="p-6">
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 text-purple-400 animate-spin" />
        </div>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="p-6">
        <div className="flex items-center gap-2 text-red-400">
          <AlertCircle className="h-5 w-5" />
          <p>{error}</p>
        </div>
      </Card>
    );
  }

  const completedAchievements = achievements.filter(isCompleted);
  const inProgressAchievements = achievements.filter(a => !isCompleted(a));

  return (
    <Card className="p-6">
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-white mb-2">Achievements & Milestones</h3>
        <p className="text-sm text-gray-400">
          Track your progress and unlock achievements as you contribute
        </p>
      </div>

      {/* Achievement Stats */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="p-4 rounded-xl bg-purple-950/30 border border-purple-500/30 text-center">
          <div className="text-2xl font-bold text-purple-400">{completedAchievements.length}</div>
          <div className="text-xs text-gray-400">Completed</div>
        </div>
        <div className="p-4 rounded-xl bg-blue-950/30 border border-blue-500/30 text-center">
          <div className="text-2xl font-bold text-blue-400">{inProgressAchievements.length}</div>
          <div className="text-xs text-gray-400">In Progress</div>
        </div>
        <div className="p-4 rounded-xl bg-green-950/30 border border-green-500/30 text-center">
          <div className="text-2xl font-bold text-green-400">{achievements.length}</div>
          <div className="text-xs text-gray-400">Total</div>
        </div>
      </div>

      {/* Completed Achievements */}
      {completedAchievements.length > 0 && (
        <div className="mb-6">
          <h4 className="text-sm font-medium text-green-400 mb-3 flex items-center gap-2">
            <CheckCircle className="h-4 w-4" />
            Completed Achievements
          </h4>
          <div className="space-y-3">
            {completedAchievements.map((achievement) => {
              const Icon = getAchievementIcon(achievement.achievement_type);
              return (
                <div
                  key={achievement.id}
                  className="p-4 rounded-xl border border-green-500/30 bg-green-950/20"
                >
                  <div className="flex items-start gap-3">
                    <div className="p-2 rounded-lg bg-green-500/20">
                      <Icon className="h-5 w-5 text-green-400" />
                    </div>
                    <div className="flex-1">
                      <h5 className="font-medium text-white text-sm mb-1">
                        {achievement.achievement_name}
                      </h5>
                      <p className="text-xs text-gray-400 mb-2">
                        {achievement.achievement_description}
                      </p>
                      <div className="text-xs text-green-400">
                        Completed on {new Date(achievement.completed_at!).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* In Progress Achievements */}
      {inProgressAchievements.length > 0 && (
        <div className="mb-6">
          <h4 className="text-sm font-medium text-blue-400 mb-3 flex items-center gap-2">
            <Target className="h-4 w-4" />
            In Progress
          </h4>
          <div className="space-y-3">
            {inProgressAchievements.map((achievement) => {
              const Icon = getAchievementIcon(achievement.achievement_type);
              const progress = getProgressPercentage(achievement.progress, achievement.target);
              return (
                <div
                  key={achievement.id}
                  className="p-4 rounded-xl border border-gray-700 bg-gray-900/50"
                >
                  <div className="flex items-start gap-3">
                    <div className="p-2 rounded-lg bg-gray-800">
                      <Icon className="h-5 w-5 text-gray-400" />
                    </div>
                    <div className="flex-1">
                      <h5 className="font-medium text-white text-sm mb-1">
                        {achievement.achievement_name}
                      </h5>
                      <p className="text-xs text-gray-400 mb-3">
                        {achievement.achievement_description}
                      </p>
                      <div className="mb-2">
                        <div className="flex justify-between text-xs text-gray-400 mb-1">
                          <span>Progress</span>
                          <span>{achievement.progress}/{achievement.target}</span>
                        </div>
                        <div className="w-full bg-gray-700 rounded-full h-2">
                          <div
                            className="bg-blue-500 h-2 rounded-full transition-all"
                            style={{ width: `${progress}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* No Achievements */}
      {achievements.length === 0 && (
        <div className="text-center py-8">
          <Trophy className="h-12 w-12 text-gray-600 mx-auto mb-3" />
          <p className="text-gray-400 text-sm">No achievements yet</p>
          {isOwnProfile && (
            <p className="text-gray-500 text-xs mt-2">
              Start contributing to unlock achievements
            </p>
          )}
        </div>
      )}

      {isOwnProfile && achievements.length > 0 && (
        <div className="mt-6 pt-4 border-t border-gray-700">
          <p className="text-xs text-gray-500">
            💡 Tip: Complete projects, get followers, and engage with the community to unlock more achievements
          </p>
        </div>
      )}
    </Card>
  );
}
