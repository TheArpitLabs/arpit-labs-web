# DATABASE TABLES AUDIT REPORT
## Arpit Labs Database Reality Audit - Task 2

**Audit Date:** June 16, 2026  
**Audit Scope:** All tables defined in schema.sql and migration files  
**Verification Method:** Schema analysis and migration file examination

### TABLE INVENTORY

#### CORE TABLES (From schema.sql)

**projects**
- Purpose: Main projects table for portfolio and showcase
- Active Usage: HIGH - Core content type
- Duplicate Candidate: No
- Orphaned: No
- Classification: CORE
- Columns: id, title, slug, description, overview, problem_statement, architecture, tech_stack, github_url, demo_url, cover_image, screenshots, lessons_learned, tags, featured, published, created_at, updated_at, engineering_category_id, project_type, repository_url, github_stars, license, original_author, architecture_summary, learning_outcomes, features, industry_applications, challenges_solved, future_possibilities, contributors, verified_repository, verification_date, owner_id

**experiments**
- Purpose: Experimental projects and learning exercises
- Active Usage: MEDIUM - Educational content
- Duplicate Candidate: No
- Orphaned: No
- Classification: CORE
- Columns: id, title, slug, description, content, category, difficulty, tech_stack, status, featured, published, cover_image, created_at, updated_at

**lab_notes** (formerly blog)
- Purpose: Blog posts and technical articles
- Active Usage: MEDIUM - Content marketing
- Duplicate Candidate: No
- Orphaned: No
- Classification: CORE
- Columns: id, title, slug, excerpt, content, category, cover_image, tags, published, reading_time, created_at, updated_at

**journey**
- Purpose: Professional journey and timeline
- Active Usage: MEDIUM - Personal branding
- Duplicate Candidate: No
- Orphaned: No
- Classification: CORE
- Columns: id, year, title, description, entry_type, organization, location, icon, display_order, created_at, updated_at

**contact_messages**
- Purpose: Contact form submissions
- Active Usage: LOW - Communication
- Duplicate Candidate: No
- Orphaned: No
- Classification: CORE
- Columns: id, name, email, subject, message, is_read, created_at

**newsletter_subscribers**
- Purpose: Newsletter subscriptions
- Active Usage: LOW - Marketing
- Duplicate Candidate: No
- Orphaned: No
- Classification: CORE
- Columns: id, email, subscribed_at

**profiles**
- Purpose: User profiles and authentication
- Active Usage: HIGH - User system
- Duplicate Candidate: No
- Orphaned: No
- Classification: CORE
- Columns: id, email, full_name, avatar_url, bio, github_url, linkedin_url, website_url, location, twitter_url, youtube_url, instagram_url, stackoverflow_url, portfolio_theme, custom_css, featured_project_id, job_title, company, availability, is_verified, verification_date, verification_method, profile_visibility, username, engineering_score, created_at, updated_at

**saved_content**
- Purpose: User-saved content bookmarks
- Active Usage: LOW - User feature
- Duplicate Candidate: No
- Orphaned: No
- Classification: CORE
- Columns: id, user_id, content_type, content_id, created_at

#### EXTENSION TABLES (Phase 8 - Learning Platform)

**courses**
- Purpose: Online courses and learning content
- Active Usage: UNKNOWN - Phase 8 implementation unclear
- Duplicate Candidate: No
- Orphaned: No
- Classification: EXTENSION
- Columns: id, title, slug, description, content, category, difficulty, duration, thumbnail, published, created_at, updated_at

**course_modules**
- Purpose: Course modules and lessons
- Active Usage: UNKNOWN - Phase 8 implementation unclear
- Duplicate Candidate: No
- Orphaned: No
- Classification: EXTENSION
- Columns: id, course_id, title, content, order_index, created_at, updated_at

**labs**
- Purpose: Hands-on lab exercises
- Active Usage: UNKNOWN - Phase 8 implementation unclear
- Duplicate Candidate: No
- Orphaned: No
- Classification: EXTENSION
- Columns: id, title, slug, description, instructions, difficulty, category, published, created_at, updated_at

**roadmaps**
- Purpose: Learning roadmaps and paths
- Active Usage: UNKNOWN - Phase 8 implementation unclear
- Duplicate Candidate: No
- Orphaned: No
- Classification: EXTENSION
- Columns: id, title, slug, description, category, content, published, created_at, updated_at

