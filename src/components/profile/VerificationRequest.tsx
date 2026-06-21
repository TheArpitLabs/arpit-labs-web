"use client";

import React, { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, Mail, Link2, FileText, Loader2, AlertCircle, Send, Clock, XCircle } from "lucide-react";
import { supabaseClient } from "@/lib/supabase/client";

interface VerificationRequestProps {
  profile: any;
  onRequestSubmitted?: () => void;
}

export function VerificationRequest({ profile, onRequestSubmitted }: VerificationRequestProps) {
  const [verificationType, setVerificationType] = useState<"email" | "social" | "identity">("email");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [existingRequests, setExistingRequests] = useState<any[]>([]);

  const verificationTypes = [
    {
      id: "email" as const,
      name: "Email Verification",
      description: "Verify your email address to confirm your identity",
      icon: Mail,
      color: "text-blue-400",
    },
    {
      id: "social" as const,
      name: "Social Verification",
      description: "Link and verify your social media accounts",
      icon: Link2,
      color: "text-purple-400",
    },
    {
      id: "identity" as const,
      name: "Identity Verification",
      description: "Submit government ID for professional verification",
      icon: FileText,
      color: "text-green-400",
    },
  ];

  const handleSubmitRequest = async () => {
    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      const verificationData: any = {};

      if (verificationType === "email") {
        verificationData.email = profile.email;
      } else if (verificationType === "social") {
        verificationData.github_url = profile.github_url;
        verificationData.linkedin_url = profile.linkedin_url;
        verificationData.twitter_url = profile.twitter_url;
      } else if (verificationType === "identity") {
        verificationData.document_type = "government_id";
        verificationData.status = "pending_submission";
      }

      const { data, error } = await supabaseClient
        .from("verification_requests")
        .insert({
          profile_id: profile.id,
          verification_type: verificationType,
          verification_data: verificationData,
          status: "pending",
        })
        .select()
        .single();

      if (error) throw error;

      setSuccess(true);
      if (onRequestSubmitted) onRequestSubmitted();
    } catch (err) {
      console.error("Error submitting verification request:", err);
      setError("Failed to submit verification request");
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, { color: string; icon: any; label: string }> = {
      pending: { color: "bg-yellow-500/20 text-yellow-400", icon: Clock, label: "Pending" },
      approved: { color: "bg-green-500/20 text-green-400", icon: CheckCircle, label: "Approved" },
      rejected: { color: "bg-red-500/20 text-red-400", icon: XCircle, label: "Rejected" },
    };

    const config = statusConfig[status] || statusConfig.pending;
    const Icon = config.icon;

    return (
      <Badge className={config.color}>
        <Icon className="h-3 w-3 mr-1" />
        {config.label}
      </Badge>
    );
  };

  return (
    <Card className="p-6">
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-white mb-2">Profile Verification</h3>
        <p className="text-sm text-gray-400">
          Get verified to build trust and unlock premium features
        </p>
      </div>

      {/* Current Verification Status */}
      {profile.is_verified && (
        <div className="mb-6 p-4 rounded-xl border border-green-500/30 bg-green-950/30">
          <div className="flex items-center gap-3">
            <CheckCircle className="h-5 w-5 text-green-400" />
            <div>
              <p className="text-sm font-medium text-green-400">Profile Verified</p>
              <p className="text-xs text-gray-400">
                Verified on {profile.verification_date ? new Date(profile.verification_date).toLocaleDateString() : "N/A"}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Verification Type Selection */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-300 mb-3">
          Verification Method
        </label>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {verificationTypes.map((type) => {
            const Icon = type.icon;
            return (
              <button
                key={type.id}
                onClick={() => setVerificationType(type.id)}
                className={`p-4 rounded-xl border-2 transition-all ${
                  verificationType === type.id
                    ? "border-purple-500 bg-purple-950/50"
                    : "border-gray-700 bg-gray-900/50 hover:border-gray-600"
                }`}
              >
                <Icon className={`h-5 w-5 mb-2 ${verificationType === type.id ? "text-purple-400" : type.color}`} />
                <p className={`text-sm font-medium ${verificationType === type.id ? "text-white" : "text-gray-400"}`}>
                  {type.name}
                </p>
                <p className="text-xs text-gray-500 mt-1">{type.description}</p>
              </button>
            );
          })}
        </div>
      </div>

      {/* Verification Details */}
      <div className="mb-6 p-4 rounded-xl border border-gray-700 bg-gray-900/30">
        <h4 className="text-sm font-medium text-gray-300 mb-3">Verification Details</h4>
        
        {verificationType === "email" && (
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm text-gray-400">
              <Mail className="h-4 w-4" />
              <span>{profile.email}</span>
            </div>
            <p className="text-xs text-gray-500">
              We&apos;ll send a verification link to your email address
            </p>
          </div>
        )}

        {verificationType === "social" && (
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm text-gray-400">
              <Link2 className="h-4 w-4" />
              <span>Link your social accounts for verification</span>
            </div>
            <div className="text-xs text-gray-500 space-y-1">
              {profile.github_url && <p>• GitHub: {profile.github_url}</p>}
              {profile.linkedin_url && <p>• LinkedIn: {profile.linkedin_url}</p>}
              {profile.twitter_url && <p>• Twitter: {profile.twitter_url}</p>}
              {!profile.github_url && !profile.linkedin_url && !profile.twitter_url && (
                <p>Add social links in your profile settings first</p>
              )}
            </div>
          </div>
        )}

        {verificationType === "identity" && (
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm text-gray-400">
              <FileText className="h-4 w-4" />
              <span>Government ID verification</span>
            </div>
            <p className="text-xs text-gray-500">
              Submit a government-issued ID for professional verification. This is the most secure verification method.
            </p>
          </div>
        )}
      </div>

      {/* Error Message */}
      {error && (
        <div className="mb-4 p-3 rounded-lg bg-red-950/30 border border-red-500/30">
          <div className="flex items-center gap-2">
            <AlertCircle className="h-4 w-4 text-red-400" />
            <p className="text-sm text-red-400">{error}</p>
          </div>
        </div>
      )}

      {/* Success Message */}
      {success && (
        <div className="mb-4 p-3 rounded-lg bg-green-950/30 border border-green-500/30">
          <div className="flex items-center gap-2">
            <CheckCircle className="h-4 w-4 text-green-400" />
            <p className="text-sm text-green-400">Verification request submitted successfully!</p>
          </div>
        </div>
      )}

      {/* Submit Button */}
      <Button
        onClick={handleSubmitRequest}
        disabled={loading || success || profile.is_verified}
        className="w-full"
        variant="primary"
      >
        {loading ? (
          <>
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            Submitting...
          </>
        ) : success ? (
          <>
            <CheckCircle className="h-4 w-4 mr-2" />
            Request Submitted
          </>
        ) : (
          <>
            <Send className="h-4 w-4 mr-2" />
            Submit Verification Request
          </>
        )}
      </Button>

      {/* Info Notice */}
      <div className="mt-4 p-3 rounded-lg bg-blue-950/30 border border-blue-500/30">
        <div className="flex items-start gap-2">
          <AlertCircle className="h-4 w-4 text-blue-400 mt-0.5" />
          <p className="text-xs text-gray-400">
            Verification requests are typically reviewed within 24-48 hours. You&apos;ll receive a notification once your request is processed.
          </p>
        </div>
      </div>
    </Card>
  );
}
