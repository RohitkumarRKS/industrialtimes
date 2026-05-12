import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Container, Spinner } from 'react-bootstrap';

const ExternalNews = () => {
  const [searchParams] = useSearchParams();
  const url = searchParams.get('url');
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    window.scrollTo(0, 0);
    if (!url) {
      navigate('/');
    }
  }, [url, navigate]);

  if (!url) return null;

  return (
    <div className="external-news-container d-flex flex-column" style={{ height: 'calc(100vh - 150px)', width: '100%' }}>
      <div className="bg-dark text-white p-2 d-flex justify-content-between align-items-center px-4">
        <div className="small fw-bold d-flex align-items-center gap-2">
          <Spinner animation="grow" size="sm" variant="danger" />
          <span>Live External Source</span>
        </div>
        <div>
          <a href={url} target="_blank" rel="noopener noreferrer" className="btn btn-outline-light btn-sm rounded-pill px-3">
            Open in Original Site <i className="bi bi-box-arrow-up-right ms-1"></i>
          </a>
        </div>
      </div>
      
      {loading && (
        <div className="flex-grow-1 d-flex justify-content-center align-items-center">
          <Spinner animation="border" style={{ color: 'var(--industrial-red)' }} />
        </div>
      )}
      
      <iframe 
        src={url} 
        title="External News Source"
        className="w-100 flex-grow-1 border-0"
        style={{ display: loading ? 'none' : 'block' }}
        onLoad={() => setLoading(false)}
        sandbox="allow-same-origin allow-scripts allow-popups allow-forms"
      />
    </div>
  );
};

export default ExternalNews;