**user_course_progress**
- Purpose: Track user course progress
- Active Usage: UNKNOWN - Phase 8 implementation unclear
- Duplicate Candidate: No
- Orphaned: No
- Classification: EXTENSION
- Columns: id, user_id, course_id, progress_percentage, completed, updated_at

**community_posts**
- Purpose: Community discussion posts
- Active Usage: UNKNOWN - Phase 8 implementation unclear
- Duplicate Candidate: No
- Orphaned: No
- Classification: EXTENSION
- Columns: id, user_id, title, slug, content, category, tags, views, upvotes, created_at, updated_at

**community_replies**
- Purpose: Community post replies
- Active Usage: UNKNOWN - Phase 8 implementation unclear
- Duplicate Candidate: No
- Orphaned: No
- Classification: EXTENSION
- Columns: id, post_id, user_id, content, created_at

**community_votes**
- Purpose: Community voting system
- Active Usage: UNKNOWN - Phase 8 implementation unclear
- Duplicate Candidate: No
- Orphaned: No
- Classification: EXTENSION
- Columns: id, post_id, user_id, vote_type, created_at

**membership_plans**
- Purpose: Subscription and membership plans
- Active Usage: UNKNOWN - Phase 8 implementation unclear
- Duplicate Candidate: No
- Orphaned: No
- Classification: EXTENSION
- Columns: id, name, slug, description, monthly_price, yearly_price, features, active, created_at

**user_subscriptions**
- Purpose: User subscription management
- Active Usage: UNKNOWN - Phase 8 implementation unclear
- Duplicate Candidate: No
- Orphaned: No
- Classification: EXTENSION
- Columns: id, user_id, plan_id, status, billing_cycle, start_date, end_date, created_at

**feature_access**
- Purpose: Feature access control by plan
- Active Usage: UNKNOWN - Phase 8 implementation unclear
- Duplicate Candidate: No
- Orphaned: No
- Classification: EXTENSION
- Columns: id, plan_id, feature_key, enabled

#### ENGINE & INTELLIGENCE TABLES (E-Engines)

**ai_conversations**
- Purpose: AI chat conversation history
- Active Usage: UNKNOWN - Phase 7 implementation unclear
- Duplicate Candidate: No
- Orphaned: No
- Classification: EXTENSION
- Columns: id, user_id, anonymous_session_id, title, topic, created_at, updated_at, archived_at, metadata

**ai_messages**
- Purpose: Individual AI chat messages
- Active Usage: UNKNOWN - Phase 7 implementation unclear
- Duplicate Candidate: No
- Orphaned: No
- Classification: EXTENSION
- Columns: id, conversation_id, role, content, tokens_used, model, embedding_id, created_at, metadata

**ai_knowledge_base**
- Purpose: AI knowledge base for content indexing
- Active Usage: UNKNOWN - Phase 7 implementation unclear
- Duplicate Candidate: No
- Orphaned: No
- Classification: EXTENSION
- Columns: id, source_type, source_id, source_title, source_url, content, metadata_obj, indexed_at, last_updated, chunk_number, is_active, metadata

**ai_embeddings**
- Purpose: Vector embeddings for semantic search
- Active Usage: UNKNOWN - Phase 7 implementation unclear
- Duplicate Candidate: No
- Orphaned: No
- Classification: EXTENSION
- Columns: id, source_type, source_id, content_id, embedding, model, text_preview, metadata_obj, created_at, metadata

**automation_workflows**
- Purpose: Automation workflow configurations
- Active Usage: UNKNOWN - Phase 7 implementation unclear
- Duplicate Candidate: No
- Orphaned: No
- Classification: EXTENSION
- Columns: id, name, description, workflow_type, is_active, schedule, trigger_type, trigger_config, actions, last_run_at, last_error, run_count, created_at, updated_at, created_by, metadata

**automation_runs**
- Purpose: Automation workflow execution records
- Active Usage: UNKNOWN - Phase 7 implementation unclear
- Duplicate Candidate: No
- Orphaned: No
- Classification: EXTENSION
- Columns: id, workflow_id, status, input_data, output_data, error_message, started_at, completed_at, duration_seconds, created_at, metadata

**ai_predictions**
- Purpose: AI predictions for trends and analytics
- Active Usage: UNKNOWN - Phase 7 implementation unclear
- Duplicate Candidate: No
- Orphaned: No
- Classification: EXTENSION
- Columns: id, prediction_type, subject, predicted_values, confidence_score, prediction_start_date, prediction_end_date, actual_values, accuracy_score, created_at, verified_at, metadata

