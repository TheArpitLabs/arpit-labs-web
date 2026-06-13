import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

const supabase = createClient(supabaseUrl, supabaseKey);

const projects = [
  {
    title: 'Smart Traffic Management System',
    slug: 'smart-traffic-management-system',
    description: 'An IoT-based intelligent traffic management system that uses computer vision and machine learning to optimize traffic flow, reduce congestion, and improve road safety through real-time monitoring and adaptive signal control.',
    overview: 'The Smart Traffic Management System is a comprehensive IoT solution that addresses urban traffic challenges through intelligent monitoring and control. By leveraging computer vision at intersections and adaptive signal timing, the system reduces wait times by up to 35% and improves emergency vehicle response times through green wave coordination.',
    problem_statement: 'Urban traffic congestion causes significant economic losses, increased fuel consumption, and environmental pollution. Traditional fixed-time traffic signals cannot adapt to real-time traffic patterns, leading to inefficient flow and increased driver frustration. Emergency vehicles often get stuck in traffic, delaying critical response times.',
    architecture: 'The system employs a distributed architecture with edge devices at intersections equipped with cameras and IoT sensors. These process video locally using optimized computer vision models to detect vehicle density, speed, and classification. Data is transmitted to a central cloud server where ML algorithms optimize signal timing in real-time. The system includes a web dashboard for traffic operators and mobile apps for drivers to receive real-time updates.',
    tech_stack: ['Python', 'OpenCV', 'TensorFlow', 'Arduino', 'ESP32', 'MQTT', 'Node.js', 'React', 'PostgreSQL', 'Docker', 'AWS IoT Core'],
    github_url: 'https://github.com/arpit-labs/smart-traffic-management',
    demo_url: 'https://traffic-demo.arpit-labs.com',
    cover_image: '/images/projects/traffic-management-cover.jpg',
    screenshots: ['/images/projects/traffic-dashboard.jpg', '/images/projects/traffic-intersection.jpg', '/images/projects/traffic-mobile-app.jpg', '/images/projects/traffic-analytics.jpg'],
    lessons_learned: 'Real-time video processing at the edge taught us the importance of model optimization. We learned to balance accuracy with latency, implementing model quantization and pruning. Integration with existing traffic infrastructure required careful attention to safety protocols and redundancy systems.',
    tags: ['IoT', 'Computer Vision', 'Machine Learning', 'Traffic Management', 'Smart City', 'Edge Computing'],
    featured: true,
    published: true
  },
  {
    title: 'Hospital Attendance System',
    slug: 'hospital-attendance-system',
    description: 'A biometric-based attendance tracking system for healthcare facilities using RFID and fingerprint authentication to streamline staff management, improve security, and generate automated reports for administrative efficiency.',
    overview: 'The Hospital Attendance System modernizes workforce management in healthcare settings through biometric authentication. It replaces manual attendance registers with RFID badges and fingerprint scanners, providing real-time visibility into staff availability, automating payroll calculations, and ensuring only authorized personnel access sensitive areas.',
    problem_statement: 'Manual attendance tracking in hospitals is error-prone, time-consuming, and susceptible to buddy punching. Healthcare facilities need accurate staff attendance data for proper patient-to-staff ratios, payroll processing, and security compliance. Existing solutions are often expensive and lack integration with hospital management systems.',
    architecture: 'The system uses a client-server architecture with RFID readers and fingerprint scanners at entry points. A local server processes authentication requests and syncs data with a cloud database. The web application provides administrators with dashboards for attendance monitoring, leave management, and report generation. Mobile apps allow staff to view their attendance history and request leave.',
    tech_stack: ['Java', 'Spring Boot', 'React', 'MySQL', 'RFID SDK', 'Fingerprint API', 'REST APIs', 'Docker', 'AWS EC2', 'Redis'],
    github_url: 'https://github.com/arpit-labs/hospital-attendance',
    demo_url: null,
    cover_image: '/images/projects/hospital-attendance-cover.jpg',
    screenshots: ['/images/projects/hospital-dashboard.jpg', '/images/projects/hospital-auth.jpg', '/images/projects/hospital-reports.jpg'],
    lessons_learned: 'Integration with legacy hospital systems required building flexible APIs. We learned the importance of offline functionality for authentication when network connectivity is unreliable. Data privacy and HIPAA compliance considerations shaped our entire architecture design.',
    tags: ['Healthcare', 'Biometrics', 'RFID', 'Attendance Management', 'Enterprise Software', 'Security'],
    featured: true,
    published: true
  },
  {
    title: 'NCC Buddy',
    slug: 'ncc-buddy',
    description: 'A comprehensive mobile application for National Cadet Corps (NCC) cadets that combines training schedules, attendance tracking, study materials, and community features to enhance the cadet experience and streamline administrative processes.',
    overview: 'NCC Buddy serves as a digital companion for NCC cadets, providing easy access to training schedules, educational content, and community features. The app helps cadets track their attendance, access study materials for certificate exams, connect with fellow cadets, and stay updated on camp announcements and events.',
    problem_statement: 'NCC cadets struggle with disorganized training schedules, lack of access to study materials, and difficulty connecting with their unit. Administrative officers face challenges in maintaining attendance records and disseminating information efficiently. Existing solutions are either too generic or lack NCC-specific features.',
    architecture: 'The mobile app follows a modular architecture with separate modules for training, attendance, study materials, and community. A backend API handles data synchronization and user management. The app works offline for core features, syncing data when connectivity is available. Admin web portal allows officers to manage schedules and track cadet progress.',
    tech_stack: ['React Native', 'Node.js', 'MongoDB', 'Firebase', 'Redux', 'Expo', 'REST APIs', 'AWS S3', 'PDF Generation'],
    github_url: 'https://github.com/arpit-labs/ncc-buddy',
    demo_url: null,
    cover_image: '/images/projects/ncc-buddy-cover.jpg',
    screenshots: ['/images/projects/ncc-dashboard.jpg', '/images/projects/ncc-training.jpg', '/images/projects/ncc-study-material.jpg', '/images/projects/ncc-community.jpg'],
    lessons_learned: 'Building for offline-first functionality was crucial given variable connectivity during NCC camps. We learned to implement efficient data synchronization strategies. User feedback from actual cadets helped us prioritize features that truly mattered over nice-to-have additions.',
    tags: ['Mobile App', 'Education', 'Community', 'Training Management', 'React Native', 'Offline-First'],
    featured: true,
    published: true
  },
  {
    title: 'Ship Bridge Collision Prevention',
    slug: 'ship-bridge-collision-prevention',
    description: 'An advanced marine navigation system using radar integration, AI-powered object detection, and automated alerting to prevent ship collisions and improve maritime safety through real-time threat assessment and navigation assistance.',
    overview: 'The Ship Bridge Collision Prevention system integrates with existing marine radar and AIS (Automatic Identification System) to provide real-time collision risk assessment. Using machine learning algorithms, it predicts vessel trajectories and provides early warning alerts to bridge officers, significantly reducing the risk of maritime accidents.',
    problem_statement: 'Ship collisions remain a major maritime safety concern despite technological advances. Human error, fatigue, and poor visibility contribute to accidents. Existing collision avoidance systems are often complex, require extensive training, and provide too many false alarms, leading to alert fatigue among bridge officers.',
    architecture: 'The system consists of hardware interfaces for radar and AIS data ingestion, an AI processing unit for trajectory prediction, and a bridge display unit for alerts. The core algorithm uses historical vessel data and real-time sensor inputs to calculate collision risk scores. The system integrates with Electronic Chart Display and Information Systems (ECDIS) for seamless navigation.',
    tech_stack: ['Python', 'C++', 'OpenCV', 'TensorFlow', 'ROS', 'AIS SDK', 'Radar API', 'Qt', 'PostgreSQL', 'Docker'],
    github_url: 'https://github.com/arpit-labs/ship-collision-prevention',
    demo_url: null,
    cover_image: '/images/projects/ship-collision-cover.jpg',
    screenshots: ['/images/projects/ship-interface.jpg', '/images/projects/ship-radar.jpg', '/images/projects/ship-alerts.jpg', '/images/projects/ship-trajectory.jpg'],
    lessons_learned: 'Maritime environments present unique challenges with harsh conditions and reliability requirements. We learned the importance of redundant systems and fail-safe mechanisms. Working with maritime data required understanding international regulations and standards. False positive reduction was critical for user adoption.',
    tags: ['Maritime', 'AI', 'Computer Vision', 'Safety Systems', 'Navigation', 'IoT'],
    featured: true,
    published: true
  },
  {
    title: 'Accident Detection System',
    slug: 'accident-detection-system',
    description: 'An IoT-based vehicle accident detection and emergency response system that uses accelerometer sensors, GPS, and machine learning to automatically detect accidents and alert emergency services with location and severity information.',
    overview: 'The Accident Detection System combines IoT sensors with intelligent algorithms to detect vehicle accidents in real-time. Upon detection, it automatically alerts emergency services with precise location, accident severity, and vehicle information, reducing response times and potentially saving lives through rapid intervention.',
    problem_statement: 'Road accident fatalities often increase due to delayed emergency response, especially in remote areas or when occupants are incapacitated. Manual emergency calls are not always possible after severe accidents. Existing solutions are expensive, require subscription services, or have high false alarm rates that desensitize responders.',
    architecture: 'The system uses a multi-sensor approach with accelerometers, gyroscopes, and GPS modules. A machine learning model processes sensor data to distinguish accidents from normal driving events. Upon accident detection, the system communicates via GSM networks to emergency contacts and services. A mobile companion app allows users to manage settings and receive notifications.',
    tech_stack: ['Python', 'TensorFlow', 'Arduino', 'ESP32', 'GPS Module', 'GSM Module', 'Accelerometer', 'Flask', 'Firebase', 'React Native'],
    github_url: 'https://github.com/arpit-labs/accident-detection',
    demo_url: null,
    cover_image: '/images/projects/accident-detection-cover.jpg',
    screenshots: ['/images/projects/accident-hardware.jpg', '/images/projects/accident-mobile.jpg', '/images/projects/accident-dashboard.jpg', '/images/projects/accident-sensor-data.jpg'],
    lessons_learned: 'Distinguishing between hard braking and actual accidents was our biggest challenge. We learned to incorporate multiple data points and context. Power management was crucial for always-on monitoring. Working with emergency services required understanding their protocols and integration requirements.',
    tags: ['IoT', 'Safety', 'Machine Learning', 'Emergency Response', 'Automotive', 'Sensors'],
    featured: true,
    published: true
  }
];

export async function GET() {
  const results = [];
  
  for (const project of projects) {
    try {
      // Check if project already exists
      const { data: existing } = await supabase
        .from('projects')
        .select('id')
        .eq('slug', project.slug)
        .single();
      
      if (existing) {
        results.push({ title: project.title, status: 'already exists' });
        continue;
      }
      
      const { data, error } = await supabase
        .from('projects')
        .insert(project)
        .select()
        .single();
      
      if (error) {
        results.push({ title: project.title, status: 'error', error: error.message });
      } else {
        results.push({ title: project.title, status: 'created', id: data.id });
      }
    } catch (err) {
      results.push({ title: project.title, status: 'error', error: String(err) });
    }
  }
  
  return NextResponse.json({ results });
}
