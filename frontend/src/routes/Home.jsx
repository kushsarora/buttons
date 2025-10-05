import "../styles/Home.css";
import logo1 from "../assets/logo1.png";
import logo2 from "../assets/logo2.png";
import logo3 from "../assets/logo3.png";
import logo4 from "../assets/logo4.png";
import { useNavigate } from "react-router-dom";

export default function Home() {
  const navigate = useNavigate();

  const handleLogin = (e) => {
    e.preventDefault();
    navigate("/login");
  };

  return (
    <div className="homepage">

      {/* Navbar */}
      <nav className="navbar">
        <div className="navbar-logo">BUTTONS</div>
        <ul className="navbar-links">
          <li><a href="#about">About</a></li>
          <li>
            <a href="/login" className="signup-btn" onClick={handleLogin}>
              Sign In with Google
            </a>
          </li>
        </ul>
      </nav>

      {/* Hero */}
      <section className="hero">
        <div className="hero-content">
          <span className="hero-badge">AI-Powered Scheduling</span>
          <h1>
            Upgrade Your <span className="highlight">Learning</span> Experience
          </h1>
          <p>
            Smarter tools for managing your syllabus, scheduling your study time,
            and staying on top of deadlines — powered by AI.
          </p>
          <div className="hero-buttons">
            <a href="/login" className="btn btn-pink" onClick={handleLogin}>
              Sign Up
            </a>
            <a href="#about" className="btn btn-green">Learn More</a>
          </div>
        </div>
      </section>

      {/* Logos */}
      <section className="logos">
        <p className="logos-text">Featured On</p>
        <div className="logos-container">
          <img src={logo1} alt="Logo 1" />
          <img src={logo2} alt="Logo 2" />
          <img src={logo3} alt="Logo 3" />
          <img src={logo4} alt="Logo 4" />
        </div>
      </section>

      {/* Content 1 */}
      <section className="content-section content-green">
        <div className="content-container">
          <div className="content-image">
            <img src="/placeholder-feature.png" alt="AI Scheduling" />
          </div>
          <div className="content-text">
            <h2>Smarter AI Scheduling</h2>
            <p>
              Never miss a deadline again. Our AI automatically creates
              personalized study schedules, adapts to changes, and keeps you
              ahead of your coursework.
            </p>
          </div>
        </div>
      </section>

      {/* Content 2 */}
      <section className="content-section content-pink">
        <div className="content-container reverse">
          <div className="content-image">
            <img src="/placeholder-feature.png" alt="Progress Tracking" />
          </div>
          <div className="content-text">
            <h2>Track Your Progress</h2>
            <p>
              Get clear insights into your study habits with real-time analytics,
              progress charts, and feedback that helps you improve consistently.
            </p>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="testimonials">
        <h2>What Our Users Say</h2>
        <div className="testimonial-cards">
          <div className="testimonial-card">
            <p>"This app is so cool!"</p>
            <span>- Jennie Cho</span>
          </div>
          <div className="testimonial-card">
            <p>"This app saved my grade!"</p>
            <span>- Kush Arora</span>
          </div>
        </div>
      </section>

      {/* Call to Action */}
      <section className="cta">
        <h2>Ready to Upgrade Your Learning?</h2>
        <p>Join thousands of students already using BUTTONS to stay on top of their studies.</p>
        <button className="btn btn-pink" onClick={handleLogin}>
          Get Started Free
        </button>
      </section>

    </div>
  );
}
