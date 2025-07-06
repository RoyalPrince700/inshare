import React, { useCallback, useEffect, useRef, useState } from 'react';
import './App.css';

const API_URL = window.location.hostname === 'localhost'
  ? 'http://localhost:3001/api'
  : `/api`;

function generateClientId() {
  return Math.random().toString(36).substring(2, 10);
}

interface FileMeta {
  id: string;
  name: string;
  type: string;
  size: number;
  uploadedBy: string;
  uploadedAt: number;
  data?: string; // base64
}

function App() {
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [clientId] = useState(generateClientId());
  const [files, setFiles] = useState<FileMeta[]>([]);
  const [status, setStatus] = useState<string>('');
  const [error, setError] = useState<string>('');
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Create or join session
  useEffect(() => {
    let id = window.location.pathname.replace(/\//g, '');
    if (!id) {
      fetch(`${API_URL}/session`).then(res => res.json()).then(data => {
        setSessionId(data.sessionId);
        window.history.replaceState({}, '', `/${data.sessionId}`);
      });
    } else {
      setSessionId(id);
    }
  }, []);

  // Poll for new files every 3 seconds
  useEffect(() => {
    if (!sessionId) return;
    
    let isMounted = true;
    let timeoutId: NodeJS.Timeout;
    
    const pollFiles = async () => {
      if (!isMounted) return;
      
      try {
        const response = await fetch(`${API_URL}/session/${sessionId}`);
        if (response.ok) {
          const data = await response.json();
          if (isMounted) {
            setFiles(data.files || []);
            setStatus('Connected');
          }
        } else {
          if (isMounted) {
            setStatus('Error');
          }
        }
      } catch (err) {
        if (isMounted) {
          setStatus('Error');
        }
      }
      
      // Schedule next poll only if still mounted
      if (isMounted) {
        timeoutId = setTimeout(pollFiles, 3000);
      }
    };

    // Start polling
    pollFiles();
    
    // Cleanup function
    return () => {
      isMounted = false;
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };
  }, [sessionId]);

  // Handle file upload
  const handleFiles = useCallback(async (fileList: FileList) => {
    if (!sessionId) return;
    
    setIsUploading(true);
    setError('');
    
    try {
      for (const file of Array.from(fileList)) {
        if (file.size > 5 * 1024 * 1024) {
          setError('File exceeds 5MB limit');
          setTimeout(() => setError(''), 3000);
          continue;
        }
        
        const reader = new FileReader();
        const fileData = await new Promise<string>((resolve) => {
          reader.onload = () => resolve(reader.result as string);
          reader.readAsDataURL(file);
        });
        
        const response = await fetch(`${API_URL}/session/${sessionId}/upload`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            fileName: file.name,
            fileType: file.type,
            fileSize: file.size,
            fileData,
            clientId
          })
        });
        
        if (!response.ok) {
          const errorData = await response.json();
          setError(errorData.error || 'Upload failed');
          setTimeout(() => setError(''), 3000);
        }
      }
    } catch (err) {
      setError('Upload failed');
      setTimeout(() => setError(''), 3000);
    } finally {
      setIsUploading(false);
    }
  }, [sessionId, clientId]);

  // Drag & drop
  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files) {
      handleFiles(e.dataTransfer.files);
    }
  }, [handleFiles]);

  // Paste
  useEffect(() => {
    const onPaste = (e: ClipboardEvent) => {
      if (e.clipboardData?.files?.length) {
        handleFiles(e.clipboardData.files);
      }
    };
    window.addEventListener('paste', onPaste);
    return () => window.removeEventListener('paste', onPaste);
  }, [handleFiles]);

  // Copy session link
  const copyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    setStatus('Link copied!');
    setTimeout(() => setStatus('Connected'), 1000);
  };

  // Download file
  const downloadFile = async (fileId: string, fileName: string) => {
    try {
      const response = await fetch(`${API_URL}/session/${sessionId}/file/${fileId}`);
      if (response.ok) {
        const data = await response.json();
        const link = document.createElement('a');
        link.href = data.file.data;
        link.download = fileName;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }
    } catch (err) {
      setError('Download failed');
      setTimeout(() => setError(''), 3000);
    }
  };

  return (
    <div className="instantshare-root">
      <header>
        <h1>InstantShare</h1>
        <div className="session-link">
          <span>Session:</span>
          <code>{window.location.href}</code>
          <button onClick={copyLink}>Copy</button>
        </div>
        <div className="status">{status}</div>
        {error && <div className="error">{error}</div>}
      </header>
      <main>
        <div
          className={`dropzone ${isUploading ? 'uploading' : ''}`}
          onDrop={onDrop}
          onDragOver={e => e.preventDefault()}
          onClick={() => fileInputRef.current?.click()}
        >
          <input
            type="file"
            multiple
            style={{ display: 'none' }}
            ref={fileInputRef}
            onChange={e => e.target.files && handleFiles(e.target.files)}
          />
          <div>
            {isUploading ? 'Uploading...' : 'Drag & drop or paste files here'}
          </div>
          <div className="hint">(Max 5MB, updates every 3s)</div>
        </div>
        <ul className="file-list">
          {files.map(file => (
            <li key={file.id}>
              <span>{file.name}</span>
              <span className="filesize">{(file.size/1024).toFixed(1)} KB</span>
              <button
                onClick={() => downloadFile(file.id, file.name)}
                className="download-btn"
              >
                Download
              </button>
            </li>
          ))}
        </ul>
      </main>
      <footer>
        <div>Open this link on your phone or PC to sync files.</div>
      </footer>
    </div>
  );
}

export default App;
