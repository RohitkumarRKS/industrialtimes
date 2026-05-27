// Centralized API configuration
// In development: uses localhost:3000
// In production: uses relative URLs (same origin)
const API_BASE = import.meta.env.DEV ? 'http://localhost:3000' : '';

export default API_BASE;
