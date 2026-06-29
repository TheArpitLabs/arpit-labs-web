import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
// Use service role key to bypass RLS policies for seeding
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

const projects = [
  {
    title: 'Smart Traffic Management System',
    slug: 'smart-traffic-management-system',
    description: 'An IoT-based intelligent traffic management system that uses computer vision and machine learning to optimize traffic flow, reduce congestion, and improve road safety through real-time monitoring and adaptive signal control.',
    tech_stack: ['Python', 'OpenCV', 'TensorFlow', 'Arduino', 'ESP32', 'MQTT', 'Node.js', 'React', 'PostgreSQL', 'Docker', 'AWS IoT Core'],
    github_url: 'https://github.com/axiora/smart-traffic-management',
    demo_url: 'https://traffic-demo.axiora.com',
    tags: ['IoT', 'Computer Vision', 'Machine Learning', 'Traffic Management', 'Smart City', 'Edge Computing'],
    featured: true,
    published: true
  },
  {
    title: 'Hospital Attendance System',
    slug: 'hospital-attendance-system',
    description: 'A biometric-based attendance tracking system for healthcare facilities using RFID and fingerprint authentication to streamline staff management, improve security, and generate automated reports for administrative efficiency.',
    tech_stack: ['Java', 'Spring Boot', 'React', 'MySQL', 'RFID SDK', 'Fingerprint API', 'REST APIs', 'Docker', 'AWS EC2', 'Redis'],
    github_url: 'https://github.com/axiora/hospital-attendance',
    demo_url: '',
    tags: ['Healthcare', 'Biometrics', 'RFID', 'Attendance Management', 'Enterprise Software', 'Security'],
    featured: true,
    published: true
  },
  {
    title: 'NCC Buddy',
    slug: 'ncc-buddy',
    description: 'A comprehensive mobile application for National Cadet Corps (NCC) cadets that combines training schedules, attendance tracking, study materials, and community features to enhance the cadet experience and streamline administrative processes.',
    tech_stack: ['React Native', 'Node.js', 'MongoDB', 'Firebase', 'Redux', 'Expo', 'REST APIs', 'AWS S3', 'PDF Generation'],
    github_url: 'https://github.com/axiora/ncc-buddy',
    demo_url: '',
    tags: ['Mobile App', 'Education', 'Community', 'Training Management', 'React Native', 'Offline-First'],
    featured: true,
    published: true
  },
  {
    title: 'Ship Bridge Collision Prevention',
    slug: 'ship-bridge-collision-prevention',
    description: 'An advanced marine navigation system using radar integration, AI-powered object detection, and automated alerting to prevent ship collisions and improve maritime safety through real-time threat assessment and navigation assistance.',
    tech_stack: ['Python', 'C++', 'OpenCV', 'TensorFlow', 'ROS', 'AIS SDK', 'Radar API', 'Qt', 'PostgreSQL', 'Docker'],
    github_url: 'https://github.com/axiora/ship-collision-prevention',
    demo_url: '',
    tags: ['Maritime', 'AI', 'Computer Vision', 'Safety Systems', 'Navigation', 'IoT'],
    featured: true,
    published: true
  },
  {
    title: 'Accident Detection System',
    slug: 'accident-detection-system',
    description: 'An IoT-based vehicle accident detection and emergency response system that uses accelerometer sensors, GPS, and machine learning to automatically detect accidents and alert emergency services with location and severity information.',
    tech_stack: ['Python', 'TensorFlow', 'Arduino', 'ESP32', 'GPS Module', 'GSM Module', 'Accelerometer', 'Flask', 'Firebase', 'React Native'],
    github_url: 'https://github.com/axiora/accident-detection',
    demo_url: '',
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
      
      // Prepare project data with only the most basic columns that should exist
      const projectData: any = {
        title: project.title,
        slug: project.slug,
        description: project.description,
        github_url: project.github_url,
        demo_url: project.demo_url,
        tags: project.tags,
        featured: project.featured,
        status: 'published',
        created_at: new Date().toISOString()
      };

      const { data, error } = await supabase
        .from('projects')
        .insert(projectData)
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