**ai_analytics_events**
- Purpose: AI analytics event tracking
- Active Usage: UNKNOWN - Phase 7 implementation unclear
- Duplicate Candidate: No
- Orphaned: No
- Classification: EXTENSION
- Columns: id, event_type, visitor_id, user_id, session_id, event_data, predicted_interest, confidence, created_at, metadata

**recruiter_profiles**
- Purpose: Recruiter assistant profiles
- Active Usage: UNKNOWN - Phase 7 implementation unclear
- Duplicate Candidate: No
- Orphaned: No
- Classification: EXTENSION
- Columns: id, user_id, company_name, job_title, email, phone, focus_areas, experience_level, resume_summary, skills_overview, project_highlights, hiring_report, is_active, created_at, updated_at, metadata

**recruiter_interactions**
- Purpose: Recruiter interaction tracking
- Active Usage: UNKNOWN - Phase 7 implementation unclear
- Duplicate Candidate: No
- Orphaned: No
- Classification: EXTENSION
- Columns: id, recruiter_id, interaction_type, interaction_data, created_at, metadata

**ai_settings**
- Purpose: AI system settings and configuration
- Active Usage: UNKNOWN - Phase 7 implementation unclear
- Duplicate Candidate: No
- Orphaned: No
- Classification: EXTENSION
- Columns: id, ai_enabled, chat_enabled, search_enabled, default_model, temperature, max_tokens, kb_max_context_length, kb_refresh_interval, chat_rate_limit, search_rate_limit, monthly_api_budget, current_month_spent, created_at, updated_at, metadata

#### PROFILE SYSTEM TABLES (Phase 2 & 3)

**profile_follows**
- Purpose: User follow relationships
- Active Usage: UNKNOWN - Phase 2 implementation unclear
- Duplicate Candidate: No
- Orphaned: No
- Classification: EXTENSION
- Columns: id, follower_id, following_id, created_at

**profile_likes**
- Purpose: Profile likes
- Active Usage: UNKNOWN - Phase 2 implementation unclear
- Duplicate Candidate: No
- Orphaned: No
- Classification: EXTENSION
- Columns: id, profile_id, user_id, created_at

**profile_comments**
- Purpose: Profile comments
- Active Usage: UNKNOWN - Phase 2 implementation unclear
- Duplicate Candidate: No
- Orphaned: No
- Classification: EXTENSION
- Columns: id, profile_id, user_id, content, parent_id, created_at, updated_at

**profile_shares**
- Purpose: Profile share tracking
- Active Usage: UNKNOWN - Phase 2 implementation unclear
- Duplicate Candidate: No
- Orphaned: No
- Classification: EXTENSION
- Columns: id, profile_id, user_id, platform, created_at

**profile_analytics**
- Purpose: Profile analytics and metrics
- Active Usage: UNKNOWN - Phase 2 implementation unclear
- Duplicate Candidate: No
- Orphaned: No
- Classification: EXTENSION
- Columns: id, profile_id, view_count, follower_count, following_count, like_count, comment_count, share_count, last_viewed_at, updated_at

**profile_badges**
- Purpose: User badges and achievements
- Active Usage: UNKNOWN - Phase 3 implementation unclear
- Duplicate Candidate: No
- Orphaned: No
- Classification: EXTENSION
- Columns: id, profile_id, badge_type, badge_name, badge_description, badge_icon, badge_color, earned_at, expires_at, is_active

**profile_achievements**
- Purpose: User achievements and milestones
- Active Usage: UNKNOWN - Phase 3 implementation unclear
- Duplicate Candidate: No
- Orphaned: No
- Classification: EXTENSION
- Columns: id, profile_id, achievement_type, achievement_name, achievement_description, achievement_icon, progress, target, completed_at, metadata

**profile_endorsements**
- Purpose: Skill endorsements
- Active Usage: UNKNOWN - Phase 3 implementation unclear
- Duplicate Candidate: No
- Orphaned: No
- Classification: EXTENSION
- Columns: id, profile_id, endorser_id, skill, endorsement_text, rating, created_at

**verification_requests**
- Purpose: Profile verification requests
- Active Usage: UNKNOWN - Phase 3 implementation unclear
- Duplicate Candidate: No
- Orphaned: No
- Classification: EXTENSION
- Columns: id, profile_id, verification_type, verification_data, status, submitted_at, reviewed_at, reviewed_by, rejection_reason, notes

