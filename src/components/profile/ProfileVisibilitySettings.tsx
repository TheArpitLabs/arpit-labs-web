"use client";

import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Eye, EyeOff, Globe, Lock, User, Check, Loader2, AlertCircle } from "lucide-react";
import { supabaseClient } from "@/lib/supabase/client";

interface ProfileVisibilitySettingsProps {
  profile: any;
  onProfileUpdate: (updatedProfile: any) => void;
}

export function ProfileVisibilitySettings({ profile, onProfileUpdate }: ProfileVisibilitySettingsProps) {
  const [visibility, setVisibility] = useState<"private" | "public">(profile?.profile_visibility || "private");
  const [username, setUsername] = useState(profile?.username || "");
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [usernameAvailable, setUsernameAvailable] = useState<boolean | null>(null);
  const [checkingUsername, setCheckingUsername] = useState(false);

  useEffect(() => {
    setVisibility(profile?.profile_visibility || "private");
    setUsername(profile?.username || "");
  }, [profile]);

  const checkUsernameAvailability = async (usernameToCheck: string) => {
    if (!usernameToCheck || usernameToCheck.length < 3) {
      setUsernameAvailable(null);
      return;
    }

    setCheckingUsername(true);
    try {
      const { data, error } = await supabaseClient
        .from("profiles")
        .select("username")
        .eq("username", usernameToCheck)
        .neq("id", profile?.id)
        .single();

      if (error && error.code !== "PGRST116") {
        console.error("Error checking username:", error);
        setUsernameAvailable(null);
        return;
      }

      setUsernameAvailable(!data);
    } catch (err) {
      console.error("Error checking username:", err);
      setUsernameAvailable(null);
    } finally {
      setCheckingUsername(false);
    }
  };

  const handleUsernameChange = (value: string) => {
    setUsername(value);
    setError(null);
    setSaveSuccess(false);
    
    if (value.length >= 3) {
      const debounceTimer = setTimeout(() => {
        checkUsernameAvailability(value);
      }, 500);
      return () => clearTimeout(debounceTimer);
    } else {
      setUsernameAvailable(null);
    }
  };

  const handleVisibilityChange = (newVisibility: "private" | "public") => {
    setVisibility(newVisibility);
    setError(null);
    setSaveSuccess(false);

    if (newVisibility === "public" && !username) {
      setError("Username is required for public profiles");
    }
  };

  const handleSave = async () => {
    if (visibility === "public" && !username) {
      setError("Username is required for public profiles");
      return;
    }

    if (username && username.length < 3) {
      setError("Username must be at least 3 characters");
      return;
    }

    if (username && !/^[a-zA-Z0-9_-]+$/.test(username)) {
      setError("Username can only contain letters, numbers, underscores, and hyphens");
      return;
    }

    if (visibility === "public" && usernameAvailable === false) {
      setError("Username is already taken");
      return;
    }

    setIsSaving(true);
    setError(null);

    try {
      const updates: any = {
        profile_visibility: visibility,
      };

      if (visibility === "public") {
        updates.username = username;
      } else {
        updates.username = null;
      }

      const { data, error } = await supabaseClient
        .from("profiles")
        .update(updates)
        .eq("id", profile?.id)
        .select()
        .single();

      if (error) throw error;

      setSaveSuccess(true);
      onProfileUpdate(data);

      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err) {
      console.error("Error updating profile visibility:", err);
      setError("Failed to update profile settings");
    } finally {
      setIsSaving(false);
    }
  };

  const generateUsername = () => {
    const baseName = profile?.full_name?.toLowerCase().replace(/\s+/g, "") || profile?.email?.split("@")[0] || "user";
    const randomSuffix = Math.random().toString(36).substring(2, 6);
    const generatedUsername = `${baseName}${randomSuffix}`;
    handleUsernameChange(generatedUsername);
  };

  return (
    <Card className="p-6">
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-white mb-2">Profile Visibility</h3>
        <p className="text-sm text-gray-400">
          Control who can view your profile and engineering score.
        </p>
      </div>

      {/* Visibility Toggle */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-300 mb-3">
          Profile Visibility
        </label>
        <div className="grid grid-cols-2 gap-4">
          <button
            onClick={() => handleVisibilityChange("private")}
            className={`p-4 rounded-xl border-2 transition-all ${
              visibility === "private"
                ? "border-purple-500 bg-purple-950/50"
                : "border-gray-700 bg-gray-900/50 hover:border-gray-600"
            }`}
          >
            <div className="flex items-center gap-3 mb-2">
              <Lock className={`h-5 w-5 ${visibility === "private" ? "text-purple-400" : "text-gray-400"}`} />
              <span className={`font-medium ${visibility === "private" ? "text-white" : "text-gray-400"}`}>
                Private
              </span>
            </div>
            <p className="text-xs text-gray-400">
              Only you can view your profile
            </p>
          </button>

          <button
            onClick={() => handleVisibilityChange("public")}
            className={`p-4 rounded-xl border-2 transition-all ${
              visibility === "public"
                ? "border-purple-500 bg-purple-950/50"
                : "border-gray-700 bg-gray-900/50 hover:border-gray-600"
            }`}
          >
            <div className="flex items-center gap-3 mb-2">
              <Globe className={`h-5 w-5 ${visibility === "public" ? "text-purple-400" : "text-gray-400"}`} />
              <span className={`font-medium ${visibility === "public" ? "text-white" : "text-gray-400"}`}>
                Public
              </span>
            </div>
            <p className="text-xs text-gray-400">
              Anyone can view your profile
            </p>
          </button>
        </div>
      </div>

      {/* Username Settings (only shown for public) */}
      {visibility === "public" && (
        <div className="mb-6 p-4 rounded-xl border border-purple-500/30 bg-purple-950/30">
          <div className="flex items-center gap-2 mb-3">
            <User className="h-4 w-4 text-purple-400" />
            <label className="text-sm font-medium text-gray-300">
              Public Profile Username
            </label>
          </div>
          
          <div className="flex gap-2">
            <div className="flex-1 relative">
              <input
                type="text"
                value={username}
                onChange={(e) => handleUsernameChange(e.target.value)}
                placeholder="Choose a username"
                className="w-full px-4 py-2 rounded-lg bg-gray-900 border border-gray-700 text-white placeholder-gray-500 focus:outline-none focus:border-purple-500 transition"
              />
              {checkingUsername && (
                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                  <Loader2 className="h-4 w-4 text-gray-400 animate-spin" />
                </div>
              )}
              {usernameAvailable === true && username && (
                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                  <Check className="h-4 w-4 text-green-400" />
                </div>
              )}
              {usernameAvailable === false && username && (
                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                  <AlertCircle className="h-4 w-4 text-red-400" />
                </div>
              )}
            </div>
            <Button
              onClick={generateUsername}
              variant="outline"
              size="sm"
              type="button"
            >
              Generate
            </Button>
          </div>

          {username && (
            <div className="mt-2 text-xs text-gray-400">
              Your public profile will be available at:{" "}
              <span className="text-purple-400 font-mono">
                /profile/{username}
              </span>
            </div>
          )}

          {usernameAvailable === false && (
            <p className="mt-2 text-xs text-red-400">
              This username is already taken
            </p>
          )}
          
          {usernameAvailable === true && username && (
            <p className="mt-2 text-xs text-green-400">
              Username is available
            </p>
          )}
        </div>
      )}

      {/* Privacy Notice */}
      <div className="mb-6 p-4 rounded-xl border border-gray-700 bg-gray-900/30">
        <div className="flex items-start gap-3">
          <AlertCircle className="h-5 w-5 text-yellow-400 mt-0.5" />
          <div className="flex-1">
            <p className="text-sm text-gray-300 mb-2">
              <strong>Privacy Notice:</strong>
            </p>
            <ul className="text-xs text-gray-400 space-y-1">
              <li>• Public profiles display your engineering score, projects, badges, and achievements</li>
              <li>• Your email address is never shown on public profiles</li>
              <li>• You can change your visibility settings at any time</li>
              <li>• Draft projects are never shown on public profiles</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="mb-4 p-3 rounded-lg bg-red-950/30 border border-red-500/30">
          <p className="text-sm text-red-400">{error}</p>
        </div>
      )}

      {/* Success Message */}
      {saveSuccess && (
        <div className="mb-4 p-3 rounded-lg bg-green-950/30 border border-green-500/30">
          <p className="text-sm text-green-400">Settings saved successfully!</p>
        </div>
      )}

      {/* Save Button */}
      <Button
        onClick={handleSave}
        disabled={isSaving || (visibility === "public" && (!username || usernameAvailable === false))}
        className="w-full"
        variant="primary"
      >
        {isSaving ? (
          <>
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            Saving...
          </>
        ) : (
          "Save Settings"
        )}
      </Button>
    </Card>
  );
}
