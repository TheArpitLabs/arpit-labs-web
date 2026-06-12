"use client";

import { motion } from "framer-motion";
import { GraduationCap, Microscope, Code2, Rocket, Users, TrendingUp, ArrowRight, CheckCircle2 } from "lucide-react";
import Link from "next/link";

const communityStats = [
  { value: "1,200+", label: "Active Members", icon: Users },
  { value: "48+", label: "Projects Built", icon: Code2 },
  { value: "12K+", label: "Research Citations", icon: Microscope },
  { value: "89%", label: "Career Growth", icon: TrendingUp },
];

const communityTypes = [
  {
    title: "Students",
    description: "Undergraduate and graduate students building their engineering portfolios through hands-on projects",
    icon: GraduationCap,
    color: "from-blue-500/10 to-cyan-500/10",
    iconColor: "from-blue-500 to-cyan-500",
    benefits: ["Real-world projects", "Industry mentorship", "Career guidance", "Skill development"]
  },
  {
    title: "Researchers",
    description: "Academic researchers and PhD candidates exploring cutting-edge AI, IoT, and cybersecurity",
    icon: Microscope,
    color: "from-purple-500/10 to-pink-500/10",
    iconColor: "from-purple-500 to-pink-500",
    benefits: ["Research collaboration", "Publication support", "Dataset access", "Lab resources"]
  },
  {
    title: "Developers",
    description: "Professional developers and engineers enhancing their skills with advanced projects",
    icon: Code2,
    color: "from-green-500/10 to-emerald-500/10",
    iconColor: "from-green-500 to-emerald-500",
    benefits: ["Advanced projects", "Best practices", "Code reviews", "Networking"]
  },
  {
    title: "Startups",
    description: "Early-stage startups leveraging Arpit Labs resources for rapid prototyping and development",
    icon: Rocket,
    color: "from-orange-500/10 to-red-500/10",
    iconColor: "from-orange-500 to-red-500",
    benefits: ["Quick prototyping", "Technical support", "Talent access", "Industry insights"]
  },
];

const testimonials = [
  {
    name: "Priya Sharma",
    role: "CS Student, IIT Delhi",
    content: "Arpit Labs transformed my understanding of AI. The projects are industry-grade and the documentation is exceptional.",
    avatar: "PS"
  },
  {
    name: "Dr. Rajesh Kumar",
    role: "Research Scientist, MIT",
    content: "The research resources and collaboration opportunities have accelerated our lab's work significantly.",
    avatar: "RK"
  },
  {
    name: "Alex Chen",
    role: "Senior Developer, Google",
    content: "Even as an experienced engineer, I found the advanced projects incredibly valuable for staying current.",
    avatar: "AC"
  },
];

export function CommunitySection() {
  return (
    <section className="py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="mb-16 text-center"
        >
          <p className="mb-4 text-sm uppercase tracking-[0.28em] text-muted">Community</p>
          <h2 className="mb-6 text-section-title">
            Join a Global Engineering Network
          </h2>
          <p className="mx-auto max-w-3xl text-lg text-muted">
            Connect with students, researchers, developers, and innovators from around the world who are building the future of technology.
          </p>
        </motion.div>

        {/* Community Stats */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="mb-20 grid gap-6 sm:grid-cols-2 lg:grid-cols-4"
        >
          {communityStats.map((stat, index) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              whileHover={{ y: -8 }}
              className="relative overflow-hidden rounded-3xl glass p-6 text-center transition-all duration-300 hover:shadow-2xl"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-secondary/5 opacity-0 transition-opacity duration-300 hover:opacity-100" />
              <div className="relative">
                <div className="mx-auto mb-4 inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-primary/10 to-secondary/10 text-primary">
                  <stat.icon size={28} />
                </div>
                <div className="text-4xl font-bold bg-gradient-to-r from-foreground to-muted bg-clip-text text-transparent">
                  {stat.value}
                </div>
                <p className="mt-2 text-sm font-semibold text-foreground">{stat.label}</p>
              </div>
            </motion.div>
          ))}
        </motion.div>

        {/* Community Types */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="mb-20"
        >
          <div className="mb-12 text-center">
            <h3 className="text-3xl font-bold text-foreground">Who We Serve</h3>
            <p className="mt-4 text-muted">Tailored resources for every engineering journey</p>
          </div>

          <div className="grid gap-6 sm:grid-cols-2">
            {communityTypes.map((type, index) => (
              <motion.div
                key={type.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                whileHover={{ y: -8, scale: 1.02 }}
                className="group relative overflow-hidden rounded-3xl glass p-8 transition-all duration-300 hover:shadow-2xl"
              >
                <div className={`absolute inset-0 bg-gradient-to-br ${type.color} opacity-0 transition-opacity duration-300 group-hover:opacity-100`} />
                <div className="relative">
                  <motion.div
                    whileHover={{ scale: 1.1, rotate: 5 }}
                    transition={{ duration: 0.3 }}
                    className={`mb-6 inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br ${type.iconColor} text-white shadow-lg`}
                  >
                    <type.icon size={32} />
                  </motion.div>
                  
                  <h4 className="mb-3 text-2xl font-bold text-foreground group-hover:text-primary transition-colors">
                    {type.title}
                  </h4>
                  
                  <p className="mb-6 text-base text-muted leading-relaxed">
                    {type.description}
                  </p>
                  
                  <div className="space-y-2">
                    {type.benefits.map((benefit, idx) => (
                      <div key={idx} className="flex items-center gap-2 text-sm text-foreground">
                    <CheckCircle2 className="h-4 w-4 text-primary" />
                    <span>{benefit}</span>
                  </div>
                    ))}
                  </div>
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
        >
          <div className="mb-12 text-center">
            <h3 className="text-3xl font-bold text-foreground">Community Voices</h3>
            <p className="mt-4 text-muted">What our members say about Arpit Labs</p>
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
                  <p className="mb-6 text-base text-muted leading-relaxed">
                    &ldquo;{testimonial.content}&rdquo;
                  </p>
                  <div className="flex items-center gap-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-primary/20 to-secondary/20">
                      <span className="text-lg font-bold text-primary">{testimonial.avatar}</span>
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

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="mt-20"
        >
          <div className="relative overflow-hidden rounded-3xl glass p-12 text-center">
            <div className="absolute inset-0 bg-gradient-to-r from-primary/5 to-secondary/5" />
            <div className="relative">
              <h3 className="mb-4 text-3xl font-bold text-foreground">Ready to Join?</h3>
              <p className="mb-8 max-w-2xl mx-auto text-lg text-muted">
                Become part of a thriving community of engineers, researchers, and innovators building the future together.
              </p>
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-center">
                <Link
                  href="/register"
                  className="premium-button group inline-flex items-center justify-center"
                >
                  Join Community
                  <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                </Link>
                <Link
                  href="/community/global"
                  className="premium-button-secondary inline-flex items-center justify-center"
                >
                  Explore Community
                </Link>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
