"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@supabase/supabase-js";
import { clearAdminSessionCookies, requireAdmin, setAdminSessionCookies } from "@/lib/auth";
import { uploadFileToBucket } from "@/lib/admin-storage";
import { contactsRepository } from "@/lib/repositories/contacts.repository";
import { experimentsRepository } from "@/lib/repositories/experiments.repository";
import { hackathonsRepository } from "@/lib/repositories/hackathons.repository";
import { journeyRepository } from "@/lib/repositories/journey.repository";
import { labNotesRepository } from "@/lib/repositories/labnotes.repository";
import { newsletterRepository } from "@/lib/repositories/newsletter.repository";
import { productsRepository } from "@/lib/repositories/products.repository";
import { productFeaturesRepository } from "@/lib/repositories/product-features.repository";
import { productScreenshotsRepository } from "@/lib/repositories/product-screenshots.repository";
import { projectsRepository } from "@/lib/repositories/projects.repository";
import { experimentSchema, journeySchema, labNoteSchema, projectSchema } from "@/lib/validation";
import { productSchema, productFeatureSchema, productScreenshotSchema } from "@/lib/validation/product.schema";
import { hackathonSchema } from "@/lib/validation/hackathon.schema";

function createAuthClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error("Missing Supabase auth environment variables.");
  }

  return createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}

function asString(value: FormDataEntryValue | null) {
  return typeof value === "string" ? value.trim() : "";
}

function asOptionalString(value: FormDataEntryValue | null) {
  const normalized = asString(value);
  return normalized.length > 0 ? normalized : undefined;
}

function asBoolean(value: FormDataEntryValue | null) {
  return value === "on" || value === "true";
}

function asStringArray(value: FormDataEntryValue | null, separator = ",") {
  const str = asString(value);
  if (!str) return [];
  return str
    .split(separator)
    .map((item) => item.trim())
    .filter(Boolean);
}

export async function adminSignIn(formData: FormData) {
  const email = asString(formData.get("email"));
  const password = asString(formData.get("password"));
  const redirectTo = asString(formData.get("redirectTo")) || "/admin";

  const authClient = createAuthClient();
  const { data, error } = await authClient.auth.signInWithPassword({ 
    email, 
    password 
  });

  if (error || !data.session) {
    redirect("/admin/login?error=" + encodeURIComponent("Invalid credentials") as never);
  }

  await setAdminSessionCookies(data.session.access_token, data.session.refresh_token);
  redirect(redirectTo as never);
}

export async function adminSignOut() {
  await clearAdminSessionCookies();
  redirect("/admin/login" as never);
}

export async function saveProjectAction(formData: FormData) {
  await requireAdmin();

  const id = asString(formData.get("id"));
  const payload = projectSchema.parse({
    title: asString(formData.get("title")),
    slug: asString(formData.get("slug")),
    description: asString(formData.get("description")),
    category: asString(formData.get("category")),
    content: asOptionalString(formData.get("content")),
    overview: asOptionalString(formData.get("overview")),
    problem_statement: asOptionalString(formData.get("problem_statement")),
    architecture: asOptionalString(formData.get("architecture")),
    tech_stack: asStringArray(formData.get("tech_stack")),
    github_url: asOptionalString(formData.get("github_url")),
    demo_url: asOptionalString(formData.get("demo_url")),
    cover_image: asOptionalString(formData.get("cover_image")),
    screenshots: asStringArray(formData.get("screenshots")),
    lessons_learned: asStringArray(formData.get("lessons_learned"), "|"),
    tags: asStringArray(formData.get("tags")),
    featured: asBoolean(formData.get("featured")),
    published: asBoolean(formData.get("published")),
  });

  if (id) {
    await projectsRepository.updateProject(id, payload);
  } else {
    await projectsRepository.createProject(payload);
  }

  revalidatePath("/admin/projects");
  revalidatePath("/projects");
  revalidatePath("/");
  redirect("/admin/projects" as never);
}

export async function deleteProjectAction(formData: FormData) {
  await requireAdmin();
  const id = asString(formData.get("id"));
  await projectsRepository.deleteProject(id);
  revalidatePath("/admin/projects");
  revalidatePath("/projects");
}

export async function saveProductAction(formData: FormData) {
  await requireAdmin();

  const id = asString(formData.get("id"));
  const payload = productSchema.parse({
    title: asString(formData.get("title")),
    slug: asString(formData.get("slug")),
    description: asString(formData.get("description")),
    overview: asOptionalString(formData.get("overview")),
    category: asString(formData.get("category")),
    pricing_type: asString(formData.get("pricing_type")),
    pricing_details: asOptionalString(formData.get("pricing_details")),
    demo_url: asOptionalString(formData.get("demo_url")),
    documentation_url: asOptionalString(formData.get("documentation_url")),
    cover_image: asOptionalString(formData.get("cover_image")),
    featured: asBoolean(formData.get("featured")),
    published: asBoolean(formData.get("published")),
  });

  const rawFeatures = asOptionalString(formData.get("features")) || "[]";
  const features = z.array(productFeatureSchema).parse(JSON.parse(rawFeatures));

  const rawScreenshots = asOptionalString(formData.get("screenshots")) || "[]";
  const screenshotsUrls = JSON.parse(rawScreenshots) as string[];
  const screenshots = screenshotsUrls.map((url, index) => ({
    image_url: url,
    sort_order: index
  }));

  const product = id
    ? await productsRepository.updateProduct(id, payload)
    : await productsRepository.createProduct(payload);

  await productFeaturesRepository.replaceFeatures(product.id, features);
  await productScreenshotsRepository.replaceScreenshots(product.id, screenshots);

  revalidatePath("/admin/products");
  revalidatePath("/products");
  revalidatePath("/");
  redirect("/admin/products" as never);
}

