# Buttons Project

This repository contains a full-stack application with a Python backend and a React frontend.

## Structure

- `backend/` - Python backend (Flask or FastAPI recommended)
  - `app.py` - Main application entry point
  - `db/` - Database models and base classes
  - `routes/` - API route definitions
  - `services/` - Service layer (AI parser, business logic)
  - `buttons.db` - SQLite database file

- `frontend/` - React frontend (Vite)
  - `src/` - Source code
    - `routes/` - React route components
    - `styles/` - CSS files
    - `assets/` - Images and static assets
  - `index.html` - Main HTML file
  - `package.json` - Frontend dependencies

## Getting Started

### Backend
1. Create a Python virtual environment:
   ```bash
   python3 -m venv venv
   source venv/bin/activate
   ```
2. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```
3. Run the backend:
   ```bash
   python backend/app.py
   ```

### Frontend
1. Install dependencies:
   ```bash
   cd frontend
   npm install
   ```
2. Start the development server:
   ```bash
   npm run dev
   ```

## Contributing
Pull requests are welcome. For major changes, please open an issue first to discuss what you would like to change.

## License
MIT
