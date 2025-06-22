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
  Lightbulb, // For Electrical Engineer
  Camera, // For Photography & Graphic Design Interns
  BookOpen, // For Technical Mastery / Learning
  Handshake, // For Mentorship / Partnerships
  
  GraduationCap, // For Professional Growth / University Partnerships / Certificate
  Trophy // For Certificate & Recognition
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

// (Removed unused useNavigateDummy function)

// Define props interface for the Button Component
interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
  onClick?: () => void;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'primary' | 'secondary';
  className?: string;
}

// Simple Button Component - This replaces '../components/UI/Button'
import { forwardRef } from 'react';
import type { MotionProps } from 'framer-motion';

const Button = forwardRef<HTMLButtonElement, ButtonProps & MotionProps>(
  ({ children, onClick, size = 'md', variant = 'primary', className = '', ...props }, ref) => {
    const baseStyles = "inline-flex items-center justify-center font-semibold rounded-xl transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2";
    
    const sizeStyles = {
      sm: "px-4 py-2 text-sm",
      md: "px-5 py-2.5 text-base",
      lg: "px-6 py-3 text-lg",
    };

    const variantStyles = {
      primary: "bg-blue-600 text-white hover:bg-blue-700 active:bg-blue-800 focus:ring-blue-500 shadow-md",
      secondary: "bg-white text-blue-600 border border-blue-600 hover:bg-blue-50 hover:border-blue-700 focus:ring-blue-500 shadow-sm",
    };

    return (
      <motion.button
        ref={ref}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
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

  const stats: { number: string; label: string }[] = [
    { number: '', label: 'Software Engineer WEB' },
    { number: '', label: 'Software Engineer .NET' },
    { number: '', label: 'Electrical Engineer' },
    { number: '', label: 'Studio' },
  ];

  interface InternshipPhase {
    phase: string;
    duration: string;
    description: string;
    compensation: string;
  }

  interface InternshipStream {
    title: string;
    icon: React.ElementType; // Use React.ElementType for Lucide icons
    description: string;
    phases: InternshipPhase[];
  }

  const internshipStreams: InternshipStream[] = [
    {
      title: 'Software Engineering Intern – Web',
      icon: Code,
      description: 'Learn to build modern web apps from UI to backend, deploy at scale, and collaborate on live client sites.',
      phases: [
        { phase: '1. Orientation & Industry Induction', duration: '1 Month', description: 'Overview of DETZ culture and Agile workflows; Git/GitHub best practices; environment setup (Node.js, React, Docker).', compensation: 'Unpaid' },
        { phase: '2. Tech Workshops & Demo App Development', duration: '1 Month', description: 'Intensive training on React/Next.js, REST/GraphQL APIs, CI/CD pipelines, containerization, and cloud hosting fundamentals.', compensation: 'Unpaid' },
        { phase: '3. Demo Project Execution & Client Task Integration', duration: '2–4 Months', description: 'Guided mini-projects that evolve into real client feature work—auth flows, UI components, API integrations—under mentor code reviews and sprint cycles.', compensation: 'Stipend (Performance-based)' },
        { phase: '4. Database Design & Live Project Integration', duration: '1 Month', description: 'Model and optimize NoSQL data in Firebase/Supabase; integrate with live frontends; write serverless functions and edge-compute logic for production clients.', compensation: 'Stipend (Performance-based)' },
        { phase: '5. Full Client Project Engagement', duration: '1 Month', description: 'Contribute end-to-end on a billable client website or web-app, from feature spec to deployment and monitoring, alongside our engineering team.', compensation: 'Paid' },
      ]
    },
    {
      title: 'Software Engineering Intern – .NET/C#',
      icon: Smartphone,
      description: 'Master C#-based backends, ML.NET, and NoSQL-driven cloud services while deploying production-grade microservices.',
      phases: [
        { phase: '1. Orientation & Industry Induction', duration: '1 Month', description: 'C#/.NET ecosystem setup; core OOP principles; solution/project structure; Git workflows; Agile standups and sprint planning.', compensation: 'Unpaid' },
        { phase: '2. .NET & Cloud Workshops', duration: '1 Month', description: 'Deep dives into .NET 6+, ASP.NET Core APIs, ML.NET basics; building serverless backends with Firebase & Supabase SDKs; unit-testing with xUnit/NUnit.', compensation: 'Unpaid' },
        { phase: '3. Demo Project Execution & Client Task Integration', duration: '2–4 Months', description: 'Develop microservices and APIs backed by Firebase/Supabase; integrate ML.NET predictive models; gradually take on real client feature tickets.', compensation: 'Stipend (Performance-based)' },
        { phase: '4. Database Design & Live System Integration', duration: '1 Month', description: 'Design NoSQL data models; implement offline/real-time sync; integrate with ML pipelines; ensure secure authentication and role-based access for clients.', compensation: 'Stipend (Performance-based)' },
        { phase: '5. Full Client Project Engagement', duration: '1 Month', description: 'Deliver a full production-ready .NET solution (web API or web app), complete with CI/CD, monitoring, and performance tuning, under mentor supervision.', compensation: 'Paid' },
      ]
    },
    {
      title: 'Electrical Engineering Intern',
      icon: Lightbulb,
      description: 'From circuit labs to live installations—design, prototype, and deploy electrical systems for real-world clients.',
      phases: [
        { phase: '1. Orientation & Industry Induction', duration: '1 Month', description: 'Hands-on safety training; tool and instrument familiarization (multimeters, oscilloscopes); introduction to DETZ EHS policies and project workflows.', compensation: 'Unpaid' },
        { phase: '2. Workshop Series & Prototype Builds', duration: '1 Month', description: 'Guided labs in circuit simulation, PCB layout, embedded IoT sensor integration, and power electronics fundamentals.', compensation: 'Unpaid' },
        { phase: '3. Demo Project Execution & Client Task Integration', duration: '2–4 Months', description: 'Build functional prototypes (control panels, sensor networks); iterate with client feedback; prepare documentation and test reports for real-site trials.', compensation: 'Stipend (Performance-based)' },
        { phase: '4. System Integration & Live Deployment', duration: '1 Month', description: 'Integrate prototypes into existing client infrastructure; perform on-site commissioning or remote support; apply QA/QC procedures and safety inspections.', compensation: 'Stipend (Performance-based)' },
        { phase: '5. Full Client Project Engagement', duration: '1 Month', description: 'Lead or co-lead an end-to-end client installation or retrofit project—design, wiring, testing, and handover—under senior engineer mentorship.', compensation: 'Paid' },
      ]
    },
    {
      title: 'Photography & Graphic Design Interns',
      icon: Camera,
      description: 'Turn concepts into compelling visuals—shoot, edit, and deliver studio-and-client ready assets.',
      phases: [
        { phase: '1. Orientation & Industry Induction', duration: '1 Month', description: 'Studio safety, brand guidelines, software setup (Lightroom, Photoshop, Illustrator); workflow overview for shoots and post-production.', compensation: 'Unpaid' },
        { phase: '2. Creative Workshops & Portfolio Demos', duration: '1 Month', description: 'Masterclasses in lighting, composition, retouching, layout design, motion graphics, and client-brief interpretation.', compensation: 'Unpaid' },
        { phase: '3. Demo Project Execution & Client Task Integration', duration: '2–4 Months', description: 'Work on internal mock briefs that evolve into live client assignments—photo/video shoots, branding collateral, social-media graphics—with iterative reviews.', compensation: 'Stipend (Performance-based)' },
        { phase: '4. Asset Management & Live Campaign Support', duration: '1 Month', description: 'Catalog, optimize, and deliver assets to marketing platforms; assist in live campaigns, A/B testing, and content scheduling.', compensation: 'Stipend (Performance-based)' },
        { phase: '5. Full Client Project Engagement', duration: '1 Month', description: 'Own a client shoot or design campaign from concept through delivery, including pre-production planning, shoot direction, editing, and final handoff.', compensation: 'Paid' },
      ]
    }
  ];


  return (
    <div className="min-h-screen bg-white font-sans">
      {/* Navigation */}
      <motion.nav
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        className="bg-white shadow-sm border-b border-gray-100 sticky top-0 z-50 rounded-b-xl"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <motion.div
              whileHover={{ scale: 1.05 }}
              className="flex items-center space-x-3 cursor-pointer"
            >
              {/* Logo in Navigation */}
              <img
                src="https://i.ibb.co/WWzbXzZS/DETZ.png"
                alt="Detz Global Logo"
                className="h-8 md:h-10 w-auto" // Adjusted size for better fit
                onError={(e: React.SyntheticEvent<HTMLImageElement, Event>) => { e.currentTarget.onerror = null; e.currentTarget.src = "https://placehold.co/100x40/aabbcc/ffffff?text=DETZ%20Global"; }}
              />
            </motion.div>

            <div className="hidden md:flex items-center space-x-8">
              <a href="#about" className="text-gray-700 hover:text-blue-600 transition-colors rounded-md px-3 py-2">About</a>
              <a href="#careers" className="text-gray-700 hover:text-blue-600 transition-colors rounded-md px-3 py-2">Careers</a>
              <a href="#contact" className="text-gray-700 hover:text-blue-600 transition-colors rounded-md px-3 py-2">Contact</a>
              <Button onClick={() => navigate('/login')} size="sm">
                <LogIn className="h-4 w-4 mr-2" />
                Login to IMS
              </Button>
            </div>
          </div>
        </div>
      </motion.nav>

      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-blue-50 via-white to-teal-50 py-20 overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <motion.div
              initial={{ opacity: 0, x: -50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8 }}
            >
              <h1 className="text-5xl lg:text-6xl font-extrabold text-gray-900 leading-tight">
                Innovating the{' '}
                <span className="bg-gradient-to-r from-blue-600 to-teal-600 bg-clip-text text-transparent">
                  Digital Future
                </span>
              </h1>
              <p className="text-xl text-gray-600 mt-6 leading-relaxed">
                At Detz Global, we transform ideas into powerful digital solutions.
                Our expert team delivers cutting-edge software development, mobile applications,
                and cloud solutions that drive business growth.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 mt-8">
                <Button size="lg" className="group">
                  Get Started
                  <ArrowRight className="h-5 w-5 ml-2 group-hover:translate-x-1 transition-transform" />
                </Button>
                <Button variant="secondary" size="lg" onClick={() => navigate('/login')}>
                  <LogIn className="h-5 w-5 mr-2" />
                  Access IMS Portal
                </Button>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="relative flex justify-center items-center h-full"
            >
              <div className="relative z-10 bg-white rounded-2xl shadow-2xl p-8 w-full max-w-sm">
                <div className="grid grid-cols-2 gap-6">
                  {stats.map((stat, index) => (
                    <motion.div
                      key={stat.label}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.5 + index * 0.1 }}
                      className="text-center bg-gray-50 rounded-lg p-4 shadow-sm"
                    >
                      <div className="text-lg font-bold text-blue-600">{stat.label}</div>
                    </motion.div>
                  ))}
                </div>
              </div>
              <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-teal-600 rounded-2xl transform rotate-3 scale-105 opacity-75 shadow-xl"></div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* About Section */}
      <section id="about" className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl font-bold text-gray-900 mb-6">About Detz Global</h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Founded with a vision to bridge the gap between technology and business success,
              Detz Global has been at the forefront of digital innovation for over a decade.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <motion.div
              initial={{ opacity: 0, y: 50 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
              className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-2xl p-8 shadow-lg flex flex-col items-center text-center"
            >
              <Target className="h-12 w-12 text-blue-600 mb-6" />
              <h3 className="text-2xl font-bold text-gray-900 mb-4">Our Mission</h3>
              <p className="text-gray-700">
                To empower businesses with innovative technology solutions that drive growth,
                efficiency, and competitive advantage in the digital landscape.
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 50 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 }}
              className="bg-gradient-to-br from-teal-50 to-teal-100 rounded-2xl p-8 shadow-lg flex flex-col items-center text-center"
            >
              <Users className="h-12 w-12 text-teal-600 mb-6" />
              <h3 className="text-2xl font-bold text-gray-900 mb-4">Our Team</h3>
              <p className="text-gray-700">
                A diverse group of passionate developers, designers, and strategists
                committed to delivering excellence in every project we undertake.
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 50 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.3 }}
              className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-2xl p-8 shadow-lg flex flex-col items-center text-center"
            >
              <Award className="h-12 w-12 text-purple-600 mb-6" />
              <h3 className="text-2xl font-bold text-gray-900 mb-4">Our Values</h3>
              <p className="text-gray-700">
                Innovation, integrity, and client success are at the core of everything we do.
                We believe in building lasting partnerships through exceptional service.
              </p>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Careers Section */}
      <section id="careers" className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl font-bold text-gray-900 mb-6">Career Opportunities & Internships</h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto mb-8">
              We're always looking for talented individuals who share our passion for innovation
              and excellence. Explore exciting career opportunities and our comprehensive internship programs at Detz Global.
            </p>
          </motion.div>

          {/* About DETZ Global within Careers */}
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="bg-gray-50 rounded-2xl p-8 mb-16 shadow-lg text-gray-800"
          >
            <h3 className="text-3xl font-bold text-gray-900 mb-4 text-center flex items-center justify-center">
              <Building2 className="h-8 w-8 text-blue-600 mr-3" />
              About DETZ Global
            </h3>
            <p className="text-lg leading-relaxed mb-4">
              DETZ Global PVT LTD is a multidisciplinary engineering and creative studio headquartered in Colombo, Sri Lanka, with projects across Europe, North America, and the Middle East. Since 2022, we’ve grown from a visual-storytelling boutique into three cohesive divisions:
            </p>
            <ul className="list-disc list-inside text-lg leading-relaxed mb-6 space-y-2 pl-4">
              <li><strong>DETZ Software</strong> – Full-stack & cloud-native application development</li>
              <li><strong>DETZ Technologies</strong> – IoT, AI/ML research and systems integration</li>
              <li><strong>DETZ Studios</strong> – Photography, videography, graphic design & content production</li>
            </ul>
            <p className="text-lg leading-relaxed mb-4">
              Our mission is to empower the next generation of technologists through innovation, mentorship, and real-world client projects.
            </p>
          </motion.div>

          {/* Internship Streams & Program Phases */}
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="mb-16"
          >
            <h3 className="text-3xl font-bold text-gray-900 mb-8 text-center">
              <GraduationCap className="inline-block h-8 w-8 text-teal-600 mr-2" />
              Internship Streams & Program Phases
            </h3>
            <div className="space-y-12">
              {internshipStreams.map((stream, index) => (
                <motion.div
                  key={stream.title}
                  initial={{ opacity: 0, y: 50 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 }}
                  className="bg-gradient-to-br from-blue-50 to-white rounded-2xl p-8 shadow-xl border border-blue-100"
                >
                  <div className="flex items-center mb-6">
                    <div className="w-16 h-16 bg-blue-600 text-white rounded-full flex items-center justify-center mr-6 shadow-md">
                      <stream.icon className="h-9 w-9" />
                    </div>
                    <div>
                      <h4 className="text-2xl font-bold text-gray-900">{stream.title}</h4>
                      <p className="text-gray-700 mt-1">{stream.description}</p>
                    </div>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="min-w-full bg-white rounded-lg shadow-inner text-sm">
                      <thead className="bg-blue-100 text-blue-800 uppercase text-left">
                        <tr>
                          <th className="py-3 px-4 rounded-tl-lg">Phase</th>
                          <th className="py-3 px-4">Duration</th>
                          <th className="py-3 px-4">Description</th>
                          <th className="py-3 px-4 rounded-tr-lg">Compensation</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {stream.phases.map((phase, phaseIndex) => (
                          <tr key={phaseIndex} className={phaseIndex % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                            <td className="py-3 px-4 font-medium text-gray-800">{phase.phase}</td>
                            <td className="py-3 px-4 text-gray-700">{phase.duration}</td>
                            <td className="py-3 px-4 text-gray-700">{phase.description}</td>
                            <td className="py-3 px-4 text-gray-700">{phase.compensation}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* What You’ll Gain */}
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.3 }}
            className="bg-teal-50 rounded-2xl p-8 mb-16 shadow-lg border border-teal-100"
          >
            <h3 className="text-3xl font-bold text-gray-900 mb-6 text-center flex items-center justify-center">
              <BookOpen className="h-8 w-8 text-teal-600 mr-3" />
              What You’ll Gain
            </h3>
            <ul className="grid grid-cols-1 md:grid-cols-2 gap-6 text-lg text-gray-700 list-none p-0">
              <li className="flex items-start">
                <ChevronRight className="h-6 w-6 text-teal-600 mr-2 mt-1 flex-shrink-0" />
                <div>
                  <strong>Technical Mastery:</strong> From modern web frameworks to embedded electronics and creative suites.
                </div>
              </li>
              <li className="flex items-start">
                <ChevronRight className="h-6 w-6 text-teal-600 mr-2 mt-1 flex-shrink-0" />
                <div>
                  <strong>Mentorship:</strong> One-on-one guidance from senior engineers and creative directors.
                </div>
              </li>
              <li className="flex items-start">
                <ChevronRight className="h-6 w-6 text-teal-600 mr-2 mt-1 flex-shrink-0" />
                <div>
                  <strong>Real-World Experience:</strong> Contribute to live client projects and build a portfolio of billable work.
                </div>
              </li>
              <li className="flex items-start">
                <ChevronRight className="h-6 w-6 text-teal-600 mr-2 mt-1 flex-shrink-0" />
                <div>
                  <strong>Professional Growth:</strong> Agile team practice, code reviews, safety protocols, and client communications.
                </div>
              </li>
            </ul>
          </motion.div>

          {/* University Partnerships */}
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.4 }}
            className="bg-purple-50 rounded-2xl p-8 mb-16 shadow-lg border border-purple-100"
          >
            <h3 className="text-3xl font-bold text-gray-900 mb-6 text-center flex items-center justify-center">
              <Handshake className="h-8 w-8 text-purple-600 mr-3" />
              University Partnerships
            </h3>
            <ul className="grid grid-cols-1 md:grid-cols-2 gap-6 text-lg text-gray-700 list-none p-0">
              <li className="flex items-start">
                <ChevronRight className="h-6 w-6 text-purple-600 mr-2 mt-1 flex-shrink-0" />
                <div>
                  <strong>Curriculum Alignment:</strong> We tailor modules to reinforce academic coursework.
                </div>
              </li>
              <li className="flex items-start">
                <ChevronRight className="h-6 w-6 text-purple-600 mr-2 mt-1 flex-shrink-0" />
                <div>
                  <strong>Talent Pipeline:</strong> Early access to top interns for recruitment.
                </div>
              </li>
              <li className="flex items-start">
                <ChevronRight className="h-6 w-6 text-purple-600 mr-2 mt-1 flex-shrink-0" />
                <div>
                  <strong>Networking Opportunities:</strong> Connect students with industry leaders and global clients.
                </div>
              </li>
            </ul>
          </motion.div>

          {/* Certificate & Recognition */}
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.5 }}
            className="bg-pink-50 rounded-2xl p-8 mb-16 shadow-lg border border-pink-100"
          >
            <h3 className="text-3xl font-bold text-gray-900 mb-6 text-center flex items-center justify-center">
              <Trophy className="h-8 w-8 text-pink-600 mr-3" />
              Certificate & Recognition
            </h3>
            <ul className="grid grid-cols-1 md:grid-cols-2 gap-6 text-lg text-gray-700 list-none p-0">
              <li className="flex items-start">
                <ChevronRight className="h-6 w-6 text-pink-600 mr-2 mt-1 flex-shrink-0" />
                <div>
                  <strong>Official DETZ Global Certificate</strong>
                </div>
              </li>
              <li className="flex items-start">
                <ChevronRight className="h-6 w-6 text-pink-600 mr-2 mt-1 flex-shrink-0" />
                <div>
                  <strong>Project Evaluation Report</strong>
                </div>
              </li>
              <li className="flex items-start">
                <ChevronRight className="h-6 w-6 text-pink-600 mr-2 mt-1 flex-shrink-0" />
                <div>
                  <strong>Letter of Recommendation</strong> (top performers)
                </div>
              </li>
              <li className="flex items-start">
                <ChevronRight className="h-6 w-6 text-pink-600 mr-2 mt-1 flex-shrink-0" />
                <div>
                  <strong>LinkedIn Endorsement</strong>
                </div>
              </li>
            </ul>
          </motion.div>

          {/* IMS Portal remains at the bottom of careers */}
          <div className="bg-gradient-to-r from-blue-50 to-teal-50 rounded-2xl p-8 max-w-4xl mx-auto shadow-xl text-center">
            <h3 className="text-2xl font-bold text-gray-900 mb-4">Internship Management System</h3>
            <p className="text-gray-700 mb-6">
              Our comprehensive IMS platform helps manage internship programs, track progress,
              and foster the next generation of tech talent. Access your portal to get started.
            </p>
            <Button onClick={() => navigate('/login')} size="lg" className="group">
              <LogIn className="h-5 w-5 mr-2" />
              Access IMS Portal
              <ChevronRight className="h-5 w-5 ml-2 group-hover:translate-x-1 transition-transform" />
            </Button>
          </div>
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
              Ready to start your next project? Let's discuss how we can help bring your vision to life.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <motion.div
              initial={{ opacity: 0, y: 50 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
              className="text-center bg-gray-800 rounded-2xl p-8 shadow-lg"
            >
              <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-teal-500 rounded-full flex items-center justify-center mx-auto mb-6 shadow-md">
                <MapPin className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-xl font-bold mb-4">Address</h3>
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
              className="text-center bg-gray-800 rounded-2xl p-8 shadow-lg"
            >
              <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-teal-500 rounded-full flex items-center justify-center mx-auto mb-6 shadow-md">
                <Mail className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-xl font-bold mb-4">Email</h3>
              <p className="text-gray-300">
                info@detzglobal.com
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 50 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.3 }}
              className="text-center bg-gray-800 rounded-2xl p-8 shadow-lg"
            >
              <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-teal-500 rounded-full flex items-center justify-center mx-auto mb-6 shadow-md">
                <Phone className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-xl font-bold mb-4">Hotline</h3>
              <p className="text-gray-300">
                +94 713 979 029
              </p>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gradient-to-r from-gray-900 to-gray-700 text-white py-16 rounded-t-2xl shadow-inner">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="text-gray-300 text-center md:text-left text-lg">
              <p>Bringing innovation and excellence across multiple domains.</p>
              <p className="text-sm mt-1">&copy; 2025 Detz Global. All rights reserved.</p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
