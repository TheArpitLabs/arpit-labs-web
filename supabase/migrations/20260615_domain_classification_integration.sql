-- Domain Classification Integration for Acquisition Queue
-- Adds AI-powered domain classification fields to the content acquisition pipeline

-- Add domain classification fields to content_acquisition_queue
alter table content_acquisition_queue
add column if not exists detected_domain text,
add column if not exists detected_subdomain text,
add column if not exists classification_confidence real,
add column if not exists domain_id uuid references engineering_domains(id) on delete set null,
add column if not exists subdomain_id uuid references engineering_subdomains(id) on delete set null,
add column if not exists classified_at timestamptz;

-- Add domain classification fields to discovered_content
alter table discovered_content
add column if not exists detected_domain text,
add column if not exists detected_subdomain text,
add column if not exists classification_confidence real;

-- Create indexes for domain classification queries
create index if not exists idx_acquisition_queue_domain on content_acquisition_queue(domain_id);
create index if not exists idx_acquisition_queue_subdomain on content_acquisition_queue(subdomain_id);
create index if not exists idx_acquisition_queue_detected_domain on content_acquisition_queue(detected_domain);
create index if not exists idx_discovered_content_detected_domain on discovered_content(detected_domain);

-- Create function to auto-classify content during acquisition
create or replace function auto_classify_content(
  p_queue_id uuid,
  p_title text,
  p_description text,
  p_tags text[] default array[]::text[],
  p_metadata jsonb default '{}'
) returns jsonb as $$
declare
  classification_result jsonb;
  domain_record record;
  subdomain_record record;
begin
  -- This function would typically call an AI service
  -- For now, we'll use a simple keyword-based classification
  
  -- Extract technologies from metadata if available
  -- In production, this would call the domain classifier service
  
  -- Default classification (will be enhanced with AI service integration)
  classification_result := jsonb_build_object(
    'domain', 'software-development',
    'subdomain', 'full-stack',
    'confidence', 0.5
  );
  
  -- Look up domain and subdomain IDs
  select id, name into domain_record
  from engineering_domains
  where slug = (classification_result->>'domain');
  
  select id, name into subdomain_record
  from engineering_subdomains
  where slug = (classification_result->>'subdomain');
  
  -- Update the acquisition queue with classification results
  update content_acquisition_queue
  set 
    detected_domain = domain_record.name,
    detected_subdomain = subdomain_record.name,
    classification_confidence = (classification_result->>'confidence')::real,
    domain_id = domain_record.id,
    subdomain_id = subdomain_record.id,
    classified_at = now()
  where id = p_queue_id;
  
  return classification_result;
end;
$$ language plpgsql security definer;

-- Create trigger to auto-classify after content analysis
create or replace function trigger_auto_classify()
returns trigger as $$
begin
  -- Auto-classify when AI analysis is completed and domain not yet classified
  if new.ai_analysis is not null and new.domain_id is null then
    perform auto_classify_content(
      new.id,
      new.title,
      new.description,
      new.tags,
      new.metadata
    );
  end if;
  
  return new;
end;
$$ language plpgsql;

create trigger auto_classify_after_analysis
  after update of ai_analysis on content_acquisition_queue
  for each row
  execute function trigger_auto_classify();

-- Create view for domain-classified content
create or replace view domain_classified_content as
select 
  caq.id,
  caq.title,
  caq.description,
  caq.content_type,
  caq.status,
  caq.detected_domain,
  caq.detected_subdomain,
  caq.classification_confidence,
  ed.name as domain_name,
  ed.slug as domain_slug,
  ed.icon as domain_icon,
  ed.color as domain_color,
  es.name as subdomain_name,
  es.slug as subdomain_slug,
  caq.quality_score,
  caq.ai_quality_score,
  caq.created_at,
  caq.classified_at
from content_acquisition_queue caq
left join engineering_domains ed on caq.domain_id = ed.id
left join engineering_subdomains es on caq.subdomain_id = es.id
where caq.detected_domain is not null
order by caq.classification_confidence desc;

-- Grant necessary permissions
grant execute on function auto_classify_content to service_role;
grant select on domain_classified_content to authenticated;

-- Add comments
comment on column content_acquisition_queue.detected_domain is 'AI-detected engineering domain name';
comment on column content_acquisition_queue.detected_subdomain is 'AI-detected engineering subdomain name';
comment on column content_acquisition_queue.classification_confidence is 'AI classification confidence score (0.0 to 1.0)';
comment on column content_acquisition_queue.domain_id is 'Reference to engineering_domains table';
comment on column content_acquisition_queue.subdomain_id is 'Reference to engineering_subdomains table';
comment on column content_acquisition_queue.classified_at is 'Timestamp when domain classification was performed';

-- Migration complete
