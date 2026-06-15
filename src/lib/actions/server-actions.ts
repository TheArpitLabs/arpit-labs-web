'use server';

import { contactsRepository } from "@/lib/repositories/contacts.repository";
import { newsletterRepository } from "@/lib/repositories/newsletter.repository";
import { experimentsRepository } from "@/lib/repositories/experiments.repository";
import { labNotesRepository } from "@/lib/repositories/labnotes.repository";
import { journeyRepository } from "@/lib/repositories/journey.repository";
import { productsRepository } from "@/lib/repositories/products.repository";
import { hackathonsRepository } from "@/lib/repositories/hackathons.repository";
import { contactFormSchema, newsletterSchema } from "@/lib/validation";
import { handleValidationError } from "@/lib/errors";
import { Experiment, Hackathon, HackathonSubmission, HackathonTeam, HackathonTeamMember, LabNote, JourneyItem, Product, Project } from "@/types/content";
import { getProjects as getProjectsData, getProjectBySlug as getProjectBySlugData } from "@/lib/data/projects";

export async function submitContactMessage(formData: unknown) {
  try {
    const payload = contactFormSchema.parse(formData);
    return await contactsRepository.submitContactMessage(payload);
  } catch (error) {
    throw handleValidationError(error);
  }
}

export async function subscribeNewsletter(formData: unknown) {
  try {
    const payload = newsletterSchema.parse(formData);
    return await newsletterRepository.subscribeNewsletter(payload.email);
  } catch (error) {
    throw handleValidationError(error);
  }
}

export async function getExperiments(): Promise<Experiment[]> {
  try {
    return await experimentsRepository.getExperiments() as Experiment[];
  } catch {
    return [];
  }
}

export async function getLabNotes(): Promise<LabNote[]> {
  try {
    const notes = await labNotesRepository.getLabNotes() as LabNote[];
    return notes.filter((note) => note.published);
  } catch {
    return [];
  }
}

export async function getLabNoteBySlug(slug: string): Promise<LabNote | null> {
  try {
    const note = await labNotesRepository.getLabNoteBySlug(slug) as LabNote | null;
    return note?.published ? note : null;
  } catch {
    return null;
  }
}

export async function getJourneyTimeline(): Promise<JourneyItem[]> {
  try {
    return await journeyRepository.getJourneyTimeline() as JourneyItem[];
  } catch {
    return [];
  }
}

export async function getProjects(): Promise<Project[]> {
  try {
    return getProjectsData();
  } catch {
    return [];
  }
}

export async function getProjectBySlug(slug: string): Promise<Project | null> {
  try {
    return getProjectBySlugData(slug);
  } catch {
    return null;
  }
}

export async function getProducts(): Promise<Product[]> {
  try {
    const products = await productsRepository.getProducts({ published: true });
    return products;
  } catch {
    return [];
  }
}

export async function getProductBySlug(slug: string): Promise<Product | null> {
  try {
    const product = await productsRepository.getProductBySlug(slug) as Product | null;
    return product && product.published ? product : null;
  } catch {
    return null;
  }
}

export async function getHackathons(): Promise<Hackathon[]> {
  try {
    return await hackathonsRepository.getHackathons() as Hackathon[];
  } catch {
    return [];
  }
}

export async function getHackathonBySlug(slug: string): Promise<Hackathon | null> {
  try {
    return await hackathonsRepository.getHackathonBySlug(slug);
  } catch {
    return null;
  }
}

export async function getHackathonTeams(hackathonId: string): Promise<HackathonTeam[]> {
  try {
    return await hackathonsRepository.getHackathonTeams(hackathonId) as HackathonTeam[];
  } catch {
    return [];
  }
}

export async function getHackathonSubmissions(hackathonId: string): Promise<HackathonSubmission[]> {
  try {
    return await hackathonsRepository.getHackathonSubmissions(hackathonId) as HackathonSubmission[];
  } catch {
    return [];
  }
}

export async function getLeaderboard(hackathonId?: string): Promise<HackathonSubmission[]> {
  try {
    return await hackathonsRepository.getLeaderboard(hackathonId) as HackathonSubmission[];
  } catch {
    return [];
  }
}

export async function generateHackathonSuggestions(hackathonTitle: string): Promise<string[]> {
  try {
    const { contentGenerationService } = await import("@/lib/ai-services");
    return await contentGenerationService.generateProjectIdeas(hackathonTitle, 4);
  } catch {
    return [];
  }
}
