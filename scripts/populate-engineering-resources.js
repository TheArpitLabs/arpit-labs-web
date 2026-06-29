// Script to populate Engineering Resource Hub with 20 resources
// Run with: node scripts/populate-engineering-resources.js

require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  logger.error('Missing Supabase credentials. Check your .env.local file.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

const resources = [
  // Arduino Resources (3)
  {
    title: 'Arduino Uno Starter Template',
    slug: 'arduino-uno-starter-template',
    description: 'Complete Arduino Uno project template with sensor integration, LCD display, serial communication, and power management. Includes modular code structure, circuit diagrams, and comprehensive documentation for rapid prototyping.',
    category: 'Arduino Templates',
    price: 7.99,
    featured: true,
    download_url: 'https://github.com/arpit-labs/arduino-uno-template/archive/main.zip',
    documentation_url: 'https://docs.arpit-labs.com/arduino-uno-template',
    cover_image: '/images/marketplace/arduino-uno-template.jpg'
  },
  {
    title: 'Arduino Motor Control Library',
    slug: 'arduino-motor-control-library',
    description: 'Optimized library for DC motor, stepper motor, and servo motor control. Includes PWM control, speed regulation, direction control, and example code for robotics and automation projects.',
    category: 'Arduino Templates',
    price: 12.99,
    featured: false,
    download_url: 'https://github.com/arpit-labs/arduino-motor-control/archive/main.zip',
    documentation_url: 'https://docs.arpit-labs.com/arduino-motor-control',
    cover_image: '/images/marketplace/arduino-motor-control.jpg'
  },
  {
    title: 'Arduino Communication Protocols Bundle',
    slug: 'arduino-communication-protocols-bundle',
    description: 'Complete communication library bundle supporting I2C, SPI, UART, CAN, and OneWire protocols. Includes error handling, multi-device support, and comprehensive examples for various communication scenarios.',
    category: 'Arduino Templates',
    price: 17.99,
    featured: true,
    download_url: 'https://github.com/arpit-labs/arduino-communication/archive/main.zip',
    documentation_url: 'https://docs.arpit-labs.com/arduino-communication',
    cover_image: '/images/marketplace/arduino-communication.jpg'
  },
  // IoT Resources (3)
  {
    title: 'IoT Sensor Integration Kit',
    slug: 'iot-sensor-integration-kit',
    description: 'Comprehensive IoT sensor integration kit supporting temperature, humidity, pressure, light, and motion sensors. Includes calibration routines, data logging, cloud integration, and mobile app templates.',
    category: 'IoT Starter Kits',
    price: 24.99,
    featured: true,
    download_url: 'https://github.com/arpit-labs/iot-sensor-kit/archive/main.zip',
    documentation_url: 'https://docs.arpit-labs.com/iot-sensor-kit',
    cover_image: '/images/marketplace/iot-sensor-kit.jpg'
  },
  {
    title: 'LoRaWAN IoT Development Kit',
    slug: 'lorawan-iot-development-kit',
    description: 'Complete LoRaWAN development kit with long-range communication, device management, gateway integration, and network server setup. Includes firmware, web dashboard, and deployment guides.',
    category: 'IoT Starter Kits',
    price: 39.99,
    featured: false,
    download_url: 'https://github.com/arpit-labs/lorawan-kit/archive/main.zip',
    documentation_url: 'https://docs.arpit-labs.com/lorawan-kit',
    cover_image: '/images/marketplace/lorawan-kit.jpg'
  },
  {
    title: 'IoT Security Best Practices Guide',
    slug: 'iot-security-best-practices-guide',
    description: 'Comprehensive guide covering IoT security vulnerabilities, encryption methods, secure communication, device authentication, and firmware update mechanisms. Includes code examples and security checklists.',
    category: 'IoT Starter Kits',
    price: 19.99,
    featured: true,
    download_url: 'https://github.com/arpit-labs/iot-security-guide/archive/main.zip',
    documentation_url: 'https://docs.arpit-labs.com/iot-security-guide',
    cover_image: '/images/marketplace/iot-security-guide.jpg'
  },
  // AI Resources (3)
  {
    title: 'TensorFlow Lite Edge AI Kit',
    slug: 'tensorflow-lite-edge-ai-kit',
    description: 'Complete TensorFlow Lite implementation kit for edge AI applications. Includes model optimization, quantization, deployment scripts, and example models for image classification and object detection.',
    category: 'AI Project Assets',
    price: 44.99,
    featured: true,
    download_url: 'https://github.com/arpit-labs/tflite-edge-kit/archive/main.zip',
    documentation_url: 'https://docs.arpit-labs.com/tflite-edge-kit',
    cover_image: '/images/marketplace/tflite-edge-kit.jpg'
  },
  {
    title: 'Computer Vision Model Collection',
    slug: 'computer-vision-model-collection',
    description: 'Curated collection of pre-trained computer vision models including YOLO, ResNet, MobileNet, and EfficientNet. Includes inference scripts, model conversion tools, and deployment guides.',
    category: 'AI Project Assets',
    price: 34.99,
    featured: true,
    download_url: 'https://github.com/arpit-labs/cv-models/archive/main.zip',
    documentation_url: 'https://docs.arpit-labs.com/cv-models',
    cover_image: '/images/marketplace/cv-models.jpg'
  },
  {
    title: 'Natural Language Processing Toolkit',
    slug: 'natural-language-processing-toolkit',
    description: 'Complete NLP toolkit with sentiment analysis, text classification, named entity recognition, and language detection. Includes pre-trained models, training pipelines, and API integration examples.',
    category: 'AI Project Assets',
    price: 39.99,
    featured: false,
    download_url: 'https://github.com/arpit-labs/nlp-toolkit/archive/main.zip',
    documentation_url: 'https://docs.arpit-labs.com/nlp-toolkit',
    cover_image: '/images/marketplace/nlp-toolkit.jpg'
  },
  // Cybersecurity Resources (2)
  {
    title: 'Penetration Testing Framework',
    slug: 'penetration-testing-framework',
    description: 'Comprehensive penetration testing framework with vulnerability scanning, exploit modules, reporting tools, and compliance checks. Includes automated testing scripts and manual testing guidelines.',
    category: 'Cybersecurity',
    price: 49.99,
    featured: true,
    download_url: 'https://github.com/arpit-labs/pentest-framework/archive/main.zip',
    documentation_url: 'https://docs.arpit-labs.com/pentest-framework',
    cover_image: '/images/marketplace/pentest-framework.jpg'
  },
  {
    title: 'Security Audit Checklist',
    slug: 'security-audit-checklist',
    description: 'Complete security audit checklist covering web applications, APIs, databases, and infrastructure. Includes automated scanning tools, manual testing procedures, and compliance frameworks.',
    category: 'Cybersecurity',
    price: 29.99,
    featured: false,
    download_url: 'https://github.com/arpit-labs/security-audit/archive/main.zip',
    documentation_url: 'https://docs.arpit-labs.com/security-audit',
    cover_image: '/images/marketplace/security-audit.jpg'
  },
  // Web Development Resources (2)
  {
    title: 'React Component Library',
    slug: 'react-component-library',
    description: 'Premium React component library with 50+ reusable components including buttons, forms, cards, modals, and navigation. Includes TypeScript support, theme customization, and comprehensive documentation.',
    category: 'Web Development',
    price: 29.99,
    featured: true,
    download_url: 'https://github.com/arpit-labs/react-components/archive/main.zip',
    documentation_url: 'https://docs.arpit-labs.com/react-components',
    cover_image: '/images/marketplace/react-components.jpg'
  },
  {
    title: 'Next.js Starter Template',
    slug: 'nextjs-starter-template',
    description: 'Production-ready Next.js starter template with authentication, database integration, API routes, and deployment configuration. Includes TypeScript, Tailwind CSS, and best practices.',
    category: 'Web Development',
    price: 24.99,
    featured: true,
    download_url: 'https://github.com/arpit-labs/nextjs-template/archive/main.zip',
    documentation_url: 'https://docs.arpit-labs.com/nextjs-template',
    cover_image: '/images/marketplace/nextjs-template.jpg'
  },
  // Research Resources (2)
  {
    title: 'Research Paper Template Collection',
    slug: 'research-paper-template-collection',
    description: 'Complete collection of research paper templates for IEEE, ACM, and other formats. Includes LaTeX templates, citation management, figure generation tools, and submission guidelines.',
    category: 'Research Resources',
    price: 19.99,
    featured: false,
    download_url: 'https://github.com/arpit-labs/research-templates/archive/main.zip',
    documentation_url: 'https://docs.arpit-labs.com/research-templates',
    cover_image: '/images/marketplace/research-templates.jpg'
  },
  {
    title: 'Data Analysis Toolkit',
    slug: 'data-analysis-toolkit',
    description: 'Comprehensive data analysis toolkit with Python scripts for data cleaning, visualization, statistical analysis, and machine learning. Includes Jupyter notebooks and example datasets.',
    category: 'Research Resources',
    price: 34.99,
    featured: true,
    download_url: 'https://github.com/arpit-labs/data-analysis/archive/main.zip',
    documentation_url: 'https://docs.arpit-labs.com/data-analysis',
    cover_image: '/images/marketplace/data-analysis.jpg'
  },
  // PCB Design Resources (2)
  {
    title: 'KiCad Project Templates',
    slug: 'kicad-project-templates',
    description: 'Collection of KiCad project templates for common PCB designs including power supplies, microcontroller boards, sensor interfaces, and communication modules. Includes schematic and layout files.',
    category: 'PCB Designs',
    price: 29.99,
    featured: true,
    download_url: 'https://github.com/arpit-labs/kicad-templates/archive/main.zip',
    documentation_url: 'https://docs.arpit-labs.com/kicad-templates',
    cover_image: '/images/marketplace/kicad-templates.jpg'
  },
  {
    title: 'PCB Design Rule Checker',
    slug: 'pcb-design-rule-checker',
    description: 'Automated PCB design rule checker with comprehensive checks for manufacturing, assembly, and signal integrity. Includes custom rule configuration and detailed reporting.',
    category: 'PCB Designs',
    price: 24.99,
    featured: false,
    download_url: 'https://github.com/arpit-labs/pcb-drc/archive/main.zip',
    documentation_url: 'https://docs.arpit-labs.com/pcb-drc',
    cover_image: '/images/marketplace/pcb-drc.jpg'
  },
  // Engineering Templates (1)
  {
    title: 'Engineering Project Documentation Template',
    slug: 'engineering-project-documentation-template',
    description: 'Complete engineering project documentation template covering requirements, design, testing, deployment, and maintenance. Includes templates, checklists, and best practices.',
    category: 'Engineering Templates',
    price: 14.99,
    featured: true,
    download_url: 'https://github.com/arpit-labs/engineering-docs/archive/main.zip',
    documentation_url: 'https://docs.arpit-labs.com/engineering-docs',
    cover_image: '/images/marketplace/engineering-docs.jpg'
  }
];

async function populateEngineeringResources() {
  logger.info('Starting to populate Engineering Resource Hub with 20 resources...');
  
  // First, ensure categories exist
  const categories = [
    'Arduino Templates',
    'IoT Starter Kits',
    'AI Project Assets',
    'Cybersecurity',
    'Web Development',
    'Research Resources',
    'PCB Designs',
    'Engineering Templates'
  ];

  logger.info('Ensuring categories exist...');
  for (const categoryName of categories) {
    const slug = categoryName.toLowerCase().replace(/\s+/g, '-');
    const { error } = await supabase
      .from('marketplace_categories')
      .upsert({ name: categoryName, slug }, { onConflict: 'slug' });
    
    if (error) {
      logger.error(`Error creating category ${categoryName}:`, error.message);
    }
  }

  // Get category IDs
  const { data: categoryData, error: categoryError } = await supabase
    .from('marketplace_categories')
    .select('id, name')
    .in('name', categories);

  if (categoryError) {
    logger.error('Error fetching categories:', categoryError.message);
    process.exit(1);
  }

  const categoryMap = {};
  categoryData.forEach(cat => {
    categoryMap[cat.name] = cat.id;
  });

  // Get a seller ID (first profile)
  const { data: profiles } = await supabase
    .from('profiles')
    .select('id')
    .limit(1);

  const sellerId = profiles && profiles.length > 0 ? profiles[0].id : null;

  let successCount = 0;
  let errorCount = 0;
  const errors = [];

  for (const resource of resources) {
    try {
      // Check if resource already exists
      const { data: existing } = await supabase
        .from('marketplace_items')
        .select('id')
        .eq('slug', resource.slug)
        .single();

      if (existing) {
        logger.info(`⚠️  Resource "${resource.title}" already exists, skipping...`);
        continue;
      }

      const categoryId = categoryMap[resource.category];
      if (!categoryId) {
        throw new Error(`Category not found: ${resource.category}`);
      }

      // Insert resource
      const insertData = {
        title: resource.title,
        slug: resource.slug,
        description: resource.description,
        category_id: categoryId,
        price: resource.price,
        currency: 'USD',
        featured: resource.featured,
        published: true,
        download_url: resource.download_url,
        seller_id: sellerId,
        views_count: 0,
        sales_count: 0,
        revenue: 0.00,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      const { data, error } = await supabase
        .from('marketplace_items')
        .insert([insertData])
        .select();

      if (error) {
        throw error;
      }

      logger.info(`✅ Successfully inserted: ${resource.title}`);
      successCount++;
    } catch (error) {
      logger.error(`❌ Error inserting "${resource.title}":`, error.message);
      errorCount++;
      errors.push({ resource: resource.title, error: error.message });
    }
  }

  logger.info('\n========================================');
  logger.info('Population Summary:');
  logger.info('========================================');
  logger.info(`Total resources processed: ${resources.length}`);
  logger.info(`Successfully inserted: ${successCount}`);
  logger.info(`Skipped (already exists): ${resources.length - successCount - errorCount}`);
  logger.info(`Errors: ${errorCount}`);
  
  if (errors.length > 0) {
    logger.info('\nErrors:');
    errors.forEach(({ resource, error }) => {
      logger.info(`  - ${resource}: ${error}`);
    });
  }

  logger.info('\n========================================');
  logger.info('Verification Query:');
  logger.info('========================================');
  
  const { data: verification } = await supabase
    .from('marketplace_items')
    .select(`
      title,
      marketplace_categories!inner(name),
      price,
      featured
    `)
    .in('slug', resources.map(r => r.slug));

  if (verification) {
    logger.info('\nResources by category:');
    verification.forEach(row => {
      logger.info(`  ${row.marketplace_categories.name}: ${row.title} ($${row.price})`);
    });
  }

  const { count: totalCount } = await supabase
    .from('marketplace_items')
    .select('*', { count: 'exact', head: true });

  logger.info(`\nTotal marketplace items in database: ${totalCount}`);
}

populateEngineeringResources()
  .then(() => {
    logger.info('\n✅ Engineering Resource Hub population completed!');
    process.exit(0);
  })
  .catch((error) => {
    logger.error('\n❌ Fatal error during population:', error);
    process.exit(1);
  });
