import React from 'react';
import { Link } from 'react-router-dom';
import {
  ShoppingBag,
  Mail,
  Phone,
  MapPin,
  Clock,
  ShieldCheck,
  Globe,
  ExternalLink
} from 'lucide-react';
import { motion } from 'framer-motion';
import { usePrefersReducedMotion, tapFeedback } from '../../motion';

export const Footer: React.FC = () => {
  const shouldReduceMotion = usePrefersReducedMotion();

  return (
    <motion.footer
      initial={shouldReduceMotion ? { opacity: 0 } : { opacity: 0 }}
      whileInView={{ opacity: 1 }}
      viewport={{ once: true, margin: '-50px' }}
      transition={{ duration: 0.6 }}
      className="relative border-t border-white/10 bg-slate-950/85 backdrop-blur-2xl text-slate-400 mt-auto overflow-hidden"
    >
      {/* Specular Edge Top Rim Highlight */}
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-cyan-400/30 to-transparent pointer-events-none" />

      {/* Main Multi-Column Footer Grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-14 pb-12 relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8 sm:gap-10">
          
          {/* Column 1: FTS Brand Story & Contact Information */}
          <div className="lg:col-span-2 space-y-4">
            <Link to="/" className="inline-flex items-center space-x-2.5 group">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-cyan-500 via-blue-600 to-indigo-600 flex items-center justify-center text-white shadow-lg shadow-cyan-500/25 border border-white/15 group-hover:scale-105 transition-transform duration-200">
                <ShoppingBag className="w-5 h-5" />
              </div>
              <span className="font-display text-xl font-extrabold text-white tracking-tight group-hover:text-cyan-300 transition-colors">
                FTS Store
              </span>
            </Link>

            <p className="text-xs text-slate-400 leading-relaxed max-w-sm">
              Frnds Tech Solution (FTS) is your premier destination for high-performance computing, smart living, and connected electronics. Engineered for precision, backed by genuine warranties and dedicated engineering support.
            </p>

            {/* Direct Contact Details */}
            <div className="space-y-2 pt-2 text-xs">
              <div className="flex items-center gap-2.5 text-slate-300">
                <Mail className="w-4 h-4 text-cyan-400 flex-shrink-0" />
                <a
                  href="mailto:support@frndstech.com"
                  className="hover:text-cyan-300 hover:translate-x-1 inline-block transition-all duration-200"
                >
                  support@frndstech.com
                </a>
              </div>

              <div className="flex items-center gap-2.5 text-slate-300">
                <Phone className="w-4 h-4 text-cyan-400 flex-shrink-0" />
                <a
                  href="tel:+91800555387"
                  className="hover:text-cyan-300 hover:translate-x-1 inline-block transition-all duration-200"
                >
                  +91 (800) 555-FTS / +1 (800) 555-0192
                </a>
              </div>

              <div className="flex items-center gap-2.5 text-slate-400">
                <Clock className="w-4 h-4 text-slate-500 flex-shrink-0" />
                <span>Mon – Sat: 9:00 AM – 9:00 PM IST</span>
              </div>

              <div className="flex items-start gap-2.5 text-slate-400">
                <MapPin className="w-4 h-4 text-slate-500 flex-shrink-0 mt-0.5" />
                <span>Frnds Tech Solution, Silicon Tech Corridor, Bangalore, India</span>
              </div>
            </div>

            {/* Social Media Links with Spring Micro-Interactions */}
            <div className="pt-2 flex items-center gap-3">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mr-1">
                Follow Us:
              </span>
              <motion.a
                href="https://github.com"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="FTS Store on GitHub"
                whileHover={shouldReduceMotion ? undefined : { scale: 1.15, y: -2 }}
                whileTap={shouldReduceMotion ? undefined : tapFeedback}
                className="w-8 h-8 rounded-lg bg-slate-900/80 hover:bg-cyan-500/20 hover:text-cyan-300 text-slate-400 border border-white/10 flex items-center justify-center transition-colors"
              >
                <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                  <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" />
                </svg>
              </motion.a>

              <motion.a
                href="https://linkedin.com"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="FTS Store on LinkedIn"
                whileHover={shouldReduceMotion ? undefined : { scale: 1.15, y: -2 }}
                whileTap={shouldReduceMotion ? undefined : tapFeedback}
                className="w-8 h-8 rounded-lg bg-slate-900/80 hover:bg-cyan-500/20 hover:text-cyan-300 text-slate-400 border border-white/10 flex items-center justify-center transition-colors"
              >
                <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                  <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z" />
                </svg>
              </motion.a>

              <motion.a
                href="https://twitter.com"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="FTS Store on Twitter / X"
                whileHover={shouldReduceMotion ? undefined : { scale: 1.15, y: -2 }}
                whileTap={shouldReduceMotion ? undefined : tapFeedback}
                className="w-8 h-8 rounded-lg bg-slate-900/80 hover:bg-cyan-500/20 hover:text-cyan-300 text-slate-400 border border-white/10 flex items-center justify-center transition-colors"
              >
                <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                </svg>
              </motion.a>
            </div>
          </div>

          {/* Column 2: Product Categories */}
          <div>
            <h4 className="text-xs font-bold text-white uppercase tracking-wider mb-4">
              Categories
            </h4>
            <ul className="space-y-2.5 text-xs">
              <li>
                <Link to="/products" className="hover:text-cyan-300 hover:translate-x-1.5 inline-block transition-all duration-200">
                  All Departments
                </Link>
              </li>
              <li>
                <Link to="/products?category=laptops" className="hover:text-cyan-300 hover:translate-x-1.5 inline-block transition-all duration-200">
                  Laptops & Workstations
                </Link>
              </li>
              <li>
                <Link to="/products?category=mobiles" className="hover:text-cyan-300 hover:translate-x-1.5 inline-block transition-all duration-200">
                  Mobiles & Smartphones
                </Link>
              </li>
              <li>
                <Link to="/products?category=smart-devices" className="hover:text-cyan-300 hover:translate-x-1.5 inline-block transition-all duration-200">
                  Smart Living & IoT
                </Link>
              </li>
              <li>
                <Link to="/products?category=audio" className="hover:text-cyan-300 hover:translate-x-1.5 inline-block transition-all duration-200">
                  Audio & Wireless Sound
                </Link>
              </li>
              <li>
                <Link to="/products?category=accessories" className="hover:text-cyan-300 hover:translate-x-1.5 inline-block transition-all duration-200">
                  GaN Chargers & Docks
                </Link>
              </li>
              <li>
                <Link to="/products?category=gaming" className="hover:text-cyan-300 hover:translate-x-1.5 inline-block transition-all duration-200">
                  Pro Gaming Hardware
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 3: Customer Service */}
          <div>
            <h4 className="text-xs font-bold text-white uppercase tracking-wider mb-4">
              Customer Care
            </h4>
            <ul className="space-y-2.5 text-xs">
              <li>
                <Link to="/orders" className="hover:text-cyan-300 hover:translate-x-1.5 inline-block transition-all duration-200">
                  Track My Order
                </Link>
              </li>
              <li>
                <Link to="/cart" className="hover:text-cyan-300 hover:translate-x-1.5 inline-block transition-all duration-200">
                  View Shopping Cart
                </Link>
              </li>
              <li>
                <Link to="/checkout" className="hover:text-cyan-300 hover:translate-x-1.5 inline-block transition-all duration-200">
                  Instant Checkout
                </Link>
              </li>
              <li>
                <Link to="/login" className="hover:text-cyan-300 hover:translate-x-1.5 inline-block transition-all duration-200">
                  Customer Portal & Login
                </Link>
              </li>
              <li>
                <a href="mailto:support@frndstech.com?subject=Return%20Request" className="hover:text-cyan-300 hover:translate-x-1.5 inline-block transition-all duration-200">
                  30-Day Returns & Exchanges
                </a>
              </li>
              <li>
                <a href="mailto:support@frndstech.com?subject=Warranty%20Inquiry" className="hover:text-cyan-300 hover:translate-x-1.5 inline-block transition-all duration-200">
                  Warranty & Hardware Service
                </a>
              </li>
            </ul>
          </div>

          {/* Column 4: About & Legal & Platform */}
          <div>
            <h4 className="text-xs font-bold text-white uppercase tracking-wider mb-4">
              Company & Legal
            </h4>
            <ul className="space-y-2.5 text-xs">
              <li>
                <span className="text-slate-300 font-medium">Frnds Tech Solution (FTS)</span>
              </li>
              <li>
                <Link to="/admin" className="text-cyan-400 hover:text-cyan-300 font-semibold hover:translate-x-1.5 inline-flex items-center gap-1 transition-all duration-200">
                  <span>Admin Dashboard</span>
                  <ExternalLink className="w-3 h-3" />
                </Link>
              </li>
              <li>
                <span className="text-slate-500">Privacy Policy (GDPR / IT Act)</span>
              </li>
              <li>
                <span className="text-slate-500">Terms & Conditions</span>
              </li>
              <li>
                <span className="text-slate-500">Security & Compliance</span>
              </li>
              <li className="pt-2">
                <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-900/80 border border-white/10 text-[10px] text-slate-400 shadow-sm">
                  <Globe className="w-3 h-3 text-cyan-400" />
                  <span>PWA Ready Web Application</span>
                </div>
              </li>
            </ul>
          </div>

        </div>

        {/* Lower Banner: Authorized Payment Methods & Security Seal */}
        <div className="border-t border-white/10 mt-12 pt-8 flex flex-col md:flex-row items-center justify-between gap-6">
          
          {/* Copyright & Technical Heritage */}
          <div className="text-center md:text-left text-xs text-slate-500 space-y-1">
            <p>© {new Date().getFullYear()} Frnds Tech Solution (FTS). All rights reserved.</p>
            <p className="text-[11px] text-slate-600">
              Enterprise Storefront • Powered by FastAPI, PostgreSQL/SQLite, React & TypeScript
            </p>
          </div>

          {/* Authorized Payment Providers Badges & SSL */}
          <div className="flex flex-wrap items-center justify-center md:justify-end gap-2.5">
            <div className="px-2.5 py-1 rounded-md bg-slate-900/80 border border-white/10 hover:border-cyan-400/40 transition-colors text-[11px] font-extrabold text-blue-400 tracking-wider shadow-sm">
              VISA
            </div>
            <div className="px-2.5 py-1 rounded-md bg-slate-900/80 border border-white/10 hover:border-cyan-400/40 transition-colors text-[11px] font-extrabold text-rose-400 tracking-wider shadow-sm">
              MASTERCARD
            </div>
            <div className="px-2.5 py-1 rounded-md bg-slate-900/80 border border-white/10 hover:border-cyan-400/40 transition-colors text-[11px] font-extrabold text-sky-400 tracking-wider shadow-sm">
              AMEX
            </div>
            <div className="px-2.5 py-1 rounded-md bg-slate-900/80 border border-white/10 hover:border-cyan-400/40 transition-colors text-[11px] font-extrabold text-emerald-400 tracking-wider shadow-sm">
              UPI / RuPay
            </div>
            <div className="px-2.5 py-1 rounded-md bg-slate-900/80 border border-white/10 hover:border-cyan-400/40 transition-colors text-[11px] font-extrabold text-indigo-400 tracking-wider shadow-sm">
              PAYPAL
            </div>
            <div className="flex items-center gap-1 px-2.5 py-1 rounded-md bg-emerald-950/60 border border-emerald-500/30 text-[10px] font-bold text-emerald-300 shadow-sm">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>256-Bit SSL Encrypted</span>
            </div>
          </div>

        </div>

      </div>
    </motion.footer>
  );
};
