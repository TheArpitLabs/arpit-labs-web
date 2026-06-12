"use client";

import { motion } from "framer-motion";
import { Award, Trophy, Target, Zap, Star } from "lucide-react";

const achievements = [
  { icon: Award, label: "Engineering Focus", value: "AI + IoT", description: "Core domains" },
  { icon: Trophy, label: "Projects Published", value: "5+", description: "Production systems" },
  { icon: Target, label: "Research Papers", value: "6+", description: "Technical publications" },
  { icon: Zap, label: "Resources Available", value: "20+", description: "Engineering assets" },
];

const testimonials = [
  {
    name: "Sarah Chen",
    role: "ML Engineer at Google",
    content: "Arpit Labs' AI explanations helped me understand machine learning completely. The learning path was incredible and practical.",
    rating: 5
  },
  {
    name: "Rahul Sharma",
    role: "Systems Engineer",
    content: "Started contributing during college, now building real systems! The project documentation and community support are unmatched.",
    rating: 5
  },
  {
    name: "Alex Rivera",
    role: "IoT Specialist at Tesla",
    content: "Found my dream job through Arpit Labs projects! The hands-on experience with IoT systems made all the difference in interviews.",
    rating: 5
  }
];

const milestones = [
  { year: "2023", title: "Platform Launch", description: "Started with 10 projects" },
  { year: "2024", title: "Community Growth", description: "Reached 1,000+ members" },
  { year: "2025", title: "AI Integration", description: "Added AI-powered tools" },
  { year: "2026", title: "Global Expansion", description: "Worldwide engineering network" },
];

export function SocialProofSection() {
  return (
    <section className="py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Achievements */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="mb-24"
        >
          <div className="mb-12 text-center">
            <p className="mb-4 text-sm uppercase tracking-[0.28em] text-muted">Achievements</p>
            <h2 className="mb-6 text-section-title">
              Building Systems That Matter
            </h2>
          </div>

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {achievements.map((achievement, index) => (
              <motion.div
                key={achievement.label}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                whileHover={{ y: -8 }}
                className="relative overflow-hidden rounded-3xl glass p-8 text-center transition-all duration-300 hover:shadow-2xl"
              >
                <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-secondary/5 opacity-0 transition-opacity duration-300 hover:opacity-100" />
                <div className="relative">
                  <div className="mx-auto mb-4 inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-primary/10 to-secondary/10 text-primary shadow-lg">
                    <achievement.icon size={32} />
                  </div>
                  <div className="mb-2 text-5xl font-bold bg-gradient-to-r from-foreground to-muted bg-clip-text text-transparent">
                    {achievement.value}
                  </div>
                  <p className="mb-1 text-lg font-semibold text-foreground">{achievement.label}</p>
                  <p className="text-sm text-muted">{achievement.description}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Testimonials */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="mb-24"
        >
          <div className="mb-12 text-center">
            <p className="mb-4 text-sm uppercase tracking-[0.28em] text-muted">Community Love</p>
            <h2 className="mb-6 text-section-title">
              Engineers Building Their Future Here
            </h2>
          </div>

          <div className="grid gap-6 lg:grid-cols-3">
            {testimonials.map((testimonial, index) => (
              <motion.div
                key={testimonial.name}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                whileHover={{ y: -8 }}
                className="relative overflow-hidden rounded-3xl glass p-8 transition-all duration-300 hover:shadow-2xl"
              >
                <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-secondary/5 opacity-0 transition-opacity duration-300 hover:opacity-100" />
                <div className="relative">
                  <div className="mb-4 flex items-center gap-1">
                    {[...Array(testimonial.rating)].map((_, i) => (
                      <Star key={i} className="h-5 w-5 fill-primary text-primary" />
                    ))}
                  </div>
                  <p className="mb-6 text-base text-muted leading-relaxed">
                    &ldquo;{testimonial.content}&rdquo;
                  </p>
                  <div className="flex items-center gap-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-primary/20 to-secondary/20">
                      <span className="text-lg font-bold text-primary">
                        {testimonial.name.charAt(0)}
                      </span>
                    </div>
                    <div>
                      <p className="font-semibold text-foreground">{testimonial.name}</p>
                      <p className="text-sm text-muted">{testimonial.role}</p>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Milestones */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <div className="mb-12 text-center">
            <p className="mb-4 text-sm uppercase tracking-[0.28em] text-muted">Journey</p>
            <h2 className="mb-6 text-section-title">
              Our Evolution
            </h2>
          </div>

          <div className="relative">
            {/* Timeline line */}
            <div className="absolute left-1/2 top-0 h-full w-0.5 -translate-x-1/2 bg-gradient-to-b from-primary via-secondary to-primary opacity-20" />

            <div className="space-y-8">
              {milestones.map((milestone, index) => (
                <motion.div
                  key={milestone.year}
                  initial={{ opacity: 0, x: index % 2 === 0 ? -20 : 20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  className={`relative flex items-center ${index % 2 === 0 ? 'justify-start' : 'justify-end'}`}
                >
                  <div className={`w-5/12 ${index % 2 === 0 ? 'text-right pr-8' : 'text-left pl-8'}`}>
                    <div className="rounded-2xl glass p-6">
                      <span className="mb-2 inline-block rounded-full bg-gradient-to-r from-primary/10 to-secondary/10 px-3 py-1 text-sm font-semibold text-primary">
                        {milestone.year}
                      </span>
                      <h3 className="mb-2 text-xl font-bold text-foreground">{milestone.title}</h3>
                      <p className="text-muted">{milestone.description}</p>
                    </div>
                  </div>
                  
                  {/* Timeline dot */}
                  <div className="absolute left-1/2 flex h-4 w-4 -translate-x-1/2 items-center justify-center rounded-full bg-gradient-to-r from-primary to-secondary shadow-lg">
                    <div className="h-2 w-2 rounded-full bg-background" />
                  </div>
                  
                  <div className="w-5/12" />
                </motion.div>
              ))}
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
