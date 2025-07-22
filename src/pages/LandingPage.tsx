import React, { useState, FormEvent } from "react";
import { useAuth } from "../contexts/AuthContext";

const LandingPage: React.FC = () => {
  const [showLogin, setShowLogin] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loginLoading, setLoginLoading] = useState(false);
  const [loginError, setLoginError] = useState("");
  const { login } = useAuth();

  const handleLogin = async (e: FormEvent) => {
    e.preventDefault();
    setLoginLoading(true);
    setLoginError("");
    try {
      await login(email, password);
      setShowLogin(false);
      setEmail("");
      setPassword("");
    } catch {
      setLoginError("Login failed. Please check your credentials.");
    } finally {
      setLoginLoading(false);
    }
  };

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="fixed w-full z-50 bg-white/90 backdrop-blur-md shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-3">
              <img src="/logo192.png" alt="DETZ Global Logo" className="h-10 w-10 rounded-full shadow-md" />
              <span className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-blue-800 text-transparent bg-clip-text">DETZ Global</span>
            </div>
            <button
              onClick={() => setShowLogin(true)}
              className="px-6 py-2.5 bg-gradient-to-r from-blue-600 to-blue-800 text-white rounded-lg font-semibold hover:from-blue-700 hover:to-blue-900 transition-all duration-300 shadow-md hover:shadow-lg transform hover:-translate-y-0.5"
            >
              Login
            </button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 bg-gradient-to-b from-blue-50 via-white to-white">
        <div className="absolute inset-0 bg-grid-pattern opacity-5"></div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          <div className="text-center max-w-4xl mx-auto">
            <h1 className="text-5xl md:text-6xl font-extrabold mb-6 bg-gradient-to-r from-blue-600 to-blue-800 text-transparent bg-clip-text leading-tight">
              Empowering the Next Generation of Technologists
            </h1>
            <p className="text-xl md:text-2xl text-gray-600 mb-12 leading-relaxed">
              A multidisciplinary engineering and creative studio headquartered in Colombo, Sri Lanka, with projects across <span className="text-blue-700 font-semibold">Europe</span>, <span className="text-blue-700 font-semibold">North America</span>, and the <span className="text-blue-700 font-semibold">Middle East</span>.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 mt-16">
            <div className="bg-white rounded-2xl p-8 shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1 border border-gray-100">
              <div className="text-blue-600 mb-4">
                <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">DETZ Software</h3>
              <p className="text-gray-600">Full-stack & cloud-native application development with cutting-edge technologies</p>
            </div>
            <div className="bg-white rounded-2xl p-8 shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1 border border-gray-100">
              <div className="text-blue-600 mb-4">
                <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">DETZ Technologies</h3>
              <p className="text-gray-600">IoT innovation, AI/ML research, and advanced systems integration</p>
            </div>
            <div className="bg-white rounded-2xl p-8 shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1 border border-gray-100">
              <div className="text-blue-600 mb-4">
                <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">DETZ Studios</h3>
              <p className="text-gray-600">Creative excellence in photography, videography, and design</p>
            </div>
          </div>
        </div>
      </section>

      {/* Internship Streams */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-blue-800 text-transparent bg-clip-text mb-4">🎓 Internship Streams</h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">Launch your career with our comprehensive internship programs</p>
          </div>
          
          <div className="grid md:grid-cols-2 gap-8">
            {/* Software Engineering Intern – Web */}
            <div className="bg-white rounded-2xl shadow-xl p-8 hover:shadow-2xl transition-all duration-300 border border-gray-100">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-2xl font-bold text-gray-900">Software Engineering Intern – Web</h3>
                <span className="px-4 py-1.5 bg-blue-100 text-blue-800 rounded-full text-sm font-semibold">Full Stack</span>
              </div>
              
              <div className="space-y-6">
                <div className="bg-gray-50 rounded-xl p-4">
                  <h4 className="font-semibold text-gray-900 mb-3">Key Technologies</h4>
                  <div className="flex flex-wrap gap-2">
                    {['React', 'Node.js', 'Docker', 'Git', 'Agile'].map((tech) => (
                      <span key={tech} className="px-3 py-1 bg-white rounded-full text-sm text-gray-700 border border-gray-200">{tech}</span>
                    ))}
                  </div>
                </div>

                <div className="space-y-3">
                  <h4 className="font-semibold text-gray-900">Program Timeline</h4>
                  <div className="relative">
                    <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-blue-100"></div>
                    <div className="space-y-6 relative">
                      <div className="flex items-start">
                        <div className="flex-shrink-0 w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center shadow-md">
                          <span className="text-white text-xs font-bold">1</span>
                        </div>
                        <div className="ml-4">
                          <h5 className="text-gray-900 font-medium">Orientation</h5>
                          <p className="text-sm text-gray-600">1 month · Unpaid</p>
                        </div>
                      </div>
                      <div className="flex items-start">
                        <div className="flex-shrink-0 w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center shadow-md">
                          <span className="text-white text-xs font-bold">2</span>
                        </div>
                        <div className="ml-4">
                          <h5 className="text-gray-900 font-medium">Workshops & Training</h5>
                          <p className="text-sm text-gray-600">1 month · Unpaid</p>
                        </div>
                      </div>
                      <div className="flex items-start">
                        <div className="flex-shrink-0 w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center shadow-md">
                          <span className="text-white text-xs font-bold">3</span>
                        </div>
                        <div className="ml-4">
                          <h5 className="text-gray-900 font-medium">Demo Project Phase</h5>
                          <p className="text-sm text-gray-600">2-4 months · Stipend</p>
                        </div>
                      </div>
                      <div className="flex items-start">
                        <div className="flex-shrink-0 w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center shadow-md">
                          <span className="text-white text-xs font-bold">4</span>
                        </div>
                        <div className="ml-4">
                          <h5 className="text-gray-900 font-medium">Live Project</h5>
                          <p className="text-sm text-gray-600">1 month · Stipend</p>
                        </div>
                      </div>
                      <div className="flex items-start">
                        <div className="flex-shrink-0 w-8 h-8 bg-green-600 rounded-full flex items-center justify-center shadow-md">
                          <span className="text-white text-xs font-bold">5</span>
                        </div>
                        <div className="ml-4">
                          <h5 className="text-gray-900 font-medium">Client Project</h5>
                          <p className="text-sm text-gray-600">1 month · Paid</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          {/* Software Engineering Intern – .NET/C# */}
          <div className="bg-white rounded-xl shadow-md p-6">
            <h3 className="font-semibold text-blue-700 text-xl mb-2">Software Engineering Intern – .NET/C#</h3>
            <ul className="list-disc ml-6 text-gray-700 mb-2">
              <li>C#/.NET, ML.NET, NoSQL, microservices</li>
              <li>Cloud, APIs, Agile, xUnit/NUnit</li>
              <li>Stipend & paid phases</li>
            </ul>
            <table className="w-full text-sm mt-2 border">
              <thead>
                <tr className="bg-blue-50">
                  <th className="p-1 border">Phase</th>
                  <th className="p-1 border">Duration</th>
                  <th className="p-1 border">Compensation</th>
                </tr>
              </thead>
              <tbody>
                <tr><td className="border p-1">Orientation</td><td className="border p-1">1M</td><td className="border p-1">Unpaid</td></tr>
                <tr><td className="border p-1">Workshops</td><td className="border p-1">1M</td><td className="border p-1">Unpaid</td></tr>
                <tr><td className="border p-1">Demo Project</td><td className="border p-1">2–4M</td><td className="border p-1">Stipend</td></tr>
                <tr><td className="border p-1">DB & Live System</td><td className="border p-1">1M</td><td className="border p-1">Stipend</td></tr>
                <tr><td className="border p-1">Client Project</td><td className="border p-1">1M</td><td className="border p-1">Paid</td></tr>
              </tbody>
            </table>
          </div>
          {/* Electrical Engineering Intern */}
          <div className="bg-white rounded-xl shadow-md p-6">
            <h3 className="font-semibold text-blue-700 text-xl mb-2">Electrical Engineering Intern</h3>
            <ul className="list-disc ml-6 text-gray-700 mb-2">
              <li>Circuit labs, PCB, IoT, installations</li>
              <li>Client projects, QA/QC, safety</li>
              <li>Stipend & paid phases</li>
            </ul>
            <table className="w-full text-sm mt-2 border">
              <thead>
                <tr className="bg-blue-50">
                  <th className="p-1 border">Phase</th>
                  <th className="p-1 border">Duration</th>
                  <th className="p-1 border">Compensation</th>
                </tr>
              </thead>
              <tbody>
                <tr><td className="border p-1">Orientation</td><td className="border p-1">1M</td><td className="border p-1">Unpaid</td></tr>
                <tr><td className="border p-1">Workshops</td><td className="border p-1">1M</td><td className="border p-1">Unpaid</td></tr>
                <tr><td className="border p-1">Demo Project</td><td className="border p-1">2–4M</td><td className="border p-1">Stipend</td></tr>
                <tr><td className="border p-1">System Integration</td><td className="border p-1">1M</td><td className="border p-1">Stipend</td></tr>
                <tr><td className="border p-1">Client Project</td><td className="border p-1">1M</td><td className="border p-1">Paid</td></tr>
              </tbody>
            </table>
          </div>
          {/* Photography & Graphic Design Interns */}
          <div className="bg-white rounded-xl shadow-md p-6">
            <h3 className="font-semibold text-blue-700 text-xl mb-2">Photography & Graphic Design Interns</h3>
            <ul className="list-disc ml-6 text-gray-700 mb-2">
              <li>Studio & client shoots, editing, design</li>
              <li>Branding, campaigns, portfolio</li>
              <li>Stipend & paid phases</li>
            </ul>
            <table className="w-full text-sm mt-2 border">
              <thead>
                <tr className="bg-blue-50">
                  <th className="p-1 border">Phase</th>
                  <th className="p-1 border">Duration</th>
                  <th className="p-1 border">Compensation</th>
                </tr>
              </thead>
              <tbody>
                <tr><td className="border p-1">Orientation</td><td className="border p-1">1M</td><td className="border p-1">Unpaid</td></tr>
                <tr><td className="border p-1">Workshops</td><td className="border p-1">1M</td><td className="border p-1">Unpaid</td></tr>
                <tr><td className="border p-1">Demo Project</td><td className="border p-1">2–4M</td><td className="border p-1">Stipend</td></tr>
                <tr><td className="border p-1">Asset Management</td><td className="border p-1">1M</td><td className="border p-1">Stipend</td></tr>
                <tr><td className="border p-1">Client Project</td><td className="border p-1">1M</td><td className="border p-1">Paid</td></tr>
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* What You'll Gain */}
      <section className="max-w-4xl mx-auto mt-20 px-4">
        <h2 className="text-2xl font-bold text-blue-800 mb-4">🎯 What You’ll Gain</h2>
        <ul className="list-disc ml-8 text-gray-700 space-y-1">
          <li><b>Technical Mastery:</b> From modern web frameworks to embedded electronics and creative suites.</li>
          <li><b>Mentorship:</b> One-on-one guidance from senior engineers and creative directors.</li>
          <li><b>Real-World Experience:</b> Contribute to live client projects and build a portfolio of billable work.</li>
          <li><b>Professional Growth:</b> Agile team practice, code reviews, safety protocols, and client communications.</li>
        </ul>
      </section>

      {/* University Partnerships */}
      <section className="max-w-4xl mx-auto mt-16 px-4">
        <h2 className="text-2xl font-bold text-blue-800 mb-4">🏫 University Partnerships</h2>
        <ul className="list-disc ml-8 text-gray-700 space-y-1">
          <li><b>Curriculum Alignment:</b> We tailor modules to reinforce academic coursework.</li>
          <li><b>Talent Pipeline:</b> Early access to top interns for recruitment.</li>
          <li><b>Networking Opportunities:</b> Connect students with industry leaders and global clients.</li>
        </ul>
      </section>

      {/* Certificate & Recognition */}
      <section className="max-w-4xl mx-auto mt-16 px-4">
        <h2 className="text-2xl font-bold text-blue-800 mb-4">📜 Certificate & Recognition</h2>
        <ul className="list-disc ml-8 text-gray-700 space-y-1">
          <li>Official DETZ Global Certificate</li>
          <li>Project Evaluation Report</li>
          <li>Letter of Recommendation (top performers)</li>
          <li>LinkedIn Endorsement</li>
        </ul>
      </section>

      {/* Contact & Support */}
      <footer className="bg-gradient-to-br from-blue-900 to-blue-800 text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-3 gap-12">
            <div>
              <div className="flex items-center gap-3 mb-6">
                <img src="/logo192.png" alt="DETZ Global Logo" className="h-10 w-10 rounded-full" />
                <span className="text-2xl font-bold tracking-wide">DETZ Global</span>
              </div>
              <p className="text-blue-100 leading-relaxed">
                Empowering the next generation of technologists through innovation, mentorship, and real-world projects.
              </p>
            </div>
            
            <div>
              <h3 className="text-xl font-semibold mb-4">Contact Us</h3>
              <div className="space-y-3">
                <div className="flex items-start space-x-3">
                  <svg className="w-5 h-5 text-blue-300 mt-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  <p className="text-blue-100">141 Waragoda Road, Peliyagoda,<br/>Colombo, Sri Lanka</p>
                </div>
                <div className="flex items-center space-x-3">
                  <svg className="w-5 h-5 text-blue-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                  </svg>
                  <a href="tel:+94713979029" className="text-blue-100 hover:text-white transition">+94 713 979 029</a>
                </div>
                <div className="flex items-center space-x-3">
                  <svg className="w-5 h-5 text-blue-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                  <a href="mailto:info@detzglobal.com" className="text-blue-100 hover:text-white transition">info@detzglobal.com</a>
                </div>
              </div>
            </div>
            
            <div>
              <h3 className="text-xl font-semibold mb-4">Connect With Us</h3>
              <div className="flex space-x-4">
                <a href="#" className="w-10 h-10 bg-white/10 rounded-full flex items-center justify-center hover:bg-white/20 transition">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"/>
                  </svg>
                </a>
                <a href="#" className="w-10 h-10 bg-white/10 rounded-full flex items-center justify-center hover:bg-white/20 transition">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M24 4.557c-.883.392-1.832.656-2.828.775 1.017-.609 1.798-1.574 2.165-2.724-.951.564-2.005.974-3.127 1.195-.897-.957-2.178-1.555-3.594-1.555-3.179 0-5.515 2.966-4.797 6.045-4.091-.205-7.719-2.165-10.148-5.144-1.29 2.213-.669 5.108 1.523 6.574-.806-.026-1.566-.247-2.229-.616-.054 2.281 1.581 4.415 3.949 4.89-.693.188-1.452.232-2.224.084.626 1.956 2.444 3.379 4.6 3.419-2.07 1.623-4.678 2.348-7.29 2.04 2.179 1.397 4.768 2.212 7.548 2.212 9.142 0 14.307-7.721 13.995-14.646.962-.695 1.797-1.562 2.457-2.549z"/>
                  </svg>
                </a>
                <a href="#" className="w-10 h-10 bg-white/10 rounded-full flex items-center justify-center hover:bg-white/20 transition">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
                  </svg>
                </a>
              </div>
            </div>
          </div>
          
          <div className="mt-12 pt-8 border-t border-blue-800/50 text-center">
            <p className="text-blue-200">© {new Date().getFullYear()} DETZ Global PVT LTD. All rights reserved.</p>
          </div>
        </div>
      </footer>

      {/* Login Modal */}
      {showLogin && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md relative transform transition-all">
            <button
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
              onClick={() => setShowLogin(false)}
              aria-label="Close"
              type="button"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            
            <div className="text-center mb-8">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full mb-4">
                <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.121 17.804A13.937 13.937 0 0112 16c2.5 0 4.847.655 6.879 1.804M15 10a3 3 0 11-6 0 3 3 0 016 0zm6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h2 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-blue-800 text-transparent bg-clip-text">Welcome Back</h2>
              <p className="text-gray-600 mt-1">Log in to access your DETZ Global account</p>
            </div>
            
            <form onSubmit={handleLogin} className="space-y-6">
              <div>
                <label className="block text-gray-700 text-sm font-medium mb-2" htmlFor="login-email">Email Address</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" />
                    </svg>
                  </div>
                  <input
                    id="login-email"
                    type="email"
                    className="block w-full pl-10 pr-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    required
                    autoFocus
                    placeholder="Enter your email"
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-gray-700 text-sm font-medium mb-2" htmlFor="login-password">Password</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                  </div>
                  <input
                    id="login-password"
                    type="password"
                    className="block w-full pl-10 pr-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    required
                    placeholder="Enter your password"
                  />
                </div>
              </div>
              
              {loginError && (
                <div className="bg-red-50 text-red-600 rounded-lg p-4 flex items-center">
                  <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span className="text-sm">{loginError}</span>
                </div>
              )}
              
              <button
                type="submit"
                className="w-full bg-gradient-to-r from-blue-600 to-blue-800 text-white py-3 rounded-lg font-semibold hover:from-blue-700 hover:to-blue-900 transition-all duration-300 transform hover:-translate-y-0.5 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                disabled={loginLoading}
              >
                {loginLoading ? (
                  <div className="flex items-center justify-center">
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Logging in...
                  </div>
                ) : (
                  "Log In"
                )}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default LandingPage;