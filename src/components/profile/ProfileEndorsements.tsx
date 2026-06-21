"use client";

import React, { useCallback, useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Star, ThumbsUp, MessageSquare, Loader2, AlertCircle, Send, X } from "lucide-react";
import { supabaseClient } from "@/lib/supabase/client";

interface ProfileEndorsementsProps {
  profile: any;
  currentUserId?: string;
}

interface Endorsement {
  id: string;
  profile_id: string;
  endorser_id: string;
  skill: string;
  endorsement_text: string;
  rating: number;
  created_at: string;
  endorser: {
    full_name: string;
    avatar_url: string;
  };
}

export function ProfileEndorsements({ profile, currentUserId }: ProfileEndorsementsProps) {
  const [endorsements, setEndorsements] = useState<Endorsement[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [newEndorsement, setNewEndorsement] = useState({
    skill: "",
    endorsement_text: "",
    rating: 5,
  });

  const fetchEndorsements = useCallback(async () => {
    if (!profile?.id) return;

    setLoading(true);
    try {
      const { data, error } = await supabaseClient
        .from("profile_endorsements")
        .select(`
          *,
          endorser:profiles!profile_endorsements_endorser_id_fkey (
            full_name,
            avatar_url
          )
        `)
        .eq("profile_id", profile.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setEndorsements(data || []);
    } catch (err) {
      console.error("Error fetching endorsements:", err);
      setError("Failed to load endorsements");
    } finally {
      setLoading(false);
    }
  }, [profile?.id]);

  useEffect(() => {
    fetchEndorsements();
  }, [fetchEndorsements]);

  const handleSubmitEndorsement = async () => {
    if (!currentUserId || !profile?.id) return;

    setSubmitting(true);
    setError(null);

    try {
      const { data, error } = await supabaseClient
        .from("profile_endorsements")
        .insert({
          profile_id: profile.id,
          endorser_id: currentUserId,
          skill: newEndorsement.skill,
          endorsement_text: newEndorsement.endorsement_text,
          rating: newEndorsement.rating,
        })
        .select(`
          *,
          endorser:profiles!profile_endorsements_endorser_id_fkey (
            full_name,
            avatar_url
          )
        `)
        .single();

      if (error) throw error;

      setEndorsements([data, ...endorsements]);
      setNewEndorsement({ skill: "", endorsement_text: "", rating: 5 });
      setShowForm(false);
    } catch (err) {
      console.error("Error submitting endorsement:", err);
      setError("Failed to submit endorsement");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteEndorsement = async (endorsementId: string) => {
    if (!currentUserId) return;

    try {
      const { error } = await supabaseClient
        .from("profile_endorsements")
        .delete()
        .eq("id", endorsementId)
        .eq("endorser_id", currentUserId);

      if (error) throw error;

      setEndorsements(endorsements.filter(e => e.id !== endorsementId));
    } catch (err) {
      console.error("Error deleting endorsement:", err);
      setError("Failed to delete endorsement");
    }
  };

  const getSkillCount = (skill: string) => {
    return endorsements.filter(e => e.skill.toLowerCase() === skill.toLowerCase()).length;
  };

  const uniqueSkills = Array.from(new Set(endorsements.map(e => e.skill)));

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
        <h3 className="text-lg font-semibold text-white mb-2">Skills & Endorsements</h3>
        <p className="text-sm text-gray-400">
          Skills endorsed by the community
        </p>
      </div>

      {/* Skills Summary */}
      {uniqueSkills.length > 0 && (
        <div className="mb-6">
          <h4 className="text-sm font-medium text-gray-300 mb-3">Top Skills</h4>
          <div className="flex flex-wrap gap-2">
            {uniqueSkills.map(skill => {
              const count = getSkillCount(skill);
              const avgRating = endorsements
                .filter(e => e.skill.toLowerCase() === skill.toLowerCase())
                .reduce((sum, e) => sum + e.rating, 0) / count;
              
              return (
                <div
                  key={skill}
                  className="px-3 py-2 rounded-lg bg-purple-950/30 border border-purple-500/30"
                >
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-white">{skill}</span>
                    <div className="flex items-center gap-1">
                      <Star className="h-3 w-3 text-yellow-400 fill-yellow-400" />
                      <span className="text-xs text-gray-400">{avgRating.toFixed(1)}</span>
                    </div>
                    <span className="text-xs text-gray-500">({count})</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Endorsements List */}
      {endorsements.length > 0 ? (
        <div className="space-y-4 mb-6">
          {endorsements.map((endorsement) => (
            <div
              key={endorsement.id}
              className="p-4 rounded-xl border border-gray-700 bg-gray-900/50"
            >
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-full bg-purple-950 flex items-center justify-center overflow-hidden">
                  {endorsement.endorser?.avatar_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={endorsement.endorser.avatar_url}
                      alt={endorsement.endorser.full_name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span className="text-purple-400 font-medium">
                      {endorsement.endorser?.full_name?.[0] || "?"}
                    </span>
                  )}
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-1">
                    <h5 className="font-medium text-white text-sm">
                      {endorsement.endorser?.full_name || "Anonymous"}
                    </h5>
                    <div className="flex items-center gap-2">
                      <div className="flex items-center gap-1">
                        {[...Array(endorsement.rating)].map((_, i) => (
                          <Star
                            key={i}
                            className="h-3 w-3 text-yellow-400 fill-yellow-400"
                          />
                        ))}
                      </div>
                      {currentUserId === endorsement.endorser_id && (
                        <button
                          onClick={() => handleDeleteEndorsement(endorsement.id)}
                          className="text-gray-500 hover:text-red-400 transition"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  </div>
                  <div className="mb-2">
                    <span className="text-xs px-2 py-1 rounded bg-purple-500/20 text-purple-400">
                      {endorsement.skill}
                    </span>
                  </div>
                  {endorsement.endorsement_text && (
                    <p className="text-xs text-gray-400">
                      {endorsement.endorsement_text}
                    </p>
                  )}
                  <div className="mt-2 text-xs text-gray-500">
                    {new Date(endorsement.created_at).toLocaleDateString()}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-8 mb-6">
          <ThumbsUp className="h-12 w-12 text-gray-600 mx-auto mb-3" />
          <p className="text-gray-400 text-sm">No endorsements yet</p>
          <p className="text-gray-500 text-xs mt-2">
            Be the first to endorse this profile
          </p>
        </div>
      )}

      {/* Add Endorsement Button */}
      {currentUserId && currentUserId !== profile.id && (
        <div>
          {!showForm ? (
            <Button
              onClick={() => setShowForm(true)}
              className="w-full"
              variant="outline"
            >
              <ThumbsUp className="h-4 w-4 mr-2" />
              Add Endorsement
            </Button>
          ) : (
            <div className="p-4 rounded-xl border border-purple-500/30 bg-purple-950/30">
              <h4 className="text-sm font-medium text-white mb-3">Add Your Endorsement</h4>
              
              <div className="space-y-3">
                <div>
                  <label className="block text-xs text-gray-400 mb-1">Skill</label>
                  <input
                    type="text"
                    value={newEndorsement.skill}
                    onChange={(e) => setNewEndorsement({ ...newEndorsement, skill: e.target.value })}
                    placeholder="e.g., React, Python, Leadership"
                    className="w-full px-3 py-2 rounded-lg bg-gray-900 border border-gray-700 text-white text-sm focus:outline-none focus:border-purple-500"
                  />
                </div>

                <div>
                  <label className="block text-xs text-gray-400 mb-1">Rating</label>
                  <div className="flex items-center gap-2">
                    {[1, 2, 3, 4, 5].map((rating) => (
                      <button
                        key={rating}
                        onClick={() => setNewEndorsement({ ...newEndorsement, rating })}
                        className="transition"
                      >
                        <Star
                          className={`h-5 w-5 ${
                            rating <= newEndorsement.rating
                              ? "text-yellow-400 fill-yellow-400"
                              : "text-gray-600"
                          }`}
                        />
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-xs text-gray-400 mb-1">Comment (optional)</label>
                  <textarea
                    value={newEndorsement.endorsement_text}
                    onChange={(e) => setNewEndorsement({ ...newEndorsement, endorsement_text: e.target.value })}
                    placeholder="Share your experience working with this person..."
                    rows={3}
                    className="w-full px-3 py-2 rounded-lg bg-gray-900 border border-gray-700 text-white text-sm focus:outline-none focus:border-purple-500 resize-none"
                  />
                </div>

                <div className="flex gap-2">
                  <Button
                    onClick={handleSubmitEndorsement}
                    disabled={submitting || !newEndorsement.skill}
                    className="flex-1"
                    variant="primary"
                  >
                    {submitting ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Submitting...
                      </>
                    ) : (
                      <>
                        <Send className="h-4 w-4 mr-2" />
                        Submit
                      </>
                    )}
                  </Button>
                  <Button
                    onClick={() => setShowForm(false)}
                    variant="outline"
                    disabled={submitting}
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </Card>
  );
}