#### ENGINEERING DOMAIN TABLES

**engineering_categories**
- Purpose: Engineering categories for project classification
- Active Usage: UNKNOWN - Ecosystem expansion implementation unclear
- Duplicate Candidate: POTENTIAL - Similar to engineering_domains
- Orphaned: No
- Classification: EXTENSION
- Columns: id, name, slug, description, icon, display_order, is_active, created_at, updated_at

**engineering_domains**
- Purpose: Core engineering domains
- Active Usage: UNKNOWN - Engineering ecosystem implementation unclear
- Duplicate Candidate: POTENTIAL - Similar to engineering_categories
- Orphaned: No
- Classification: EXTENSION
- Columns: id, name, slug, description, icon, color, created_at

**engineering_subdomains**
- Purpose: Hierarchical engineering subdomains
- Active Usage: UNKNOWN - Engineering ecosystem implementation unclear
- Duplicate Candidate: No
- Orphaned: No
- Classification: EXTENSION
- Columns: id, domain_id, name, slug, description, created_at

**content_domain_mapping**
- Purpose: AI-powered content classification
- Active Usage: UNKNOWN - Engineering ecosystem implementation unclear
- Duplicate Candidate: No
- Orphaned: No
- Classification: EXTENSION
- Columns: id, content_id, content_type, domain_id, subdomain_id, confidence_score, created_at

#### RESEARCH & DATASETS TABLES

**research_papers**
- Purpose: Research papers and publications
- Active Usage: UNKNOWN - E12 implementation unclear
- Duplicate Candidate: No
- Orphaned: No
- Classification: EXTENSION
- Columns: id, title, authors, abstract, arxiv_id, doi, published_date, venue, citations, domains, technologies, summary, key_findings, created_at, updated_at, domain_id, subdomain_id, pdf_url, keywords

**research_citations**
- Purpose: Research paper citation relationships
- Active Usage: UNKNOWN - E12 implementation unclear
- Duplicate Candidate: No
- Orphaned: No
- Classification: EXTENSION
- Columns: id, citing_paper_id, cited_paper_id, citation_type, context, created_at

**research_similarities**
- Purpose: Research paper similarity analysis
- Active Usage: UNKNOWN - E12 implementation unclear
- Duplicate Candidate: No
- Orphaned: No
- Classification: EXTENSION
- Columns: id, paper_id_1, paper_id_2, similarity_score, similarity_type, reasons, created_at

**datasets**
- Purpose: Dataset catalog and metadata
- Active Usage: UNKNOWN - E13 implementation unclear
- Duplicate Candidate: No
- Orphaned: No
- Classification: EXTENSION
- Columns: id, name, description, source, source_id, url, download_url, license, size, format, domains, technologies, quality_score, completeness_score, popularity_score, downloads, upvotes, created_at, updated_at, domain_id, subdomain_id, author

**dataset_quality**
- Purpose: Dataset quality assessments
- Active Usage: UNKNOWN - E13 implementation unclear
- Duplicate Candidate: No
- Orphaned: No
- Classification: EXTENSION
- Columns: id, dataset_id, completeness, accuracy, consistency, timeliness, relevance, overall_score, issues, recommendations, assessed_at

#### ORGANIZATIONS TABLES

**organizations**
- Purpose: Organization profiles and intelligence
- Active Usage: UNKNOWN - E14 implementation unclear
- Duplicate Candidate: No
- Orphaned: No
- Classification: EXTENSION
- Columns: id, external_id, source, name, legal_name, description, tagline, logo_url, website_url, organization_type, industry, sub_industries, sectors, categories, employee_count, employee_range, founded_year, founded_month, headquarters_location, headquarters_country, headquarters_city, locations, countries, email, phone, linkedin_url, twitter_url, github_url, total_funding, funding_rounds, last_funding_date, last_funding_round, investors, valuation, research_areas, lab_count, patent_count, publication_count, tech_stack, technologies, tools, platforms, github_stars, github_repos, github_contributors, social_followers, alexa_rank, status, acquisition_date, acquired_by, innovation_score, research_score, open_source_score, community_score, overall_score, indexed_at, last_updated_at, processing_status, processed_at, tags, keywords, organization_data, created_at, updated_at

#### KNOWLEDGE GRAPH TABLES

