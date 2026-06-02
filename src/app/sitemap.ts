import { MetadataRoute } from 'next';
import { getProjects, getLabNotes } from '@/lib/actions/server-actions';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = 'https://arpitlabs.example';
  const staticUrls = [
    '',
    '/about',
    '/projects',
    '/experiments',
    '/blog',
    '/journey',
    '/contact',
  ].map((route) => ({
    url: `${baseUrl}${route}`,
    lastModified: new Date(),
  }));

  try {
    const [projects, notes] = await Promise.all([
      getProjects(),
      getLabNotes(),
    ]);

    const projectUrls = projects.map((project) => ({
      url: `${baseUrl}/projects/${project.slug}`,
      lastModified: new Date(project.updated_at),
    }));

    const noteUrls = notes.map((note) => ({
      url: `${baseUrl}/blog/${note.slug}`,
      lastModified: new Date(note.updated_at),
    }));

    return [...staticUrls, ...projectUrls, ...noteUrls];
  } catch {
    return staticUrls;
  }
}
