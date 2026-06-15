/**
 * Engineering Domain Classifier
 * AI-powered classification system for categorizing content into engineering domains
 * 
 * Input: title, description, README, tags, technologies
 * Output: domain, subdomain, confidence score
 */

export interface ClassificationInput {
  title: string;
  description?: string;
  readme?: string;
  tags?: string[];
  technologies?: string[];
}

export interface ClassificationResult {
  domain: string;
  subdomain: string;
  confidence: number;
  domainSlug: string;
  subdomainSlug: string;
}

// Domain keyword mappings for classification
const DOMAIN_KEYWORDS: Record<string, {
  name: string;
  keywords: string[];
  subdomains: Record<string, string[]>;
}> = {
  'ai-machine-learning': {
    name: 'AI & Machine Learning',
    keywords: [
      'ai', 'artificial intelligence', 'machine learning', 'ml', 'deep learning',
      'neural network', 'tensorflow', 'pytorch', 'keras', 'scikit-learn',
      'computer vision', 'nlp', 'natural language processing', 'gan',
      'generative', 'transformer', 'bert', 'gpt', 'llm', 'large language model',
      'reinforcement learning', 'mlops', 'model deployment', 'agentic', 'agent',
      'autonomous', 'prediction', 'classification', 'regression', 'clustering'
    ],
    subdomains: {
      'machine-learning': ['machine learning', 'ml', 'supervised', 'unsupervised', 'classification', 'regression', 'scikit-learn', 'xgboost', 'random forest'],
      'deep-learning': ['deep learning', 'neural network', 'cnn', 'rnn', 'lstm', 'transformer', 'attention', 'pytorch', 'tensorflow'],
      'computer-vision': ['computer vision', 'image', 'object detection', 'segmentation', 'opencv', 'yolo', 'resnet', 'vision'],
      'natural-language-processing': ['nlp', 'natural language', 'text', 'sentiment', 'tokenization', 'bert', 'gpt', 'language model'],
      'generative-ai': ['generative', 'gan', 'diffusion', 'stable diffusion', 'image generation', 'text generation', 'create'],
      'agentic-ai': ['agentic', 'agent', 'autonomous agent', 'multi-agent', 'decision making', 'planning'],
      'reinforcement-learning': ['reinforcement learning', 'q-learning', 'policy gradient', 'reward', 'environment', 'agent'],
      'mlops': ['mlops', 'model deployment', 'ml pipeline', 'monitoring', 'serving', 'production ml']
    }
  },
  'cybersecurity': {
    name: 'Cybersecurity',
    keywords: [
      'security', 'cybersecurity', 'hack', 'penetration', 'vulnerability',
      'exploit', 'malware', 'ransomware', 'phishing', 'firewall', 'intrusion',
      'encryption', 'cryptography', 'forensics', 'soc', 'siem', 'threat',
      'attack', 'defense', 'secure', 'authentication', 'authorization', 'zero trust'
    ],
    subdomains: {
      'ethical-hacking': ['ethical hacking', 'white hat', 'bug bounty', 'vulnerability assessment', 'security audit'],
      'penetration-testing': ['penetration testing', 'pentest', 'exploit', 'metasploit', 'burp suite', 'sql injection'],
      'network-security': ['network security', 'firewall', 'ids', 'ips', 'wireshark', 'packet', 'network protection'],
      'cloud-security': ['cloud security', 'aws security', 'azure security', 'gcp security', 'devsecops', 'cloud defense'],
      'malware-analysis': ['malware analysis', 'reverse engineering', 'disassembly', 'debugging', 'threat analysis'],
      'soc-operations': ['soc', 'security operations', 'incident response', 'siem', 'threat monitoring', 'security analyst'],
      'digital-forensics': ['forensics', 'digital forensics', 'investigation', 'evidence', 'chain of custody', 'analysis'],
      'secure-coding': ['secure coding', 'code review', 'sast', 'dast', 'security testing', 'vulnerability prevention']
    }
  },
  'iot-embedded-systems': {
    name: 'IoT & Embedded Systems',
    keywords: [
      'iot', 'internet of things', 'embedded', 'arduino', 'esp32', 'raspberry pi',
      'stm32', 'microcontroller', 'sensor', 'actuator', 'firmware', 'real-time',
      'rtos', 'pcb', 'circuit', 'hardware', 'edge', 'smart city', 'industrial'
    ],
    subdomains: {
      'arduino': ['arduino', 'arduino uno', 'arduino mega', 'sketch', 'arduino ide'],
      'esp32': ['esp32', 'esp8266', 'wifi', 'bluetooth', 'micropython', 'esp-idf'],
      'raspberry-pi': ['raspberry pi', 'rpi', 'raspbian', 'single board', 'sbc', 'gpio'],
      'stm32': ['stm32', 'arm cortex', 'hal', 'stm32cube', 'embedded c'],
      'embedded-linux': ['embedded linux', 'yocto', 'buildroot', 'kernel', 'device driver', 'bootloader'],
      'smart-cities': ['smart city', 'urban iot', 'smart infrastructure', 'city sensor', 'urban monitoring'],
      'industrial-iot': ['industrial iot', 'iiot', 'industry 4.0', 'manufacturing', 'automation', 'plc'],
      'edge-ai': ['edge ai', 'tinyml', 'on-device ml', 'edge computing', 'inference', 'tensorrt lite']
    }
  },
  'robotics': {
    name: 'Robotics',
    keywords: [
      'robot', 'robotics', 'ros', 'drone', 'uav', 'autonomous', 'navigation',
      'slam', 'manipulator', 'actuator', 'servo', 'motor control', 'kinematics',
      'dynamics', 'path planning', 'computer vision robotics', 'simulation'
    ],
    subdomains: {
      'ros': ['ros', 'ros2', 'robot operating system', 'nav2', 'moveit', 'gazebo'],
      'drones': ['drone', 'uav', 'quadcopter', 'flight controller', 'px4', 'ardupilot'],
      'autonomous-systems': ['autonomous', 'self-driving', 'navigation', 'path planning', 'localization'],
      'industrial-robotics': ['industrial robot', 'robotic arm', 'manipulator', 'cobot', 'automation'],
      'slam': ['slam', 'simultaneous localization', 'mapping', 'lidar', 'occupancy grid'],
      'computer-vision-robotics': ['robot vision', 'visual servoing', 'perception', 'depth camera', 'point cloud']
    }
  },
  'software-development': {
    name: 'Software Development',
    keywords: [
      'web', 'app', 'frontend', 'backend', 'full stack', 'mobile', 'devops',
      'cloud', 'api', 'rest', 'graphql', 'microservices', 'container', 'kubernetes',
      'docker', 'ci/cd', 'database', 'framework', 'library', 'programming'
    ],
    subdomains: {
      'frontend': ['frontend', 'react', 'vue', 'angular', 'javascript', 'typescript', 'css', 'html', 'ui', 'ux'],
      'backend': ['backend', 'nodejs', 'express', 'django', 'flask', 'spring', 'api', 'server'],
      'full-stack': ['full stack', 'mern', 'mean', 'fullstack', 'end-to-end'],
      'mobile-development': ['mobile', 'react native', 'flutter', 'ios', 'android', 'swift', 'kotlin'],
      'devops': ['devops', 'ci/cd', 'jenkins', 'gitlab', 'github actions', 'infrastructure'],
      'cloud-engineering': ['aws', 'azure', 'gcp', 'cloud', 'serverless', 'lambda', 'cloud formation'],
      'api-development': ['api', 'rest', 'graphql', 'grpc', 'openapi', 'swagger', 'api design']
    }
  },
  'data-science': {
    name: 'Data Science',
    keywords: [
      'data', 'analytics', 'analysis', 'visualization', 'dashboard', 'bi',
      'business intelligence', 'big data', 'spark', 'hadoop', 'etl', 'pipeline',
      'warehouse', 'lake', 'statistics', 'predictive', 'forecasting', 'reporting'
    ],
    subdomains: {
      'data-analytics': ['analytics', 'analysis', 'statistical', 'exploratory', 'insight'],
      'data-engineering': ['data engineering', 'etl', 'pipeline', 'warehouse', 'lake', 'airflow'],
      'data-visualization': ['visualization', 'dashboard', 'chart', 'plot', 'tableau', 'power bi', 'd3'],
      'big-data': ['big data', 'spark', 'hadoop', 'distributed', 'scalable', 'cluster'],
      'business-intelligence': ['business intelligence', 'bi', 'reporting', 'decision support', 'kpi'],
      'predictive-analytics': ['predictive', 'forecasting', 'prediction', 'time series', 'prognostic']
    }
  }
};

