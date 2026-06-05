"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { ArrowRightCircle, Target, CheckSquare, Users, Menu, X, BarChart3 } from "lucide-react"
import Link from "next/link"

export default function LandingPage() {
  const [menuOpen, setMenuOpen] = useState(false)

  const navLinks = ['Features', 'Workflow', 'Analytics', 'Help']

  const fadeUp = {
    hidden: { opacity: 0, y: 28 },
    visible: (i: number) => ({
      opacity: 1,
      y: 0,
      transition: { delay: i * 0.15, duration: 0.6, ease: [0.22, 1, 0.36, 1] }
    })
  }

  const Logo = () => (
    <Target className="h-8 w-8" style={{ color: "var(--color-accent-vs)" }} />
  )

  return (
    <div 
      className="relative w-full min-h-screen overflow-hidden bg-background"
      style={{ fontFamily: "var(--font-body)", color: "var(--color-text)" }}
    >
      {/* Background Video */}
      <video
        autoPlay
        muted
        loop
        playsInline
        className="absolute inset-0 w-full h-full object-cover z-0 pointer-events-none"
      >
        <source src="https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260518_003132_8b7edcb6-c64d-4a52-a9ca-879942e122ad.mp4" type="video/mp4" />
      </video>

      {/* Navbar */}
      <nav className="relative z-10 w-full max-w-[1280px] mx-auto px-5 sm:px-8 py-4 sm:py-5 flex items-center justify-between">
        <div className="flex items-center gap-2" style={{ color: "var(--color-text)" }}>
          <Logo />
          <span className="font-bold tracking-tight text-xl ml-1 hidden sm:block">GoalFlow</span>
        </div>

        {/* Desktop Links */}
        <div className="hidden md:flex items-center gap-8">
          {navLinks.map((link) => (
            <a key={link} href={`#${link.toLowerCase()}`} className="text-sm font-medium hover:opacity-70 transition-opacity">
              {link}
            </a>
          ))}
        </div>

        {/* Desktop Buttons */}
        <div className="hidden md:flex items-center gap-3">
          <Link href="/sign-in">
            <button 
              className="rounded-full px-5 py-2.5 text-sm font-semibold transition-transform hover:scale-[1.02] active:scale-[0.98]"
              style={{ background: "var(--color-login-bg)", color: "var(--color-text)" }}
            >
              Sign In
            </button>
          </Link>
          <Link href="/sign-up">
            <button 
              className="rounded-full px-5 py-2.5 text-sm font-semibold text-white transition-transform hover:scale-[1.02] active:scale-[0.98]"
              style={{ background: "var(--color-accent-vs)" }}
            >
              Start Demo
            </button>
          </Link>
        </div>

        {/* Mobile Menu Toggle */}
        <button 
          className="md:hidden flex items-center justify-center p-2 rounded-full hover:bg-black/5 transition-colors"
          onClick={() => setMenuOpen(true)}
        >
          <Menu className="h-6 w-6" />
        </button>
      </nav>

      {/* Mobile Menu Sheet */}
      <AnimatePresence>
        {menuOpen && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="fixed inset-0 z-40"
              style={{ backgroundColor: "rgba(25,40,55,0.35)", backdropFilter: "blur(4px)" }}
              onClick={() => setMenuOpen(false)}
            />
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
              className="fixed right-0 top-0 z-50 flex flex-col"
              style={{ 
                width: "min(88vw, 360px)", 
                height: "100dvh", 
                background: "#CFC8C5", 
                boxShadow: "-12px 0 48px rgba(25,40,55,0.18)" 
              }}
            >
              <div className="flex items-center justify-between p-5">
                <div className="flex items-center gap-2" style={{ color: "var(--color-text)" }}>
                  <Logo />
                  <span className="font-bold tracking-tight text-xl ml-1">GoalFlow</span>
                </div>
                <button 
                  className="p-2 rounded-full hover:bg-black/10 transition-colors"
                  onClick={() => setMenuOpen(false)}
                >
                  <X className="h-6 w-6" />
                </button>
              </div>
              <div className="h-[1px] w-full bg-black/10" />
              
              <div className="flex-1 flex flex-col p-6 gap-6 overflow-y-auto">
                {navLinks.map((link, i) => (
                  <motion.a
                    key={link}
                    href={`#${link.toLowerCase()}`}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.18 + i * 0.07, duration: 0.4, ease: "easeOut" }}
                    className="text-2xl font-semibold tracking-tight hover:opacity-70 transition-opacity"
                    onClick={() => setMenuOpen(false)}
                  >
                    {link}
                  </motion.a>
                ))}
              </div>

              <div className="p-6 flex flex-col gap-3 mt-auto">
                <Link href="/sign-in" className="w-full">
                  <button 
                    className="w-full rounded-full px-5 py-3.5 text-base font-semibold transition-transform active:scale-[0.98]"
                    style={{ background: "var(--color-login-bg)", color: "var(--color-text)" }}
                  >
                    Sign In
                  </button>
                </Link>
                <Link href="/sign-up" className="w-full">
                  <button 
                    className="w-full rounded-full px-5 py-3.5 text-base font-semibold text-white transition-transform active:scale-[0.98]"
                    style={{ background: "var(--color-accent-vs)" }}
                  >
                    Start Demo
                  </button>
                </Link>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Hero Content */}
      <main 
        className="relative z-10 w-full max-w-[1280px] mx-auto px-5 sm:px-8"
        style={{ paddingTop: "clamp(40px, 8vw, 72px)" }}
      >
        <div style={{ maxWidth: "560px" }}>
          <motion.h1
            custom={0}
            variants={fadeUp}
            initial="hidden"
            animate="visible"
            style={{
              fontFamily: "var(--font-heading)",
              fontSize: "clamp(1.65rem, 5vw, 3rem)",
              lineHeight: 1.05,
              letterSpacing: "-0.01em",
              marginBottom: "24px",
              color: "var(--color-text)"
            }}
          >
            <Target className="inline-block relative h-6 w-6" style={{ top: "-2px", color: "var(--color-text)" }} /> Align Your Goals <CheckSquare className="inline-block relative h-6 w-6" style={{ top: "-2px", color: "var(--color-text)" }} /> with Enterprise <Users className="inline-block relative h-6 w-6" style={{ top: "-2px", color: "var(--color-text)" }} /> Precision
          </motion.h1>

          <motion.p
            custom={1}
            variants={fadeUp}
            initial="hidden"
            animate="visible"
            style={{
              fontSize: "clamp(0.9rem, 2.5vw, 1.1rem)",
              lineHeight: 1.65,
              opacity: 0.8,
              maxWidth: "560px",
              marginBottom: "40px"
            }}
          >
            Zero confusion, total alignment. GoalFlow keeps your team focused with clear OKRs, transparent progress tracking, and seamless check-ins for high-performance teams.
          </motion.p>

          <Link href="/sign-up">
            <motion.button
              custom={2}
              variants={fadeUp}
              initial="hidden"
              animate="visible"
              whileHover={{ scale: 1.04, filter: "brightness(1.1)" }}
              whileTap={{ scale: 0.96 }}
              className="flex items-center justify-between"
              style={{
                background: "var(--color-accent-vs)",
                color: "white",
                borderRadius: "50px",
                padding: "17px 24px",
                fontWeight: 600,
                fontSize: "clamp(0.9rem, 2vw, 1rem)",
                boxShadow: "0 4px 24px rgba(115,66,226,0.28)",
                minWidth: "210px",
                gap: "32px",
                cursor: "pointer",
                border: "none",
              }}
            >
              <span>Start Demo</span>
              <ArrowRightCircle size={20} />
            </motion.button>
          </Link>
        </div>
      </main>
    </div>
  )
}