**graph_entities**
- Purpose: Knowledge graph entities
- Active Usage: UNKNOWN - E6 implementation unclear
- Duplicate Candidate: No
- Orphaned: No
- Classification: EXTENSION
- Columns: id, entity_id, entity_type, title, slug, metadata, created_at, updated_at

**graph_relationships**
- Purpose: Knowledge graph relationships
- Active Usage: UNKNOWN - E6 implementation unclear
- Duplicate Candidate: No
- Orphaned: No
- Classification: EXTENSION
- Columns: id, from_entity_id, to_entity_id, relationship_type, weight, metadata, created_at

**graph_entity_types**
- Purpose: Entity type definitions
- Active Usage: UNKNOWN - E6 implementation unclear
- Duplicate Candidate: No
- Orphaned: No
- Classification: EXTENSION
- Columns: id, type_name, display_name, description, color, icon, metadata, created_at

**graph_metrics**
- Purpose: Knowledge graph metrics
- Active Usage: UNKNOWN - E6 implementation unclear
- Duplicate Candidate: No
- Orphaned: No
- Classification: EXTENSION
- Columns: id, metric_name, metric_value, metric_type, entity_type, recorded_at

#### ACQUISITION ENGINE TABLES

**content_sources**
- Purpose: Content source configurations
- Active Usage: UNKNOWN - Acquisition engine implementation unclear
- Duplicate Candidate: No
- Orphaned: No
- Classification: EXTENSION
- Columns: id, name, provider_type, base_url, api_endpoint, auth_config, rate_limit, is_active, priority, last_synced_at, sync_frequency, metadata, created_at, updated_at

**discovery_rules**
- Purpose: Content discovery rules
- Active Usage: UNKNOWN - Acquisition engine implementation unclear
- Duplicate Candidate: No
- Orphaned: No
- Classification: EXTENSION
- Columns: id, source_id, rule_name, rule_type, pattern, weight, is_active, created_at, updated_at

**discovered_content**
- Purpose: Discovered content queue
- Active Usage: UNKNOWN - Acquisition engine implementation unclear
- Duplicate Candidate: No
- Orphaned: No
- Classification: EXTENSION
- Columns: id, source_id, external_id, source_url, content_type, title, description, author, organization, discovery_metadata, discovered_at, processed_at, status, error_message

**content_acquisition_queue**
- Purpose: Main content acquisition queue
- Active Usage: UNKNOWN - Acquisition engine implementation unclear
- Duplicate Candidate: No
- Orphaned: No
- Classification: EXTENSION
- Columns: id, source_id, discovered_id, provider, external_id, source_url, canonical_url, repository_id, content_type, title, description, raw_content, extracted_content, author, author_url, organization, organization_url, screenshot_url, cover_image, screenshots, metadata, tags, categories, content_hash, similarity_score, duplicate_of_id, status, priority, retry_count, max_retries, ai_analysis, ai_summary, ai_tags, ai_categories, ai_quality_score, quality_score, quality_factors, compliance_status, license_type, license_url, compliance_notes, moderation_status, moderator_id, moderation_notes, moderated_at, published_content_id, published_content_type, published_at, scheduled_for, started_at, completed_at, error_message, error_stack, last_error_at, created_at, updated_at, created_by, executive_summary, technical_summary, engineering_overview, tech_stack, difficulty, difficulty_reasoning, domains, learning_outcomes, architecture_components, architecture_data_flow, architecture_system_overview, ai_analysis_status, ai_analyzed_at

**acquisition_jobs**
- Purpose: Acquisition job tracking
- Active Usage: UNKNOWN - Acquisition engine implementation unclear
- Duplicate Candidate: No
- Orphaned: No
- Classification: EXTENSION
- Columns: id, queue_id, job_id, job_type, status, priority, attempts, max_attempts, delay, backoff, data, result, error_message, started_at, completed_at, created_at, updated_at

**content_hashes**
- Purpose: Content hash registry for deduplication
- Active Usage: UNKNOWN - Acquisition engine implementation unclear
- Duplicate Candidate: No
- Orphaned: No
- Classification: EXTENSION
- Columns: id, content_hash, content_type, first_seen_id, first_seen_at, occurrence_count, last_seen_at

**content_clusters**
- Purpose: Similar content clusters
- Active Usage: UNKNOWN - Acquisition engine implementation unclear
- Duplicate Candidate: No
- Orphaned: No
- Classification: EXTENSION
- Columns: id, cluster_name, content_type, canonical_id, similarity_threshold, member_count, created_at, updated_at

