import React, { useCallback, useEffect, useRef, useState } from 'react';
import './App.css';

const API_URL = window.location.hostname === 'localhost'
  ? 'http://localhost:3001/api'
  : 'https://inshare-backend-c9p8.onrender.com/api';

function generateClientId() {
  return Math.random().toString(36).substring(2, 10);
}

function generateRepeatedDigitCode() {
  const digit = Math.floor(Math.random() * 9) + 1; // 1-9
  return String(digit).repeat(4);
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
  const [showPrompt, setShowPrompt] = useState(false);
  const [showJoinInput, setShowJoinInput] = useState(false);
  const [inputCode, setInputCode] = useState('');
  const [createdCode, setCreatedCode] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const pasteInputRef = useRef<HTMLDivElement>(null);
  const [imageUrls, setImageUrls] = useState<{ [id: string]: string }>({});

  // On mount, check for session code in URL or prompt
  useEffect(() => {
    let id = window.location.pathname.replace(/\//g, '');
    if (!id) {
      setShowPrompt(true);
    } else {
      setSessionId(id);
    }
  }, []);

  // Handle create session
  const handleCreate = async () => {
    setError("");
    setStatus("Creating session...");
    let attempts = 0;
    while (attempts < 10) {
      const code = generateRepeatedDigitCode();
      try {
        const response = await fetch(`${API_URL}/session`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ sessionId: code })
        });
        if (response.ok) {
          setCreatedCode(code);
          setSessionId(code);
          window.history.replaceState({}, '', `/${code}`);
          setShowPrompt(false);
          setShowJoinInput(false);
          setStatus("Session created!");
          return;
        } else if (response.status === 409) {
          // Code taken, try another
          attempts++;
          continue;
        } else {
          setError("Failed to create session");
          setTimeout(() => setError(''), 2000);
          setStatus("");
          return;
        }
      } catch (err) {
        setError("Failed to create session");
        setTimeout(() => setError(''), 2000);
        setStatus("");
        return;
      }
    }
    setError("Could not generate a unique session code. Please try again.");
    setTimeout(() => setError(''), 2000);
    setStatus("");
  };

  // Handle join session
  const handleJoin = () => {
    setShowJoinInput(true);
    setInputCode('');
  };

  // Handle join code submit
  const handleCodeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (/^([0-9])\1{3}$/.test(inputCode)) {
      setSessionId(inputCode);
      window.history.replaceState({}, '', `/${inputCode}`);
      setShowPrompt(false);
      setShowJoinInput(false);
    } else {
      setError('Please enter a valid 4-digit code (e.g. 4444)');
      setTimeout(() => setError(''), 2000);
    }
  };

  // Poll for new files every 3 seconds
  useEffect(() => {
    if (!sessionId) return;
    let isMounted = true;
    let timeoutId: ReturnType<typeof setTimeout>;
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
      if (isMounted) {
        timeoutId = setTimeout(pollFiles, 3000);
      }
    };
    pollFiles();
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
      } else if (e.clipboardData?.items) {
        for (let i = 0; i < e.clipboardData.items.length; i++) {
          const item = e.clipboardData.items[i];
          if (item.type.startsWith('image/')) {
            const file = item.getAsFile();
            if (file) {
              handleFiles({ 0: file, length: 1, item: (_: number) => file } as unknown as FileList);
            }
          }
        }
      }
    };
    const node = pasteInputRef.current;
    if (node) node.addEventListener('paste', onPaste as any);
    return () => {
      if (node) node.removeEventListener('paste', onPaste as any);
    };
  }, [handleFiles]);

  // Fetch image blobs and create object URLs when files change
  useEffect(() => {
    const newImageUrls: { [id: string]: string } = {};
    const fetchImages = async () => {
      await Promise.all(files.map(async (file) => {
        if (file.type.startsWith('image/')) {
          const res = await fetch(`${API_URL}/session/${sessionId}/file/${file.id}`);
          if (res.ok) {
            const blob = await res.blob();
            newImageUrls[file.id] = URL.createObjectURL(blob);
          }
        }
      }));
      setImageUrls(newImageUrls);
    };
    if (files.length > 0 && sessionId) fetchImages();
    else setImageUrls({});
    // Cleanup old object URLs
    return () => {
      Object.values(imageUrls).forEach(url => URL.revokeObjectURL(url));
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [files, sessionId]);

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
        const blob = await response.blob();
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = fileName;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        setTimeout(() => URL.revokeObjectURL(url), 1000);
      }
    } catch (err) {
      setError('Download failed');
      setTimeout(() => setError(''), 3000);
    }
  };

  return (
    <div className="instantshare-root">
      {showPrompt && (
        <div className="code-modal">
          {!showJoinInput ? (
            <div className="code-form">
              <h2>Start or Join a Session</h2>
              <button onClick={handleCreate}>Create Session</button>
              <button onClick={handleJoin}>Join Session</button>
            </div>
          ) : (
            <form onSubmit={handleCodeSubmit} className="code-form">
              <h2>Enter 4-digit session code</h2>
              <input
                type="text"
                maxLength={4}
                pattern="([0-9])\1{3}"
                placeholder="e.g. 4444"
                value={inputCode}
                onChange={e => setInputCode(e.target.value.replace(/[^0-9]/g, ''))}
                autoFocus
                className="code-input"
              />
              <button type="submit">Join</button>
            </form>
          )}
          {createdCode && (
            <div className="created-code-info">
              <div>Share this code with others:</div>
              <div className="created-code">{createdCode}</div>
              <div className="created-link">{window.location.origin + '/' + createdCode}</div>
            </div>
          )}
        </div>
      )}
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
        {/* Paste area for mobile clipboard images */}
        <div
          ref={pasteInputRef}
          contentEditable
          suppressContentEditableWarning
          className="paste-area"
          tabIndex={0}
          onFocus={() => setStatus('Tap your keyboard clipboard icon to paste an image')}
        >
          Tap here and paste your screenshot (mobile: use keyboard clipboard)
        </div>
        {/* Connection spinner while waiting for files */}
        {status === 'Waiting for files...' && (
          <div className="connection-spinner">
            <div className="spinner"></div>
            <div>Waiting for connection...</div>
            <div style={{ fontSize: '0.95em', color: '#888', marginTop: '0.5em' }}>
              Open this session on another device to connect.
            </div>
          </div>
        )}
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
              {file.type.startsWith('image/') && (
                <>
                  <img
                    src={imageUrls[file.id]}
                    alt={file.name}
                    className="preview-thumb"
                    style={{ maxWidth: 60, maxHeight: 60, margin: '0 0.5em', borderRadius: 4, border: '1px solid #eee' }}
                  />
                  <button
                    className="copy-btn"
                    onClick={async () => {
                      try {
                        const res = await fetch(`${API_URL}/session/${sessionId}/file/${file.id}`);
                        const blob = await res.blob();
                        await navigator.clipboard.write([
                          new window.ClipboardItem({ [file.type]: blob })
                        ]);
                        setStatus('Image copied!');
                        setTimeout(() => setStatus('Connected'), 1000);
                      } catch {
                        setError('Copy failed');
                        setTimeout(() => setError(''), 2000);
                      }
                    }}
                  >
                    Copy
                  </button>
                </>
              )}
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
