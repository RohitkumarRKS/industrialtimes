import React from 'react';
import { Card } from 'react-bootstrap';
import { Link } from 'react-router-dom';

const ArticleCard = ({ article }) => {
  return (
    <Card className="article-card mb-4">
      <div className="article-card-img-wrapper">
        <span className="article-category-badge">{article.category}</span>
        <Card.Img variant="top" src={article.imageUrl} className="article-card-img" />
      </div>
      <Card.Body className="article-card-body d-flex flex-column bg-slate">
        <Card.Title className="article-title">
          <Link to={`/article/${article.id}`} className="text-decoration-none">
            {article.title}
          </Link>
        </Card.Title>
        <Card.Text className="article-excerpt flex-grow-1">
          {article.excerpt}
        </Card.Text>
        <div className="text-muted small mt-2">
          <i className="bi bi-clock me-1"></i> {article.date}
        </div>
      </Card.Body>
    </Card>
  );
};

export default ArticleCard;