**content_cluster_members**
- Purpose: Cluster membership tracking
- Active Usage: UNKNOWN - Acquisition engine implementation unclear
- Duplicate Candidate: No
- Orphaned: No
- Classification: EXTENSION
- Columns: id, cluster_id, content_id, content_type, similarity_score, is_canonical, created_at

**license_registry**
- Purpose: License information registry
- Active Usage: UNKNOWN - Acquisition engine implementation unclear
- Duplicate Candidate: No
- Orphaned: No
- Classification: EXTENSION
- Columns: id, spdx_id, name, is_osi_approved, is_fsf_libre, can_commercially_use, can_modify, can_distribute, can_sublicense, requires_attribution, requires_same_license, requires_documentation, description, compatibility, created_at, updated_at

**compliance_checks**
- Purpose: Compliance check records
- Active Usage: UNKNOWN - Acquisition engine implementation unclear
- Duplicate Candidate: No
- Orphaned: No
- Classification: EXTENSION
- Columns: id, content_id, content_type, check_type, status, result, notes, checked_at, checked_by

**ai_enrichment_tasks**
- Purpose: AI enrichment task tracking
- Active Usage: UNKNOWN - Acquisition engine implementation unclear
- Duplicate Candidate: No
- Orphaned: No
- Classification: EXTENSION
- Columns: id, content_id, task_type, status, input_data, output_data, model_used, tokens_used, processing_time_ms, error_message, queued_at, started_at, completed_at

**extracted_entities**
- Purpose: Extracted entity tracking
- Active Usage: UNKNOWN - Acquisition engine implementation unclear
- Duplicate Candidate: No
- Orphaned: No
- Classification: EXTENSION
- Columns: id, content_id, content_type, entity_type, entity_name, entity_value, confidence, metadata, created_at

#### GAMIFICATION TABLES

**gamification_achievements**
- Purpose: Gamification achievement definitions
- Active Usage: UNKNOWN - Gamification implementation unclear
- Duplicate Candidate: POTENTIAL - Similar to profile_achievements
- Orphaned: No
- Classification: EXTENSION
- Columns: (Not fully defined in examined migrations)

**user_achievements**
- Purpose: User achievement tracking
- Active Usage: UNKNOWN - Gamification implementation unclear
- Duplicate Candidate: POTENTIAL - Similar to profile_achievements
- Orphaned: No
- Classification: EXTENSION
- Columns: (Not fully defined in examined migrations)

### CRITICAL FINDINGS

#### Table Classification Issues
1. **Duplicate Table Candidates:** `engineering_categories` vs `engineering_domains` - Similar purpose, potential redundancy
2. **Duplicate Achievement Systems:** `profile_achievements` vs gamification achievement tables - Potential overlap
3. **Unknown Implementation Status:** Most extension tables have unknown active usage status

#### Schema Drift Concerns
1. **schema.sql vs Migration Mismatch:** schema.sql contains only core tables, migrations define many extension tables
2. **Column Definition Inconsistencies:** Same tables have different column definitions across files
3. **Missing Foreign Keys:** Some relationships lack proper foreign key constraints
4. **RLS Policy Inconsistencies:** RLS policies defined differently across migrations

#### Orphaned Table Risks
1. **Unused Extension Tables:** Many E-engine and intelligence tables may not be actively used
2. **Dead Acquisition Tables:** Complex acquisition engine tables may be abandoned
3. **Test Tables:** Some tables may be development artifacts

### RECOMMENDATIONS

1. **Immediate Actions Required**
   - Query live database to verify actual table existence
   - Identify truly orphaned tables
   - Resolve duplicate table conflicts
   - Standardize table definitions

2. **Schema Governance**
   - Establish single source of truth for schema
   - Implement schema validation
   - Create table deprecation policy
   - Document table dependencies

3. **Database Cleanup**
   - Remove or consolidate duplicate tables
   - Archive unused tables
   - Clean up orphaned data
   - Optimize table structures

### CONCLUSION

**Total Tables Defined:** 70+  
**Core Tables:** 8  
**Extension Tables:** 60+  
**Duplicate Candidates:** 3  
**Unknown Status:** 55+  
**Risk Level:** HIGH

The database schema has grown significantly through migrations with many extension tables whose implementation status is unknown. Without access to the live database, it is impossible to determine which tables are actually in use and which are orphaned.

**Next Step:** Direct database query required to verify table existence and usage.
