import { useState } from 'react';
import { motion } from 'framer-motion';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Building2,
  Shield,
  TrendingUp,
  Users,
  BarChart3,
  Headphones,
  Clock,
  Zap,
  Globe,
  CheckCircle2,
  ArrowRight,
  Briefcase,
  Store,
  Hotel,
  Coffee,
  Mail,
  Phone,
} from 'lucide-react';

const fadeInUp = {
  initial: { opacity: 0, y: 30 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] as any },
};

const FEATURES = [
  {
    icon: Shield,
    title: 'Enterprise Security',
    description: 'Advanced encryption, VPN support, and compliance with corporate security standards.',
    color: 'bg-blue-500',
  },
  {
    icon: BarChart3,
    title: 'Analytics Dashboard',
    description: 'Real-time insights on usage patterns, cost optimization, and employee connectivity.',
    color: 'bg-green-500',
  },
  {
    icon: Users,
    title: 'Team Management',
    description: 'Centralized billing, user provisioning, and access control for your entire organization.',
    color: 'bg-yellow-500',
  },
  {
    icon: Headphones,
    title: '24/7 Priority Support',
    description: 'Dedicated account manager and round-the-clock technical support for your team.',
    color: 'bg-purple-500',
  },
  {
    icon: Zap,
    title: 'API Integration',
    description: 'Seamlessly integrate with your existing expense management and travel booking systems.',
    color: 'bg-orange-500',
  },
  {
    icon: Globe,
    title: 'Global Coverage',
    description: 'Access to verified WiFi spots across major cities for your traveling workforce.',
    color: 'bg-pink-500',
  },
];

const USE_CASES = [
  {
    icon: Briefcase,
    title: 'Corporate Travel',
    description: 'Provide reliable WiFi access for employees traveling across cities.',
    stats: '40% cost reduction vs. mobile data',
    color: 'bg-blue-500',
  },
  {
    icon: Store,
    title: 'Retail Chains',
    description: 'Monetize your store WiFi infrastructure across multiple locations.',
    stats: 'Earn ₹15K-50K per location/month',
    color: 'bg-green-500',
  },
  {
    icon: Hotel,
    title: 'Hotels & Resorts',
    description: 'Offer premium WiFi access as an added revenue stream for guests.',
    stats: '98% customer satisfaction',
    color: 'bg-purple-500',
  },
  {
    icon: Coffee,
    title: 'Co-working Spaces',
    description: 'Manage member WiFi access with flexible plans and usage tracking.',
    stats: '60% faster member onboarding',
    color: 'bg-orange-500',
  },
];

const PRICING_TIERS = [
  {
    name: 'Startup',
    price: '4,999',
    period: 'month',
    description: 'Perfect for small teams and startups',
    features: [
      'Up to 25 users',
      '500 hours/month included',
      'Basic analytics',
      'Email support',
      'Single location listing',
      'Standard security',
    ],
    highlighted: false,
  },
  {
    name: 'Business',
    price: '14,999',
    period: 'month',
    description: 'Ideal for growing businesses',
    features: [
      'Up to 100 users',
      '2,500 hours/month included',
      'Advanced analytics & reports',
      'Priority email & chat support',
      'Up to 10 location listings',
      'Enhanced security features',
      'API access',
      'Custom branding',
    ],
    highlighted: true,
  },
  {
    name: 'Enterprise',
    price: 'Custom',
    period: '',
    description: 'For large organizations',
    features: [
      'Unlimited users',
      'Unlimited hours',
      'Full analytics suite',
      '24/7 phone & dedicated support',
      'Unlimited location listings',
      'Enterprise-grade security',
      'Full API access',
      'White-label solution',
      'On-premise deployment option',
      'SLA guarantee',
    ],
    highlighted: false,
  },
];

const STATS = [
  { value: '500+', label: 'Enterprise Clients' },
  { value: '99.9%', label: 'Uptime SLA' },
  { value: '2M+', label: 'Business Hours Saved' },
  { value: '₹50Cr+', label: 'Revenue Generated' },
];

