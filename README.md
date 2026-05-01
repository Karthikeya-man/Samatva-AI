# Samatva AI \ud83d\udee1\ufe0f

**Samatva AI** is an enterprise-grade platform for real-time algorithmic bias monitoring, regulatory compliance auditing, and multi-agent governance. It helps organizations detect bias in AI model predictions and automatically generates ethical analysis reports using Google's Gemini AI to ensure compliance with frameworks like the EU AI Act and EEOC.

## \u2728 Features

*   **Real-time Bias Detection:** Upload a CSV of your model's predictions to instantly calculate mathematical fairness scores and demographic disparities.
*   **Gemini AI Ethicist:** Leverages the power of `gemini-2.5-flash` to automatically generate contextual, professional ethical analyses and compliance reports based on your data.
*   **Secure Authentication:** User accounts secured with JWT and bcrypt password hashing.
*   **Audit History:** Persistent storage of past audits via SQLite, allowing users to review their compliance history at any time.
*   **Modern Dashboard:** A beautiful, dark-themed glassmorphism UI built with React and Tailwind CSS.

## \ud83d\udee0\ufe0f Tech Stack

*   **Frontend:** React, Vite, Tailwind CSS, Recharts, Lucide React
*   **Backend:** Node.js, Express.js, Google Generative AI SDK
*   **Database:** SQLite (`better-sqlite3`)
*   **Security:** Helmet, Express-Rate-Limit, Express-Validator, CORS

---

## \ud83d\ude80 Getting Started

Follow these steps to run Samatva AI on your local machine.

### 1. Prerequisites
*   [Node.js](https://nodejs.org/) (v18 or higher recommended)
*   A Google Gemini API Key. You can get one from [Google AI Studio](https://aistudio.google.com/).

### 2. Environment Setup
In the root directory of the project (`Samatva-app`), create a file named `.env` and add the following keys:

```env
VITE_GEMINI_API_KEY=your_google_gemini_api_key_here
PORT=5000
JWT_SECRET=your_super_secret_jwt_key_here
```

### 3. Run the Backend Server
The backend handles authentication, database connections, and Gemini AI requests.

```bash
cd server
npm install
npm start
```
*The backend should now be running on `http://localhost:5000`*

### 4. Run the Frontend App
Open a **new terminal window** and start the Vite frontend.

```bash
cd Samatva-app
npm install
npm run dev
```
*The frontend should now be running on `http://localhost:5173`. Open this link in your browser to view the application.*

---

## \ud83d\udd12 Security Notes
The backend is equipped with rate limiting, cross-origin resource policy enforcement, and payload compression. Ensure that your `.env` file is never committed to a public repository.

## \ud83d\udce6 Deployment Strategy
*   **Frontend:** Easily deployable as static files on platforms like **Vercel** or **Netlify**.
*   **Backend:** Must be deployed on a platform that supports persistent disk volumes (like **Render.com**, **Railway**, or **DigitalOcean**) because it relies on a local SQLite database file (`samatva.db`). Serverless functions (like Vercel functions) are not suitable for the backend.
