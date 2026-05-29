import { Link } from "react-router-dom";
import { useStore } from "../store.jsx";

export default function Footer() {
  const { data } = useStore();
  return (
    <footer className="site-footer">
      <div>
        <img src={data.brand.logo} alt="Phrazs" />
        <p>{data.brand.description}</p>
      </div>
      <nav aria-label="Footer navigation">
        <Link to="/explore">Explore</Link>
        <Link to="/hosts">Hosts</Link>
        <Link to="/blog">Blog</Link>
        <Link to="/about">About</Link>
        <Link to="/terms">Terms &amp; Refunds</Link>
      </nav>
      <p>Facebook · Twitter · LinkedIn</p>
    </footer>
  );
}
