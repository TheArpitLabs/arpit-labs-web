'use server';

import { contactsRepository } from "@/lib/repositories/contacts.repository";
import { newsletterRepository } from "@/lib/repositories/newsletter.repository";
import { experimentsRepository } from "@/lib/repositories/experiments.repository";
import { labNotesRepository } from "@/lib/repositories/labnotes.repository";
import { journeyRepository } from "@/lib/repositories/journey.repository";
import { projectsRepository } from "@/lib/repositories/projects.repository";
import { contactFormSchema, newsletterSchema } from "@/lib/validation";
import { handleValidationError } from "@/lib/errors";
import { Experiment, LabNote, JourneyItem, Project } from "@/types/content";

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
    const projects = await projectsRepository.getProjects() as Project[];
    return projects.filter((project) => project.published ?? true);
  } catch {
    return [];
  }
}

export async function getProjectBySlug(slug: string): Promise<Project | null> {
  try {
    const project = await projectsRepository.getProjectBySlug(slug) as Project | null;
    return project && (project.published ?? true) ? project : null;
  } catch {
    return null;
  }
}
