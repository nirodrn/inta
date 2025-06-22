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
    <div className="bg-gradient-to-br from-blue-50 to-white min-h-screen">
      {/* Header */}
      <header className="flex justify-between items-center px-8 py-6 bg-white/80 shadow-md">
        <div className="flex items-center gap-3">
          <img src="/logo192.png" alt="DETZ Global Logo" className="h-10 w-10 rounded-full" />
          <span className="text-2xl font-bold text-blue-900 tracking-wide">DETZ Global</span>
        </div>
        <button
          onClick={() => setShowLogin(true)}
          className="px-6 py-2 bg-blue-700 text-white rounded-lg font-semibold hover:bg-blue-800 transition"
        >
          Login
        </button>
      </header>

      {/* Hero Section */}
      <section className="max-w-5xl mx-auto mt-16 text-center">
        <h1 className="text-4xl md:text-5xl font-extrabold text-blue-900 mb-4">
          Empowering the Next Generation of Technologists
        </h1>
        <p className="text-lg md:text-xl text-gray-700 mb-8">
          DETZ Global PVT LTD is a multidisciplinary engineering and creative studio headquartered in Colombo, Sri Lanka, with projects across Europe, North America, and the Middle East.
        </p>
        <div className="flex flex-wrap justify-center gap-6 mb-10">
          <div className="bg-white shadow-lg rounded-xl p-6 w-64">
            <h3 className="font-bold text-blue-700 mb-2">DETZ Software</h3>
            <p className="text-gray-600 text-sm">Full-stack & cloud-native application development</p>
          </div>
          <div className="bg-white shadow-lg rounded-xl p-6 w-64">
            <h3 className="font-bold text-blue-700 mb-2">DETZ Technologies</h3>
            <p className="text-gray-600 text-sm">IoT, AI/ML research and systems integration</p>
          </div>
          <div className="bg-white shadow-lg rounded-xl p-6 w-64">
            <h3 className="font-bold text-blue-700 mb-2">DETZ Studios</h3>
            <p className="text-gray-600 text-sm">Photography, videography, graphic design & content production</p>
          </div>
        </div>
        <p className="text-md text-gray-700 max-w-2xl mx-auto">
          Our mission is to empower the next generation of technologists through innovation, mentorship, and real-world client projects.
        </p>
      </section>

      {/* Internship Streams */}
      <section className="max-w-6xl mx-auto mt-20 px-4">
        <h2 className="text-3xl font-bold text-blue-800 mb-8 text-center">🎓 Internship Streams & Program Phases</h2>
        <div className="grid md:grid-cols-2 gap-10">
          {/* Software Engineering Intern – Web */}
          <div className="bg-white rounded-xl shadow-md p-6">
            <h3 className="font-semibold text-blue-700 text-xl mb-2">Software Engineering Intern – Web</h3>
            <ul className="list-disc ml-6 text-gray-700 mb-2">
              <li>Modern web apps: UI to backend, live client sites</li>
              <li>Agile, Git/GitHub, Node.js, React, Docker</li>
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
                <tr><td className="border p-1">DB & Live Project</td><td className="border p-1">1M</td><td className="border p-1">Stipend</td></tr>
                <tr><td className="border p-1">Client Project</td><td className="border p-1">1M</td><td className="border p-1">Paid</td></tr>
              </tbody>
            </table>
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
      <footer className="bg-blue-900 text-white mt-20 py-8">
        <div className="max-w-4xl mx-auto px-4">
          <h2 className="text-xl font-bold mb-2">📞 Contact & Support</h2>
          <p>Address: 141 Waragoda Road, Peliyagoda, Colombo, Sri Lanka</p>
          <p>Hotline: <a href="tel:+94713979029" className="underline">+94 713 979 029</a></p>
          <p>Email: <a href="mailto:info@detzglobal.com" className="underline">info@detzglobal.com</a></p>
          <div className="mt-4 text-sm text-blue-100">© {new Date().getFullYear()} DETZ Global PVT LTD. All rights reserved.</div>
        </div>
      </footer>

      {/* Login Modal */}
      {showLogin && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-lg p-8 w-full max-w-sm relative">
            <button
              className="absolute top-2 right-2 text-gray-400 hover:text-gray-700 text-2xl"
              onClick={() => setShowLogin(false)}
              aria-label="Close"
              type="button"
            >
              &times;
            </button>
            <h2 className="text-xl font-bold text-blue-800 mb-4 text-center">Login to DETZ Global</h2>
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="block text-gray-700 mb-1" htmlFor="login-email">Email</label>
                <input
                  id="login-email"
                  type="email"
                  className="w-full border rounded px-3 py-2"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  required
                  autoFocus
                />
              </div>
              <div>
                <label className="block text-gray-700 mb-1" htmlFor="login-password">Password</label>
                <input
                  id="login-password"
                  type="password"
                  className="w-full border rounded px-3 py-2"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                />
              </div>
              {loginError && <div className="text-red-600 text-sm">{loginError}</div>}
              <button
                type="submit"
                className="w-full bg-blue-700 text-white py-2 rounded font-semibold hover:bg-blue-800 transition"
                disabled={loginLoading}
              >
                {loginLoading ? "Logging in..." : "Login"}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default LandingPage;