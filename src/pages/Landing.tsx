import React from 'react';
import { motion } from 'framer-motion';
import {
  ArrowRight,
  Users,
  Target,
  Award,
  Code,
  Smartphone,
  ChevronRight,
  LogIn,
  Building2,
  MapPin,
  Mail,
  Phone,
  Lightbulb,
  Camera,
  BookOpen,
  Handshake,
  GraduationCap,
  Trophy,
  Star,
  Zap,
  Globe,
  Shield,
  Clock,
  CheckCircle,
  Rocket,
  Heart,
  Coffee,
  Briefcase
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { forwardRef } from 'react';
import type { MotionProps } from 'framer-motion';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
  onClick?: () => void;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'primary' | 'secondary' | 'accent';
  className?: string;
}

const Button = forwardRef<HTMLButtonElement, ButtonProps & MotionProps>(
  ({ children, onClick, size = 'md', variant = 'primary', className = '', ...props }, ref) => {
    const baseStyles = "inline-flex items-center justify-center font-semibold rounded-xl transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2 transform hover:scale-105";
    
    const sizeStyles = {
      sm: "px-4 py-2 text-sm",
      md: "px-6 py-3 text-base",
      lg: "px-8 py-4 text-lg",
    };

    const variantStyles = {
      primary: "bg-gradient-to-r from-blue-600 to-teal-600 text-white hover:from-blue-700 hover:to-teal-700 focus:ring-blue-500 shadow-lg hover:shadow-xl",
      secondary: "bg-white text-blue-600 border-2 border-blue-600 hover:bg-blue-50 hover:border-blue-700 focus:ring-blue-500 shadow-md hover:shadow-lg",
      accent: "bg-gradient-to-r from-purple-600 to-pink-600 text-white hover:from-purple-700 hover:to-pink-700 focus:ring-purple-500 shadow-lg hover:shadow-xl",
    };

    return (
      <motion.button
        ref={ref}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={onClick}
        className={`${baseStyles} ${sizeStyles[size]} ${variantStyles[variant]} ${className}`}
        {...props}
      >
        {children}
      </motion.button>
    );
  }
);
Button.displayName = "Button";

