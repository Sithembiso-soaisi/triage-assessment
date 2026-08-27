import { Link } from 'react-router-dom';
import NotificationBell from './NotificationBell';
import './Header.css';

function Header() {
  return (
    <header className="app-header">
      <div className="header-content">
        <Link to="/tickets" className="header-logo">
          <span className="logo-icon">🎫</span>
          <span className="logo-text">Triage</span>
        </Link>

        <nav className="header-nav">
          <Link to="/tickets" className="nav-link active">Tickets</Link>
          <Link to="/analytics" className="nav-link">Analytics</Link>
        </nav>

        <div className="header-actions">
          <NotificationBell />
        </div>
      </div>
    </header>
  );
}

export default Header;