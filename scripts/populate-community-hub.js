// Script to populate Community Hub with 20 posts (10 discussions, 5 challenges, 5 announcements)
// Run with: node scripts/populate-community-hub.js

require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  logger.error('Missing Supabase credentials. Check your .env.local file.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

const communityPosts = [
  // Discussions (10)
  {
    title: 'Best practices for implementing AI in embedded systems?',
    slug: 'best-practices-ai-embedded-systems',
    content: `I'm working on integrating AI models into embedded systems and would love to hear about best practices from the community. Specifically:

1. What are the most effective model optimization techniques for edge devices?
2. How do you handle model updates in production embedded systems?
3. What frameworks have you found most reliable for edge AI deployment?
4. How do you balance model accuracy with resource constraints?

I've been experimenting with TensorFlow Lite and ONNX Runtime, but I'm curious about other approaches. Any insights or experiences to share?`,
    category: 'Engineering',
    tags: ['AI', 'Embedded Systems', 'Edge Computing', 'TensorFlow Lite'],
    post_type: 'discussion'
  },
  {
    title: 'IoT security challenges in smart home deployments',
    slug: 'iot-security-challenges-smart-home',
    content: `As smart home devices become more prevalent, security concerns are growing. I'd like to discuss the major security challenges we face:

- Device authentication and authorization
- Secure firmware updates
- Data encryption in transit and at rest
- Privacy concerns with always-listening devices
- Supply chain security for IoT components

What security frameworks have you implemented? How do you handle the trade-off between security and user convenience? Let's share our experiences and solutions.`,
    category: 'IoT',
    tags: ['IoT', 'Security', 'Smart Home', 'Privacy', 'Cybersecurity'],
    post_type: 'discussion'
  },
  {
    title: 'Career transition from traditional engineering to AI/ML',
    slug: 'career-transition-engineering-ai-ml',
    content: `I'm considering a career transition from traditional mechanical engineering to AI/ML roles. For those who've made similar transitions:

1. What skills were most valuable to transfer?
2. What new skills did you need to learn?
3. How did you demonstrate your ML capabilities to employers?
4. What resources or courses would you recommend?
5. How long did the transition take?

I have a strong background in mathematics and programming, but I'm unsure about the best path forward. Any advice from the community would be greatly appreciated!`,
    category: 'Career Growth',
    tags: ['Career', 'AI', 'Machine Learning', 'Transition', 'Skills'],
    post_type: 'discussion'
  },
  {
    title: 'Open source contribution strategies for beginners',
    slug: 'open-source-contribution-strategies-beginners',
    content: `I want to start contributing to open source projects but I'm not sure where to begin. What strategies have worked for you?

- How do you choose which projects to contribute to?
- What's the best way to find beginner-friendly issues?
- How do you approach maintainers for guidance?
- What types of contributions are most valued?
- How do you balance OSS work with other commitments?

I'm particularly interested in AI/ML and IoT projects. Any tips on getting started and building a reputation in the OSS community?`,
    category: 'Open Source',
    tags: ['Open Source', 'Contributing', 'Beginner', 'GitHub', 'Community'],
    post_type: 'discussion'
  },
  {
    title: 'Research collaboration opportunities in engineering',
    slug: 'research-collaboration-opportunities-engineering',
    content: `I'm looking to collaborate on research projects in engineering, particularly in the intersection of IoT and AI. I'm interested in:

- Finding research partners with complementary skills
- Understanding how to structure research collaborations
- Best practices for co-authoring papers
- Funding opportunities for collaborative research
- Balancing research with industry work

If you're working on interesting research projects or looking for collaborators, let's connect! I have experience in sensor networks and edge computing.`,
    category: 'Research',
    tags: ['Research', 'Collaboration', 'IoT', 'AI', 'Academic'],
    post_type: 'discussion'
  },
  {
    title: 'Building sustainable engineering practices in startups',
    slug: 'building-sustainable-engineering-practices-startups',
    content: `In the fast-paced startup environment, how do you maintain sustainable engineering practices? I'm struggling with:

- Balancing speed of delivery with code quality
- Implementing proper testing without slowing down
- Managing technical debt while shipping features
- Building documentation that actually gets used
- Creating onboarding processes for new engineers

What practices have you found most effective? How do you convince stakeholders to invest in engineering excellence? Let's discuss practical strategies for sustainable development.`,
    category: 'Engineering',
    tags: ['Engineering', 'Startups', 'Best Practices', 'Code Quality', 'Agile'],
    post_type: 'discussion'
  },
  {
    title: 'The future of robotics in everyday life',
    slug: 'future-robotics-everyday-life',
    content: `With advances in robotics and AI, I'm curious about how we'll see robots integrated into everyday life over the next decade. Some questions:

- Which applications will see mainstream adoption first?
- What are the biggest technical hurdles remaining?
- How will we address safety and liability concerns?
- What impact will this have on employment?
- How can we ensure ethical development and deployment?

I'm particularly interested in home robotics and assistive technologies. What are your predictions and concerns?`,
    category: 'Engineering',
    tags: ['Robotics', 'AI', 'Future', 'Ethics', 'Automation'],
    post_type: 'discussion'
  },
  {
    title: 'Mentorship opportunities for junior engineers',
    slug: 'mentorship-opportunities-junior-engineers',
    content: `I'm a junior engineer looking for mentorship opportunities. I'd love to connect with experienced engineers who can provide guidance on:

- Career development and growth paths
- Technical skill development
- Navigating workplace dynamics
- Building professional networks
- Work-life balance in engineering

I'm willing to put in the work and am eager to learn. If you're interested in mentoring or know of good mentorship programs, please let me know!`,
    category: 'Career Growth',
    tags: ['Mentorship', 'Career', 'Junior Engineer', 'Professional Development', 'Networking'],
    post_type: 'discussion'
  },
  {
    title: 'Cloud vs. Edge: When to use which for IoT applications?',
    slug: 'cloud-vs-edge-iot-applications',
    content: `For IoT applications, deciding between cloud and edge processing is crucial. I'd like to discuss the decision-making framework:

- What factors should drive the cloud vs. edge decision?
- How do latency requirements influence the choice?
- What about cost considerations and scalability?
- How do you handle hybrid approaches?
- What are the trade-offs in terms of maintenance and updates?

I'm working on a smart city project and need to make this decision for various components. What's your experience with this trade-off?`,
    category: 'IoT',
    tags: ['IoT', 'Cloud Computing', 'Edge Computing', 'Architecture', 'Decision Making'],
    post_type: 'discussion'
  },
  {
    title: 'Building inclusive engineering communities',
    slug: 'building-inclusive-engineering-communities',
    content: `How can we build more inclusive engineering communities? I'm interested in discussing:

- Creating welcoming environments for underrepresented groups
- Addressing unconscious bias in technical discussions
- Building accessible documentation and resources
- Creating mentorship programs for diverse talent
- Measuring and improving diversity and inclusion

I believe diverse teams build better products, but I'm not always sure how to translate that belief into action. What strategies have worked in your communities?`,
    category: 'Open Source',
    tags: ['Diversity', 'Inclusion', 'Community', 'Engineering', 'Culture'],
    post_type: 'discussion'
  },
  // Challenges (5)
  {
    title: 'Challenge: Build a low-power IoT environmental monitor',
    slug: 'challenge-low-power-iot-environmental-monitor',
    content: `## Challenge: Low-Power IoT Environmental Monitor

**Objective:** Build an IoT environmental monitoring system that can operate for 6+ months on battery power.

**Requirements:**
- Monitor temperature, humidity, and air quality
- Transmit data via LoRaWAN for long-range communication
- Achieve 6+ months battery life on standard AA batteries
- Include data visualization dashboard
- Implement sleep modes and power optimization

**Constraints:**
- Budget: Under $50 for hardware
- Must use open-source components where possible
- Provide complete documentation and schematics

**Submission:** Share your design, code, and results by the end of the month. Best solution wins a $100 gift card to an electronics retailer!

**Discussion:** Share your approaches, challenges, and questions here.`,
    category: 'Engineering',
    tags: ['Challenge', 'IoT', 'Low Power', 'LoRaWAN', 'Hardware'],
    post_type: 'challenge'
  },
  {
    title: 'Challenge: Optimize a neural network for edge deployment',
    slug: 'challenge-optimize-neural-network-edge-deployment',
    content: `## Challenge: Neural Network Edge Optimization

**Objective:** Optimize a given neural network model to run efficiently on edge devices with limited resources.

**Base Model:** A pre-trained image classification model (provided)

**Target Device:** Raspberry Pi 4 or similar edge device

**Requirements:**
- Reduce model size by at least 50%
- Maintain accuracy within 5% of original model
- Achieve inference time under 100ms per image
- Provide optimization documentation
- Include performance benchmarks

**Allowed Techniques:**
- Quantization
- Pruning
- Knowledge distillation
- Architecture search
- Any other optimization method

**Prize:** Winner receives a free edge AI development kit!

**Discussion:** Share your optimization strategies and results.`,
    category: 'AI',
    tags: ['Challenge', 'AI', 'Edge Computing', 'Optimization', 'Machine Learning'],
    post_type: 'challenge'
  },
  {
    title: 'Challenge: Create a secure IoT authentication system',
    slug: 'challenge-secure-iot-authentication-system',
    content: `## Challenge: Secure IoT Authentication System

**Objective:** Design and implement a secure authentication system for IoT devices.

**Requirements:**
- Device-to-cloud authentication
- Device-to-device authentication
- Secure key management
- Resistance to common attacks (replay, MITM, etc.)
- Scalable to thousands of devices
- Provide security analysis documentation

**Scenarios:**
- New device onboarding
- Device firmware updates
- Device revocation
- Key rotation

**Bonus Points:**
- Implementation with real hardware
- Performance benchmarks
- Compliance with security standards

**Prize:** Best implementation wins a cybersecurity certification course voucher!

**Discussion:** Share your security architectures and approaches.`,
    category: 'Cybersecurity',
    tags: ['Challenge', 'IoT', 'Security', 'Authentication', 'Cryptography'],
    post_type: 'challenge'
  },
  {
    title: 'Challenge: Build a real-time collaborative coding platform',
    slug: 'challenge-real-time-collaborative-coding-platform',
    content: `## Challenge: Real-Time Collaborative Coding Platform

**Objective:** Build a web-based real-time collaborative coding platform.

**Requirements:**
- Real-time code synchronization
- Multiple users editing simultaneously
- Syntax highlighting
- Code execution (sandboxed)
- Chat/collaboration features
- Version control integration

**Technical Constraints:**
- Use WebSocket or similar real-time technology
- Handle conflict resolution
- Support at least 5 concurrent users
- Provide responsive UI

**Bonus Features:**
- Video/audio integration
- Screen sharing
- Code review tools
- AI-assisted coding

**Prize:** Winning team gets featured on our platform and $500 in cloud credits!

**Discussion:** Share your architecture decisions and implementation approaches.`,
    category: 'Web Development',
    tags: ['Challenge', 'Web Development', 'Real-Time', 'Collaboration', 'WebSocket'],
    post_type: 'challenge'
  },
  {
    title: 'Challenge: Design a sustainable smart city solution',
    slug: 'challenge-design-sustainable-smart-city-solution',
    content: `## Challenge: Sustainable Smart City Solution

**Objective:** Design a comprehensive smart city solution focused on sustainability.

**Areas to Address:**
- Energy management and optimization
- Waste management and recycling
- Water conservation
- Air quality monitoring
- Transportation optimization
- Green spaces and urban planning

**Requirements:**
- System architecture design
- Technology stack recommendations
- Implementation roadmap
- Environmental impact assessment
- Cost-benefit analysis
- Community engagement strategy

**Deliverables:**
- Complete design document
- Technical architecture diagrams
- Prototype or simulation (optional but recommended)
- Presentation of solution

**Prize:** Best design wins mentorship with smart city experts!

**Discussion:** Share your smart city concepts and sustainability approaches.`,
    category: 'Engineering',
    tags: ['Challenge', 'Smart City', 'Sustainability', 'IoT', 'Urban Planning'],
    post_type: 'challenge'
  },
  // Announcements (5)
  {
    title: 'Announcement: New AI research grant program open for applications',
    slug: 'announcement-new-ai-research-grant-program',
    content: `## New AI Research Grant Program

We're excited to announce a new grant program supporting AI research in engineering applications!

**Grant Details:**
- **Amount:** Up to $50,000 per project
- **Duration:** 12 months
- **Focus Areas:** AI in IoT, robotics, cybersecurity, and sustainable engineering
- **Eligibility:** Open to researchers, students, and independent developers

**Application Requirements:**
- Research proposal (max 5 pages)
- Project timeline and milestones
- Budget breakdown
- Team qualifications
- Expected outcomes and impact

**Timeline:**
- Application deadline: July 15, 2026
- Notification: August 1, 2026
- Project start: September 1, 2026

**How to Apply:**
Submit applications through our research portal. Link in bio.

**Questions?** Join our Q&A session on June 20th at 2 PM EST.

Good luck to all applicants!`,
    category: 'Research',
    tags: ['Announcement', 'Grant', 'AI', 'Research', 'Funding'],
    post_type: 'announcement'
  },
  {
    title: 'Announcement: Community hackathon - Smart Cities of the Future',
    slug: 'announcement-community-hackathon-smart-cities',
    content: `## Community Hackathon: Smart Cities of the Future

Join us for our biggest community hackathon of the year!

**Event Details:**
- **Date:** July 8-10, 2026
- **Format:** 48-hour virtual hackathon
- **Theme:** Smart Cities of the Future
- **Prizes:** $10,000 in total prizes
- **Registration:** Free and open to all

**Challenge Tracks:**
1. **Urban Mobility:** Transportation and traffic solutions
2. **Energy Efficiency:** Smart grid and energy management
3. **Environmental Monitoring:** Air quality and pollution tracking
4. **Public Safety:** Emergency response and security
5. **Citizen Services:** Digital services for residents

**What's Provided:**
- Mentorship from industry experts
- Access to APIs and datasets
- Cloud credits for all participants
- Networking opportunities
- Swag bags for all participants

**Registration:** Opens June 20th - Limited to 200 participants

**Sponsors:** We're still accepting sponsor inquiries. Contact us for partnership opportunities.

Let's build the smart cities of tomorrow, together!`,
    category: 'Engineering',
    tags: ['Announcement', 'Hackathon', 'Smart City', 'IoT', 'Competition'],
    post_type: 'announcement'
  },
  {
    title: 'Announcement: New learning paths and certification programs',
    slug: 'announcement-new-learning-paths-certification-programs',
    content: `## New Learning Paths and Certification Programs

We're thrilled to announce the launch of our new learning paths and certification programs!

**New Learning Paths:**

1. **IoT Engineering Fundamentals**
   - 12-week program
   - Hands-on projects with real hardware
   - Industry-recognized certification
   - Mentorship from IoT experts

2. **AI for Engineers**
   - 8-week intensive program
   - Focus on practical AI applications
   - Real-world project work
   - Career placement support

3. **Cybersecurity for Embedded Systems**
   - 10-week specialized program
   - Hands-on security labs
   - Industry certification prep
   - Network with security professionals

**Certification Programs:**
- Certified IoT Engineer (CIE)
- AI Engineering Professional (AIEP)
- Embedded Systems Security Specialist (ESSS)

**Special Launch Offer:**
- 20% off all programs for early registrants
- Free access to premium resources
- Priority placement in mentorship program

**Enrollment:** Opens July 1st - Limited spots available

Invest in your future with our industry-recognized programs!`,
    category: 'Career Growth',
    tags: ['Announcement', 'Learning', 'Certification', 'Education', 'Career'],
    post_type: 'announcement'
  },
  {
    title: 'Announcement: Open source project spotlight program',
    slug: 'announcement-open-source-project-spotlight-program',
    content: `## Open Source Project Spotlight Program

We're launching a new program to highlight and support outstanding open source projects in our community!

**Program Benefits:**
- Featured spot on our platform
- $500 monthly stipend for featured projects
- Mentorship from experienced maintainers
- Access to our community resources
- Promotion across our channels

**Selection Criteria:**
- Active development and maintenance
- Clear documentation and contribution guidelines
- Welcoming to new contributors
- Alignment with our community values
- Impact and innovation

**How to Nominate:**
- Self-nominations welcome
- Community nominations encouraged
- Monthly selection process
- All projects considered

**First Spotlight Selection:** July 15th

**Nomination Form:** Available in our community resources

We believe in the power of open source. Let's celebrate and support the projects that make our community amazing!`,
    category: 'Open Source',
    tags: ['Announcement', 'Open Source', 'Community', 'Spotlight', 'Support'],
    post_type: 'announcement'
  },
  {
    title: 'Announcement: Community survey and feedback initiative',
    slug: 'announcement-community-survey-feedback-initiative',
    content: `## Community Survey and Feedback Initiative

Your voice matters! We're launching a comprehensive community survey to better understand your needs and improve our platform.

**Survey Topics:**
- Platform features and usability
- Content preferences and interests
- Community engagement and events
- Learning and development needs
- Suggestions for improvements

**Incentives:**
- Complete the survey for a chance to win a $100 gift card
- 10 winners will be selected randomly
- Survey takes approximately 10 minutes
- All responses anonymous

**Timeline:**
- Survey open: June 15-30, 2026
- Results announcement: July 15, 2026
- Implementation of feedback: Ongoing

**How to Participate:**
Survey link will be sent to all community members via email. Check your inbox!

**Town Hall:**
Join us for a virtual town hall on July 20th to discuss survey results and future plans.

Help us build a better community for everyone. Your feedback is invaluable!`,
    category: 'Open Source',
    tags: ['Announcement', 'Survey', 'Feedback', 'Community', 'Improvement'],
    post_type: 'announcement'
  }
];

async function populateCommunityHub() {
  logger.info('Starting to populate Community Hub with 20 posts (10 discussions, 5 challenges, 5 announcements)...');
  
  // Get a user ID (first profile)
  const { data: profiles } = await supabase
    .from('profiles')
    .select('id')
    .limit(1);

  const userId = profiles && profiles.length > 0 ? profiles[0].id : null;

  if (!userId) {
    logger.error('No profiles found in database. Please create at least one profile first.');
    process.exit(1);
  }

  let successCount = 0;
  let errorCount = 0;
  const errors = [];

  for (const post of communityPosts) {
    try {
      // Check if post already exists
      const { data: existing } = await supabase
        .from('community_posts')
        .select('id')
        .eq('slug', post.slug)
        .single();

      if (existing) {
        logger.info(`⚠️  Post "${post.title}" already exists, skipping...`);
        continue;
      }

      // Insert post
      const insertData = {
        user_id: userId,
        title: post.title,
        slug: post.slug,
        content: post.content,
        category: post.category,
        tags: post.tags,
        views: 0,
        upvotes: 0,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      const { data, error } = await supabase
        .from('community_posts')
        .insert([insertData])
        .select();

      if (error) {
        throw error;
      }

      const postType = post.post_type.charAt(0).toUpperCase() + post.post_type.slice(1);
      logger.info(`✅ Successfully inserted ${postType}: ${post.title}`);
      successCount++;
    } catch (error) {
      logger.error(`❌ Error inserting "${post.title}":`, error.message);
      errorCount++;
      errors.push({ post: post.title, error: error.message });
    }
  }

  logger.info('\n========================================');
  logger.info('Population Summary:');
  logger.info('========================================');
  logger.info(`Total posts processed: ${communityPosts.length}`);
  logger.info(`Successfully inserted: ${successCount}`);
  logger.info(`Skipped (already exists): ${communityPosts.length - successCount - errorCount}`);
  logger.info(`Errors: ${errorCount}`);
  
  if (errors.length > 0) {
    logger.info('\nErrors:');
    errors.forEach(({ post, error }) => {
      logger.info(`  - ${post}: ${error}`);
    });
  }

  logger.info('\n========================================');
  logger.info('Verification Query:');
  logger.info('========================================');
  
  const { data: verification } = await supabase
    .from('community_posts')
    .select('title, category, upvotes, views')
    .in('slug', communityPosts.map(p => p.slug));

  if (verification) {
    logger.info('\nPosts by category:');
    verification.forEach(row => {
      logger.info(`  ${row.category}: ${row.title} (${row.upvotes} upvotes, ${row.views} views)`);
    });
  }

  const { count: totalCount } = await supabase
    .from('community_posts')
    .select('*', { count: 'exact', head: true });

  logger.info(`\nTotal community posts in database: ${totalCount}`);
}

populateCommunityHub()
  .then(() => {
    logger.info('\n✅ Community Hub population completed!');
    process.exit(0);
  })
  .catch((error) => {
    logger.error('\n❌ Fatal error during population:', error);
    process.exit(1);
  });
