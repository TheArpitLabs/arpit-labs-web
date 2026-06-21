"use client";

import React, { useCallback, useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CheckCircle, Award, Shield, Star, Zap, Trophy, Crown, Flame, Sparkles, Loader2, AlertCircle } from "lucide-react";
import { supabaseClient } from "@/lib/supabase/client";

interface ProfileBadgesProps {
  profile: any;
  isOwnProfile?: boolean;
}

interface Badge {
  id: string;
  badge_type: string;
  badge_name: string;
  badge_description: string;
  badge_icon: string;
  badge_color: string;
  earned_at: string;
  expires_at: string | null;
  is_active: boolean;
}

export function ProfileBadges({ profile, isOwnProfile = false }: ProfileBadgesProps) {
  const [badges, setBadges] = useState<Badge[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchBadges = useCallback(async () => {
    if (!profile?.id) return;

    setLoading(true);
    try {
      const { data, error } = await supabaseClient
        .from("profile_badges")
        .select("*")
        .eq("profile_id", profile.id)
        .eq("is_active", true)
        .order("earned_at", { ascending: false });

      if (error) throw error;
      setBadges(data || []);
    } catch (err) {
      console.error("Error fetching badges:", err);
      setError("Failed to load badges");
    } finally {
      setLoading(false);
    }
  }, [profile?.id]);

  useEffect(() => {
    fetchBadges();
  }, [fetchBadges]);

  const getBadgeIcon = (badgeType: string) => {
    const iconMap: Record<string, any> = {
      verified: CheckCircle,
      contributor: Award,
      expert: Star,
      mentor: Shield,
      top_contributor: Trophy,
      early_adopter: Sparkles,
      community_leader: Crown,
      active_member: Flame,
      verified_developer: Zap,
    };
    return iconMap[badgeType] || Award;
  };

  const getBadgeColor = (badgeColor: string) => {
    return badgeColor || "#8B5CF6";
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

  return (
    <Card className="p-6">
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-white mb-2">Profile Badges</h3>
        <p className="text-sm text-gray-400">
          Achievements and verification badges earned by this profile
        </p>
      </div>

      {badges.length === 0 ? (
        <div className="text-center py-8">
          <Award className="h-12 w-12 text-gray-600 mx-auto mb-3" />
          <p className="text-gray-400 text-sm">No badges earned yet</p>
          {isOwnProfile && (
            <p className="text-gray-500 text-xs mt-2">
              Complete achievements to earn badges
            </p>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {badges.map((badge) => {
            const Icon = getBadgeIcon(badge.badge_type);
            const badgeColor = getBadgeColor(badge.badge_color);
            
            return (
              <div
                key={badge.id}
                className="p-4 rounded-xl border border-gray-700 bg-gray-900/50 hover:border-purple-500/50 transition-all"
              >
                <div className="flex items-start gap-3">
                  <div
                    className="p-2 rounded-lg"
                    style={{ backgroundColor: `${badgeColor}20` }}
                  >
                    <Icon
                      className="h-5 w-5"
                      style={{ color: badgeColor }}
                    />
                  </div>
                  <div className="flex-1">
                    <h4 className="font-medium text-white text-sm mb-1">
                      {badge.badge_name}
                    </h4>
                    <p className="text-xs text-gray-400 mb-2">
                      {badge.badge_description}
                    </p>
                    <div className="flex items-center gap-2">
                      <div
                        className="text-xs px-2 py-1 rounded border"
                        style={{
                          borderColor: badgeColor,
                          color: badgeColor,
                        }}
                      >
                        {badge.badge_type}
                      </div>
                      <span className="text-xs text-gray-500">
                        {new Date(badge.earned_at).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {isOwnProfile && badges.length > 0 && (
        <div className="mt-6 pt-4 border-t border-gray-700">
          <p className="text-xs text-gray-500">
            💡 Tip: Keep contributing to earn more badges and increase your engineering score
          </p>
        </div>
      )}
    </Card>
  );
}
