import { Metadata } from "next";
import { createClient } from "@supabase/supabase-js";
import DomainLandingPageContent from "./DomainLandingPageContent";

export async function generateMetadata({ params }: { params: Promise<{ domain: string }> }): Promise<Metadata> {
  const resolvedParams = await params;
  const domainSlug = resolvedParams.domain;
  
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
  const supabase = createClient(supabaseUrl, supabaseKey);
  
  const { data: domain } = await supabase
    .from('engineering_domains')
    .select('name, description')
    .eq('slug', domainSlug)
    .single();
  
  const domainName = domain?.name || 'Engineering Domain';
  const domainDescription = domain?.description || 'Explore engineering projects, research, and resources.';
  
  return {
    title: `${domainName} - Arpit Labs`,
    description: `${domainDescription} Discover featured projects, research papers, datasets, and contributors in this domain.`,
    keywords: [domainName, 'engineering', 'projects', 'research', 'datasets', 'Arpit Labs'],
    openGraph: {
      title: `${domainName} - Arpit Labs`,
      description: domainDescription,
      type: 'website',
    },
  };
}

export default async function DomainLandingPage({ params }: { params: Promise<{ domain: string }> }) {
  const resolvedParams = await params;
  const domainSlug = resolvedParams.domain;

  return <DomainLandingPageContent domainSlug={domainSlug} />;
}
