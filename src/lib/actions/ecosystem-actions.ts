"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { supabaseServer } from "@/lib/supabase/server";
import { 
  researchPaperSchema, 
  certificationSchema, 
  startupSchema, 
  communityChapterSchema, 
  communityEventSchema 
} from "@/lib/validation/ecosystem.schema";

// RESEARCH
export async function saveResearchPaperAction(formData: FormData) {
  const id = formData.get("id") as string;
  const data = {
    title: formData.get("title"),
    slug: formData.get("slug"),
    abstract: formData.get("abstract"),
    content: formData.get("content"),
    division: formData.get("division"),
    is_featured: formData.get("is_featured") === "on",
    authors: (formData.get("authors") as string)?.split(",").map(s => s.trim()) || [],
    tags: (formData.get("tags") as string)?.split(",").map(s => s.trim()) || [],
  };

  const validated = researchPaperSchema.parse(data);

  if (id) {
    await supabaseServer.from("research_papers").update(validated).eq("id", id);
  } else {
    await supabaseServer.from("research_papers").insert(validated);
  }

  revalidatePath("/admin/research");
  revalidatePath("/research");
  redirect("/admin/research");
}

export async function deleteResearchPaperAction(formData: FormData) {
  const id = formData.get("id") as string;
  await supabaseServer.from("research_papers").delete().eq("id", id);
  revalidatePath("/admin/research");
}

// UNIVERSITY
export async function saveCertificationAction(formData: FormData) {
  const id = formData.get("id") as string;
  const data = {
    title: formData.get("title"),
    slug: formData.get("slug"),
    description: formData.get("description"),
    topic: formData.get("topic"),
    level: formData.get("level"),
    image_url: formData.get("image_url"),
  };

  const validated = certificationSchema.parse(data);

  if (id) {
    await supabaseServer.from("certifications").update(validated).eq("id", id);
  } else {
    await supabaseServer.from("certifications").insert(validated);
  }

  revalidatePath("/admin/university");
  revalidatePath("/university");
  redirect("/admin/university");
}

// INNOVATION
export async function saveStartupAction(formData: FormData) {
  const id = formData.get("id") as string;
  const data = {
    name: formData.get("name"),
    slug: formData.get("slug"),
    description: formData.get("description"),
    logo_url: formData.get("logo_url"),
    website_url: formData.get("website_url"),
    stage: formData.get("stage"),
  };

  const validated = startupSchema.parse(data);

  if (id) {
    await supabaseServer.from("startups").update(validated).eq("id", id);
  } else {
    await supabaseServer.from("startups").insert(validated);
  }

  revalidatePath("/admin/innovation");
  revalidatePath("/innovation");
  redirect("/admin/innovation");
}

// COMMUNITY
export async function saveCommunityChapterAction(formData: FormData) {
  const id = formData.get("id") as string;
  const data = {
    name: formData.get("name"),
    country: formData.get("country"),
    city: formData.get("city"),
  };

  const validated = communityChapterSchema.parse(data);

  if (id) {
    await supabaseServer.from("community_chapters").update(validated).eq("id", id);
  } else {
    await supabaseServer.from("community_chapters").insert(validated);
  }

  revalidatePath("/admin/community");
  revalidatePath("/community");
  redirect("/admin/community");
}

export async function saveCommunityEventAction(formData: FormData) {
  const id = formData.get("id") as string;
  const data = {
    chapter_id: formData.get("chapter_id"),
    title: formData.get("title"),
    description: formData.get("description"),
    event_type: formData.get("event_type"),
    location: formData.get("location"),
    start_time: formData.get("start_time"),
    end_time: formData.get("end_time"),
    max_attendees: formData.get("max_attendees"),
  };

  const validated = communityEventSchema.parse(data);

  if (id) {
    await supabaseServer.from("community_events").update(validated).eq("id", id);
  } else {
    await supabaseServer.from("community_events").insert(validated);
  }

  revalidatePath("/admin/community");
  revalidatePath("/community");
  redirect("/admin/community");
}