export default function Enterprise() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    company: '',
    phone: '',
    employees: '',
    message: '',
  });
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Handle form submission (would integrate with backend)
    console.log('Enterprise inquiry:', formData);
    setSubmitted(true);
    setTimeout(() => setSubmitted(false), 5000);
  };

  return (
    <div className="min-h-screen bg-white dark:bg-black">
      <Navbar />

      {/* Hero Section */}
      <section className="relative pt-24 pb-16 md:pt-32 md:pb-24 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-50 via-white to-indigo-50 dark:from-gray-950 dark:via-black dark:to-gray-900" />
        <div className="absolute inset-0 opacity-40 dark:opacity-20">
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-blue-200 dark:bg-blue-900 rounded-full blur-3xl" />
          <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-indigo-200 dark:bg-indigo-900 rounded-full blur-3xl" />
        </div>

        <div className="container relative px-4 md:px-6 mx-auto">
          <motion.div {...fadeInUp} className="max-w-4xl mx-auto text-center">
            <span className="text-[#0055FF] dark:text-[#66FF00] font-bold tracking-wider uppercase text-xs mb-4 block">
              Enterprise Solutions
            </span>
            <h1 className="text-4xl md:text-6xl font-black text-gray-900 dark:text-white mb-6 leading-tight">
              WiFi Infrastructure for
              <span className="block text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-400 dark:to-indigo-400">
                Modern Businesses
              </span>
            </h1>
            <p className="text-lg md:text-xl text-gray-600 dark:text-gray-400 mb-8 max-w-3xl mx-auto leading-relaxed">
              Scale your connectivity infrastructure with enterprise-grade WiFi solutions.
              Reduce costs by 60%, increase productivity, and provide seamless access for your team.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button
                size="lg"
                className="bg-[#0055FF] hover:bg-blue-700 text-white px-8 py-6 text-lg"
                onClick={() => document.getElementById('contact-form')?.scrollIntoView({ behavior: 'smooth' })}
              >
                Request Demo
                <ArrowRight size={20} className="ml-2" />
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="border-2 border-gray-300 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-900 dark:text-white px-8 py-6 text-lg"
                onClick={() => document.getElementById('pricing')?.scrollIntoView({ behavior: 'smooth' })}
              >
                View Pricing
              </Button>
            </div>
          </motion.div>

          {/* Stats */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.3 }}
            className="mt-16 md:mt-24 grid grid-cols-2 md:grid-cols-4 gap-6"
          >
            {STATS.map((stat, idx) => (
              <div key={idx} className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm rounded-2xl border border-gray-200 dark:border-gray-800 p-6 text-center">
                <div className="text-3xl md:text-4xl font-black text-[#0055FF] dark:text-blue-400 mb-2">
                  {stat.value}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400 font-medium">{stat.label}</div>
              </div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 md:py-24 bg-gray-50 dark:bg-gray-950">
        <div className="container px-4 md:px-6 mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-12"
          >
            <span className="text-[#0055FF] dark:text-[#66FF00] font-bold tracking-wider uppercase text-xs mb-4 block">
              Why Choose Us
            </span>
            <h2 className="text-3xl md:text-5xl font-black text-gray-900 dark:text-white mb-4">
              Enterprise-Grade Features
            </h2>
            <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
              Everything your business needs for seamless WiFi connectivity management
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {FEATURES.map((feature, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: idx * 0.1 }}
                className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-6 hover:shadow-lg dark:hover:shadow-blue-900/20 transition-all group"
              >
                <div className={`w-12 h-12 ${feature.color} rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                  <feature.icon size={24} className="text-white" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">{feature.title}</h3>
                <p className="text-gray-600 dark:text-gray-400">{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Use Cases Section */}
      <section className="py-16 md:py-24 dark:bg-black">
        <div className="container px-4 md:px-6 mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-12"
          >
            <span className="text-[#0055FF] dark:text-[#66FF00] font-bold tracking-wider uppercase text-xs mb-4 block">
              Success Stories
            </span>
            <h2 className="text-3xl md:text-5xl font-black text-gray-900 dark:text-white mb-4">
              Built for Every Industry
            </h2>
            <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
              Trusted by businesses across sectors to power their connectivity needs
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 gap-6">
            {USE_CASES.map((useCase, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: idx * 0.1 }}
                className="bg-gradient-to-br from-gray-50 to-blue-50 dark:from-gray-900 dark:to-blue-950/30 rounded-2xl border border-gray-200 dark:border-gray-800 p-8 hover:shadow-lg dark:hover:shadow-blue-900/20 hover:border-[#0055FF] dark:hover:border-[#66FF00] transition-all group"
              >
                <div className="flex items-start gap-4">
                  <div className={`w-14 h-14 ${useCase.color} rounded-xl flex items-center justify-center shrink-0 shadow-sm group-hover:scale-110 transition-transform`}>
                    <useCase.icon size={28} className="text-white" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">{useCase.title}</h3>
                    <p className="text-gray-600 dark:text-gray-400 mb-3">{useCase.description}</p>
                    <div className="inline-flex items-center gap-2 text-sm font-semibold text-[#0055FF] dark:text-blue-400 bg-white dark:bg-gray-800 px-3 py-1.5 rounded-lg">
                      <TrendingUp size={16} />
                      {useCase.stats}
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-16 md:py-24 bg-gray-50 dark:bg-gray-950">
        <div className="container px-4 md:px-6 mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-12"
          >
            <span className="text-[#0055FF] dark:text-[#66FF00] font-bold tracking-wider uppercase text-xs mb-4 block">
              Plans & Pricing
            </span>
            <h2 className="text-3xl md:text-5xl font-black text-gray-900 dark:text-white mb-4">
              Transparent Pricing
            </h2>
            <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
              Choose the plan that fits your business needs. All plans include our core features.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-6 max-w-6xl mx-auto">
            {PRICING_TIERS.map((tier, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: idx * 0.1 }}
                className={`rounded-2xl border-2 p-8 bg-white ${
                  tier.highlighted
                    ? 'border-[#0055FF] shadow-xl scale-105 relative'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                {tier.highlighted && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-[#0055FF] text-white text-xs font-bold px-4 py-1.5 rounded-full">
                    MOST POPULAR
                  </div>
                )}
                <div className="mb-6">
                  <h3 className="text-2xl font-black text-gray-900 mb-2">{tier.name}</h3>
                  <p className="text-sm text-gray-600 mb-4">{tier.description}</p>
                  <div className="flex items-baseline gap-1">
                    <span className="text-4xl font-black text-gray-900">
                      {tier.price === 'Custom' ? 'Custom' : `₹${tier.price}`}
                    </span>
                    {tier.period && <span className="text-gray-600">/{tier.period}</span>}
                  </div>
                </div>
                <ul className="space-y-3 mb-8">
                  {tier.features.map((feature, featureIdx) => (
                    <li key={featureIdx} className="flex items-start gap-2 text-sm">
                      <CheckCircle2 size={18} className="text-green-500 shrink-0 mt-0.5" />
                      <span className="text-gray-700">{feature}</span>
                    </li>
                  ))}
                </ul>
                <Button
                  className={`w-full ${
                    tier.highlighted
                      ? 'bg-[#0055FF] hover:bg-blue-700 text-white'
                      : 'bg-gray-100 hover:bg-gray-200 text-gray-900'
                  }`}
                  onClick={() => document.getElementById('contact-form')?.scrollIntoView({ behavior: 'smooth' })}
                >
                  Get Started
                </Button>
              </motion.div>
            ))}
          </div>

          <div className="mt-12 text-center">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              All plans include 14-day free trial. No credit card required.
              <br />
              Need a custom plan? <a href="#contact-form" className="text-[#0055FF] dark:text-blue-400 font-semibold hover:underline">Contact us</a> for tailored solutions.
            </p>
          </div>
        </div>
      </section>

      {/* Contact Form Section */}
      <section id="contact-form" className="py-16 md:py-24 dark:bg-black">
        <div className="container px-4 md:px-6 mx-auto max-w-4xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-12"
          >
            <span className="text-[#0055FF] dark:text-[#66FF00] font-bold tracking-wider uppercase text-xs mb-4 block">
              Get In Touch
            </span>
            <h2 className="text-3xl md:text-5xl font-black text-gray-900 dark:text-white mb-4">
              Let's Talk Business
            </h2>
            <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
              Schedule a demo or get in touch with our enterprise team to discuss your requirements
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-xl p-8"
          >
            {submitted ? (
              <div className="text-center py-12">
                <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                  <CheckCircle2 size={32} className="text-green-600 dark:text-green-400" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Thank You!</h3>
                <p className="text-gray-600 dark:text-gray-400">
                  We've received your inquiry. Our enterprise team will reach out within 24 hours.
                </p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                      Full Name *
                    </label>
                    <Input
                      required
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="John Doe"
                      className="w-full"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                      Work Email *
                    </label>
                    <Input
                      required
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      placeholder="john@company.com"
                      className="w-full"
                    />
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                      Company Name *
                    </label>
                    <Input
                      required
                      value={formData.company}
                      onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                      placeholder="Company Inc."
                      className="w-full"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                      Phone Number
                    </label>
                    <Input
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      placeholder="+91 98765 43210"
                      className="w-full"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                    Number of Employees
                  </label>
                  <select
                    value={formData.employees}
                    onChange={(e) => setFormData({ ...formData, employees: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 dark:bg-gray-800 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Select range</option>
                    <option value="1-25">1-25</option>
                    <option value="26-100">26-100</option>
                    <option value="101-500">101-500</option>
                    <option value="500+">500+</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                    Tell us about your requirements
                  </label>
                  <Textarea
                    value={formData.message}
                    onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                    placeholder="What are your WiFi connectivity needs? How many locations? Any specific requirements?"
                    rows={4}
                    className="w-full"
                  />
                </div>

                <Button
                  type="submit"
                  size="lg"
                  className="w-full bg-[#0055FF] hover:bg-blue-700 text-white"
                >
                  Submit Inquiry
                </Button>

                <p className="text-xs text-gray-500 dark:text-gray-400 text-center">
                  By submitting, you agree to our Terms of Service and Privacy Policy.
                  We'll process your data to respond to your inquiry.
                </p>
              </form>
            )}
          </motion.div>

          {/* Contact Info */}
          <div className="mt-12 grid md:grid-cols-3 gap-6 text-center">
            <div className="flex flex-col items-center">
              <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center mb-3">
                <Mail size={20} className="text-[#0055FF] dark:text-blue-400" />
              </div>
              <h4 className="font-semibold text-gray-900 dark:text-white mb-1">Email Us</h4>
              <a href="mailto:enterprise@airlink.com" className="text-sm text-gray-600 dark:text-gray-400 hover:text-[#0055FF] dark:hover:text-blue-400">
                enterprise@airlink.com
              </a>
            </div>
            <div className="flex flex-col items-center">
              <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center mb-3">
                <Phone size={20} className="text-[#0055FF] dark:text-blue-400" />
              </div>
              <h4 className="font-semibold text-gray-900 dark:text-white mb-1">Call Us</h4>
              <a href="tel:+918800123456" className="text-sm text-gray-600 dark:text-gray-400 hover:text-[#0055FF] dark:hover:text-blue-400">
                +91 88001 23456
              </a>
            </div>
            <div className="flex flex-col items-center">
              <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center mb-3">
                <Clock size={20} className="text-[#0055FF] dark:text-blue-400" />
              </div>
              <h4 className="font-semibold text-gray-900 dark:text-white mb-1">Support Hours</h4>
              <p className="text-sm text-gray-600 dark:text-gray-400">24/7 for Enterprise</p>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
