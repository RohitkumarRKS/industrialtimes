import React from 'react';
import { Link } from 'react-router-dom';

const BreakingNewsTicker = ({ news }) => {
  if (!news || news.length === 0) return null;

  return (
    <div className="ticker-wrap">
      <div className="ticker-heading">
        <i className="bi bi-lightning-charge-fill me-1 text-warning"></i> BREAKING
      </div>
      <div className="ticker-move">
        {news.map((item, index) => (
          <div className="ticker-item" key={index}>
            <Link to={`/article/${item.id}`}>{item.title}</Link>
            {index < news.length - 1 && <span className="ms-4 text-white-50">|</span>}
          </div>
        ))}
      </div>
    </div>
  );
};

export default BreakingNewsTicker;
