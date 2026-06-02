'use server';

import { contactsRepository } from "@/lib/repositories/contacts.repository";
import { newsletterRepository } from "@/lib/repositories/newsletter.repository";
import { experimentsRepository } from "@/lib/repositories/experiments.repository";
import { labNotesRepository } from "@/lib/repositories/labnotes.repository";
import { journeyRepository } from "@/lib/repositories/journey.repository";
import { contactFormSchema, newsletterSchema } from "@/lib/validation";
import { handleValidationError, handleServerActionError } from "@/lib/errors";

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

export async function getExperiments() {
  try {
    return await experimentsRepository.getExperiments();
  } catch (error) {
    throw handleServerActionError(error);
  }
}

export async function getLabNotes() {
  try {
    return await labNotesRepository.getLabNotes();
  } catch (error) {
    throw handleServerActionError(error);
  }
}

export async function getJourneyTimeline() {
  try {
    return await journeyRepository.getJourneyTimeline();
  } catch (error) {
    throw handleServerActionError(error);
  }
}
