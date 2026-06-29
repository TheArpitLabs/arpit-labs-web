"use client";

import React, { useCallback, useEffect, useState } from "react";
import { supabaseClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Heart, MessageSquare, Share2, UserPlus, UserMinus, Send, Reply, Trash2 } from "lucide-react";
import { logger } from '@/lib/logger';

interface SocialFeaturesProps {
  profileId: string;
  currentUserId?: string;
}

interface Comment {
  id: string;
  user_id: string;
  content: string;
  parent_id?: string;
  created_at: string;
  user?: {
    full_name?: string;
    avatar_url?: string;
    username?: string;
  };
  replies?: Comment[];
}

export function SocialFeatures({ profileId, currentUserId }: SocialFeaturesProps) {
  const [isFollowing, setIsFollowing] = useState(false);
  const [isLiked, setIsLiked] = useState(false);
  const [followersCount, setFollowersCount] = useState(0);
  const [likesCount, setLikesCount] = useState(0);
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState("");
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyContent, setReplyContent] = useState("");
  const [loading, setLoading] = useState(true);

  const loadSocialData = useCallback(async () => {
    setLoading(true);
    try {
      // Load follow status
      if (currentUserId) {
        const { data: followData } = await supabaseClient
          .from("profile_follows")
          .select("*")
          .eq("follower_id", currentUserId)
          .eq("following_id", profileId)
          .single();

        setIsFollowing(!!followData);
      }

      // Load like status
      if (currentUserId) {
        const { data: likeData } = await supabaseClient
          .from("profile_likes")
          .select("*")
          .eq("user_id", currentUserId)
          .eq("profile_id", profileId)
          .single();

        setIsLiked(!!likeData);
      }

      // Load counts
      const [{ count: followers }, { count: likes }] = await Promise.all([
        supabaseClient.from("profile_follows").select("*", { count: "exact", head: true }).eq("following_id", profileId),
        supabaseClient.from("profile_likes").select("*", { count: "exact", head: true }).eq("profile_id", profileId),
      ]);

      setFollowersCount(followers || 0);
      setLikesCount(likes || 0);

      // Load comments
      const { data: commentsData } = await supabaseClient
        .from("profile_comments")
        .select("*, profiles(full_name, avatar_url, username)")
        .eq("profile_id", profileId)
        .is("parent_id", null)
        .order("created_at", { ascending: false });

      if (commentsData) {
        // Load replies for each comment
        const commentsWithReplies = await Promise.all(
          commentsData.map(async (comment) => {
            const { data: replies } = await supabaseClient
              .from("profile_comments")
              .select("*, profiles(full_name, avatar_url, username)")
              .eq("parent_id", comment.id)
              .order("created_at", { ascending: true });

            return {
              ...comment,
              user: comment.profiles,
              replies: replies?.map(r => ({ ...r, user: r.profiles })) || [],
            };
          })
        );

        setComments(commentsWithReplies);
      }
    } catch (error) {
      logger.error("Error loading social data:", error);
    } finally {
      setLoading(false);
    }
  }, [currentUserId, profileId]);

  useEffect(() => {
    loadSocialData();
  }, [loadSocialData]);

  const handleFollow = async () => {
    if (!currentUserId) return;

    try {
      if (isFollowing) {
        await supabaseClient
          .from("profile_follows")
          .delete()
          .eq("follower_id", currentUserId)
          .eq("following_id", profileId);
        setIsFollowing(false);
        setFollowersCount(Math.max(0, followersCount - 1));
      } else {
        await supabaseClient
          .from("profile_follows")
          .insert({ follower_id: currentUserId, following_id: profileId });
        setIsFollowing(true);
        setFollowersCount(followersCount + 1);
      }
    } catch (error) {
      logger.error("Error toggling follow:", error);
    }
  };

  const handleLike = async () => {
    if (!currentUserId) return;

    try {
      if (isLiked) {
        await supabaseClient
          .from("profile_likes")
          .delete()
          .eq("user_id", currentUserId)
          .eq("profile_id", profileId);
        setIsLiked(false);
        setLikesCount(Math.max(0, likesCount - 1));
      } else {
        await supabaseClient
          .from("profile_likes")
          .insert({ user_id: currentUserId, profile_id: profileId });
        setIsLiked(true);
        setLikesCount(likesCount + 1);
      }
    } catch (error) {
      logger.error("Error toggling like:", error);
    }
  };

  const handleShare = async (platform: string) => {
    try {
      await supabaseClient
        .from("profile_shares")
        .insert({ profile_id: profileId, user_id: currentUserId || null, platform });

      const shareUrl = window.location.href;
      if (platform === "twitter") {
        window.open(`https://twitter.com/intent/tweet?url=${encodeURIComponent(shareUrl)}`, "_blank");
      } else if (platform === "linkedin") {
        window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}`, "_blank");
      } else if (platform === "copy_link") {
        navigator.clipboard.writeText(shareUrl);
      }
    } catch (error) {
      logger.error("Error sharing:", error);
    }
  };

  const handleAddComment = async () => {
    if (!currentUserId || !newComment.trim()) return;

    try {
      const { data } = await supabaseClient
        .from("profile_comments")
        .insert({
          profile_id: profileId,
          user_id: currentUserId,
          content: newComment.trim(),
        })
        .select("*, profiles(full_name, avatar_url, username)")
        .single();

      if (data) {
        setComments([{ ...data, user: data.profiles, replies: [] }, ...comments]);
        setNewComment("");
      }
    } catch (error) {
      logger.error("Error adding comment:", error);
    }
  };

  const handleAddReply = async (parentId: string) => {
    if (!currentUserId || !replyContent.trim()) return;

    try {
      const { data } = await supabaseClient
        .from("profile_comments")
        .insert({
          profile_id: profileId,
          user_id: currentUserId,
          content: replyContent.trim(),
          parent_id: parentId,
        })
        .select("*, profiles(full_name, avatar_url, username)")
        .single();

      if (data) {
        setComments(comments.map(comment => {
          if (comment.id === parentId) {
            return {
              ...comment,
              replies: [...(comment.replies || []), { ...data, user: data.profiles }],
            };
          }
          return comment;
        }));
        setReplyContent("");
        setReplyingTo(null);
      }
    } catch (error) {
      logger.error("Error adding reply:", error);
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    if (!currentUserId) return;

    try {
      await supabaseClient
        .from("profile_comments")
        .delete()
        .eq("id", commentId)
        .eq("user_id", currentUserId);

      setComments(comments.filter(c => c.id !== commentId));
    } catch (error) {
      logger.error("Error deleting comment:", error);
    }
  };

  if (loading) {
    return <div className="text-gray-400">Loading...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Social Actions */}
      <Card className="p-6">
        <div className="flex flex-wrap gap-4">
          {currentUserId && currentUserId !== profileId && (
            <Button
              onClick={handleFollow}
              variant={isFollowing ? "outline" : "primary"}
              size="sm"
              className="flex items-center gap-2"
            >
              {isFollowing ? <UserMinus className="h-4 w-4" /> : <UserPlus className="h-4 w-4" />}
              {isFollowing ? "Unfollow" : "Follow"}
              <Badge variant="secondary" className="ml-1">{followersCount}</Badge>
            </Button>
          )}

          <Button
            onClick={handleLike}
            variant={isLiked ? "primary" : "outline"}
            size="sm"
            className="flex items-center gap-2"
          >
            <Heart className={`h-4 w-4 ${isLiked ? "fill-current" : ""}`} />
            Like
            <Badge variant="secondary" className="ml-1">{likesCount}</Badge>
          </Button>

          <div className="flex gap-2">
            <Button
              onClick={() => handleShare("twitter")}
              variant="outline"
              size="sm"
              className="flex items-center gap-2"
            >
              <Share2 className="h-4 w-4" />
              Share
            </Button>
          </div>
        </div>
      </Card>

      {/* Comments Section */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <MessageSquare className="h-5 w-5 text-purple-400" />
          Comments ({comments.length})
        </h3>

        {currentUserId && (
          <div className="mb-6">
            <Textarea
              value={newComment}
              onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setNewComment(e.target.value)}
              placeholder="Add a comment..."
              rows={3}
              className="bg-purple-950/50 border-purple-500/30 text-white placeholder-gray-500 mb-3"
            />
            <Button onClick={handleAddComment} size="sm" disabled={!newComment.trim()}>
              <Send className="h-4 w-4 mr-2" />
              Post Comment
            </Button>
          </div>
        )}

        <div className="space-y-4">
          {comments.length === 0 ? (
            <p className="text-gray-400 text-center py-8">No comments yet. Be the first to comment!</p>
          ) : (
            comments.map((comment) => (
              <div key={comment.id} className="p-4 bg-purple-900/30 rounded-lg">
                <div className="flex items-start gap-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="font-medium text-white">
                        {comment.user?.full_name || comment.user?.username || "Anonymous"}
                      </span>
                      <span className="text-xs text-gray-500">
                        {new Date(comment.created_at).toLocaleDateString()}
                      </span>
                    </div>
                    <p className="text-gray-300 mb-3">{comment.content}</p>
                    
                    {currentUserId && (
                      <div className="flex gap-2">
                        <Button
                          onClick={() => setReplyingTo(replyingTo === comment.id ? null : comment.id)}
                          variant="ghost"
                          size="sm"
                          className="text-gray-400 hover:text-white"
                        >
                          <Reply className="h-4 w-4 mr-1" />
                          Reply
                        </Button>
                        {comment.user_id === currentUserId && (
                          <Button
                            onClick={() => handleDeleteComment(comment.id)}
                            variant="ghost"
                            size="sm"
                            className="text-red-400 hover:text-red-300"
                          >
                            <Trash2 className="h-4 w-4 mr-1" />
                            Delete
                          </Button>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {replyingTo === comment.id && (
                  <div className="mt-4 ml-8">
                    <Textarea
                      value={replyContent}
                      onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setReplyContent(e.target.value)}
                      placeholder="Write a reply..."
                      rows={2}
                      className="bg-purple-950/50 border-purple-500/30 text-white placeholder-gray-500 mb-2"
                    />
                    <div className="flex gap-2">
                      <Button
                        onClick={() => handleAddReply(comment.id)}
                        size="sm"
                        disabled={!replyContent.trim()}
                      >
                        <Send className="h-4 w-4 mr-2" />
                        Reply
                      </Button>
                      <Button
                        onClick={() => setReplyingTo(null)}
                        size="sm"
                        variant="outline"
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                )}

                {comment.replies && comment.replies.length > 0 && (
                  <div className="mt-4 ml-8 space-y-3">
                    {comment.replies.map((reply) => (
                      <div key={reply.id} className="p-3 bg-purple-800/30 rounded-lg">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="font-medium text-white text-sm">
                            {reply.user?.full_name || reply.user?.username || "Anonymous"}
                          </span>
                          <span className="text-xs text-gray-500">
                            {new Date(reply.created_at).toLocaleDateString()}
                          </span>
                        </div>
                        <p className="text-gray-300 text-sm">{reply.content}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </Card>
    </div>
  );
}