export async function deleteProductAction(formData: FormData) {
  await requireAdmin();
  const id = asString(formData.get("id"));
  await productsRepository.deleteProduct(id);
  revalidatePath("/admin/products");
  revalidatePath("/products");
}

export async function saveLabNoteAction(formData: FormData) {
  await requireAdmin();

  const id = asString(formData.get("id"));
  const payload = labNoteSchema.parse({
    title: asString(formData.get("title")),
    slug: asString(formData.get("slug")),
    excerpt: asOptionalString(formData.get("excerpt")),
    content: asString(formData.get("content")),
    category: asOptionalString(formData.get("category")),
    cover_image: asOptionalString(formData.get("cover_image")),
    tags: asStringArray(formData.get("tags")),
    published: asBoolean(formData.get("published")),
    reading_time: Number(asString(formData.get("reading_time")) || 0),
  });

  if (id) {
    await labNotesRepository.updateLabNote(id, payload);
  } else {
    await labNotesRepository.createLabNote(payload);
  }

  revalidatePath("/admin/blog");
  revalidatePath("/blog");
  redirect("/admin/blog" as never);
}

export async function deleteLabNoteAction(formData: FormData) {
  await requireAdmin();
  const id = asString(formData.get("id"));
  await labNotesRepository.deleteLabNote(id);
  revalidatePath("/admin/blog");
  revalidatePath("/blog");
}

export async function saveExperimentAction(formData: FormData) {
  await requireAdmin();

  const id = asString(formData.get("id"));
  const payload = experimentSchema.parse({
    title: asString(formData.get("title")),
    slug: asString(formData.get("slug")),
    description: asString(formData.get("description")),
    content: asOptionalString(formData.get("content")),
    category: asOptionalString(formData.get("category")),
    difficulty: asOptionalString(formData.get("difficulty")),
    tech_stack: asStringArray(formData.get("tech_stack")),
    status: asString(formData.get("status")),
    featured: asBoolean(formData.get("featured")),
    published: asBoolean(formData.get("published")),
    cover_image: asOptionalString(formData.get("cover_image")),
  });

  if (id) {
    await experimentsRepository.updateExperiment(id, payload);
  } else {
    await experimentsRepository.createExperiment(payload);
  }

  revalidatePath("/admin/experiments");
  revalidatePath("/experiments");
  redirect("/admin/experiments" as never);
}

export async function deleteExperimentAction(formData: FormData) {
  await requireAdmin();
  const id = asString(formData.get("id"));
  await experimentsRepository.deleteExperiment(id);
  revalidatePath("/admin/experiments");
  revalidatePath("/experiments");
}

export async function saveJourneyEntryAction(formData: FormData) {
  await requireAdmin();

  const id = asString(formData.get("id"));
  const payload = journeySchema.parse({
    year: Number(asString(formData.get("year"))),
    title: asString(formData.get("title")),
    description: asString(formData.get("description")),
    entry_type: asString(formData.get("entry_type")),
    organization: asOptionalString(formData.get("organization")),
    location: asOptionalString(formData.get("location")),
    icon: asOptionalString(formData.get("icon")),
    display_order: Number(asString(formData.get("display_order")) || 0),
  });

  if (id) {
    await journeyRepository.updateJourneyEntry(id, payload);
  } else {
    await journeyRepository.createJourneyEntry(payload);
  }

  revalidatePath("/admin/journey");
  revalidatePath("/journey");
  redirect("/admin/journey" as never);
}

export async function deleteJourneyEntryAction(formData: FormData) {
  await requireAdmin();
  const id = asString(formData.get("id"));
  await journeyRepository.deleteJourneyEntry(id);
  revalidatePath("/admin/journey");
  revalidatePath("/journey");
}

export async function saveHackathonAction(formData: FormData) {
  await requireAdmin();

  const id = asString(formData.get("id"));
  const payload = hackathonSchema.parse({
    title: asString(formData.get("title")),
    slug: asString(formData.get("slug")),
    description: asString(formData.get("description")),
    organizer: asString(formData.get("organizer")),
    start_date: asOptionalString(formData.get("start_date")),
    end_date: asOptionalString(formData.get("end_date")),
    registration_deadline: asOptionalString(formData.get("registration_deadline")),
    status: asString(formData.get("status")),
  });

  if (id) {
    await hackathonsRepository.updateHackathon(id, payload);
  } else {
    await hackathonsRepository.createHackathon(payload);
  }

  revalidatePath("/admin/hackathons");
  revalidatePath("/hackathons");
  redirect("/admin/hackathons" as never);
}

