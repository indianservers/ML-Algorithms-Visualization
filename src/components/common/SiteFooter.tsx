import "./SiteFooter.css";

const indianServersUrl = "https://www.IndianServers.com";
const aimerSocietyUrl = "https://www.AimerSociety.com";

export function SiteFooter() {
  return (
    <footer className="site-footer" aria-label="Site credits">
      <div className="site-footer-credit">
        <span>
          Powered by{" "}
          <a href={indianServersUrl} target="_blank" rel="noopener noreferrer">
            Indian Servers Pvt Limited
          </a>{" "}
          &amp;{" "}
          <a href={aimerSocietyUrl} target="_blank" rel="noopener noreferrer">
            AIMER Society
          </a>
        </span>
        <small>Artificial Intelligence Medical and Engineering Researchers Society</small>
      </div>
      <nav className="site-footer-links" aria-label="Partner websites">
        <a href={indianServersUrl} target="_blank" rel="noopener noreferrer">
          www.IndianServers.com
        </a>
        <a href={aimerSocietyUrl} target="_blank" rel="noopener noreferrer">
          www.AimerSociety.com
        </a>
      </nav>
      <small className="site-footer-copyright">
        © {new Date().getFullYear()} Indian Servers Pvt Limited &amp; AIMER Society. All rights reserved.
      </small>
    </footer>
  );
}
