"use client";

import { motion } from "framer-motion";
import { ArrowRight, ClipboardCheck, FileText, LockKeyhole, ShieldCheck } from "lucide-react";
import { ParticleTextEffect } from "../components/ParticleTextEffect";

const steps = [
  { title: "Draft", text: "Faculty complete structured self-review entries with evidence.", icon: FileText },
  { title: "Submit", text: "The form validates every enabled category before final submission.", icon: ClipboardCheck },
  { title: "Review", text: "Authorized teams verify evidence and combine approved data sources.", icon: ShieldCheck },
  { title: "Secure", text: "Internal evaluation logic remains protected and role-based.", icon: LockKeyhole },
];

export default function LandingPage() {
  return (
    <main className="min-h-screen bg-[#FFFDF7] text-[#111827]">
      <section className="relative overflow-hidden bg-[#08111F] px-6 py-8 text-white md:px-10 md:py-12">
        <div className="absolute inset-0 opacity-40 [background:radial-gradient(circle_at_20%_20%,#E3120B_0,transparent_30%),radial-gradient(circle_at_82%_16%,#F9C205_0,transparent_26%),radial-gradient(circle_at_70%_75%,#3EBDFA_0,transparent_24%)]" />
        <div className="relative mx-auto flex max-w-7xl flex-col gap-10">
          <nav className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/10 ring-1 ring-white/20">
                <span className="text-lg font-bold text-[#F9C205]">GU</span>
              </div>
              <div>
                <p className="text-sm uppercase tracking-[0.24em] text-white/60">Faculty Portal</p>
                <p className="font-semibold">Performance Appraisal</p>
              </div>
            </div>
            <div className="hidden items-center gap-3 md:flex">
              <button className="rounded-full border border-white/15 px-5 py-2 text-sm text-white/80 transition hover:bg-white/10">
                Admin Login
              </button>
              <button className="rounded-full bg-[#F9C205] px-5 py-2 text-sm font-semibold text-[#08111F] transition hover:scale-[1.02]">
                Faculty Login
              </button>
            </div>
          </nav>

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
              <p className="max-w-2xl text-lg leading-8 text-white/72">
                Faculty can submit service, research, academic delivery, and innovation contributions in one clean workflow. Internal evaluation remains protected for authorized reviewers.
              </p>
              <div className="flex flex-col gap-3 sm:flex-row">
                <button className="inline-flex items-center justify-center gap-2 rounded-full bg-[#E3120B] px-6 py-3 font-semibold text-white shadow-lg shadow-red-950/30 transition hover:scale-[1.02]">
                  Start Faculty Login <ArrowRight className="h-4 w-4" />
                </button>
                <button className="rounded-full border border-white/15 px-6 py-3 font-semibold text-white/85 transition hover:bg-white/10">
                  Open Admin Console
                </button>
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

      <section className="mx-auto max-w-7xl px-6 py-14 md:px-10">
        <div className="mb-8 flex flex-col justify-between gap-4 md:flex-row md:items-end">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[#E3120B]">Process</p>
            <h2 className="mt-2 text-3xl font-semibold tracking-tight">Simple for faculty. Controlled for administrators.</h2>
          </div>
          <p className="max-w-xl text-[#6B7280]">
            The portal separates faculty-facing self-review from confidential internal scoring, student feedback imports, and evaluator moderation.
          </p>
        </div>

        <div className="grid gap-5 md:grid-cols-4">
          {steps.map((step) => {
            const Icon = step.icon;
            return (
              <div key={step.title} className="rounded-3xl border border-[#F3E7DE] bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-xl">
                <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-2xl bg-[#FFF4E6] text-[#E3120B]">
                  <Icon className="h-5 w-5" />
                </div>
                <h3 className="text-lg font-semibold">{step.title}</h3>
                <p className="mt-2 text-sm leading-6 text-[#6B7280]">{step.text}</p>
              </div>
            );
          })}
        </div>
      </section>
    </main>
  );
}
