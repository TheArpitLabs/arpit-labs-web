// Script to populate domain content for Phase 2
// Run with: node scripts/populate-domain-content.js

require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase credentials. Check your .env.local file.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// Domain configurations
const DOMAIN_CONFIGS = {
  'ai-machine-learning': {
    name: 'AI & Machine Learning',
    targetProjects: 3000,
    subdomains: ['neural-networks', 'computer-vision', 'natural-language-processing', 'deep-learning', 'reinforcement-learning'],
    techStacks: ['Python', 'TensorFlow', 'PyTorch', 'Keras', 'Scikit-learn', 'OpenAI', 'Hugging Face', 'JAX'],
    categories: ['Artificial Intelligence', 'Machine Learning', 'Deep Learning', 'Computer Vision', 'NLP']
  },
  'software-development': {
    name: 'Software Development',
    targetProjects: 2500,
    subdomains: ['web-development', 'mobile-development', 'devops', 'cloud-computing', 'api-development'],
    techStacks: ['JavaScript', 'TypeScript', 'React', 'Node.js', 'Python', 'Java', 'Go', 'Rust', 'Docker', 'Kubernetes'],
    categories: ['Web Development', 'Mobile Development', 'DevOps', 'Cloud Computing', 'API Development']
  },
  'cybersecurity': {
    name: 'Cybersecurity',
    targetProjects: 1500,
    subdomains: ['network-security', 'application-security', 'cryptography', 'penetration-testing', 'incident-response'],
    techStacks: ['Python', 'Go', 'Rust', 'C++', 'Security Tools', 'Penetration Testing Frameworks', 'Cryptography Libraries'],
    categories: ['Network Security', 'Application Security', 'Cryptography', 'Penetration Testing', 'Incident Response']
  }
};

// Project templates for each domain
const PROJECT_TEMPLATES = {
  'ai-machine-learning': [
    {
      title: '{tech} Neural Network',
      description: 'Advanced neural network implementation using {tech} for {application} with state-of-the-art performance and optimization techniques.',
      applications: ['image classification', 'natural language understanding', 'time series prediction', 'recommendation systems', 'anomaly detection']
    },
    {
      title: '{tech} Computer Vision Pipeline',
      description: 'End-to-end computer vision pipeline using {tech} for real-time {application} with optimized inference and deployment capabilities.',
      applications: ['object detection', 'image segmentation', 'face recognition', 'medical imaging', 'autonomous driving']
    },
    {
      title: '{tech} NLP Framework',
      description: 'Comprehensive natural language processing framework built with {tech} for {application} with pre-trained models and custom training capabilities.',
      applications: ['sentiment analysis', 'text classification', 'named entity recognition', 'machine translation', 'question answering']
    },
    {
      title: '{tech} Deep Learning Toolkit',
      description: 'Production-ready deep learning toolkit using {tech} for {application} with distributed training and model serving infrastructure.',
      applications: ['large-scale model training', 'model deployment', 'experiment tracking', 'hyperparameter optimization', 'model monitoring']
    },
    {
      title: '{tech} ML Pipeline',
      description: 'End-to-end machine learning pipeline using {tech} for {application} with automated feature engineering and model management.',
      applications: ['predictive analytics', 'fraud detection', 'customer churn prediction', 'demand forecasting', 'quality prediction']
    }
  ],
  'software-development': [
    {
      title: '{tech} Web Framework',
      description: 'Modern web framework built with {tech} for {application} featuring high performance, developer experience, and production-ready capabilities.',
      applications: ['single-page applications', 'server-side rendering', 'static site generation', 'progressive web apps', 'real-time applications']
    },
    {
      title: '{tech} API Gateway',
      description: 'Scalable API gateway solution using {tech} for {application} with rate limiting, authentication, and comprehensive monitoring.',
      applications: ['microservices architecture', 'API management', 'service mesh', 'load balancing', 'API security']
    },
    {
      title: '{tech} DevOps Platform',
      description: 'Complete DevOps platform built with {tech} for {application} with CI/CD pipelines, infrastructure as code, and automated deployments.',
      applications: ['continuous integration', 'continuous deployment', 'infrastructure automation', 'monitoring and alerting', 'log management']
    },
    {
      title: '{tech} Cloud Native Toolkit',
      description: 'Cloud-native development toolkit using {tech} for {application} with container orchestration and service discovery capabilities.',
      applications: ['container orchestration', 'service mesh', 'serverless computing', 'cloud storage', 'database management']
    },
    {
      title: '{tech} Mobile Development Kit',
      description: 'Cross-platform mobile development kit using {tech} for {application} with native performance and comprehensive UI components.',
      applications: ['iOS development', 'Android development', 'cross-platform apps', 'mobile-first design', 'progressive web apps']
    }
  ],
  'cybersecurity': [
    {
      title: '{tech} Security Scanner',
      description: 'Advanced security scanning tool using {tech} for {application} with comprehensive vulnerability detection and reporting capabilities.',
      applications: ['network security scanning', 'application security testing', 'container security', 'cloud security', 'compliance monitoring']
    },
    {
      title: '{tech} Penetration Testing Framework',
      description: 'Professional penetration testing framework built with {tech} for {application} with automated exploits and comprehensive reporting.',
      applications: ['network penetration testing', 'web application security', 'social engineering', 'physical security', 'red team operations']
    },
    {
      title: '{tech} Cryptography Library',
      description: 'Modern cryptography library implemented in {tech} for {application} with secure implementations and comprehensive algorithm support.',
      applications: ['data encryption', 'digital signatures', 'secure communication', 'key management', 'hash functions']
    },
    {
      title: '{tech} Incident Response Platform',
      description: 'Enterprise incident response platform using {tech} for {application} with automated workflows and comprehensive threat intelligence.',
      applications: ['security incident management', 'threat hunting', 'forensics analysis', 'malware analysis', 'security orchestration']
    },
    {
      title: '{tech} Security Monitoring System',
      description: 'Real-time security monitoring system built with {tech} for {application} with anomaly detection and automated response capabilities.',
      applications: ['network monitoring', 'endpoint security', 'log analysis', 'behavioral analytics', 'threat detection']
    }
  ]
};

