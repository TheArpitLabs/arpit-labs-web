-- PHASE FINAL-CONTENT-SPRINT: Community Seeding
-- This migration adds 10+ community posts with discussions, announcements, and learning threads
-- Date: June 12, 2026

-- Insert community posts (using first profile as default user)
INSERT INTO community_posts (
  id,
  user_id,
  title,
  slug,
  content,
  category,
  tags,
  views,
  upvotes,
  created_at,
  updated_at
)
SELECT 
  gen_random_uuid(),
  (SELECT id FROM profiles LIMIT 1),
  title,
  slug,
  content,
  category,
  tags,
  0,
  0,
  now(),
  now()
FROM (
  VALUES
  -- Announcements
  (
    'Welcome to Arpit Labs Community! 🚀',
    'welcome-to-arpit-labs-community',
    'We are thrilled to launch the Arpit Labs community platform! This space is designed for engineers, researchers, and enthusiasts to connect, share knowledge, and collaborate on exciting projects in AI, IoT, and embedded systems.

## What You Can Do Here
- **Share Projects**: Showcase your engineering projects and get feedback
- **Ask Questions**: Get help with technical challenges from the community
- **Find Collaborators**: Connect with others for hackathons and projects
- **Share Resources**: Post tutorials, tools, and learning materials
- **Discuss Research**: Engage with technical papers and research findings

## Community Guidelines
- Be respectful and constructive in discussions
- Share knowledge and help others learn
- Keep discussions technical and focused
- Respect privacy and intellectual property

## Getting Started
1. Complete your profile to let others know your interests
2. Browse existing discussions and jump in where you can help
3. Start a new discussion if you have questions or ideas to share
4. Check out our projects and research sections for inspiration

We are building something special here - thanks for being part of it from the beginning!',
    'announcement',
    ARRAY['welcome', 'community', 'introduction']
  ),
  (
    'New Research Papers Published on Traffic Optimization and IoT Security',
    'new-research-papers-traffic-optimization-iot-security',
    'Excited to share our latest research publications! We have just released two comprehensive papers covering critical topics in modern engineering:

## 1. Real-Time Traffic Optimization Using Edge AI and Computer Vision
Our latest research on traffic signal optimization using edge-deployed computer vision and ML. Key findings:
- 35% reduction in average wait times
- 28% improvement in traffic flow efficiency
- Optimized models for ESP32 and Raspberry Pi deployment

## 2. IoT Security Vulnerabilities in Smart Home Environments
Comprehensive analysis of security vulnerabilities in IoT devices:
- Assessment of 50 popular IoT devices
- Identified common attack vectors and defense strategies
- Multi-layered defense framework proposal

Both papers include detailed methodologies, implementation guides, and performance metrics. Perfect for researchers and practitioners working on smart city and IoT security projects.

Check them out in the Research section and let us know your thoughts!',
    'announcement',
    ARRAY['research', 'traffic-optimization', 'iot-security', 'publications']
  ),
  
  -- Discussions
  (
    'Best Practices for Low-Power IoT Design - Share Your Experience',
    'best-practices-low-power-iot-design',
    'Working on a environmental monitoring project that needs to run on battery for 2+ years. Looking for community insights on low-power design.

## Current Setup
- ESP32 microcontroller
- Multiple sensors (temp, humidity, air quality)
- LoRaWAN for communication
- Solar panel for energy harvesting

## Challenges I am Facing
1. Balancing sensor reading frequency vs power consumption
2. Optimal sleep/wake cycles for different sensors
3. LoRa transmission timing optimization
4. Power management IC selection

## Questions for the Community
- What sleep strategies have worked well for you?
- Any favorite low-power sensor libraries?
- How do you handle power management with multiple sensors?
- Best practices for energy harvesting integration?

Would love to hear from others who have tackled similar challenges. Will share my findings as the project progresses!',
    'discussion',
    ARRAY['iot', 'low-power', 'embedded', 'sensors', 'energy-harvesting']
  ),
  (
    'Computer Vision on Edge Devices - YOLO vs MobileNet SSD',
    'computer-vision-edge-devices-yolo-vs-mobilenet-ssd',
    'Evaluating object detection models for deployment on edge devices. Currently comparing YOLOv5-nano vs MobileNet SSD for a traffic monitoring application.

## My Test Setup
- Hardware: Raspberry Pi 4 and ESP32
- Use case: Vehicle detection and classification
- Performance requirements: <100ms inference time
- Accuracy target: >90% mAP

## Initial Findings
**YOLOv5-nano:**
- Inference time: 45ms on RPi4, 180ms on ESP32
- mAP: 92.3%
- Model size: 4.5MB
- Good accuracy but challenging on ESP32

**MobileNet SSD:**
- Inference time: 35ms on RPi4, 95ms on ESP32
- mAP: 88.7%
- Model size: 3.2MB
- Better performance on ESP32 but lower accuracy

## Questions
- Has anyone quantized YOLO models for ESP32 successfully?
- Any experience with TFLite optimization for these models?
- Alternative models I should consider?
- Trade-offs between accuracy and speed in your experience?

Would appreciate insights from anyone who has deployed CV on resource-constrained devices!',
    'discussion',
    ARRAY['computer-vision', 'edge-ai', 'yolo', 'mobilenet', 'embedded', 'tensorflow-lite']
  ),
  (
    'PCB Design for High-Frequency Applications - Signal Integrity Tips',
    'pcb-design-high-frequency-applications-signal-integrity',
    'Designing my first PCB for a 2.4GHz IoT device and looking for signal integrity best practices. Have read the research paper on PCB design but want practical insights from the community.

## My Design Specs
- Frequency: 2.4GHz (WiFi/Bluetooth)
- Layers: 4-layer board
- Material: FR-4 (considering Rogers for better performance)
- Components: ESP32, RF module, sensors

## Specific Concerns
1. Impedance matching for RF traces
2. Ground plane design and split avoidance
3. Decoupling capacitor placement
4. Via optimization for high-speed signals
5. EMI/EMC considerations

## What I Have Learned So Far
- Controlled impedance is critical (50Ω single-ended, 100Ω differential)
- Ground planes should be continuous with minimal splits
- Decoupling capacitors need to be close to IC power pins
- Via stubs can cause reflections at high frequencies

## Questions
- FR-4 vs Rogers material - is the cost difference worth it for 2.4GHz?
- Any favorite PCB design tools for high-frequency work?
- Common mistakes to avoid in first high-frequency design?
- Testing methodologies for signal integrity validation?

Thanks in advance for any advice!',
    'discussion',
    ARRAY['pcb-design', 'hardware', 'rf', 'signal-integrity', 'electronics', 'high-frequency']
  ),
  
  -- Engineering Challenges
  (
    'Weekly Engineering Challenge: Build a Smart Plant Monitoring System',
    'weekly-engineering-challenge-smart-plant-monitoring',
    '🌱 **Weekly Engineering Challenge #1**

This week, challenge yourself to build a smart plant monitoring system! This is a great project for beginners and experienced engineers alike.

## Challenge Requirements
- Monitor soil moisture, temperature, and light levels
- Automated watering based on sensor readings
- Data logging and visualization
- Mobile app or web interface for monitoring
- Battery-powered or energy-efficient design

## Suggested Components
- ESP32 or Arduino for microcontroller
- Soil moisture sensor
- DHT22 for temperature/humidity
- Photoresistor for light sensing
- Relay module for water pump control
- MQTT for communication (optional)

## Bonus Points
- Implement machine learning for plant health prediction
- Add camera for disease detection
- Create mobile app with notifications
- Use solar power for energy independence
- Implement data visualization dashboard

## Submission Guidelines
Share your progress in this thread! Include:
- Component list and wiring diagram
- Code snippets or GitHub repository
- Photos of your setup
- Challenges faced and solutions
- Final results and lessons learned

## Timeline
- Start: Today
- Check-in: Share progress in 3 days
- Final submissions: Due in 7 days

Let is see what creative solutions the community comes up with! Feel free to ask questions and help each other out.',
    'challenge',
    ARRAY['engineering-challenge', 'iot', 'sensors', 'automation', 'weekly-challenge']
  ),
  (
    'Debug Challenge: Find the Memory Leak in This IoT Code',
    'debug-challenge-find-memory-leak-iot-code',
    '🔍 **Debug Challenge #1**

Here is a piece of IoT code that has a memory leak. Can you identify and fix it?

## The Problem
This ESP32 code reads sensors every 5 seconds and sends data via MQTT. After running for 24 hours, the device crashes due to memory exhaustion.

## Code Snippet
```cpp
void loop() {
  float temp = readTemperature();
  float humidity = readHumidity();
  
  String json = "{\"temp\":" + String(temp) + 
                ",\"humidity\":" + String(humidity) + "}";
  
  if (client.connected()) {
    client.publish("sensors/data", json.c_str());
  }
  
  delay(5000);
}

float readTemperature() {
  Wire.beginTransmission(DHT22_ADDR);
  Wire.write(0x00);
  Wire.endTransmission();
  
  byte data[5];
  Wire.requestFrom(DHT22_ADDR, 5);
  
  for (int i = 0; i < 5; i++) {
    data[i] = Wire.read();
  }
  
  // Process data and return temperature
  return parseTemperature(data);
}
```

## Challenge
1. Identify where the memory leak occurs
2. Explain why it happens
3. Provide a fixed version of the code
4. Suggest best practices to prevent similar issues

## Hints
- Look at String usage
- Check Wire library usage
- Consider memory allocation patterns

Post your solutions below! Let is see who can find and fix the issue first.',
    'challenge',
    ARRAY['debugging', 'memory-leak', 'esp32', 'iot', 'cpp', 'programming']
  ),
  
  -- Learning Threads
  (
    'Learning Thread: From Zero to IoT - Complete Roadmap',
    'learning-thread-zero-to-iot-complete-roadmap',
    '📚 **Learning Thread: From Zero to IoT**

Welcome to the complete learning roadmap for getting started with IoT! This thread will be updated with resources, projects, and discussions to help you go from beginner to building sophisticated IoT systems.

## Phase 1: Foundations (Weeks 1-2)
### Topics to Cover
- Basic electronics and circuit theory
- C/C++ programming fundamentals
- Understanding microcontrollers
- Basic networking concepts

### Recommended Resources
- Arduino official tutorials
- "Make: Electronics" book
- Electronics tutorials on YouTube
- C++ programming courses

### Starter Projects
- LED blink circuit
- Temperature sensor reading
- Simple serial communication
- Basic motor control

## Phase 2: Microcontroller Programming (Weeks 3-4)
### Topics to Cover
- Arduino framework and IDE
- GPIO, PWM, and interrupts
- I2C, SPI communication protocols
- Sensor integration

### Recommended Resources
- Arduino documentation
- Sensor datasheets
- Protocol specifications
- Community project examples

### Starter Projects
- Weather station with multiple sensors
- LCD display integration
- Data logging to SD card
- Remote control via IR

## Phase 3: Connectivity (Weeks 5-6)
### Topics to Cover
- WiFi and Bluetooth basics
- MQTT protocol
- HTTP/REST APIs
- Cloud platforms (AWS IoT, Firebase)

### Recommended Resources
- ESP8266/ESP32 documentation
- MQTT essentials
- API design best practices
- Cloud platform tutorials

### Starter Projects
- WiFi-connected sensor
- MQTT publisher/subscriber
- Cloud data logging
- Mobile app integration

## Phase 4: Advanced Topics (Weeks 7-8)
### Topics to Cover
- Low-power design
- Edge computing
- Security best practices
- Machine learning on edge

### Recommended Resources
- Low-power design guides
- TensorFlow Lite micro
- Security frameworks
- Research papers

## Community Participation
- Share your progress as you go through phases
- Ask questions when stuck
- Help others who are behind you
- Suggest additional resources
- Share your completed projects

## Progress Tracking
Comment below with:
- Your current phase
- Projects completed
- Challenges faced
- Resources you found helpful

Let is learn together! 🚀',
    'learning',
    ARRAY['learning-roadmap', 'iot', 'beginner', 'tutorial', 'education']
  ),
  (
    'Resource Thread: Essential Tools for Embedded Systems Development',
    'resource-thread-essential-tools-embedded-systems-development',
    '🛠️ **Resource Thread: Essential Development Tools**

Let us compile a comprehensive list of essential tools for embedded systems development. Add your favorites and explain why they are valuable!

## Hardware Tools
### Essential
- **Multimeter**: Basic electrical measurements
- **Logic Analyzer**: Digital signal debugging
- **Oscilloscope**: Analog signal analysis
- **Soldering Station**: PCB assembly and repair
- **Power Supply**: Variable voltage/current for testing

### Nice to Have
- **Hot Air Rework Station**: SMD component work
- **Microscope**: PCB inspection and soldering
- **Function Generator**: Signal testing
- **Protocol Analyzers**: I2C/SPI/UART debugging

## Software Tools
### Development Environments
- **VS Code**: Lightweight, extensible IDE
- **PlatformIO**: Professional embedded IDE
- **Arduino IDE**: Beginner-friendly
- **Eclipse CDT**: Advanced debugging

### Design Tools
- **KiCad**: Open-source PCB design
- **Eagle**: Popular PCB design (free tier available)
- **Fritzing**: Beginner-friendly circuit design
- **LTspice**: Circuit simulation

### Debugging Tools
- **GDB**: Command-line debugging
- **Segger J-Link**: Professional debug probe
- **OpenOCD**: Open-source debug tool
- **Serial monitors**: Real-time data viewing

## Firmware Libraries
### Communication
- **PubSubClient**: MQTT for Arduino
- **ArduinoJson**: JSON parsing
- **Wire**: I2C communication
- **SPI**: SPI communication

### Sensors
- **Adafruit Unified Sensor**: Unified sensor interface
- **DHT sensor library**: Temperature/humidity sensors
- **BME280**: Environmental sensor library
- **Adafruit GPS**: GPS module library

## Online Resources
### Documentation
- **Datasheets**: Always primary source for component info
- **Application Notes**: Manufacturer implementation guides
- **Reference Designs**: Proven circuit implementations

### Communities
- **EEVblog Forum**: Electronics discussion
- **Reddit r/embedded**: Embedded systems community
- **Stack Overflow**: Programming questions
- **GitHub Open Source**: Project examples

## Add Your Favorites
Comment below with:
- Tool name and category
- Why it is essential for your workflow
- Alternatives you have tried
- Tips for getting the most out of it

Let us build the ultimate embedded development toolkit! 🧰',
    'resource',
    ARRAY['tools', 'embedded', 'hardware', 'software', 'development', 'resources']
  ),
  
  -- Project Showcases
  (
    'Project Showcase: My Smart Home Automation System',
    'project-showcase-smart-home-automation-system',
    '🏠 **Project Showcase: Smart Home Automation**

Excited to share my smart home automation project that I have been working on for the past 6 months!

## Overview
A comprehensive smart home system with:
- Automated lighting control
- Climate monitoring and control
- Security system with cameras
- Energy monitoring
- Voice control integration

## Hardware Components
### Controllers
- Raspberry Pi 4 (main hub)
- ESP32 modules (room controllers)
- Arduino Nano (sensor nodes)

### Sensors
- DHT22 (temperature/humidity)
- PIR motion sensors
- Door/window magnetic sensors
- Current sensors (energy monitoring)
- Light sensors (ambient light)

### Actuators
- Relay modules (light/appliance control)
- Smart bulbs (Zigbee)
- Servo motors (curtain control)
- Smart thermostat

### Communication
- WiFi (ESP32 to hub)
- Zigbee (smart devices)
- MQTT (internal messaging)
- Home Assistant (integration)

## Software Architecture
### Backend
- Home Assistant (main controller)
- Node-RED (automation flows)
- MQTT broker (message routing)
- InfluxDB (data storage)
- Grafana (visualization)

### Frontend
- Home Assistant dashboard
- Custom mobile app (React Native)
- Voice integration (Alexa/Google)

### Automation Examples
- Morning routine: Lights on, coffee maker start, thermostat adjustment
- Away mode: All lights off, security on, energy saving
- Movie mode: Dim lights, close curtains, temperature adjustment
- Security alerts: Notifications for door/window opening, motion detection

## Challenges Faced
1. **Integration Complexity**: Getting different protocols to work together
2. **Reliability**: Ensuring system works when internet is down
3. **Security**: Protecting smart home from external threats
4. **Scalability**: Adding new devices without major reconfiguration

## Solutions Implemented
- Local processing for critical functions
- Redundant communication paths
- Network segmentation for IoT devices
- Modular automation design

## Results
- 40% reduction in energy consumption
- Complete automation of daily routines
- Enhanced security with real-time monitoring
- Scalable architecture for future expansion

## Future Plans
- Add solar panel monitoring
- Integrate with smart irrigation
- Implement AI for predictive automation
- Add more voice control capabilities

## Code and Documentation
GitHub repository coming soon! Will share once I clean up the code and add proper documentation.

## Questions for the Community
- Anyone else using similar architecture?
- Recommendations for improving reliability?
- Experience with Home Assistant vs. OpenHAB?
- Best practices for smart home security?

Would love feedback and suggestions from the community! 🎉',
    'showcase',
    ARRAY['smart-home', 'iot', 'home-automation', 'home-assistant', 'project-showcase']
  ),
  (
    'Project Showcase: Autonomous Robot for Warehouse Navigation',
    'project-showcase-autonomous-robot-warehouse-navigation',
    '🤖 **Project Showcase: Autonomous Warehouse Robot**

Sharing my autonomous robot designed for warehouse navigation and inventory management!

## Project Overview
An autonomous mobile robot (AMR) that can:
- Navigate warehouse aisles autonomously
- Locate and identify inventory items
- Perform basic inventory counting
- Generate real-time inventory reports
- Avoid obstacles and humans safely

## Hardware Architecture
### Chassis and Motors
- Custom aluminum chassis
- 4x DC motors with encoders
- Motor driver (L298N)
- Omni-directional wheels for maneuverability

### Computing
- Raspberry Pi 4 (main processing)
- Arduino Mega (motor control)
- ESP32 (wireless communication)

### Sensors
- LiDAR (RPLIDAR A1) for mapping
- Ultrasonic sensors (obstacle detection)
- IMU (orientation and movement)
- Camera (QR code reading)
- RFID reader (inventory identification)

### Power
- 12V LiFePO4 battery pack
- Voltage regulators for different components
- Power management module
- Battery monitoring system

## Software Stack
### Navigation
- SLAM (Simultaneous Localization and Mapping)
- ROS (Robot Operating System)
- Path planning (A* algorithm)
- Obstacle avoidance (dynamic window approach)

### Vision
- OpenCV (image processing)
- QR code detection and decoding
- Object detection (YOLO)
- Barcode reading

### Communication
- ROS topics for internal messaging
- MQTT for warehouse system integration
- REST API for external control
- WebSocket for real-time updates

## Key Features
### Autonomous Navigation
- Real-time mapping of warehouse layout
- Dynamic path planning and replanning
- Safe obstacle avoidance
- Human detection and safety zones

### Inventory Management
- RFID tag reading for item identification
- QR code scanning for location verification
- Camera-based visual confirmation
- Real-time inventory database updates

### Safety Systems
- Emergency stop functionality
- Human detection with safety zones
- Obstacle detection and avoidance
- Battery monitoring and auto-docking

## Challenges Overcome
1. **SLAM Accuracy**: Fine-tuning parameters for warehouse environment
2. **Path Planning**: Optimizing for warehouse constraints
3. **Sensor Fusion**: Combining data from multiple sensors
4. **Real-time Processing**: Optimizing algorithms for performance

## Performance Metrics
- Navigation accuracy: ±5cm
- Obstacle detection: 99.5% success rate
- Inventory scanning: 50 items/minute
- Battery life: 4 hours continuous operation
- Mapping time: 30 minutes for 1000m² warehouse

## Future Improvements
- Add robotic arm for item manipulation
- Implement fleet management for multiple robots
- Enhanced AI for predictive maintenance
- Integration with warehouse management systems

## Lessons Learned
- Start with simulation before hardware implementation
- Sensor calibration is critical for accuracy
- Safety systems must be redundant
- Real-world testing reveals unexpected edge cases

## Community Questions
- Experience with different SLAM algorithms?
- Best practices for sensor fusion?
- Recommendations for fleet management systems?
- Safety certifications for warehouse robots?

GitHub repository and build instructions coming soon! This has been a 8-month project and I am excited to finally share it with the community. 🚀',
    'showcase',
    ARRAY['robotics', 'autonomous-navigation', 'warehouse', 'slam', 'ros', 'project-showcase']
  )
) AS posts(title, slug, content, category, tags)
ON CONFLICT (slug) DO NOTHING;

-- Verify insertion
SELECT 
  title,
  slug,
  category,
  tags,
  views,
  upvotes
FROM community_posts
ORDER BY created_at;
