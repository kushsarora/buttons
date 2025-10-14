import "../styles/Home.css";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Calendar, TrendingUp, Zap, Star, ArrowRight, Sparkles, BarChart3, Clock, CheckCircle, Target } from "lucide-react";

export default function Home() {
  const navigate = useNavigate();
  const [scrollY, setScrollY] = useState(0);

  useEffect(() => {
    const handleScroll = () => setScrollY(window.scrollY);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const handleLogin = (e) => {
    e.preventDefault();
    navigate("/login");
  };

  return (
    <div className="homepage">
      
      {/* Navbar */}
      <nav className={`navbar ${scrollY > 50 ? 'navbar-scrolled' : ''}`}>
        <div className="navbar-logo">
          <div className="logo-icon">
            <Sparkles className="logo-sparkle" />
          </div>
          <span>BUTTONS</span>
        </div>
        
        <ul className="navbar-links">
          <li><a href="#features">Features</a></li>
          <li><a href="#testimonials">Testimonials</a></li>
          <li>
            <a href="/login" className="signup-btn" onClick={handleLogin}>
              Sign In with Google
            </a>
          </li>
        </ul>
      </nav>

      {/* Hero */}
      <section className="hero">
        <div className="hero-blob hero-blob-1"></div>
        <div className="hero-blob hero-blob-2"></div>
        <div className="hero-blob hero-blob-3"></div>

        <div className="hero-content">
          <div className="hero-badge">
            <Zap className="badge-icon" />
            AI-Powered Scheduling
          </div>
          
          <h1>
            Upgrade Your <span className="highlight">Learning</span> Experience
          </h1>
          
          <p>
            Smarter tools for managing your syllabus, scheduling your study time,
            and staying on top of deadlines — powered by AI.
          </p>
          
          <div className="hero-buttons">
            <a href="/login" className="btn btn-pink" onClick={handleLogin}>
              Get Started Free
              <ArrowRight className="btn-icon" />
            </a>
            
            <a href="#features" className="btn btn-green">
              Explore Features
            </a>
          </div>

          {/* Feature Pills */}
          <div className="feature-pills">
            <div className="feature-pill">
              <CheckCircle className="pill-icon" />
              Smart AI
            </div>
            <div className="feature-pill">
              <Clock className="pill-icon" />
              Save Time
            </div>
            <div className="feature-pill">
              <Target className="pill-icon" />
              Hit Goals
            </div>
          </div>
        </div>
      </section>

      {/* Logos */}
      <section className="logos">
        <p className="logos-text">Featured On</p>
        <div className="logos-container">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="logo-placeholder">
              Logo {i}
            </div>
          ))}
        </div>
      </section>

      {/* Content 1 - AI Scheduling */}
      <section id="features" className="content-section content-white">
        <div className="content-container">
          <div className="content-image">
            <div className="image-placeholder image-pink">
              <Calendar className="placeholder-icon" />
              <div className="image-badge badge-green">AI Powered</div>
            </div>
          </div>
          
          <div className="content-text">
            <div className="content-badge badge-pink">
              <Sparkles className="badge-icon-small" />
              Smart Scheduling
            </div>
            
            <h2>Smarter AI Scheduling</h2>
            
            <p>
              Never miss a deadline again. Our AI automatically creates
              personalized study schedules, adapts to changes, and keeps you
              ahead of your coursework.
            </p>
            
            <div className="feature-list">
              <div className="feature-item">
                <CheckCircle className="feature-check check-green" />
                <span>Adaptive scheduling based on your habits</span>
              </div>
              <div className="feature-item">
                <CheckCircle className="feature-check check-green" />
                <span>Real-time deadline tracking</span>
              </div>
              <div className="feature-item">
                <CheckCircle className="feature-check check-green" />
                <span>Smart priority suggestions</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Content 2 - Progress Tracking */}
      <section className="content-section content-pink-bg">
        <div className="content-container reverse">
          <div className="content-image">
            <div className="image-placeholder image-green">
              <BarChart3 className="placeholder-icon" />
              <div className="image-badge badge-pink">Live Stats</div>
            </div>
          </div>
          
          <div className="content-text">
            <div className="content-badge badge-green">
              <TrendingUp className="badge-icon-small" />
              Analytics
            </div>
            
            <h2>Track Your Progress</h2>
            
            <p>
              Get clear insights into your study habits with real-time analytics,
              progress charts, and feedback that helps you improve consistently.
            </p>
            
            <div className="feature-list">
              <div className="feature-item">
                <CheckCircle className="feature-check check-pink" />
                <span>Visual progress dashboards</span>
              </div>
              <div className="feature-item">
                <CheckCircle className="feature-check check-pink" />
                <span>Study time analytics</span>
              </div>
              <div className="feature-item">
                <CheckCircle className="feature-check check-pink" />
                <span>Performance insights & tips</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section id="testimonials" className="testimonials">
        <div className="content-badge badge-pink centered">
          <Star className="badge-icon-small" />
          Student Success
        </div>
        
        <h2>What Our Users Say</h2>
        
        <div className="testimonial-cards">
          <div className="testimonial-card card-pink">
            <div className="card-glow glow-pink"></div>
            <Star className="testimonial-star star-pink" />
            <p>"This app is so cool!"</p>
            <div className="testimonial-author">
              <div className="author-avatar avatar-pink">J</div>
              <span>Jennie Cho</span>
            </div>
          </div>
          
          <div className="testimonial-card card-green">
            <div className="card-glow glow-green"></div>
            <Star className="testimonial-star star-green" />
            <p>"This app saved my grade!"</p>
            <div className="testimonial-author">
              <div className="author-avatar avatar-green">K</div>
              <span>Kush Arora</span>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="cta">
        <div className="cta-blob"></div>
        
        <div className="cta-content">
          <h2>Ready to Upgrade Your Learning?</h2>
          <p>Join thousands of students already using BUTTONS to stay on top of their studies.</p>
          <button className="btn btn-pink btn-large" onClick={handleLogin}>
            Get Started Free
            <ArrowRight className="btn-icon" />
          </button>
        </div>
      </section>

    </div>
  );
}