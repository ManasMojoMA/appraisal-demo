"use client";

import { motion } from "framer-motion";
import {
  ArrowRight,
  ClipboardCheck,
  FileText,
  LockKeyhole,
  ShieldCheck,
  GraduationCap,
  BookOpen,
  Award,
  Lightbulb,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { ParticleTextEffect } from "@/components/ParticleTextEffect";

const steps = [
  {
    title: "Draft",
    text: "Faculty complete structured self-review entries with evidence.",
    icon: FileText,
  },
  {
    title: "Submit",
    text: "The form validates every enabled category before final submission.",
    icon: ClipboardCheck,
  },
  {
    title: "Review",
    text: "Authorized teams verify evidence and combine approved data sources.",
    icon: ShieldCheck,
  },
  {
    title: "Secure",
    text: "Internal evaluation logic remains protected and role-based.",
    icon: LockKeyhole,
  },
];

const categories = [
  {
    title: "Service Contribution",
    description:
      "Report institutional roles, industry engagement, and faculty development contributions.",
    icon: Award,
  },
  {
    title: "Research Performance",
    description:
      "Document publications, projects, patents, and research collaborations.",
    icon: BookOpen,
  },
  {
    title: "Academic Delivery",
    description:
      "Evidence of course planning, syllabus completion, LMS usage, and student support.",
    icon: GraduationCap,
  },
  {
    title: "Innovation in Pedagogy",
    description:
      "Showcase innovative teaching methods, live projects, and experiential learning.",
    icon: Lightbulb,
  },
];

const fadeInUp = {
  initial: { opacity: 0, y: 24 },
  animate: { opacity: 1, y: 0 },
};

export default function LandingPage() {
  return (
    <main className="min-h-screen bg-[#FFFDF7] text-[#111827]">
      {/* ───── Hero Section ───── */}
      <section className="relative overflow-hidden bg-[#08111F] px-6 py-8 text-white md:px-10 md:py-12">
        <div className="absolute inset-0 opacity-40 [background:radial-gradient(circle_at_20%_20%,#E3120B_0,transparent_30%),radial-gradient(circle_at_82%_16%,#F9C205_0,transparent_26%),radial-gradient(circle_at_70%_75%,#3EBDFA_0,transparent_24%)]" />

        <div className="relative mx-auto flex max-w-7xl flex-col gap-10">
          {/* Nav */}
          <nav className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Image
                src="/institute-logo.svg"
                alt="Northbridge Institute"
                width={96}
                height={96}
                className="rounded-xl shadow-lg"
                unoptimized
              />
              <div>
                <p className="text-xs uppercase tracking-[0.24em] text-white/60">
                  Faculty Portal
                </p>
                <p className="font-semibold">Performance Appraisal</p>
              </div>
            </div>
            <div className="hidden items-center gap-3 md:flex">
              <Link
                href="/login?role=admin"
                className="rounded-full border border-white/15 px-5 py-2 text-sm text-white/80 transition hover:bg-white/10"
              >
                Admin Login
              </Link>
              <Link
                href="/login"
                className="rounded-full bg-[#F9C205] px-5 py-2 text-sm font-semibold text-[#08111F] transition hover:scale-[1.02] hover:shadow-lg hover:shadow-yellow-500/20"
              >
                Faculty Login
              </Link>
            </div>
          </nav>

          {/* Hero content */}
          <div className="grid items-center gap-10 lg:grid-cols-[0.92fr_1.08fr]">
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7 }}
              className="space-y-7"
            >
              <div className="inline-flex rounded-full border border-white/15 bg-white/10 px-4 py-2 text-sm text-white/80 backdrop-blur">
                Annual self-review • Evidence-led • Secure evaluation
              </div>
              <h1 className="max-w-3xl text-4xl font-semibold tracking-tight md:text-6xl">
                A structured self-review experience for faculty appraisal.
              </h1>
              <p className="max-w-2xl text-lg leading-8 text-white/70">
                Faculty can submit service, research, academic delivery, and
                innovation contributions in one clean workflow. Internal
                evaluation remains protected for authorized reviewers.
              </p>
              <div className="flex flex-col gap-3 sm:flex-row">
                <Link
                  href="/login"
                  className="inline-flex items-center justify-center gap-2 rounded-full bg-[#E3120B] px-6 py-3 font-semibold text-white shadow-lg shadow-red-950/30 transition hover:scale-[1.02] hover:shadow-xl"
                >
                  Start Faculty Login <ArrowRight className="h-4 w-4" />
                </Link>
                <Link
                  href="/login?role=admin"
                  className="rounded-full border border-white/15 px-6 py-3 font-semibold text-white/85 transition hover:bg-white/10"
                >
                  Open Admin Console
                </Link>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.8, delay: 0.1 }}
            >
              <ParticleTextEffect />
            </motion.div>
          </div>
        </div>
      </section>

      {/* ───── Process Section ───── */}
      <section className="mx-auto max-w-7xl px-6 py-16 md:px-10">
        <div className="mb-10 flex flex-col justify-between gap-4 md:flex-row md:items-end">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[#E3120B]">
              Process
            </p>
            <h2 className="mt-2 text-3xl font-semibold tracking-tight">
              Simple for faculty. Controlled for administrators.
            </h2>
          </div>
          <p className="max-w-xl text-[#6B7280]">
            The portal separates faculty-facing self-review from confidential
            internal processes, ensuring data integrity and role-based access.
          </p>
        </div>

        <div className="grid gap-5 md:grid-cols-4">
          {steps.map((step, index) => {
            const Icon = step.icon;
            return (
              <motion.div
                key={step.title}
                variants={fadeInUp}
                initial="initial"
                whileInView="animate"
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="group rounded-3xl border border-[#F3E7DE] bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-xl"
              >
                <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-2xl bg-[#FFF4E6] text-[#E3120B] transition group-hover:bg-[#E3120B] group-hover:text-white">
                  <Icon className="h-5 w-5" />
                </div>
                <h3 className="text-lg font-semibold">{step.title}</h3>
                <p className="mt-2 text-sm leading-6 text-[#6B7280]">
                  {step.text}
                </p>
              </motion.div>
            );
          })}
        </div>
      </section>

      {/* ───── Categories Section ───── */}
      <section className="bg-[#08111F] px-6 py-16 text-white md:px-10">
        <div className="mx-auto max-w-7xl">
          <div className="mb-10 text-center">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[#F9C205]">
              Self-Review Categories
            </p>
            <h2 className="mt-2 text-3xl font-semibold tracking-tight">
              Four areas of annual contribution
            </h2>
            <p className="mx-auto mt-4 max-w-2xl text-white/60">
              Faculty can enable and submit evidence-backed entries across
              each category during the appraisal window.
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            {categories.map((cat, index) => {
              const Icon = cat.icon;
              return (
                <motion.div
                  key={cat.title}
                  variants={fadeInUp}
                  initial="initial"
                  whileInView="animate"
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  className="rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur transition hover:border-white/20 hover:bg-white/10"
                >
                  <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl bg-white/10 text-[#F9C205]">
                    <Icon className="h-5 w-5" />
                  </div>
                  <h3 className="text-lg font-semibold">{cat.title}</h3>
                  <p className="mt-2 text-sm leading-6 text-white/60">
                    {cat.description}
                  </p>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ───── Confidentiality Note ───── */}
      <section className="mx-auto max-w-7xl px-6 py-16 md:px-10">
        <motion.div
          variants={fadeInUp}
          initial="initial"
          whileInView="animate"
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="rounded-3xl border border-[#F3E7DE] bg-gradient-to-br from-[#FFFDF7] to-[#FFF8F0] p-8 md:p-12"
        >
          <div className="flex flex-col items-center gap-6 md:flex-row">
            <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-[#08111F] text-[#F9C205]">
              <ShieldCheck className="h-8 w-8" />
            </div>
            <div>
              <h3 className="text-xl font-semibold">
                Confidential & Secure
              </h3>
              <p className="mt-2 max-w-3xl text-[#6B7280]">
                Internal evaluation details are handled securely by
                authorized reviewers. Faculty can view their own submitted
                self-review content, while all administrative processes
                remain protected behind role-based access controls.
              </p>
            </div>
          </div>
        </motion.div>
      </section>

      {/* ───── Footer ───── */}
      <footer className="border-t border-[#F3E7DE] bg-[#FFFDF7] px-6 py-8 md:px-10">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 md:flex-row">
          <div className="flex items-center gap-3">
            <Image
              src="/institute-logo.svg"
              alt="Northbridge Institute"
              width={36}
              height={36}
              className="rounded-lg"
              unoptimized
            />
            <div>
              <p className="text-sm font-semibold text-[#111827]">
                Faculty Performance Appraisal Portal
              </p>
              <p className="text-xs text-[#6B7280]">
                Northbridge Institute — School of Management
              </p>
            </div>
          </div>
          <p className="text-xs text-[#6B7280]">
            &copy; {new Date().getFullYear()} Northbridge Institute. All
            rights reserved.
          </p>
        </div>
      </footer>
    </main>
  );
}
