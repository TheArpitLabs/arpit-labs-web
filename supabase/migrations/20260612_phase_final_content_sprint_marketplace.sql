-- PHASE FINAL-CONTENT-SPRINT: Marketplace Realism
-- This migration adds 10+ realistic engineering resources to the marketplace
-- Date: June 12, 2026

-- First, ensure categories exist
INSERT INTO marketplace_categories (name, slug) VALUES
('Arduino Templates', 'arduino-templates'),
('IoT Starter Kits', 'iot-starter-kits'),
('Engineering Notes', 'engineering-notes'),
('PCB Designs', 'pcb-designs'),
('Research Resources', 'research-resources'),
('AI Project Assets', 'ai-project-assets'),
('Hackathon Packs', 'hackathon-packs')
ON CONFLICT (slug) DO NOTHING;

-- Get category IDs for referencing
WITH category_ids AS (
  SELECT id, slug FROM marketplace_categories WHERE slug IN (
    'arduino-templates', 'iot-starter-kits', 'engineering-notes', 
    'pcb-designs', 'research-resources', 'ai-project-assets', 'hackathon-packs'
  )
)

-- Insert realistic engineering resources
INSERT INTO marketplace_items (
  id,
  title,
  slug,
  description,
  category_id,
  price,
  currency,
  featured,
  published,
  download_url,
  documentation_url,
  cover_image,
  seller_id,
  views_count,
  sales_count,
  revenue,
  created_at,
  updated_at
)
SELECT 
  gen_random_uuid(),
  title,
  slug,
  description,
  category_id,
  price,
  'USD',
  featured,
  true,
  download_url,
  documentation_url,
  cover_image,
  (SELECT id FROM profiles LIMIT 1), -- Default to first profile as seller
  0,
  0,
  0.00,
  now(),
  now()