/**
 * Domain Classifier Class
 * Uses keyword matching and confidence scoring to classify content
 */
export class DomainClassifier {
  /**
   * Classify content into engineering domain and subdomain
   */
  classify(input: ClassificationInput): ClassificationResult {
    const text = this.combineText(input);
    const scores = this.calculateDomainScores(text);
    const topDomain = this.getTopDomain(scores);
    
    if (!topDomain) {
      return this.getDefaultClassification();
    }

    const subdomainResult = this.classifySubdomain(text, topDomain.slug);
    
    return {
      domain: topDomain.name,
      subdomain: subdomainResult.name,
      confidence: Math.min(topDomain.score, subdomainResult.confidence),
      domainSlug: topDomain.slug,
      subdomainSlug: subdomainResult.slug
    };
  }

  /**
   * Combine all input text into a single searchable string
   */
  private combineText(input: ClassificationInput): string {
    const parts = [
      input.title,
      input.description || '',
      input.readme || '',
      ...(input.tags || []),
      ...(input.technologies || [])
    ];
    return parts.join(' ').toLowerCase();
  }

  /**
   * Calculate confidence scores for each domain
   */
  private calculateDomainScores(text: string): Array<{ slug: string; name: string; score: number }> {
    const scores: Array<{ slug: string; name: string; score: number }> = [];

    for (const [slug, domain] of Object.entries(DOMAIN_KEYWORDS)) {
      let score = 0;
      const words = text.split(/\s+/);

      // Count keyword matches
      for (const keyword of domain.keywords) {
        if (text.includes(keyword.toLowerCase())) {
          score += 1;
        }
      }

      // Bonus for title matches
      for (const keyword of domain.keywords) {
        if (text.toLowerCase().includes(keyword.toLowerCase()) && keyword.length > 3) {
          score += 0.5; // Small bonus for longer keyword matches in general text
        }
      }

      // Normalize score
      const maxPossibleScore = domain.keywords.length * 2;
      const normalizedScore = maxPossibleScore > 0 ? score / maxPossibleScore : 0;

      scores.push({
        slug,
        name: domain.name,
        score: normalizedScore
      });
    }

    return scores.sort((a, b) => b.score - a.score);
  }

