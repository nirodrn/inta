import React from 'react';
import { motion } from 'framer-motion';
import {
  ArrowRight,
  Users,
  Code,
  Lightbulb,
  Camera,
  LogIn,
  MapPin,
  Mail,
  Phone,
  Globe,
  Shield,
  Briefcase,
  CheckCircle,
  Clock,
  Award
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function Landing() {
  const navigate = useNavigate();

  const features = [
    {
      icon: Code,
      title: 'Real-World Projects',
      description: 'Work on live client projects from day one with modern technologies and industry best practices.'
    },
    {
      icon: Users,
      title: 'Expert Mentorship',
      description: 'Learn from senior engineers and industry professionals with years of experience.'
    },
    {
      icon: Globe,
      title: 'Global Exposure',
      description: 'Work with international clients across Europe, North America, and the Middle East.'
    },
    {
      icon: Shield,
      title: 'Certified Training',
      description: 'Receive official certificates and recommendations upon successful completion.'
    },
    {
      icon: Briefcase,
      title: 'Career Ready',
      description: 'Build a professional portfolio and gain skills that employers are looking for.'
    },
    {
      icon: Award,
      title: 'Structured Learning',
      description: 'Follow a proven 6-month program designed to take you from beginner to professional.'
    }
  ];

  const programs = [
    {
      title: 'Software Engineering – Web',
      icon: Code,
      description: 'Master modern web development with React, Node.js, and cloud technologies.',
      duration: '6 Months',
      phases: ['Orientation', 'Workshops', 'Demo Projects', 'Database Integration', 'Client Projects']
    },
    {
      title: 'Software Engineering – .NET/C#',
      icon: Code,
      description: 'Build enterprise applications with .NET, ML.NET, and cloud services.',
      duration: '6 Months',
      phases: ['Orientation', '.NET Workshops', 'Microservices', 'System Integration', 'Production Solutions']
    },
    {
      title: 'Electrical Engineering',
      icon: Lightbulb,
      description: 'From circuit design to live installations with IoT and embedded systems.',
      duration: '6 Months',
      phases: ['Safety Training', 'Circuit Design', 'Prototyping', 'System Integration', 'Live Installations']
    },
    {
      title: 'Photography & Design',
      icon: Camera,
      description: 'Professional studio work with real client campaigns and brand projects.',
      duration: '6 Months',
      phases: ['Studio Training', 'Creative Workshops', 'Client Work', 'Campaign Management', 'Full Ownership']
    }
  ];

  return (
    <div className="min-h-screen bg-white">
      {/* Navigation */}
      <nav className="bg-white shadow-sm sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-6">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <span className="text-2xl font-bold text-blue-600">DETZ Global</span>
            </div>
            <div className="hidden md:flex items-center space-x-8">
              <a href="#about" className="text-gray-700 hover:text-blue-600 transition-colors">About</a>
              <a href="#programs" className="text-gray-700 hover:text-blue-600 transition-colors">Programs</a>
              <a href="#contact" className="text-gray-700 hover:text-blue-600 transition-colors">Contact</a>
              <button
                onClick={() => navigate('/login')}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center"
              >
                <LogIn className="h-4 w-4 mr-2" />
                Access IMS
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="bg-gradient-to-br from-blue-50 to-white py-20">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
            >
              <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6">
                Empowering the Next Generation of
                <span className="text-blue-600 block">Technologists</span>
              </h1>
              <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
                DETZ Global is a multidisciplinary engineering and creative studio with projects across 
                Europe, North America, and the Middle East. Join our comprehensive internship programs 
                and launch your career with real-world experience.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <button
                  onClick={() => window.open('https://detzglobal.com/careers', '_blank')}
                  className="bg-blue-600 text-white px-8 py-4 rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center text-lg font-semibold"
                >
                  Start Your Journey
                  <ArrowRight className="h-5 w-5 ml-2" />
                </button>
                <button
                  onClick={() => navigate('/login')}
                  className="border-2 border-blue-600 text-blue-600 px-8 py-4 rounded-lg hover:bg-blue-50 transition-colors flex items-center justify-center text-lg font-semibold"
                >
                  <LogIn className="h-5 w-5 mr-2" />
                  Access Portal
                </button>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="about" className="py-20 bg-gray-50">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">Why Choose DETZ Global?</h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              We don't just teach technology – we immerse you in real-world projects that shape your career
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="bg-white p-8 rounded-xl shadow-sm hover:shadow-md transition-shadow"
              >
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-6">
                  <feature.icon className="h-6 w-6 text-blue-600" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-4">{feature.title}</h3>
                <p className="text-gray-600">{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Programs Section */}
      <section id="programs" className="py-20 bg-white">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">Internship Programs</h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Choose your path and grow from beginner to professional through our structured programs
            </p>
          </div>
          <div className="grid md:grid-cols-2 gap-8">
            {programs.map((program, index) => (
              <motion.div
                key={program.title}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="bg-gray-50 p-8 rounded-xl"
              >
                <div className="flex items-center mb-6">
                  <div className="w-12 h-12 bg-blue-600 rounded-lg flex items-center justify-center mr-4">
                    <program.icon className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold text-gray-900">{program.title}</h3>
                    <p className="text-blue-600 font-medium">{program.duration}</p>
                  </div>
                </div>
                <p className="text-gray-600 mb-6">{program.description}</p>
                <div className="space-y-2">
                  <h4 className="font-semibold text-gray-900 mb-3">Program Phases:</h4>
                  {program.phases.map((phase, phaseIndex) => (
                    <div key={phaseIndex} className="flex items-center">
                      <CheckCircle className="h-4 w-4 text-green-500 mr-3 flex-shrink-0" />
                      <span className="text-gray-700">{phase}</span>
                    </div>
                  ))}
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Program Structure */}
      <section className="py-20 bg-blue-600 text-white">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4">Program Structure</h2>
            <p className="text-xl text-blue-100 max-w-3xl mx-auto">
              Our 6-month programs are designed to take you from beginner to professional
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-white bg-opacity-20 rounded-full flex items-center justify-center mx-auto mb-4">
                <Clock className="h-8 w-8" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Months 1-2</h3>
              <p className="text-blue-100">Orientation & Workshops</p>
              <p className="text-sm text-blue-200 mt-2">Foundation building and skill development</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-white bg-opacity-20 rounded-full flex items-center justify-center mx-auto mb-4">
                <Code className="h-8 w-8" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Months 3-5</h3>
              <p className="text-blue-100">Demo Projects & Integration</p>
              <p className="text-sm text-blue-200 mt-2">Hands-on experience with real projects</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-white bg-opacity-20 rounded-full flex items-center justify-center mx-auto mb-4">
                <Award className="h-8 w-8" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Month 6</h3>
              <p className="text-blue-100">Client Projects</p>
              <p className="text-sm text-blue-200 mt-2">Professional work with real clients</p>
            </div>
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section id="contact" className="py-20 bg-gray-900 text-white">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4">Contact & Support</h2>
            <p className="text-xl text-gray-300 max-w-3xl mx-auto">
              Ready to start your journey? Get in touch with us
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-12 h-12 bg-blue-600 rounded-lg flex items-center justify-center mx-auto mb-4">
                <MapPin className="h-6 w-6" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Address</h3>
              <p className="text-gray-300">
                141 Waragoda Road, Peliyagoda<br />
                Colombo, Sri Lanka
              </p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-blue-600 rounded-lg flex items-center justify-center mx-auto mb-4">
                <Phone className="h-6 w-6" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Hotline</h3>
              <p className="text-gray-300">
                <a href="tel:+94713979029" className="hover:text-blue-400 transition-colors">
                  +94 713 979 029
                </a>
              </p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-blue-600 rounded-lg flex items-center justify-center mx-auto mb-4">
                <Mail className="h-6 w-6" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Email</h3>
              <p className="text-gray-300">
                <a href="mailto:info@detzglobal.com" className="hover:text-blue-400 transition-colors">
                  info@detzglobal.com
                </a>
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-black text-white py-8">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center">
            <p className="text-gray-400">
              © {new Date().getFullYear()} DETZ Global PVT LTD. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}