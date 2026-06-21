"use client";

import React, { useCallback, useEffect, useState } from "react";
import { supabaseClient } from "@/lib/supabase/client";
import { Card } from "@/components/ui/card";
import { Eye, Users, Heart, MessageSquare, Share2, TrendingUp, Calendar } from "lucide-react";

interface ProfileAnalyticsProps {
  profileId: string;
  isOwner?: boolean;
}

interface AnalyticsData {
  view_count: number;
  follower_count: number;
  following_count: number;
  like_count: number;
  comment_count: number;
  share_count: number;
  last_viewed_at?: string;
  updated_at: string;
}

export function ProfileAnalytics({ profileId, isOwner = false }: ProfileAnalyticsProps) {
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);

  const loadAnalytics = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await supabaseClient
        .from("profile_analytics")
        .select("*")
        .eq("profile_id", profileId)
        .single();

      setAnalytics(data);
    } catch (error) {
      console.error("Error loading analytics:", error);
    } finally {
      setLoading(false);
    }
  }, [profileId]);

  const trackView = useCallback(async () => {
    try {
      await supabaseClient.rpc("increment_profile_view", { profile_id: profileId });
    } catch (error) {
      console.error("Error tracking view:", error);
    }
  }, [profileId]);

  useEffect(() => {
    loadAnalytics();
  }, [loadAnalytics]);

  // Track profile view (only for public profiles and not owner)
  useEffect(() => {
    if (!isOwner && analytics) {
      trackView();
    }
  }, [analytics, isOwner, trackView]);

  if (loading) {
    return (
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-24 bg-purple-900/30 rounded-lg animate-pulse" />
        ))}
      </div>
    );
  }

  if (!analytics) {
    return null;
  }

  const engagementRate = analytics.view_count > 0
    ? ((analytics.like_count + analytics.comment_count + analytics.share_count) / analytics.view_count * 100).toFixed(1)
    : "0.0";

  return (
    <div className="space-y-6">
      {/* Analytics Overview */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <TrendingUp className="h-5 w-5 text-purple-400" />
          Profile Analytics
        </h3>
        
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="p-6 bg-purple-950/50 rounded-lg border border-purple-500/30">
            <div className="flex items-center gap-3 mb-2">
              <Eye className="h-5 w-5 text-purple-400" />
              <span className="text-sm text-gray-400">Total views</span>
            </div>
            <div className="text-2xl font-bold text-white">{analytics.view_count.toLocaleString()}</div>
            <p className="mt-2 text-sm text-gray-400">Profile Views</p>
          </div>
          <div className="p-6 bg-purple-950/50 rounded-lg border border-purple-500/30">
            <div className="flex items-center gap-3 mb-2">
              <Users className="h-5 w-5 text-blue-400" />
              <span className="text-sm text-gray-400">People following</span>
            </div>
            <div className="text-2xl font-bold text-white">{analytics.follower_count.toLocaleString()}</div>
            <p className="mt-2 text-sm text-gray-400">Followers</p>
          </div>
          <div className="p-6 bg-purple-950/50 rounded-lg border border-purple-500/30">
            <div className="flex items-center gap-3 mb-2">
              <Users className="h-5 w-5 text-green-400" />
              <span className="text-sm text-gray-400">People you follow</span>
            </div>
            <div className="text-2xl font-bold text-white">{analytics.following_count.toLocaleString()}</div>
            <p className="mt-2 text-sm text-gray-400">Following</p>
          </div>
          <div className="p-6 bg-purple-950/50 rounded-lg border border-purple-500/30">
            <div className="flex items-center gap-3 mb-2">
              <TrendingUp className="h-5 w-5 text-yellow-400" />
              <span className="text-sm text-gray-400">Engagement rate</span>
            </div>
            <div className="text-2xl font-bold text-white">{engagementRate}%</div>
            <p className="mt-2 text-sm text-gray-400">Likes + Comments + Shares / Views</p>
          </div>
        </div>
      </Card>

      {/* Engagement Details */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold text-white mb-4">Engagement Breakdown</h3>
        <div className="grid gap-4 sm:grid-cols-3">
          <div className="p-4 bg-purple-900/30 rounded-lg">
            <div className="flex items-center gap-3 mb-2">
              <Heart className="h-5 w-5 text-red-400" />
              <span className="text-sm text-gray-400">Likes</span>
            </div>
            <div className="text-2xl font-bold text-white">{analytics.like_count.toLocaleString()}</div>
          </div>
          <div className="p-4 bg-purple-900/30 rounded-lg">
            <div className="flex items-center gap-3 mb-2">
              <MessageSquare className="h-5 w-5 text-blue-400" />
              <span className="text-sm text-gray-400">Comments</span>
            </div>
            <div className="text-2xl font-bold text-white">{analytics.comment_count.toLocaleString()}</div>
          </div>
          <div className="p-4 bg-purple-900/30 rounded-lg">
            <div className="flex items-center gap-3 mb-2">
              <Share2 className="h-5 w-5 text-green-400" />
              <span className="text-sm text-gray-400">Shares</span>
            </div>
            <div className="text-2xl font-bold text-white">{analytics.share_count.toLocaleString()}</div>
          </div>
        </div>
      </Card>

      {/* Last Updated */}
      {isOwner && analytics.last_viewed_at && (
        <Card className="p-6">
          <div className="flex items-center gap-2 text-sm text-gray-400">
            <Calendar className="h-4 w-4" />
            <span>Last viewed: {new Date(analytics.last_viewed_at).toLocaleString()}</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-gray-400 mt-1">
            <Calendar className="h-4 w-4" />
            <span>Analytics updated: {new Date(analytics.updated_at).toLocaleString()}</span>
          </div>
        </Card>
      )}
    </div>
  );
}
