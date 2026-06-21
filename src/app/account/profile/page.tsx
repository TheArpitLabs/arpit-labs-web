"use client";

import React, { useEffect, useState } from "react";
import { supabaseClient } from "@/lib/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { ProfileCustomization } from "@/components/profile/ProfileCustomization";
import { ProfileVisibilitySettings } from "@/components/profile/ProfileVisibilitySettings";
import { ProfileBadges } from "@/components/profile/ProfileBadges";
import { ProfileAchievements } from "@/components/profile/ProfileAchievements";
import { ProfileEndorsements } from "@/components/profile/ProfileEndorsements";
import { VerificationRequest } from "@/components/profile/VerificationRequest";
import { User, Settings, Shield, Award, Trophy, MessageSquare, ArrowLeft } from "lucide-react";
import Link from "next/link";

export default function ProfileSettingsPage() {
  const [profile, setProfile] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"basic" | "visibility" | "badges" | "achievements" | "endorsements" | "verification">("basic");

  useEffect(() => {
    loadProfile();
  }, []);

  async function loadProfile() {
    setLoading(true);
    try {
      const { data: { user } } = await supabaseClient.auth.getUser();
      if (!user) return;

      const { data: p, error } = await supabaseClient
        .from("profiles")
        .select("*, role")
        .eq("id", user.id)
        .single();

      if (error) throw error;
      setProfile(p);
    } catch (error) {
      console.error("Error loading profile:", error);
    } finally {
      setLoading(false);
    }
  }

  const handleProfileUpdate = (updatedProfile: any) => {
    setProfile(updatedProfile);
  };

  if (loading) {
    return (
      <main className="min-h-screen bg-background">
        <Navbar />
        <div className="mx-auto max-w-5xl px-4 py-12">
          <div className="mb-8">
            <Skeleton variant="text" className="w-1/3 h-8 mb-4" />
            <Skeleton variant="text" className="w-1/2 h-4" />
          </div>
          <div className="space-y-6">
            <Skeleton variant="card" className="h-64" />
            <Skeleton variant="card" className="h-64" />
          </div>
        </div>
      </main>
    );
  }

  if (!profile) {
    return (
      <main className="min-h-screen bg-background">
        <Navbar />
        <div className="mx-auto max-w-5xl px-4 py-12">
          <div className="text-center">
            <h1 className="text-2xl font-heading font-bold text-foreground mb-4">Profile not found</h1>
            <Link href="/">
              <Button variant="outline">Go Home</Button>
            </Link>
          </div>
        </div>
      </main>
    );
  }

  const tabs = [
    { id: "basic", label: "Basic Info", icon: User },
    { id: "visibility", label: "Visibility", icon: Settings },
    { id: "badges", label: "Badges", icon: Award },
    { id: "achievements", label: "Achievements", icon: Trophy },
    { id: "endorsements", label: "Endorsements", icon: MessageSquare },
    { id: "verification", label: "Verification", icon: Shield },
  ] as const;

  return (
    <main className="min-h-screen bg-background">
      <Navbar />
      <div className="mx-auto max-w-5xl px-4 py-12">
        {/* Header */}
        <div className="mb-8">
          <Link href="/" className="inline-flex items-center gap-2 text-muted hover:text-foreground mb-4 transition">
            <ArrowLeft className="h-4 w-4" />
            Back to Home
          </Link>
          <h1 className="text-3xl font-heading font-bold text-foreground mb-2">Profile Settings</h1>
          <p className="text-muted">Manage your profile information, visibility, badges, and verification status.</p>
        </div>

        {/* Role and Admin Status Display */}
        <Card className="p-6 mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-heading font-semibold text-foreground mb-1">Role & Status</h3>
              <p className="text-sm text-muted">Your account role and verification status</p>
            </div>
            <div className="text-right">
              <div className="flex items-center gap-2 justify-end">
                <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                  profile.role === 'admin' ? 'bg-primary/20 text-primary' :
                  profile.role === 'moderator' ? 'bg-accent/20 text-accent' :
                  profile.role === 'creator' ? 'bg-success/20 text-success' :
                  'bg-surface text-muted'
                }`}>
                  {profile.role?.toUpperCase() || 'USER'}
                </span>
                {profile.role === 'admin' && (
                  <span className="px-3 py-1 rounded-full text-xs font-bold bg-primary text-white">
                    ADMIN
                  </span>
                )}
              </div>
              <div className="text-sm text-muted mt-2">
                {profile.verified ? '✓ Verified' : 'Unverified'}
              </div>
            </div>
          </div>
        </Card>

        {/* Engineering Score Display */}
        <Card className="p-6 mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-heading font-semibold text-foreground mb-1">Engineering Score</h3>
              <p className="text-sm text-muted">Your overall engineering contribution score</p>
            </div>
            <div className="text-right">
              <div className="text-4xl font-heading font-bold text-primary">{profile.engineering_score || 0}</div>
              <div className="text-sm text-muted">Total Points</div>
            </div>
          </div>
        </Card>

        {/* Tabs */}
        <div className="mb-6 border-b border-border">
          <div className="flex gap-4 overflow-x-auto">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-4 py-3 border-b-2 transition ${
                    activeTab === tab.id
                      ? "border-primary text-primary"
                      : "border-transparent text-muted hover:text-foreground"
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Tab Content */}
        <div className="space-y-6">
          {activeTab === "basic" && (
            <ProfileCustomization profile={profile} onProfileUpdate={handleProfileUpdate} />
          )}

          {activeTab === "visibility" && (
            <ProfileVisibilitySettings profile={profile} onProfileUpdate={handleProfileUpdate} />
          )}

          {activeTab === "badges" && (
            <ProfileBadges profile={profile} isOwnProfile={true} />
          )}

          {activeTab === "achievements" && (
            <ProfileAchievements profile={profile} isOwnProfile={true} />
          )}

          {activeTab === "endorsements" && (
            <ProfileEndorsements profile={profile} currentUserId={profile.id} />
          )}

          {activeTab === "verification" && (
            <VerificationRequest profile={profile} onRequestSubmitted={loadProfile} />
          )}
        </div>
      </div>
      <Footer />
    </main>
  );
}
