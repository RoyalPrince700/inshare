# InstantShare Web

A lightweight, real-time file-sharing website that allows users to instantly transfer screenshots, images, and documents (up to 5MB) between their phone and PC without requiring logins, apps, or external cloud storage.

## ✨ Features

- **Instant Pasting** – Take a screenshot on your phone, paste (Ctrl+V) into the browser, and it appears instantly on your PC (and vice versa)
- **Drag & Drop Support** – Easily upload files from either device
- **Bi-Directional Sync** – Send files from phone → PC or PC → phone in real time
- **No Storage** – Files are temporarily held in memory (not saved permanently)
- **Short-Link Access** – Easy-to-remember URLs for quick sharing
- **5MB File Limit** – Optimized for quick sharing of screenshots and small documents
- **Mobile-Friendly** – Works perfectly on both desktop and mobile devices

## 🚀 How It Works

1. Open the website on both devices (phone & PC)
2. Paste a screenshot (phone) or drag & drop a file (PC)
3. The file instantly appears on the other device for viewing/downloading
4. Files expire when the session ends (no permanent storage)

## 🛠️ Tech Stack

- **Frontend**: React + TypeScript + Vite
- **Backend**: Node.js + Express
- **Deployment**: Vercel (Frontend) + Render/Railway (Backend)

## 📁 Project Structure

```
/share
├── client/          # React frontend
│   ├── src/
│   │   ├── App.tsx  # Main component
│   │   └── App.css  # Styles
│   └── package.json
├── server/          # Node.js backend
│   ├── index.js     # Express server
│   └── package.json
└── README.md
```

## 🚀 Quick Start

### Local Development

1. **Start the backend server:**
   ```bash
   cd server
   npm install
   npm start
   ```

2. **Start the frontend:**
   ```bash
   cd client
   npm install
   npm run dev
   ```

3. **Open your browser:**
   - Frontend: http://localhost:5173
   - Backend: http://localhost:3001

### Deployment

#### Frontend (Vercel)
1. Push code to GitHub
2. Go to [vercel.com](https://vercel.com)
3. Import your repository
4. Set root directory to `client`
5. Deploy!

#### Backend (Render/Railway)
1. Go to [render.com](https://render.com) or [railway.app](https://railway.app)
2. Create new Web Service
3. Connect your repository
4. Set root directory to `server`
5. Set build command: `npm install`
6. Set start command: `node index.js`
7. Deploy!

## 📱 Usage

1. **Create a session**: Visit the website to get a unique session link
2. **Share the link**: Copy and share the session URL with your other device
3. **Upload files**: 
   - Drag & drop files onto the dropzone
   - Paste files (Ctrl+V) from clipboard
   - Click the dropzone to select files
4. **Download files**: Click the download button next to any file
5. **Real-time sync**: Files appear on all connected devices within 3 seconds

## 🔧 API Endpoints

- `GET /api/session` - Create new session
- `GET /api/session/:sessionId` - Get session files
- `POST /api/session/:sessionId/upload` - Upload file
- `GET /api/session/:sessionId/file/:fileId` - Download file

## 🎯 Use Cases

- Quickly transfer screenshots during work
- Share small documents (PDF, DOCX) without email/cloud delays
- Replace Bluetooth/USB transfers with a faster, wireless solution
- Temporary file sharing between personal devices

## ⚠️ Limitations

- Max file size: 5MB (to ensure speed)
- Requires both devices to be online simultaneously
- No long-term file storage (purely for instant transfer)
- Files are stored in memory and lost when server restarts

## 🤝 Contributing

Feel free to submit issues and enhancement requests!

## 📄 License

MIT License - feel free to use this project for your own needs. 