# Industrial Times Media Platform

This is a fully responsive media platform inspired by "The Industrial", built with React, Bootstrap, and Node.js. It features a premium dark slate and industrial amber theme that compliments the white logo.

## Project Structure

- `frontend/`: React application powered by Vite, styled with custom CSS and React-Bootstrap.
- `backend/`: Node.js and Express application providing mock REST API endpoints for the articles.

## Prerequisites

- [Node.js](https://nodejs.org/) (v16 or higher recommended)
- npm or yarn

## Installation & Setup

1. **Clone the repository or navigate to the project directory:**
   ```bash
   cd "Medieawebsites"
   ```

2. **Backend Setup:**
   Open a new terminal window/tab:
   ```bash
   cd backend
   npm install
   node server.js
   ```
   The backend will start running on `http://localhost:5000`.

3. **Frontend Setup:**
   Open another terminal window/tab:
   ```bash
   cd frontend
   npm install
   npm run dev
   ```
   The frontend will start on the default Vite port (usually `http://localhost:5173`).

## Usage

- Once both servers are running, open the provided frontend URL (e.g., `http://localhost:5173`) in your web browser.
- The platform should display the latest articles, trending news, and category links.

## Technologies Used

- **Frontend:** React, React Router, React-Bootstrap, Vite, CSS.
- **Backend:** Node.js, Express, CORS.
