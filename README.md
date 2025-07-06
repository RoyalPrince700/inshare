# InstantShare Web

A real-time, login-free, bi-directional file sharing app for screenshots and documents (up to 5MB) between phone and PC, with no permanent storage and easy session links.

## Features

- 🚀 **Real-time file sharing** - Instant file transfer between devices
- 📱 **Mobile-friendly** - Works seamlessly on phones and PCs
- 🔗 **Session-based** - Join with a simple 4-digit code
- 📋 **Multiple input methods** - Drag & drop, file picker, clipboard paste
- 🖼️ **Image preview** - See images before copying
- 📋 **Copy to clipboard** - One-click copy for images
- 🎯 **No login required** - Start sharing immediately
- 💾 **No permanent storage** - Files are temporary and secure

## Quick Start

### Prerequisites
- Node.js (v16 or higher)
- npm

### Installation

1. **Clone the repository**
   ```bash
   git clone <your-repo-url>
   cd share
   ```

2. **Install all dependencies**
   ```bash
   npm run install:all
   ```

### Development

**Run both frontend and backend in development mode:**
```bash
npm run dev
```

This will start:
- Frontend: http://localhost:5173
- Backend: http://localhost:3000

### Production

**Build and start the production version:**
```bash
npm run build
npm start
```

### Individual Commands

- **Frontend only:** `npm run dev:client`
- **Backend only:** `npm run dev:server`
- **Build frontend:** `npm run build`

## How to Use

1. **Create a session** - Click "Create Session" to get a 4-digit code
2. **Join from another device** - Enter the same code on your phone/PC
3. **Share files** - Drag & drop, paste from clipboard, or use the file picker
4. **View and copy** - See image previews and copy files to clipboard

## Tech Stack

- **Frontend:** React + TypeScript + Vite
- **Backend:** Node.js + Express
- **Deployment:** Vercel (frontend) + Render (backend)

## Project Structure

```
share/
├── client/          # React frontend
├── server/          # Node.js backend
├── package.json     # Root package with scripts
└── README.md        # This file
```

## Deployment

The app is deployed at:
- **Frontend:** https://your-app.vercel.app
- **Backend:** https://your-app.onrender.com

## License

ISC 