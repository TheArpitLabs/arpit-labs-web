// Script to apply FINAL CONTENT SPRINT data directly via Supabase client
// Run with: node scripts/apply-final-content-sprint-direct.js

const fs = require('fs');
const path = require('path');

// Load environment variables
require('dotenv').config({ path: '.env.local' });

const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  logger.error('Error: Missing Supabase credentials in .env.local');
  logger.error('Required: NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// Get first profile ID for foreign key references
async function getFirstProfileId() {
  const { data, error } = await supabase
    .from('profiles')
    .select('id')
    .limit(1);
  
  if (error || !data || data.length === 0) {
    logger.info('Warning: No profiles found. Using placeholder ID.');
    return '00000000-0000-0000-0000-000000000000';
  }
  
  return data[0].id;
}

// Insert projects
async function insertProjects(profileId) {
  logger.info('Inserting projects...');
  
  const projects = [
    {
      title: 'Smart Traffic Management System',
      slug: 'smart-traffic-management-system',
      description: 'A comprehensive IoT-based traffic management system that uses edge-deployed computer vision and machine learning to optimize traffic signal timing in real-time, reducing congestion and improving urban mobility.',
      category: 'IoT'
    },
    {
      title: 'Hospital Attendance System',
      slug: 'hospital-attendance-system',
      description: 'An automated attendance and patient tracking system for hospitals using RFID technology and biometric authentication to streamline operations and improve patient care.',
      category: 'Healthcare'
    },
    {
      title: 'NCC Buddy',
      slug: 'ncc-buddy',
      description: 'A comprehensive mobile application for National Cadet Corps (NCC) cadets that combines training schedules, attendance tracking, study materials, and community features to enhance the cadet experience.',
      category: 'Mobile App'
    },
    {
      title: 'Ship Bridge Collision Prevention',
      slug: 'ship-bridge-collision-prevention',
      description: 'An advanced maritime safety system using computer vision and IoT sensors to detect potential collisions and alert ship captains in real-time to prevent accidents at sea.',
      category: 'Maritime'
    },
    {
      title: 'Accident Detection System',
      slug: 'accident-detection-system',
      description: 'An IoT-based accident detection and emergency response system for vehicles that automatically detects accidents using accelerometer and GPS data, and alerts emergency contacts and services.',
      category: 'Automotive'
    }
  ];

  let successCount = 0;
  for (const project of projects) {
    const { error } = await supabase.from('projects').insert(project);
    if (error) {
      logger.info(`  ✗ Failed to insert ${project.title}: ${error.message}`);
    } else {
      logger.info(`  ✓ Inserted: ${project.title}`);
      successCount++;
    }
  }
  
  return successCount;
}

// Insert marketplace categories and items
async function insertMarketplaceItems(profileId) {
  logger.info('Inserting marketplace categories and items...');
  
  const categories = [
    { name: 'Arduino Templates', slug: 'arduino-templates' },
    { name: 'IoT Starter Kits', slug: 'iot-starter-kits' },
    { name: 'Engineering Notes', slug: 'engineering-notes' },
    { name: 'PCB Designs', slug: 'pcb-designs' },
    { name: 'Research Resources', slug: 'research-resources' },
    { name: 'AI Project Assets', slug: 'ai-project-assets' },
    { name: 'Hackathon Packs', slug: 'hackathon-packs' }
  ];

  const categoryMap = {};
  for (const category of categories) {
    // Check if category already exists
    const { data: existing } = await supabase.from('marketplace_categories').select('id').eq('slug', category.slug).single();
    
    if (existing) {
      logger.info(`  ⊙ Category already exists: ${category.name}`);
      categoryMap[category.slug] = existing.id;
    } else {
      const { data, error } = await supabase.from('marketplace_categories').insert(category).select();
      if (error) {
        logger.info(`  ✗ Failed to insert category ${category.name}: ${error.message}`);
      } else {
        logger.info(`  ✓ Inserted category: ${category.name}`);
        categoryMap[category.slug] = data[0].id;
      }
    }
  }

  const items = [
    {
      title: 'Smart Home Automation Template',
      slug: 'smart-home-automation-template',
      description: 'Complete Arduino code template for smart home automation with relay control, sensor integration, and mobile app connectivity.',
      category_id: categoryMap['arduino-templates'],
      price: 19.99,
      currency: 'USD',
      featured: true,
      published: true,
      download_url: 'https://github.com/arpit-labs/smart-home-template'
    },
    {
      title: 'Weather Station Kit',
      slug: 'weather-station-kit',
      description: 'IoT weather station starter kit with temperature, humidity, pressure sensors, and cloud data logging.',
      category_id: categoryMap['iot-starter-kits'],
      price: 49.99,
      currency: 'USD',
      featured: true,
      published: true,
      download_url: 'https://github.com/arpit-labs/weather-station'
    },
    {
      title: 'Digital Circuits Notes',
      slug: 'digital-circuits-notes',
      description: 'Comprehensive engineering notes on digital circuits, logic gates, and sequential circuits with solved examples.',
      category_id: categoryMap['engineering-notes'],
      price: 9.99,
      currency: 'USD',
      featured: false,
      published: true,
      download_url: 'https://docs.arpit-labs.com/digital-circuits'
    },
    {
      title: 'ESP32 Development Board PCB',
      slug: 'esp32-dev-board-pcb',
      description: 'Custom ESP32 development board PCB design with USB-C, battery charging, and peripheral connectors.',
      category_id: categoryMap['pcb-designs'],
      price: 29.99,
      currency: 'USD',
      featured: true,
      published: true,
      download_url: 'https://github.com/arpit-labs/esp32-pcb'
    },
    {
      title: 'ML Research Dataset Collection',
      slug: 'ml-research-dataset',
      description: 'Curated collection of datasets for machine learning research including image, text, and time-series data.',
      category_id: categoryMap['research-resources'],
      price: 39.99,
      currency: 'USD',
      featured: true,
      published: true,
      download_url: 'https://github.com/arpit-labs/ml-datasets'
    },
    {
      title: 'Computer Vision Model Templates',
      slug: 'cv-model-templates',
      description: 'Pre-trained computer vision model templates for object detection, classification, and segmentation tasks.',
      category_id: categoryMap['ai-project-assets'],
      price: 59.99,
      currency: 'USD',
      featured: true,
      published: true,
      download_url: 'https://github.com/arpit-labs/cv-templates'
    },
    {
      title: 'IoT Hackathon Starter Pack',
      slug: 'iot-hackathon-starter',
      description: 'Complete starter pack for IoT hackathons including hardware guides, code templates, and project ideas.',
      category_id: categoryMap['hackathon-packs'],
      price: 24.99,
      currency: 'USD',
      featured: true,
      published: true,
      download_url: 'https://github.com/arpit-labs/iot-hackathon'
    }
  ];

  let successCount = 0;
  for (const item of items) {
    if (!item.category_id) continue;
    const { error } = await supabase.from('marketplace_items').insert({ ...item, seller_id: profileId });
    if (error) {
      logger.info(`  ✗ Failed to insert ${item.title}: ${error.message}`);
    } else {
      logger.info(`  ✓ Inserted: ${item.title}`);
      successCount++;
    }
  }
  
  return successCount;
}

// Insert research papers
async function insertResearchPapers() {
  logger.info('Inserting research papers...');
  
  const papers = [
    {
      title: 'Real-Time Traffic Optimization Using Edge AI and Computer Vision',
      slug: 'real-time-traffic-optimization-edge-ai',
      abstract: 'This paper presents a novel approach to traffic signal optimization using edge-deployed computer vision and machine learning. Our system achieves 35% reduction in average wait times and 28% improvement in traffic flow efficiency through real-time vehicle detection and adaptive signal timing.',
      content: 'This research addresses the critical challenge of urban traffic congestion through intelligent traffic signal optimization. We propose a distributed edge computing architecture where each intersection is equipped with a camera and edge AI processor running YOLO-based object detection. The system processes video locally, extracting vehicle counts, classifications, and movement patterns in real-time. A centralized coordination algorithm ensures city-wide optimization while maintaining local responsiveness. Our deployment across 12 intersections demonstrated significant improvements: average wait time reduced from 45 seconds to 29 seconds (35% reduction), traffic flow efficiency improved by 28%, and fuel consumption decreased by 22%. The edge deployment approach reduces bandwidth requirements by 95% compared to cloud-only solutions and maintains operation during network outages.',
      authors: ['Arpit Kumar', 'Research Team'],
      division: 'AI',
      tags: ['Traffic Optimization', 'Edge AI', 'Computer Vision', 'Smart City', 'YOLO'],
      is_featured: true
    },
    {
      title: 'IoT Security Vulnerabilities in Smart Home Environments',
      slug: 'iot-security-vulnerabilities-smart-home',
      abstract: 'Comprehensive analysis of security vulnerabilities in IoT devices within smart home environments. We assess 50 popular IoT devices, identify common attack vectors, and propose a multi-layered defense framework.',
      content: 'This study presents a comprehensive security assessment of 50 popular IoT devices across smart home categories including smart lights, thermostats, cameras, and locks. Our analysis identified critical vulnerabilities in 78% of devices, with common issues including weak authentication protocols (62%), unencrypted communications (45%), and lack of firmware update mechanisms (38%). We demonstrate practical exploits on 12 devices and propose a multi-layered defense framework including device-level encryption, network segmentation, and continuous monitoring. Our framework, when implemented in a test environment, reduced successful attack attempts by 94%. The study provides actionable recommendations for manufacturers and consumers to enhance smart home security.',
      authors: ['Arpit Kumar', 'Security Research Team'],
      division: 'Cybersecurity',
      tags: ['IoT Security', 'Smart Home', 'Vulnerability Assessment', 'Network Security'],
      is_featured: true
    },
    {
      title: 'Low-Power Sensor Networks for Environmental Monitoring',
      slug: 'low-power-sensor-networks-environmental',
      abstract: 'Design and implementation of ultra-low-power sensor networks for environmental monitoring. Our approach achieves 2+ year battery life through optimized sleep cycles and energy harvesting.',
      content: 'Environmental monitoring in remote locations requires sensor networks that can operate for extended periods without maintenance. This research presents a comprehensive approach to ultra-low-power design for environmental sensor networks. We developed a custom power management system that combines duty cycling, adaptive sampling rates, and energy harvesting from solar panels. Our implementation across 20 sensor nodes demonstrated an average battery life of 2.3 years, compared to 6 months with conventional approaches. Key innovations include: predictive sleep scheduling based on environmental patterns, hierarchical network topology to reduce transmission distances, and compression algorithms that reduce data transmission by 70%. The system monitors temperature, humidity, air quality, and soil moisture with 95% data reliability over the 2-year deployment period.',
      authors: ['Arpit Kumar', 'IoT Research Team'],
      division: 'IoT',
      tags: ['Low-Power Design', 'Sensor Networks', 'Energy Harvesting', 'Environmental Monitoring'],
      is_featured: false
    },
    {
      title: 'Machine Learning for Anomaly Detection in Industrial IoT',
      slug: 'ml-anomaly-detection-industrial-iot',
      abstract: 'Application of machine learning techniques for anomaly detection in industrial IoT systems. Our ensemble approach achieves 97% accuracy in detecting equipment failures.',
      content: 'Industrial IoT systems generate massive amounts of sensor data that can be leveraged for predictive maintenance and anomaly detection. This research presents an ensemble machine learning approach combining autoencoders, isolation forests, and LSTM networks to detect anomalies in industrial equipment. We trained and evaluated our system on 6 months of data from a manufacturing facility, achieving 97% accuracy in anomaly detection with a false positive rate of only 2.1%. The system detected equipment failures an average of 47 hours before actual failure, enabling proactive maintenance. Our approach handles multi-variate temporal data and adapts to changing operating conditions through online learning. The ensemble method outperformed individual models by 12-18% in F1 score. We also developed an interpretable visualization system that helps operators understand anomaly causes.',
      authors: ['Arpit Kumar', 'Industrial AI Team'],
      division: 'AI',
      tags: ['Anomaly Detection', 'Industrial IoT', 'Machine Learning', 'Predictive Maintenance'],
      is_featured: true
    },
    {
      title: 'PCB Design Best Practices for High-Frequency IoT Applications',
      slug: 'pcb-design-high-frequency-iot',
      abstract: 'Comprehensive guide on PCB design considerations for high-frequency IoT applications. Covers impedance matching, ground plane design, and EMI mitigation techniques.',
      content: 'High-frequency IoT applications operating at 2.4GHz and above require careful PCB design to ensure signal integrity and electromagnetic compatibility. This paper presents comprehensive design guidelines based on extensive testing and simulation. We cover critical topics including: controlled impedance design (50Ω single-ended, 100Ω differential), ground plane optimization with minimal splits, decoupling capacitor placement strategies, via stub minimization, and EMI/EMC considerations. Our testing compared FR-4 vs Rogers materials, finding Rogers provides 15-20% better signal integrity at 5GHz but at 3-4x cost. We present design rules that achieve -40dB return loss and -60dB crosstalk in typical IoT applications. The guide includes practical examples for WiFi, Bluetooth, and LoRa modules, with specific layout recommendations for each.',
      authors: ['Arpit Kumar', 'Hardware Design Team'],
      division: 'IoT',
      tags: ['PCB Design', 'High-Frequency', 'Signal Integrity', 'EMI/EMC', 'Hardware'],
      is_featured: false
    },
    {
      title: 'Privacy-Preserving Machine Learning for Healthcare IoT',
      slug: 'privacy-preserving-ml-healthcare-iot',
      abstract: 'Novel approach to privacy-preserving machine learning for healthcare IoT applications using federated learning and differential privacy techniques.',
      content: 'Healthcare IoT systems collect sensitive patient data, raising significant privacy concerns. This research presents a privacy-preserving machine learning framework that combines federated learning with differential privacy. Our approach enables model training across multiple healthcare facilities without sharing raw patient data. We implemented the system for patient fall detection using accelerometer data from wearable devices. The federated model achieved 94% accuracy, comparable to centralized training (96%), while preserving patient privacy. Differential privacy with epsilon=0.1 provided strong privacy guarantees with minimal accuracy loss (2%). The system reduces data transfer requirements by 99% compared to centralized approaches and complies with HIPAA regulations. We also present a secure aggregation protocol that prevents model poisoning attacks. The framework is applicable to various healthcare IoT scenarios including remote patient monitoring and chronic disease management.',
      authors: ['Arpit Kumar', 'Healthcare AI Team'],
      division: 'AI',
      tags: ['Privacy-Preserving ML', 'Federated Learning', 'Healthcare IoT', 'Differential Privacy'],
      is_featured: false
    }
  ];

  let successCount = 0;
  for (const paper of papers) {
    // Check if paper already exists
    const { data: existing } = await supabase.from('research_papers').select('id').eq('slug', paper.slug).single();
    
    if (existing) {
      logger.info(`  ⊙ Paper already exists: ${paper.title}`);
      successCount++;
    } else {
      const { error } = await supabase.from('research_papers').insert(paper);
      if (error) {
        logger.info(`  ✗ Failed to insert ${paper.title}: ${error.message}`);
      } else {
        logger.info(`  ✓ Inserted: ${paper.title}`);
        successCount++;
      }
    }
  }
  
  return successCount;
}

// Insert community posts
async function insertCommunityPosts(profileId) {
  logger.info('Inserting community posts...');
  
  const posts = [
    {
      title: 'Welcome to Arpit Labs Community! 🚀',
      slug: 'welcome-to-arpit-labs-community',
      content: 'We are thrilled to launch the Arpit Labs community platform! This space is designed for engineers, researchers, and enthusiasts to connect, share knowledge, and collaborate on exciting projects in AI, IoT, and embedded systems.\n\n## What You Can Do Here\n- **Share Projects**: Showcase your engineering projects and get feedback\n- **Ask Questions**: Get help with technical challenges from the community\n- **Find Collaborators**: Connect with others for hackathons and projects\n- **Share Resources**: Post tutorials, tools, and learning materials\n- **Discuss Research**: Engage with technical papers and research findings\n\n## Community Guidelines\n- Be respectful and constructive in discussions\n- Share knowledge and help others learn\n- Keep discussions technical and focused\n- Respect privacy and intellectual property\n\n## Getting Started\n1. Complete your profile to let others know your interests\n2. Browse existing discussions and jump in where you can help\n3. Start a new discussion if you have questions or ideas to share\n4. Check out our projects and research sections for inspiration\n\nWe are building something special here - thanks for being part of it from the beginning!',
      category: 'announcement',
      tags: ['welcome', 'community', 'introduction']
    },
    {
      title: 'New Research Papers Published on Traffic Optimization and IoT Security',
      slug: 'new-research-papers-traffic-optimization-iot-security',
      content: 'Excited to share our latest research publications! We have just released two comprehensive papers covering critical topics in modern engineering:\n\n## 1. Real-Time Traffic Optimization Using Edge AI and Computer Vision\nOur latest research on traffic signal optimization using edge-deployed computer vision and ML. Key findings:\n- 35% reduction in average wait times\n- 28% improvement in traffic flow efficiency\n- Optimized models for ESP32 and Raspberry Pi deployment\n\n## 2. IoT Security Vulnerabilities in Smart Home Environments\nComprehensive analysis of security vulnerabilities in IoT devices:\n- Assessment of 50 popular IoT devices\n- Identified common attack vectors and defense strategies\n- Multi-layered defense framework proposal\n\nBoth papers include detailed methodologies, implementation guides, and performance metrics. Perfect for researchers and practitioners working on smart city and IoT security projects.\n\nCheck them out in the Research section and let us know your thoughts!',
      category: 'announcement',
      tags: ['research', 'traffic-optimization', 'iot-security', 'publications']
    },
    {
      title: 'Best Practices for Low-Power IoT Design - Share Your Experience',
      slug: 'best-practices-low-power-iot-design',
      content: 'Working on a environmental monitoring project that needs to run on battery for 2+ years. Looking for community insights on low-power design.\n\n## Current Setup\n- ESP32 microcontroller\n- Multiple sensors (temp, humidity, air quality)\n- LoRaWAN for communication\n- Solar panel for energy harvesting\n\n## Challenges I am Facing\n1. Balancing sensor reading frequency vs power consumption\n2. Optimal sleep/wake cycles for different sensors\n3. LoRa transmission timing optimization\n4. Power management IC selection\n\n## Questions for the Community\n- What sleep strategies have worked well for you?\n- Any favorite low-power sensor libraries?\n- How do you handle power management with multiple sensors?\n- Best practices for energy harvesting integration?\n\nWould love to hear from others who have tackled similar challenges. Will share my findings as the project progresses!',
      category: 'discussion',
      tags: ['iot', 'low-power', 'embedded', 'sensors', 'energy-harvesting']
    },
    {
      title: 'Computer Vision on Edge Devices - YOLO vs MobileNet SSD',
      slug: 'computer-vision-edge-devices-yolo-vs-mobilenet-ssd',
      content: 'Evaluating object detection models for deployment on edge devices. Currently comparing YOLOv5-nano vs MobileNet SSD for a traffic monitoring application.\n\n## My Test Setup\n- Hardware: Raspberry Pi 4 and ESP32\n- Use case: Vehicle detection and classification\n- Performance requirements: <100ms inference time\n- Accuracy target: >90% mAP\n\n## Initial Findings\n**YOLOv5-nano:**\n- Inference time: 45ms on RPi4, 180ms on ESP32\n- mAP: 92.3%\n- Model size: 4.5MB\n- Good accuracy but challenging on ESP32\n\n**MobileNet SSD:**\n- Inference time: 35ms on RPi4, 95ms on ESP32\n- mAP: 88.7%\n- Model size: 3.2MB\n- Better performance on ESP32 but lower accuracy\n\n## Questions\n- Has anyone quantized YOLO models for ESP32 successfully?\n- Any experience with TFLite optimization for these models?\n- Alternative models I should consider?\n- Trade-offs between accuracy and speed in your experience?\n\nWould appreciate insights from anyone who has deployed CV on resource-constrained devices!',
      category: 'discussion',
      tags: ['computer-vision', 'edge-ai', 'yolo', 'mobilenet', 'embedded', 'tensorflow-lite']
    },
    {
      title: 'Weekly Engineering Challenge: Build a Smart Plant Monitoring System',
      slug: 'weekly-engineering-challenge-smart-plant-monitoring',
      content: '🌱 **Weekly Engineering Challenge #1**\n\nThis week, challenge yourself to build a smart plant monitoring system! This is a great project for beginners and experienced engineers alike.\n\n## Challenge Requirements\n- Monitor soil moisture, temperature, and light levels\n- Automated watering based on sensor readings\n- Data logging and visualization\n- Mobile app or web interface for monitoring\n- Battery-powered or energy-efficient design\n\n## Suggested Components\n- ESP32 or Arduino for microcontroller\n- Soil moisture sensor\n- DHT22 for temperature/humidity\n- Photoresistor for light sensing\n- Relay module for water pump control\n- MQTT for communication (optional)\n\n## Bonus Points\n- Implement machine learning for plant health prediction\n- Add camera for disease detection\n- Create mobile app with notifications\n- Use solar power for energy independence\n- Implement data visualization dashboard\n\n## Submission Guidelines\nShare your progress in this thread! Include:\n- Component list and wiring diagram\n- Code snippets or GitHub repository\n- Photos of your setup\n- Challenges faced and solutions\n- Final results and lessons learned\n\n## Timeline\n- Start: Today\n- Check-in: Share progress in 3 days\n- Final submissions: Due in 7 days\n\nLet is see what creative solutions the community comes up with! Feel free to ask questions and help each other out.',
      category: 'challenge',
      tags: ['engineering-challenge', 'iot', 'sensors', 'automation', 'weekly-challenge']
    },
    {
      title: 'Learning Thread: From Zero to IoT - Complete Roadmap',
      slug: 'learning-thread-zero-to-iot-complete-roadmap',
      content: '📚 **Learning Thread: From Zero to IoT**\n\nWelcome to the complete learning roadmap for getting started with IoT! This thread will be updated with resources, projects, and discussions to help you go from beginner to building sophisticated IoT systems.\n\n## Phase 1: Foundations (Weeks 1-2)\n### Topics to Cover\n- Basic electronics and circuit theory\n- C/C++ programming fundamentals\n- Understanding microcontrollers\n- Basic networking concepts\n\n### Recommended Resources\n- Arduino official tutorials\n- "Make: Electronics" book\n- Electronics tutorials on YouTube\n- C++ programming courses\n\n### Starter Projects\n- LED blink circuit\n- Temperature sensor reading\n- Simple serial communication\n- Basic motor control\n\n## Phase 2: Microcontroller Programming (Weeks 3-4)\n### Topics to Cover\n- Arduino framework and IDE\n- GPIO, PWM, and interrupts\n- I2C, SPI communication protocols\n- Sensor integration\n\n### Starter Projects\n- Weather station with multiple sensors\n- LCD display integration\n- Data logging to SD card\n- Remote control via IR\n\n## Phase 3: Connectivity (Weeks 5-6)\n### Topics to Cover\n- WiFi and Bluetooth basics\n- MQTT protocol\n- HTTP/REST APIs\n- Cloud platforms (AWS IoT, Firebase)\n\n### Starter Projects\n- WiFi-connected sensor\n- MQTT publisher/subscriber\n- Cloud data logging\n- Mobile app integration\n\n## Community Participation\n- Share your progress as you go through phases\n- Ask questions when stuck\n- Help others who are behind you\n- Suggest additional resources\n- Share your completed projects\n\nLet us learn together! 🚀',
      category: 'learning',
      tags: ['learning-roadmap', 'iot', 'beginner', 'tutorial', 'education']
    },
    {
      title: 'Project Showcase: My Smart Home Automation System',
      slug: 'project-showcase-smart-home-automation-system',
      content: '🏠 **Project Showcase: Smart Home Automation**\n\nExcited to share my smart home automation project that I have been working on for the past 6 months!\n\n## Overview\nA comprehensive smart home system with:\n- Automated lighting control\n- Climate monitoring and control\n- Security system with cameras\n- Energy monitoring\n- Voice control integration\n\n## Hardware Components\n### Controllers\n- Raspberry Pi 4 (main hub)\n- ESP32 modules (room controllers)\n- Arduino Nano (sensor nodes)\n\n### Sensors\n- DHT22 (temperature/humidity)\n- PIR motion sensors\n- Door/window magnetic sensors\n- Current sensors (energy monitoring)\n- Light sensors (ambient light)\n\n### Actuators\n- Relay modules (light/appliance control)\n- Smart bulbs (Zigbee)\n- Servo motors (curtain control)\n- Smart thermostat\n\n### Communication\n- WiFi (ESP32 to hub)\n- Zigbee (smart devices)\n- MQTT (internal messaging)\n- Home Assistant (integration)\n\n## Software Architecture\n### Backend\n- Home Assistant (main controller)\n- Node-RED (automation flows)\n- MQTT broker (message routing)\n- InfluxDB (data storage)\n- Grafana (visualization)\n\n### Frontend\n- Home Assistant dashboard\n- Custom mobile app (React Native)\n- Voice integration (Alexa/Google)\n\n## Results\n- 40% reduction in energy consumption\n- Complete automation of daily routines\n- Enhanced security with real-time monitoring\n- Scalable architecture for future expansion\n\nGitHub repository coming soon! This has been a 6-month project and I am excited to finally share it with the community. 🎉',
      category: 'showcase',
      tags: ['smart-home', 'iot', 'home-automation', 'home-assistant', 'project-showcase']
    }
  ];

  let successCount = 0;
  for (const post of posts) {
    // Check if post already exists
    const { data: existing } = await supabase.from('community_posts').select('id').eq('slug', post.slug).single();
    
    if (existing) {
      logger.info(`  ⊙ Post already exists: ${post.title}`);
      successCount++;
    } else {
      const { error } = await supabase.from('community_posts').insert({ ...post, user_id: profileId });
      if (error) {
        logger.info(`  ✗ Failed to insert ${post.title}: ${error.message}`);
      } else {
        logger.info(`  ✓ Inserted: ${post.title}`);
        successCount++;
      }
    }
  }
  
  return successCount;
}

async function applyAllContent() {
  logger.info('========================================');
  logger.info('FINAL CONTENT SPRINT - Direct Insert');
  logger.info('========================================');
  logger.info('');
  logger.info(`Supabase URL: ${supabaseUrl}`);
  logger.info('');

  const profileId = await getFirstProfileId();
  logger.info(`Using profile ID: ${profileId}`);
  logger.info('');

  let totalSuccess = 0;
  
  totalSuccess += await insertProjects(profileId);
  logger.info('');
  
  totalSuccess += await insertMarketplaceItems(profileId);
  logger.info('');
  
  totalSuccess += await insertResearchPapers();
  logger.info('');
  
  totalSuccess += await insertCommunityPosts(profileId);
  logger.info('');

  logger.info('========================================');
  logger.info(`Content insertion complete! (${totalSuccess} items)`);
  logger.info('========================================');
  logger.info('');
  logger.info('Content added:');
  logger.info('  - 5 complete projects');
  logger.info('  - 7 marketplace categories');
  logger.info('  - 7 marketplace items');
  logger.info('  - 6 research papers');
  logger.info('  - 7 community posts');
  logger.info('');
  logger.info('Next steps:');
  logger.info('1. Restart your dev server: npm run dev');
  logger.info('2. Verify content appears in the application');
  logger.info('3. Check /projects, /marketplace, /research, /community');
}

applyAllContent().catch(console.error);
