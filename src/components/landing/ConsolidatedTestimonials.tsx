"use client";

import { motion } from "framer-motion";
import { Star, Quote } from "lucide-react";

const testimonials = [
  {
    name: "Sarah Chen",
    role: "ML Engineer at Google",
    content: "Axiora's AI explanations helped me understand machine learning completely. The learning path was incredible and practical. I've recommended this platform to my entire team.",
    rating: 5,
    avatar: "SC"
  },
  {
    name: "Rahul Sharma",
    role: "Systems Engineer",
    content: "Started contributing during college, now building real systems! The project documentation and community support are unmatched. Best decision for my engineering career.",
    rating: 5,
    avatar: "RS"
  },
  {
    name: "Alex Rivera",
    role: "IoT Specialist at Tesla",
    content: "Found my dream job through Axiora projects! The hands-on experience with IoT systems made all the difference in interviews. Real-world projects matter.",
    rating: 5,
    avatar: "AR"
  },
  {
    name: "Priya Sharma",
    role: "CS Student, IIT Delhi",
    content: "Axiora transformed my understanding of AI. The projects are industry-grade and the documentation is exceptional. My professors were impressed by my portfolio.",
    rating: 5,
    avatar: "PS"
  },
  {
    name: "Dr. Rajesh Kumar",
    role: "Research Scientist, MIT",
    content: "The research resources and collaboration opportunities have accelerated our lab's work significantly. High-quality publications and excellent datasets.",
    rating: 5,
    avatar: "RK"
  },
  {
    name: "Alex Chen",
    role: "Senior Developer, Google",
    content: "Even as an experienced engineer, I found the advanced projects incredibly valuable for staying current with modern engineering practices.",
    rating: 5,
    avatar: "AC"
  }
];

export function ConsolidatedTestimonials() {
  return (
    <section className="py-24">
      {/* Header */}
      <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="mb-16 text-center"
        >
          <p className="mb-4 text-sm uppercase tracking-[0.28em] text-muted">Testimonials</p>
          <h2 className="mb-6 font-heading text-section-title font-bold">
            Engineers Building Their Future Here
          </h2>
          <p className="mx-auto max-w-3xl text-lg text-muted">
            Hear from engineers, researchers, and students who have transformed their careers with Arpit Labs.
          </p>
        </motion.div>

        {/* Testimonials Grid */}
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
              <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-accent/5 opacity-0 transition-opacity duration-300 hover:opacity-100" />
              <div className="relative">
                {/* Quote Icon */}
                <div className="mb-4 inline-flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary">
                  <Quote size={20} />
                </div>

                {/* Rating */}
                <div className="mb-4 flex items-center gap-1">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <Star key={i} className="h-5 w-5 fill-primary text-primary" />
                  ))}
                </div>

                {/* Content */}
                <p className="mb-6 text-base text-muted leading-relaxed">
                  &ldquo;{testimonial.content}&rdquo;
                </p>

                {/* Author */}
                <div className="flex items-center gap-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-primary/20 to-accent/20">
                    <span className="text-lg font-bold text-primary">
                      {testimonial.avatar}
                    </span>
                  </div>
                  <div>
                    <p className="font-heading font-semibold text-foreground">{testimonial.name}</p>
                    <p className="text-sm text-muted">{testimonial.role}</p>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Stats */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="mt-16"
        >
          <div className="grid gap-6 sm:grid-cols-3">
            <div className="rounded-3xl glass p-8 text-center">
              <div className="text-4xl font-heading font-bold bg-gradient-to-r from-foreground to-muted bg-clip-text text-transparent">
                95%
              </div>
              <p className="mt-2 text-sm font-heading font-semibold text-foreground">Career Growth</p>
              <p className="text-xs text-muted">Reported by users</p>
            </div>
            <div className="rounded-3xl glass p-8 text-center">
              <div className="text-4xl font-heading font-bold bg-gradient-to-r from-foreground to-muted bg-clip-text text-transparent">
                4.9/5
              </div>
              <p className="mt-2 text-sm font-heading font-semibold text-foreground">Average Rating</p>
              <p className="text-xs text-muted">Across all reviews</p>
            </div>
            <div className="rounded-3xl glass p-8 text-center">
              <div className="text-4xl font-heading font-bold bg-gradient-to-r from-foreground to-muted bg-clip-text text-transparent">
                89%
              </div>
              <p className="mt-2 text-sm font-heading font-semibold text-foreground">Would Recommend</p>
              <p className="text-xs text-muted">To other engineers</p>
            </div>
          </div>
        </motion.div>
    </section>
  );
}
