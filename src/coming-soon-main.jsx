import React from 'react';
import ReactDOM from 'react-dom/client';
import '@fontsource/cormorant-garamond/latin-400.css';
import '@fontsource/manrope/latin-400.css';
import '@fontsource/manrope/latin-500.css';
import './coming-soon.css';

const asset = (path) => `${import.meta.env.BASE_URL}${path}`;

function ComingSoon() {
  return (
    <main className="coming-soon" aria-labelledby="coming-soon-title">
      <div className="coming-soon-background" aria-hidden="true" />
      <div className="coming-soon-decorations" aria-hidden="true">
        <img className="pomegranate pomegranate-left" src={asset('media/daya-pomegranate-left.png')} alt="" fetchPriority="high" />
        <img className="pomegranate pomegranate-right" src={asset('media/daya-pomegranate-right.png')} alt="" fetchPriority="high" />
      </div>

      <header className="coming-soon-header">
        <a className="coming-soon-brand" href={import.meta.env.BASE_URL} aria-label="DAYA home">
          <img src={asset('media/daya-wordmark.png')} alt="DAYA" />
        </a>
        <span className="coming-soon-location">Ibiza · 38°59′N</span>
      </header>

      <section className="coming-soon-hero" aria-labelledby="coming-soon-title">
        <h1 id="coming-soon-title"><span>Coming</span><span>Soon</span></h1>
      </section>

      <footer className="coming-soon-footer">
        <p className="coming-soon-signature">Persian soul.<br />Modern expression.</p>
        <div className="coming-soon-connect">
          <span className="coming-soon-eyebrow">Until then, stay close</span>
          <nav aria-label="Get in touch">
            <a href="https://www.instagram.com/dayaibiza/" target="_blank" rel="noopener noreferrer">Instagram</a>
            <a href="mailto:hello@dayaibiza.com">Get in touch</a>
          </nav>
        </div>
        <p className="coming-soon-copyright">© {new Date().getFullYear()} DAYA Ibiza</p>
      </footer>
    </main>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode><ComingSoon /></React.StrictMode>,
);
