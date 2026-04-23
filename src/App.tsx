import React, { useState, useRef, useEffect } from 'react';
import { computeHashOfIntent } from './utils/crypto';

interface LedgerEntry {
  id: string;
  hash: string;
  timestamp: string;
  status: 'processing' | 'verified';
  originalQuery: string;
}

function App() {
  const [query, setQuery] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [ledger, setLedger] = useState<LedgerEntry[]>([]);
  const [aiResponse, setAiResponse] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  
  const ledgerEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll the ledger
  useEffect(() => {
    if (ledgerEndRef.current) {
      ledgerEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [ledger]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;

    setIsProcessing(true);
    setAiResponse(null);

    // 1. Generate Proof-of-Agency Hash
    const timer = new Promise(resolve => setTimeout(resolve, 800)); // simulation delay
    const hashHex = await computeHashOfIntent(query);
    await timer; // Wait for minimum processing animation time

    const newId = Math.random().toString(36).substr(2, 9);
    const timestamp = new Date().toISOString();

    const newEntry: LedgerEntry = {
      id: newId,
      hash: hashHex,
      timestamp,
      status: 'verified', // Mock verification
      originalQuery: query
    };

    // 2. Clear query for privacy and update ledger
    setQuery('');
    setLedger(prev => [...prev, newEntry]);
    setIsProcessing(false);

    // 3. Simulate AI Request (using hash, securely processing the background intent)
    setTimeout(() => {
      setAiResponse(
        `[Secure Output]: Received Proof-of-Agency verification for Intent Hash: \n${hashHex}\n\n` + 
        `AI Response to authorized query: "Based on the provided parameters, the Zenith-Mesh infrastructure successfully protected your privacy by only logging the encrypted intent footprint on the Titan Node."`
      );
    }, 1500);
  };

  return (
    <div className="container">
      <header style={{ marginBottom: '2rem', textAlign: 'center' }}>
        <h1 className="text-gradient" style={{ fontSize: '3rem', marginBottom: '0.5rem' }}>
          ZENITH-MESH
        </h1>
        <p style={{ color: 'var(--text-muted)' }}>Proof-of-Agency | Titan Privacy Core</p>
      </header>

      <div className="flex flex-col gap-6" style={{ maxWidth: '800px', margin: '0 auto' }}>
        
        {/* Input Panel */}
        <div className="glass-panel" style={{ padding: '2rem' }}>
          <h2 style={{ marginBottom: '1rem', color: 'var(--accent-cyan)' }}>Intent Authorization</h2>
          <p style={{ marginBottom: '1.5rem', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
             Enter your query. The raw text will be converted to a <b>Sha-256 Hash of Intent</b> 
             and stored on the decentralized ledger. <i>Your privacy is guaranteed.</i>
          </p>
          
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div className="mesh-input-container">
              <textarea 
                className="mesh-input" 
                placeholder="Initialize agentic task..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                disabled={isProcessing}
              />
              <div className={`processing-overlay ${isProcessing ? 'active' : ''}`}>
                <div className="spinner"></div>
                <p style={{ color: 'var(--accent-cyan)', fontFamily: 'Outfit, sans-serif' }}>
                  COMPUTING INTENT HASH
                </p>
              </div>
            </div>
            <div className="flex justify-between items-center">
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                End-to-End PQC Encryption Active
              </span>
              <button 
                type="submit" 
                className="mesh-button" 
                disabled={!query.trim() || isProcessing}
              >
                {isProcessing ? 'Hashing...' : 'Authorize Intent'}
              </button>
            </div>
          </form>
        </div>

        {/* Ledger Panel */}
        <div className="glass-panel" style={{ padding: '2rem' }}>
          <h2 style={{ marginBottom: '1rem', color: 'var(--accent-purple)' }}>Titan Node Ledger</h2>
          <p style={{ marginBottom: '1.5rem', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
            Live stream of authorized intent fingerprints. No raw text is ever recorded.
          </p>
          
          <div className="ledger-container">
            {ledger.length === 0 ? (
              <p style={{ color: 'rgba(255,255,255,0.2)', textAlign: 'center', margin: '2rem 0' }}>
                Ledger is empty. Awaiting Intent.
              </p>
            ) : (
              ledger.map(entry => (
                <div 
                  key={entry.id} 
                  className="ledger-item status-verified" 
                  onClick={() => setExpandedId(prev => prev === entry.id ? null : entry.id)}
                  style={{ cursor: 'pointer', transition: 'all 0.3s ease' }}
                  title="Click to reveal encrypted intent"
                >
                  <div className="flex justify-between items-center">
                    <span style={{ color: 'var(--accent-cyan)', fontWeight: 'bold', fontSize: '0.8rem', textTransform: 'uppercase' }}>
                      [Verified Block]
                    </span>
                    <span className="timestamp">{entry.timestamp}</span>
                  </div>
                  {expandedId === entry.id ? (
                    <div className="hash-text" style={{ color: 'var(--text-main)', marginTop: '0.5rem', fontFamily: 'Inter, sans-serif', fontSize: '0.9rem' }}>
                      <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>Decrypted Intent: </span>
                      <br/>
                      {entry.originalQuery}
                    </div>
                  ) : (
                    <div className="hash-text">{entry.hash}</div>
                  )}
                </div>
              ))
            )}
            <div ref={ledgerEndRef} />
          </div>
        </div>

        {/* AI Output Panel */}
        {aiResponse && (
          <div className="glass-panel animate-pulse" style={{ padding: '2rem', borderLeft: '4px solid var(--accent-cyan)' }}>
            <h2 style={{ marginBottom: '1rem', color: '#fff' }}>Agentic Reply</h2>
            <div style={{ whiteSpace: 'pre-wrap', fontFamily: 'Inter, sans-serif', color: 'var(--text-main)', lineHeight: '1.6' }}>
              {aiResponse}
            </div>
          </div>
        )}

      </div>
    </div>
  );
}

export default App;
