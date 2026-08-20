import React, { useState, useRef } from 'react';
import API_BASE from '../config/api';

const getImageUrl = (img) => {
  if (!img) return null;
  if (img.startsWith('http')) return img;
  const normalizedPath = img.startsWith('/') ? img : `/${img}`;
  return `${API_BASE}${normalizedPath}`;
};

const getVideoUrl = (video) => {
  if (!video) return null;
  if (video.startsWith('http')) return video;
  const normalizedPath = video.startsWith('/') ? video : `/${video}`;
  return `${API_BASE}${normalizedPath}`;
};

const getYouTubeEmbedUrl = (url, autoplay = false) => {
  if (!url) return null;
  if (url.includes('youtube.com') || url.includes('youtu.be')) {
    let videoId = '';
    if (url.includes('youtu.be/')) {
      videoId = url.split('youtu.be/')[1]?.split('?')[0];
    } else if (url.includes('watch?v=')) {
      videoId = url.split('watch?v=')[1]?.split('&')[0];
    } else if (url.includes('embed/')) {
      videoId = url.split('embed/')[1]?.split('?')[0];
    }
    
    if (videoId) {
      const autoParam = autoplay 
        ? `autoplay=1&mute=1&controls=0&modestbranding=1&rel=0&iv_load_policy=3&disablekb=1&loop=1&playlist=${videoId}` 
        : `rel=0&modestbranding=1&iv_load_policy=3&playlist=${videoId}`;
      return `https://www.youtube.com/embed/${videoId}?${autoParam}`;
    }
  }
  return null;
};

const getYouTubeThumbnail = (url) => {
  if (!url) return null;
  let videoId = '';
  if (url.includes('youtu.be/')) {
    videoId = url.split('youtu.be/')[1]?.split('?')[0];
  } else if (url.includes('watch?v=')) {
    videoId = url.split('watch?v=')[1]?.split('&')[0];
  } else if (url.includes('embed/')) {
    videoId = url.split('embed/')[1]?.split('?')[0];
  }
  return videoId ? `https://img.youtube.com/vi/${videoId}/hqdefault.jpg` : null;
};

const VideoNewsThumbnail = ({ article, isFeatured = false, imgHeight = '160px', className = '', style = {} }) => {
  const videoRef = useRef(null);
  const [isHovered, setIsHovered] = useState(false);

  if (!article) return null;

  let articleImg = getImageUrl(article.image || article.imageUrl);
  if (!articleImg && article.videoUrl) {
    articleImg = getYouTubeThumbnail(article.videoUrl);
  }

  const videoPath = getVideoUrl(article.video);
  const youtubeEmbedUrl = article.videoUrl ? getYouTubeEmbedUrl(article.videoUrl, true) : null;
  const shouldPlayVideo = isFeatured || isHovered;

  return (
    <div
      className={`video-news-thumb position-relative overflow-hidden ${className}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{
        height: imgHeight,
        width: '100%',
        flexShrink: 0,
        backgroundColor: '#000',
        borderRadius: 'inherit',
        ...style
      }}
    >
      {/* 1. Direct Uploaded Video */}
      {videoPath && shouldPlayVideo ? (
        <video
          ref={videoRef}
          src={videoPath}
          autoPlay
          muted
          loop
          playsInline
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            pointerEvents: 'none'
          }}
        />
      ) : article.videoUrl && youtubeEmbedUrl && shouldPlayVideo ? (
        /* 2. YouTube Link Autoplay on Load (Only if featured or hovered) */
        <iframe
          src={youtubeEmbedUrl}
          title={article.title || "Video Preview"}
          loading="lazy"
          style={{
            width: '100%',
            height: '100%',
            border: 0,
            pointerEvents: 'none',
            transform: 'scale(1.15)'
          }}
          allow="autoplay; encrypted-media"
        />
      ) : articleImg ? (
        /* 3. Static Cover Image with Play Badge overlay if video exists */
        <div className="position-relative w-100 h-100">
          <img
            src={articleImg}
            alt={article.title || "News"}
            className="featured-news-img"
            loading="lazy"
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              transition: 'transform 0.3s ease'
            }}
          />
          {(article.video || article.videoUrl) && (
            <div
              className="position-absolute top-50 start-50 translate-middle rounded-circle d-flex align-items-center justify-content-center"
              style={{
                width: '42px',
                height: '42px',
                backgroundColor: 'rgba(218, 37, 29, 0.9)',
                boxShadow: '0 4px 12px rgba(0,0,0,0.4)',
                transition: 'transform 0.2s ease'
              }}
            >
              <i className="bi bi-play-fill text-white fs-4 ms-1"></i>
            </div>
          )}
        </div>
      ) : (
        /* 4. Placeholder */
        <div className="d-flex align-items-center justify-content-center h-100 bg-dark text-white-50">
          <i className="bi bi-play-btn fs-1"></i>
        </div>
      )}
    </div>
  );
};

export default VideoNewsThumbnail;
