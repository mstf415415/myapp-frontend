import { Link } from 'react-router-dom';

function Navbar() {
  return (
    <nav className="navbar">
      <div className="logo">فروشگاه من</div>
      <div className="nav-links">
        <Link to="/" className="nav-item">صفحه اصلی</Link>
        <Link to="/register" className="nav-item">ثبت‌نام</Link>
      </div>
    </nav>
  );
}

export default Navbar;