// Helper functions
function getRandomItem(array) {
  return array[Math.floor(Math.random() * array.length)];
}

function getRandomNumber(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function generateSlug(title) {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

function generateProject(domainSlug, index) {
  const config = DOMAIN_CONFIGS[domainSlug];
  const template = getRandomItem(PROJECT_TEMPLATES[domainSlug]);
  const tech = getRandomItem(config.techStacks);
  const application = getRandomItem(template.applications);
  const subdomain = getRandomItem(config.subdomains);
  const category = getRandomItem(config.categories);

  const title = template.title
    .replace('{tech}', tech)
    .replace('{application}', application.charAt(0).toLowerCase() + application.slice(1));

  const description = template.description
    .replace('{tech}', tech)
    .replace('{application}', application.toLowerCase());

  const uniqueSlug = `${generateSlug(title)}-${index + 1}`;
  
  return {
    title: `${title} ${index + 1}`,
    slug: uniqueSlug,
    description: description,
    content: `A comprehensive ${title.toLowerCase()} solution designed for ${application.toLowerCase()} scenarios with production-ready implementation. Built using ${tech} with modern software architecture patterns.`,
    category: category,
    tags: [category, subdomain, tech, application, 'Open Source', 'Production Ready'],
    github_url: `https://github.com/example/${uniqueSlug}`,
    demo_url: Math.random() > 0.5 ? `https://demo.example.com/${uniqueSlug}` : null,
    cover_image: `/images/projects/${uniqueSlug}-cover.jpg`,
    featured: index < 10, // First 10 projects are featured
    project_type: 'software',
    status: 'published',
    branch: 'Engineering',
    domain: config.name,
    views_count: getRandomNumber(100, 5000),
    likes_count: getRandomNumber(10, 500),
    created_at: new Date(Date.now() - getRandomNumber(0, 365 * 24 * 60 * 60 * 1000)).toISOString(),
    updated_at: new Date(Date.now() - getRandomNumber(0, 30 * 24 * 60 * 60 * 1000)).toISOString()
  };
}

async function getDomainId(domainSlug) {
  // Since engineering_domains table doesn't exist, return null
  // We'll use the domain text field instead
  return null;
}

async function getSubdomainId(domainId, subdomainSlug) {
  // Since engineering_subdomains table doesn't exist, return null
  // We'll use the category text field instead
  return null;
}

async function populateDomain(domainSlug, targetCount) {
  console.log(`\n=== Populating ${domainSlug} domain with ${targetCount} projects ===`);
  
  const config = DOMAIN_CONFIGS[domainSlug];
  
  // Get current project count for this domain using text field
  const { data: existingProjects, error: countError } = await supabase
    .from('projects')
    .select('id', { count: 'exact' })
    .eq('domain', config.name);

  const currentCount = existingProjects?.length || 0;
  const projectsToCreate = Math.max(0, targetCount - currentCount);

  console.log(`Current projects: ${currentCount}`);
  console.log(`Target projects: ${targetCount}`);
  console.log(`Projects to create: ${projectsToCreate}`);

  if (projectsToCreate === 0) {
    console.log('Domain already has sufficient projects. Skipping.');
    return;
  }

  // Create projects in batches
  const batchSize = 50;
  let createdCount = 0;

  for (let i = 0; i < projectsToCreate; i += batchSize) {
    const batch = Math.min(batchSize, projectsToCreate - i);
    const projects = [];

    for (let j = 0; j < batch; j++) {
      const project = generateProject(domainSlug, currentCount + i + j);
      
      // Remove foreign key fields that don't exist in current schema
      delete project.domain_id;
      delete project.subdomain_id;
      
      // Ensure domain is set as text field (category is already set in generateProject)
      project.domain = config.name;
      
      projects.push(project);
    }

    try {
      const { data: insertedData, error: insertError } = await supabase
        .from('projects')
        .insert(projects)
        .select('id');

      if (insertError) {
        console.error(`Error inserting batch ${i / batchSize + 1}:`, insertError);
        continue;
      }

      createdCount += insertedData.length;
      console.log(`Created batch ${i / batchSize + 1}: ${insertedData.length} projects (Total: ${createdCount}/${projectsToCreate})`);

      // Add delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 100));

    } catch (error) {
      console.error(`Error in batch ${i / batchSize + 1}:`, error);
    }
  }

  console.log(`\n✅ Successfully populated ${domainSlug} domain with ${createdCount} new projects`);
  console.log(`📊 Total projects in domain: ${currentCount + createdCount}`);
}

async function updateDomainStatistics(domainSlug) {
  console.log(`\n=== Updating statistics for ${domainSlug} ===`);

  const config = DOMAIN_CONFIGS[domainSlug];
  
  // Count projects using domain text field
  const { count: projectCount } = await supabase
    .from('projects')
    .select('*', { count: 'exact', head: true })
    .eq('domain', config.name);

  // Since engineering_domains table doesn't exist, just log the statistics
  console.log(`📊 ${config.name}: ${projectCount || 0} projects`);
}

async function main() {
  console.log('🚀 Starting Phase 2 Domain Content Population');
  console.log('===========================================');

  const args = process.argv.slice(2);
  const domainFilter = args[0]; // Optional: specific domain to populate

  const domainsToPopulate = domainFilter 
    ? (DOMAIN_CONFIGS[domainFilter] ? [domainFilter] : [])
    : Object.keys(DOMAIN_CONFIGS);

  if (domainsToPopulate.length === 0) {
    console.error(`Invalid domain: ${domainFilter}`);
    console.log('Available domains:', Object.keys(DOMAIN_CONFIGS).join(', '));
    process.exit(1);
  }

  for (const domainSlug of domainsToPopulate) {
    const config = DOMAIN_CONFIGS[domainSlug];
    await populateDomain(domainSlug, config.targetProjects);
    await updateDomainStatistics(domainSlug);
  }

  console.log('\n🎉 Phase 2 Domain Content Population Complete!');
  console.log('===========================================');
}

main().catch(console.error);