export async function deleteHackathonAction(formData: FormData) {
  await requireAdmin();
  const id = asString(formData.get("id"));
  await hackathonsRepository.deleteHackathon(id);
  revalidatePath("/admin/hackathons");
  revalidatePath("/hackathons");
}

export async function saveHackathonScoreAction(formData: FormData) {
  await requireAdmin();

  const id = asString(formData.get("id"));
  const score = Number(asString(formData.get("score")) || 0);
  await hackathonsRepository.updateSubmissionScore(id, score);
  revalidatePath("/admin/hackathons");
}

export async function markMessageReadAction(formData: FormData) {
  await requireAdmin();
  const id = asString(formData.get("id"));
  const isRead = asBoolean(formData.get("isRead"));
  await contactsRepository.updateContactMessage(id, { is_read: isRead });
  revalidatePath("/admin/messages");
}

export async function deleteContactMessageAction(formData: FormData) {
  await requireAdmin();
  const id = asString(formData.get("id"));
  await contactsRepository.deleteContactMessage(id);
  revalidatePath("/admin/messages");
}

export async function deleteSubscriberAction(formData: FormData) {
  await requireAdmin();
  const id = asString(formData.get("id"));
  await newsletterRepository.deleteSubscriber(id);
  revalidatePath("/admin/newsletter");
}

// ============================================================================
// LEARNING PLATFORM ACTIONS
// ============================================================================

export async function saveCourseAction(formData: FormData) {
  await requireAdmin();
  
  const { coursesRepository } = await import("@/lib/repositories/courses.repository");
  const { courseSchema } = await import("@/lib/validation/learning.schema");

  const id = asString(formData.get("id"));
  const payload = courseSchema.parse({
    title: asString(formData.get("title")),
    slug: asString(formData.get("slug")),
    description: asString(formData.get("description")),
    content: asOptionalString(formData.get("content")),
    category: asString(formData.get("category")),
    difficulty: asString(formData.get("difficulty")),
    duration: Number(asString(formData.get("duration"))),
    thumbnail: asOptionalString(formData.get("thumbnail")),
    published: asBoolean(formData.get("published")),
  });

  if (id) {
    await coursesRepository.update(id, payload);
  } else {
    await coursesRepository.create(payload);
  }

  revalidatePath("/admin/courses");
  revalidatePath("/courses");
  redirect("/admin/courses" as never);
}

export async function deleteCourseAction(formData: FormData) {
  await requireAdmin();
  const { coursesRepository } = await import("@/lib/repositories/courses.repository");
  const id = asString(formData.get("id"));
  await coursesRepository.delete(id);
  revalidatePath("/admin/courses");
  revalidatePath("/courses");
}

export async function saveLabAction(formData: FormData) {
  await requireAdmin();
  
  const { labsRepository } = await import("@/lib/repositories/labs.repository");
  const { labSchema } = await import("@/lib/validation/learning.schema");

  const id = asString(formData.get("id"));
  const payload = labSchema.parse({
    title: asString(formData.get("title")),
    slug: asString(formData.get("slug")),
    description: asString(formData.get("description")),
    instructions: asString(formData.get("instructions")),
    difficulty: asString(formData.get("difficulty")),
    category: asString(formData.get("category")),
    published: asBoolean(formData.get("published")),
  });

  if (id) {
    await labsRepository.update(id, payload);
  } else {
    await labsRepository.create(payload);
  }

  revalidatePath("/admin/labs");
  revalidatePath("/labs");
  redirect("/admin/labs" as never);
}

export async function deleteLabAction(formData: FormData) {
  await requireAdmin();
  const { labsRepository } = await import("@/lib/repositories/labs.repository");
  const id = asString(formData.get("id"));
  await labsRepository.delete(id);
  revalidatePath("/admin/labs");
  revalidatePath("/labs");
}

export async function saveRoadmapAction(formData: FormData) {
  await requireAdmin();
  
  const { roadmapsRepository } = await import("@/lib/repositories/roadmaps.repository");
  const { roadmapSchema } = await import("@/lib/validation/learning.schema");

  const id = asString(formData.get("id"));
  const payload = roadmapSchema.parse({
    title: asString(formData.get("title")),
    slug: asString(formData.get("slug")),
    description: asString(formData.get("description")),
    category: asString(formData.get("category")),
    content: asString(formData.get("content")),
    published: asBoolean(formData.get("published")),
  });

  if (id) {
    await roadmapsRepository.update(id, payload);
  } else {
    await roadmapsRepository.create(payload);
  }

  revalidatePath("/admin/roadmaps");
  revalidatePath("/roadmaps");
  redirect("/admin/roadmaps" as never);
}

export async function deleteRoadmapAction(formData: FormData) {
  await requireAdmin();
  const { roadmapsRepository } = await import("@/lib/repositories/roadmaps.repository");
  const id = asString(formData.get("id"));
  await roadmapsRepository.delete(id);
  revalidatePath("/admin/roadmaps");
  revalidatePath("/roadmaps");
}