export default function Landing() {
  const navigate = useNavigate();

  const stats: { number: string; label: string; icon: React.ElementType }[] = [
    { number: '500+', label: 'Students Trained', icon: GraduationCap },
    { number: '50+', label: 'Live Projects', icon: Rocket },
    { number: '95%', label: 'Success Rate', icon: Trophy },
    { number: '24/7', label: 'Support', icon: Clock },
  ];

  const features = [
    {
      icon: Code,
      title: 'Hands-on Learning',
      description: 'Work on real client projects from day one with modern technologies and industry best practices.',
      color: 'from-blue-500 to-cyan-500'
    },
    {
      icon: Users,
      title: 'Expert Mentorship',
      description: 'Learn from senior engineers and industry professionals with years of experience.',
      color: 'from-purple-500 to-pink-500'
    },
    {
      icon: Globe,
      title: 'Global Exposure',
      description: 'Work with international clients across Europe, North America, and the Middle East.',
      color: 'from-green-500 to-teal-500'
    },
    {
      icon: Shield,
      title: 'Certified Training',
      description: 'Receive official certificates and recommendations upon successful completion.',
      color: 'from-orange-500 to-red-500'
    },
    {
      icon: Briefcase,
      title: 'Career Ready',
      description: 'Build a professional portfolio and gain skills that employers are looking for.',
      color: 'from-indigo-500 to-purple-500'
    },
    {
      icon: Heart,
      title: 'Supportive Community',
      description: 'Join a community of like-minded peers and build lasting professional relationships.',
      color: 'from-pink-500 to-rose-500'
    }
  ];

  const testimonials = [
    {
      name: 'Sarah Chen',
      role: 'Software Engineering Intern',
      image: 'https://images.pexels.com/photos/774909/pexels-photo-774909.jpeg?auto=compress&cs=tinysrgb&w=150&h=150&fit=crop',
      quote: 'The hands-on experience at DETZ Global transformed my understanding of software development. Working on real client projects gave me confidence I never had before.',
      rating: 5
    },
    {
      name: 'Michael Rodriguez',
      role: 'Electrical Engineering Intern',
      image: 'https://images.pexels.com/photos/1222271/pexels-photo-1222271.jpeg?auto=compress&cs=tinysrgb&w=150&h=150&fit=crop',
      quote: 'From circuit design to live installations, every day was a learning adventure. The mentorship here is unmatched.',
      rating: 5
    },
    {
      name: 'Priya Patel',
      role: 'Creative Design Intern',
      image: 'https://images.pexels.com/photos/1239291/pexels-photo-1239291.jpeg?auto=compress&cs=tinysrgb&w=150&h=150&fit=crop',
      quote: 'Working in the studio environment with professional equipment and real client briefs prepared me for the creative industry.',
      rating: 5
    }
  ];

  interface InternshipPhase {
    phase: string;
    duration: string;
    description: string;
    compensation: string;
  }

  interface InternshipStream {
    title: string;
    icon: React.ElementType;
    description: string;
    phases: InternshipPhase[];
    color: string;
  }

  const internshipStreams: InternshipStream[] = [
    {
      title: 'Software Engineering – Web',
      icon: Code,
      description: 'Master modern web development with React, Node.js, and cloud technologies.',
      color: 'from-blue-500 to-cyan-500',
      phases: [
        { phase: 'Orientation & Setup', duration: '1 Month', description: 'Environment setup, Git workflows, Agile methodologies', compensation: 'Unpaid' },
        { phase: 'Tech Workshops', duration: '1 Month', description: 'React/Next.js, APIs, CI/CD, containerization', compensation: 'Unpaid' },
        { phase: 'Demo Projects', duration: '2–4 Months', description: 'Real client features, code reviews, sprint cycles', compensation: 'Stipend' },
        { phase: 'Database & Integration', duration: '1 Month', description: 'NoSQL design, serverless functions, production deployment', compensation: 'Stipend' },
        { phase: 'Client Projects', duration: '1 Month', description: 'End-to-end billable project development', compensation: 'Paid' },
      ]
    },
    {
      title: 'Software Engineering – .NET/C#',
      icon: Smartphone,
      description: 'Build enterprise-grade applications with .NET, ML.NET, and cloud services.',
      color: 'from-purple-500 to-pink-500',
      phases: [
        { phase: 'Orientation & Setup', duration: '1 Month', description: 'C#/.NET ecosystem, OOP principles, project structure', compensation: 'Unpaid' },
        { phase: '.NET Workshops', duration: '1 Month', description: 'ASP.NET Core, ML.NET, cloud SDKs, unit testing', compensation: 'Unpaid' },
        { phase: 'Microservices Development', duration: '2–4 Months', description: 'API development, ML integration, client features', compensation: 'Stipend' },
        { phase: 'System Integration', duration: '1 Month', description: 'NoSQL integration, ML pipelines, security implementation', compensation: 'Stipend' },
        { phase: 'Production Solutions', duration: '1 Month', description: 'Full .NET solution with CI/CD and monitoring', compensation: 'Paid' },
      ]
    },
    {
      title: 'Electrical Engineering',
      icon: Lightbulb,
      description: 'From circuit design to live installations with IoT and embedded systems.',
      color: 'from-yellow-500 to-orange-500',
      phases: [
        { phase: 'Safety & Fundamentals', duration: '1 Month', description: 'Safety training, tools, instruments, EHS policies', compensation: 'Unpaid' },
        { phase: 'Circuit & PCB Design', duration: '1 Month', description: 'Simulation, layout, IoT sensors, power electronics', compensation: 'Unpaid' },
        { phase: 'Prototype Development', duration: '2–4 Months', description: 'Control panels, sensor networks, client trials', compensation: 'Stipend' },
        { phase: 'System Integration', duration: '1 Month', description: 'Client infrastructure, commissioning, QA/QC', compensation: 'Stipend' },
        { phase: 'Live Installations', duration: '1 Month', description: 'End-to-end project leadership and deployment', compensation: 'Paid' },
      ]
    },
    {
      title: 'Photography & Design',
      icon: Camera,
      description: 'Professional studio work with real client campaigns and brand projects.',
      color: 'from-pink-500 to-rose-500',
      phases: [
        { phase: 'Studio Orientation', duration: '1 Month', description: 'Studio safety, brand guidelines, software setup', compensation: 'Unpaid' },
        { phase: 'Creative Workshops', duration: '1 Month', description: 'Lighting, composition, retouching, motion graphics', compensation: 'Unpaid' },
        { phase: 'Client Assignments', duration: '2–4 Months', description: 'Live shoots, branding, social media graphics', compensation: 'Stipend' },
        { phase: 'Campaign Management', duration: '1 Month', description: 'Asset optimization, A/B testing, content scheduling', compensation: 'Stipend' },
        { phase: 'Full Campaign Ownership', duration: '1 Month', description: 'Complete campaign from concept to delivery', compensation: 'Paid' },
      ]
    }
  ];

  return (
    <div className="min-h-screen bg-white font-sans overflow-x-hidden">
      {/* Navigation */}
      <motion.nav
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        className="bg-white/95 backdrop-blur-md shadow-sm border-b border-gray-100 sticky top-0 z-50"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <motion.div
              whileHover={{ scale: 1.05 }}
              className="flex items-center space-x-3 cursor-pointer"
            >
              <img
                src="https://i.ibb.co/WWzbXzZS/DETZ.png"
                alt="Detz Global Logo"
                className="h-10 w-auto"
                onError={(e: React.SyntheticEvent<HTMLImageElement, Event>) => { 
                  e.currentTarget.onerror = null; 
                  e.currentTarget.src = "https://placehold.co/100x40/3b82f6/ffffff?text=DETZ"; 
                }}
              />
            </motion.div>

            <div className="hidden md:flex items-center space-x-8">
              <a href="#about" className="text-gray-700 hover:text-blue-600 transition-colors font-medium">About</a>
              <a href="#programs" className="text-gray-700 hover:text-blue-600 transition-colors font-medium">Programs</a>
              <a href="#testimonials" className="text-gray-700 hover:text-blue-600 transition-colors font-medium">Success Stories</a>
              <a href="#contact" className="text-gray-700 hover:text-blue-600 transition-colors font-medium">Contact</a>
              <Button onClick={() => navigate('/login')} size="sm">
                <LogIn className="h-4 w-4 mr-2" />
                Access IMS
              </Button>
            </div>
          </div>
        </div>
      </motion.nav>

      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-blue-50 via-white to-teal-50 py-20 overflow-hidden">
        <div className="absolute inset-0 bg-grid-pattern opacity-5"></div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <motion.div
              initial={{ opacity: 0, x: -50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8 }}
            >
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="inline-flex items-center px-4 py-2 bg-blue-100 text-blue-800 rounded-full text-sm font-medium mb-6"
              >
                <Zap className="h-4 w-4 mr-2" />
                Empowering the Next Generation
              </motion.div>
              
              <h1 className="text-5xl lg:text-6xl font-extrabold text-gray-900 leading-tight mb-6">
                Transform Your
                <span className="bg-gradient-to-r from-blue-600 to-teal-600 bg-clip-text text-transparent block">
                  Tech Career
                </span>
                with Real Experience
              </h1>
              
              <p className="text-xl text-gray-600 mb-8 leading-relaxed">
                Join DETZ Global's comprehensive internship program where you'll work on live client projects, 
                learn from industry experts, and build the skills that matter in today's tech landscape.
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4 mb-8">
                <Button size="lg" className="group">
                  Start Your Journey
                  <ArrowRight className="h-5 w-5 ml-2 group-hover:translate-x-1 transition-transform" />
                </Button>
                <Button variant="secondary" size="lg" onClick={() => navigate('/login')}>
                  <LogIn className="h-5 w-5 mr-2" />
                  Access Portal
                </Button>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {stats.map((stat, index) => (
                  <motion.div
                    key={stat.label}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5 + index * 0.1 }}
                    className="text-center"
                  >
                    <div className="flex items-center justify-center mb-2">
                      <stat.icon className="h-6 w-6 text-blue-600 mr-2" />
                      <div className="text-2xl font-bold text-gray-900">{stat.number}</div>
                    </div>
                    <div className="text-sm text-gray-600">{stat.label}</div>
                  </motion.div>
                ))}
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="relative"
            >
              <div className="relative z-10">
                <img
                  src="https://images.pexels.com/photos/3184360/pexels-photo-3184360.jpeg?auto=compress&cs=tinysrgb&w=800"
                  alt="Students working on projects"
                  className="rounded-2xl shadow-2xl w-full h-96 object-cover"
                />
                <div className="absolute -bottom-6 -left-6 bg-white rounded-xl shadow-lg p-4 max-w-xs">
                  <div className="flex items-center space-x-3">
                    <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-teal-500 rounded-full flex items-center justify-center">
                      <CheckCircle className="h-6 w-6 text-white" />
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900">Live Project Success</p>
                      <p className="text-sm text-gray-600">Real client impact</p>
                    </div>
                  </div>
                </div>
              </div>
              <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-teal-600 rounded-2xl transform rotate-3 scale-105 opacity-10"></div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="about" className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl font-bold text-gray-900 mb-6">Why Choose DETZ Global?</h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              We don't just teach technology – we immerse you in real-world projects that shape your career
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 50 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="bg-white rounded-2xl p-8 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2"
              >
                <div className={`w-16 h-16 bg-gradient-to-r ${feature.color} rounded-2xl flex items-center justify-center mb-6`}>
                  <feature.icon className="h-8 w-8 text-white" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-4">{feature.title}</h3>
                <p className="text-gray-600 leading-relaxed">{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Programs Section */}
      <section id="programs" className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl font-bold text-gray-900 mb-6">Internship Programs</h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Choose your path and grow from beginner to professional through our structured 6-month programs
            </p>
          </motion.div>

          <div className="space-y-12">
            {internshipStreams.map((stream, index) => (
              <motion.div
                key={stream.title}
                initial={{ opacity: 0, y: 50 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="bg-gradient-to-r from-gray-50 to-white rounded-3xl p-8 shadow-xl border border-gray-100"
              >
                <div className="flex items-center mb-8">
                  <div className={`w-20 h-20 bg-gradient-to-r ${stream.color} rounded-2xl flex items-center justify-center mr-6 shadow-lg`}>
                    <stream.icon className="h-10 w-10 text-white" />
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold text-gray-900 mb-2">{stream.title}</h3>
                    <p className="text-gray-700 text-lg">{stream.description}</p>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                  {stream.phases.map((phase, phaseIndex) => (
                    <motion.div
                      key={phaseIndex}
                      initial={{ opacity: 0, scale: 0.9 }}
                      whileInView={{ opacity: 1, scale: 1 }}
                      viewport={{ once: true }}
                      transition={{ delay: 0.1 * phaseIndex }}
                      className="bg-white rounded-xl p-4 shadow-md border border-gray-100 hover:shadow-lg transition-shadow"
                    >
                      <div className="text-center mb-3">
                        <div className={`w-8 h-8 bg-gradient-to-r ${stream.color} rounded-full flex items-center justify-center mx-auto mb-2`}>
                          <span className="text-white font-bold text-sm">{phaseIndex + 1}</span>
                        </div>
                        <h4 className="font-bold text-gray-900 text-sm">{phase.phase}</h4>
                        <p className="text-xs text-gray-600">{phase.duration}</p>
                      </div>
                      <p className="text-xs text-gray-700 mb-3 leading-relaxed">{phase.description}</p>
                      <div className={`text-xs font-medium px-2 py-1 rounded-full text-center ${
                        phase.compensation === 'Paid' ? 'bg-green-100 text-green-800' :
                        phase.compensation === 'Stipend' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {phase.compensation}
                      </div>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section id="testimonials" className="py-20 bg-gradient-to-br from-blue-50 to-teal-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl font-bold text-gray-900 mb-6">Success Stories</h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Hear from our alumni who've transformed their careers through our programs
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <motion.div
                key={testimonial.name}
                initial={{ opacity: 0, y: 50 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="bg-white rounded-2xl p-8 shadow-xl hover:shadow-2xl transition-all duration-300"
              >
                <div className="flex items-center mb-6">
                  <img
                    src={testimonial.image}
                    alt={testimonial.name}
                    className="w-16 h-16 rounded-full object-cover mr-4"
                  />
                  <div>
                    <h4 className="font-bold text-gray-900">{testimonial.name}</h4>
                    <p className="text-sm text-gray-600">{testimonial.role}</p>
                    <div className="flex mt-1">
                      {[...Array(testimonial.rating)].map((_, i) => (
                        <Star key={i} className="h-4 w-4 text-yellow-400 fill-current" />
                      ))}
                    </div>
                  </div>
                </div>
                <p className="text-gray-700 italic leading-relaxed">"{testimonial.quote}"</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-blue-600 to-teal-600">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="text-4xl font-bold text-white mb-6">Ready to Start Your Tech Journey?</h2>
            <p className="text-xl text-blue-100 mb-8 max-w-2xl mx-auto">
              Join hundreds of students who've launched successful careers through our comprehensive internship programs
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button variant="secondary" size="lg" className="bg-white text-blue-600 hover:bg-gray-100">
                <Coffee className="h-5 w-5 mr-2" />
                Schedule a Call
              </Button>
              <Button variant="accent" size="lg" onClick={() => navigate('/login')}>
                <Rocket className="h-5 w-5 mr-2" />
                Apply Now
              </Button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Contact Section */}
      <section id="contact" className="py-20 bg-gray-900 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl font-bold mb-6">Get In Touch</h2>
            <p className="text-xl text-gray-300 max-w-3xl mx-auto">
              Ready to transform your career? Let's discuss how our programs can help you achieve your goals
            </p>
          </motion.div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <motion.div
              initial={{ opacity: 0, y: 50 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
              className="text-center bg-gray-800 rounded-2xl p-8 shadow-lg hover:shadow-xl transition-shadow"
            >
              <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-teal-500 rounded-full flex items-center justify-center mx-auto mb-6">
                <MapPin className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-xl font-bold mb-4">Visit Us</h3>
              <p className="text-gray-300">
                141 Waragoda Rd, Peliyagoda,<br />
                Colombo, Sri Lanka
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 50 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 }}
              className="text-center bg-gray-800 rounded-2xl p-8 shadow-lg hover:shadow-xl transition-shadow"
            >
              <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-teal-500 rounded-full flex items-center justify-center mx-auto mb-6">
                <Mail className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-xl font-bold mb-4">Email Us</h3>
              <p className="text-gray-300">
                info@detzglobal.com
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 50 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.3 }}
              className="text-center bg-gray-800 rounded-2xl p-8 shadow-lg hover:shadow-xl transition-shadow"
            >
              <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-teal-500 rounded-full flex items-center justify-center mx-auto mb-6">
                <Phone className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-xl font-bold mb-4">Call Us</h3>
              <p className="text-gray-300">
                +94 713 979 029
              </p>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-black text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="flex items-center space-x-3 mb-4 md:mb-0">
              <img
                src="https://i.ibb.co/WWzbXzZS/DETZ.png"
                alt="Detz Global Logo"
                className="h-8 w-auto"
                onError={(e: React.SyntheticEvent<HTMLImageElement, Event>) => { 
                  e.currentTarget.onerror = null; 
                  e.currentTarget.src = "https://placehold.co/100x40/ffffff/000000?text=DETZ"; 
                }}
              />
            </div>
            <div className="text-gray-400 text-center md:text-right">
              <p className="text-lg mb-1">Empowering the next generation of technologists</p>
              <p className="text-sm">&copy; 2025 DETZ Global PVT LTD. All rights reserved.</p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}