FROM (
  VALUES
  -- Arduino Templates
  (
    'ESP32 IoT Development Template',
    'esp32-iot-development-template',
    'Complete Arduino/ESP32 project template with MQTT connectivity, OTA updates, sensor integration, and power management. Includes modular code structure, configuration files, and comprehensive documentation for rapid IoT prototyping.',
    (SELECT id FROM category_ids WHERE slug = 'arduino-templates'),
    9.99,
    true,
    'https://github.com/arpit-labs/esp32-template/archive/main.zip',
    'https://docs.arpit-labs.com/esp32-template',
    '/images/marketplace/esp32-template.jpg'
  ),
  (
    'Arduino Sensor Library Bundle',
    'arduino-sensor-library-bundle',
    'Optimized library collection for common sensors (DHT, BMP280, MQ-135, ultrasonic). Includes pre-calibrated settings, error handling, and example code for temperature, humidity, air quality, and distance measurements.',
    (SELECT id FROM category_ids WHERE slug = 'arduino-templates'),
    14.99,
    true,
    'https://github.com/arpit-labs/arduino-sensors/archive/main.zip',
    'https://docs.arpit-labs.com/arduino-sensors',
    '/images/marketplace/arduino-sensors.jpg'
  ),
  
  -- IoT Starter Kits
  (
    'Smart Home IoT Starter Kit',
    'smart-home-iot-starter-kit',
    'Complete smart home development kit with ESP8266/ESP32 support, Home Assistant integration, and mobile app control. Includes firmware, mobile app source code, and setup guides for lights, sensors, and automation.',
    (SELECT id FROM category_ids WHERE slug = 'iot-starter-kits'),
    29.99,
    true,
    'https://github.com/arpit-labs/smart-home-kit/archive/main.zip',
    'https://docs.arpit-labs.com/smart-home-kit',
    '/images/marketplace/smart-home-kit.jpg'
  ),
  (
    'Industrial IoT Monitoring Kit',
    'industrial-iot-monitoring-kit',
    'Industrial-grade IoT solution with Modbus support, data logging, alert systems, and dashboard templates. Designed for manufacturing environments with robust error handling and fail-safe mechanisms.',
    (SELECT id FROM category_ids WHERE slug = 'iot-starter-kits'),
    49.99,
    false,
    'https://github.com/arpit-labs/industrial-iot/archive/main.zip',
    'https://docs.arpit-labs.com/industrial-iot',
    '/images/marketplace/industrial-iot.jpg'
  ),
  
  -- Engineering Notes
  (
    'Embedded Systems Engineering Notes',
    'embedded-systems-engineering-notes',
    'Comprehensive notes covering microcontroller architecture, RTOS concepts, memory management, interrupt handling, and hardware interfacing. Includes code examples, circuit diagrams, and best practices.',
    (SELECT id FROM category_ids WHERE slug = 'engineering-notes'),
    19.99,
    true,
    'https://github.com/arpit-labs/embedded-notes/archive/main.zip',
    'https://docs.arpit-labs.com/embedded-notes',
    '/images/marketplace/embedded-notes.jpg'
  ),
  (
    'PCB Design Fundamentals Guide',
    'pcb-design-fundamentals-guide',
    'Complete PCB design guide covering schematic capture, layout principles, signal integrity, power distribution, and manufacturing considerations. Includes KiCad project files and design checklists.',
    (SELECT id FROM category_ids WHERE slug = 'engineering-notes'),
    24.99,
    true,
    'https://github.com/arpit-labs/pcb-guide/archive/main.zip',
    'https://docs.arpit-labs.com/pcb-guide',
    '/images/marketplace/pcb-guide.jpg'
  ),
  
  -- PCB Designs
  (
    'ESP32 Custom Breakout Board',
    'esp32-custom-breakout-board',
    'Production-ready ESP32 breakout board design with USB-C programming, LiPo charging, multiple GPIO access, and antenna optimization. Includes Gerber files, BOM, and assembly instructions.',
    (SELECT id FROM category_ids WHERE slug = 'pcb-designs'),
    34.99,
    true,
    'https://github.com/arpit-labs/esp32-breakout/archive/main.zip',
    'https://docs.arpit-labs.com/esp32-breakout',
    '/images/marketplace/esp32-breakout.jpg'
  ),
  (
    'Sensor Fusion Board Design',
    'sensor-fusion-board-design',
    'Multi-sensor integration board with IMU, GPS, magnetometer, and barometer. Features Kalman filter implementation, calibration routines, and compact form factor for robotics applications.',
    (SELECT id FROM category_ids WHERE slug = 'pcb-designs'),
    44.99,
    false,
    'https://github.com/arpit-labs/sensor-fusion-board/archive/main.zip',
    'https://docs.arpit-labs.com/sensor-fusion-board',
    '/images/marketplace/sensor-fusion-board.jpg'
  ),
  
  -- Research Resources
  (
    'Computer Vision Research Dataset',
    'computer-vision-research-dataset',
    'Curated dataset for traffic analysis with 10,000+ annotated images. Includes vehicle detection, classification, and tracking labels. Perfect for training and testing computer vision models.',
    (SELECT id FROM category_ids WHERE slug = 'research-resources'),
    39.99,
    true,
    'https://dataset.arpit-labs.com/traffic-vision.zip',
    'https://docs.arpit-labs.com/traffic-dataset',
    '/images/marketplace/traffic-dataset.jpg'
  ),
  (
    'IoT Security Research Papers',
    'iot-security-research-papers',
    'Collection of research papers on IoT security vulnerabilities, attack vectors, and defense mechanisms. Includes literature review, threat analysis, and recommended security frameworks.',
    (SELECT id FROM category_ids WHERE slug = 'research-resources'),
    29.99,
    false,
    'https://github.com/arpit-labs/iot-security-papers/archive/main.zip',
    'https://docs.arpit-labs.com/iot-security',
    '/images/marketplace/iot-security.jpg'
  ),
  
  -- AI Project Assets
  (
    'Traffic Detection ML Model',
    'traffic-detection-ml-model',
    'Pre-trained TensorFlow Lite model for vehicle detection and classification optimized for edge devices. Includes model weights, quantization scripts, and deployment guides for ESP32 and Raspberry Pi.',
    (SELECT id FROM category_ids WHERE slug = 'ai-project-assets'),
    49.99,
    true,
    'https://github.com/arpit-labs/traffic-ml-model/archive/main.zip',
    'https://docs.arpit-labs.com/traffic-ml-model',
    '/images/marketplace/traffic-ml-model.jpg'
  ),
  (
    'Anomaly Detection Framework',
    'anomaly-detection-framework',
    'Complete anomaly detection framework for IoT sensors using autoencoders. Includes training pipeline, real-time inference, alert system, and dashboard for monitoring unusual patterns.',
    (SELECT id FROM category_ids WHERE slug = 'ai-project-assets'),
    59.99,
    true,
    'https://github.com/arpit-labs/anomaly-detection/archive/main.zip',
    'https://docs.arpit-labs.com/anomaly-detection',
    '/images/marketplace/anomaly-detection.jpg'
  ),
  
  -- Hackathon Packs
  (
    'Smart City Hackathon Starter Pack',
    'smart-city-hackathon-starter-pack',
    'Complete hackathon kit for smart city challenges. Includes IoT sensor templates, data visualization dashboard, mobile app scaffold, and API integration guide. Jump-start your smart city solution in hours.',
    (SELECT id FROM category_ids WHERE slug = 'hackathon-packs'),
    19.99,
    true,
    'https://github.com/arpit-labs/smart-city-hackathon/archive/main.zip',
    'https://docs.arpit-labs.com/smart-city-hackathon',
    '/images/marketplace/smart-city-hackathon.jpg'
  ),
  (
    'HealthTech Hackathon Kit',
    'healthtech-hackathon-kit',
    'Healthcare-focused hackathon kit with patient monitoring templates, HIPAA-compliant data handling, telemedicine UI components, and medical device integration examples.',
    (SELECT id FROM category_ids WHERE slug = 'hackathon-packs'),
    24.99,
    false,
    'https://github.com/arpit-labs/healthtech-hackathon/archive/main.zip',
    'https://docs.arpit-labs.com/healthtech-hackathon',
    '/images/marketplace/healthtech-hackathon.jpg'
  )
) AS items(title, slug, description, category_id, price, featured, download_url, documentation_url, cover_image)
ON CONFLICT (slug) DO NOTHING;

-- Verify insertion
SELECT 
  mi.title,
  mi.slug,
  mc.name as category,
  mi.price,
  mi.featured,
  mi.published
FROM marketplace_items mi
JOIN marketplace_categories mc ON mi.category_id = mc.id
WHERE mi.published = true
ORDER BY mi.featured DESC, mi.price;