  /**
   * Get the top-scoring domain
   */
  private getTopDomain(scores: Array<{ slug: string; name: string; score: number }>): { slug: string; name: string; score: number } | null {
    const top = scores[0];
    return top && top.score > 0.1 ? top : null;
  }

  /**
   * Classify subdomain within a domain
   */
  private classifySubdomain(text: string, domainSlug: string): { name: string; slug: string; confidence: number } {
    const domain = DOMAIN_KEYWORDS[domainSlug];
    if (!domain || !domain.subdomains) {
      return { name: 'General', slug: 'general', confidence: 0.5 };
    }

    const subdomainScores: Array<{ slug: string; name: string; score: number }> = [];

    for (const [slug, keywords] of Object.entries(domain.subdomains)) {
      let score = 0;
      for (const keyword of keywords) {
        if (text.includes(keyword.toLowerCase())) {
          score += 1;
        }
      }

      const maxPossibleScore = keywords.length;
      const normalizedScore = maxPossibleScore > 0 ? score / maxPossibleScore : 0;

      subdomainScores.push({
        slug,
        name: this.formatSubdomainName(slug),
        score: normalizedScore
      });
    }

    subdomainScores.sort((a, b) => b.score - a.score);
    const top = subdomainScores[0];

    return top && top.score > 0.1
      ? { name: top.name, slug: top.slug, confidence: top.score }
      : { name: 'General', slug: 'general', confidence: 0.5 };
  }

  /**
   * Format subdomain slug to readable name
   */
  private formatSubdomainName(slug: string): string {
    return slug
      .split('-')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  }

  /**
   * Get default classification when no confident match is found
   */
  private getDefaultClassification(): ClassificationResult {
    return {
      domain: 'Software Development',
      subdomain: 'Full Stack',
      confidence: 0.3,
      domainSlug: 'software-development',
      subdomainSlug: 'full-stack'
    };
  }

  /**
   * Batch classify multiple items
   */
  batchClassify(inputs: ClassificationInput[]): ClassificationResult[] {
    return inputs.map(input => this.classify(input));
  }
}

// Singleton instance
export const domainClassifier = new DomainClassifier();

/**
 * Convenience function for quick classification
 */
export function classifyContent(input: ClassificationInput): ClassificationResult {
  return domainClassifier.classify(input);
}

/**
 * Get all available domains
 */
export function getAllDomains(): Array<{ slug: string; name: string; description: string }> {
  return Object.entries(DOMAIN_KEYWORDS).map(([slug, domain]) => ({
    slug,
    name: domain.name,
    description: `${domain.name} domain with ${Object.keys(domain.subdomains).length} subdomains`
  }));
}

/**
 * Get subdomains for a specific domain
 */
export function getSubdomainsForDomain(domainSlug: string): Array<{ slug: string; name: string }> {
  const domain = DOMAIN_KEYWORDS[domainSlug];
  if (!domain || !domain.subdomains) {
    return [];
  }

  return Object.entries(domain.subdomains).map(([slug, keywords]) => ({
    slug,
    name: slug.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')
  }));
}
