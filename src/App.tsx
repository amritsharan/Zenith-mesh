import React, { useState, useRef, useEffect } from 'react';
import { computeHashOfIntent, computeBlockHash, mineBlock } from './utils/crypto';

interface Block {
  index: number;
  timestamp: string;
  data: string; // Original raw query
  intentHash: string; // Encrypted proof of intent hash
  previousHash: string;
  hash: string;
  nonce: number;
  difficulty: number;
}

interface ValidationResult {
  isValid: boolean;
  brokenIndex: number | null;
  reason: string | null;
}

function App() {
  const [query, setQuery] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingStatus, setProcessingStatus] = useState('');
  const [blockchain, setBlockchain] = useState<Block[]>([]);
  const [aiResponse, setAiResponse] = useState<string | null>(null);
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null);
  
  // Tampering Simulation State
  const [tamperedData, setTamperedData] = useState<{ [key: number]: string }>({});
  const [chainValidation, setChainValidation] = useState<ValidationResult>({
    isValid: true,
    brokenIndex: null,
    reason: null
  });

  // Code Generation Language
  const [genLanguage, setGenLanguage] = useState<'javascript' | 'python'>('javascript');
  const [copyFeedback, setCopyFeedback] = useState(false);

  const blockchainEndRef = useRef<HTMLDivElement>(null);

  // Initialize Genesis block or load from local storage
  useEffect(() => {
    const initChain = async () => {
      const stored = localStorage.getItem('zenith_blockchain');
      if (stored) {
        try {
          const parsed = JSON.parse(stored) as Block[];
          if (parsed.length > 0) {
            setBlockchain(parsed);
            return;
          }
        } catch (e) {
          console.error("Failed parsing blockchain from local storage, generating new genesis...", e);
        }
      }

      // Generate Genesis Block
      setIsProcessing(true);
      setProcessingStatus('CREATING GENESIS BLOCK...');
      const genesisText = "Zenith-Mesh Decentralized Genesis Block";
      const genesisIntentHash = await computeHashOfIntent(genesisText);
      const difficulty = 2;
      const genesisTimestamp = new Date().toISOString();
      const previousHash = "0".repeat(64);
      
      const mineRes = await mineBlock(0, genesisTimestamp, genesisText, genesisIntentHash, previousHash, difficulty);
      
      const genesisBlock: Block = {
        index: 0,
        timestamp: genesisTimestamp,
        data: genesisText,
        intentHash: genesisIntentHash,
        previousHash,
        hash: mineRes.hash,
        nonce: mineRes.nonce,
        difficulty
      };
      
      setBlockchain([genesisBlock]);
      localStorage.setItem('zenith_blockchain', JSON.stringify([genesisBlock]));
      setIsProcessing(false);
      setProcessingStatus('');
    };

    initChain();
  }, []);

  // Validate chain whenever blockchain state changes or data is tampered
  useEffect(() => {
    const runValidation = async () => {
      if (blockchain.length === 0) return;
      
      for (let i = 0; i < blockchain.length; i++) {
        const block = blockchain[i];
        
        // 1. Check Linkages
        if (i > 0) {
          const prevBlock = blockchain[i - 1];
          if (block.previousHash !== prevBlock.hash) {
            setChainValidation({
              isValid: false,
              brokenIndex: i,
              reason: `Link broken at Block #${i}: 'previousHash' does not match Block #${i-1}'s current hash!`
            });
            return;
          }
        } else {
          // Genesis Block check
          if (block.previousHash !== "0".repeat(64)) {
            setChainValidation({
              isValid: false,
              brokenIndex: 0,
              reason: `Genesis Block has invalid previous hash formatting!`
            });
            return;
          }
        }

        // 2. Validate current block's hash matches its content
        const computed = await computeBlockHash(
          block.index,
          block.timestamp,
          block.data,
          block.intentHash,
          block.previousHash,
          block.nonce
        );

        if (block.hash !== computed) {
          setChainValidation({
            isValid: false,
            brokenIndex: i,
            reason: `Data integrity breach at Block #${i}: Stored hash does not match computed hash!`
          });
          return;
        }

        // 3. Validate difficulty target prefix
        const targetPrefix = '0'.repeat(block.difficulty);
        if (!block.hash.startsWith(targetPrefix)) {
          setChainValidation({
            isValid: false,
            brokenIndex: i,
            reason: `Invalid Proof of Work at Block #${i}: Hash does not meet difficulty requirements!`
          });
          return;
        }
      }

      setChainValidation({
        isValid: true,
        brokenIndex: null,
        reason: "Blockchain is cryptographically secure and verified."
      });
    };

    runValidation();
  }, [blockchain]);

  // Scroll to end of blockchain panel when updated
  useEffect(() => {
    if (blockchainEndRef.current) {
      blockchainEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [blockchain]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim() || isProcessing) return;

    setIsProcessing(true);
    setAiResponse(null);

    try {
      // 1. Generate Proof-of-Agency Intent Hash
      setProcessingStatus('COMPUTING INTENT HASH...');
      const intentHash = await computeHashOfIntent(query);
      
      // 2. Mine Block (Proof-of-Work simulation)
      setProcessingStatus('MINING NEW TRANSACTION BLOCK (POW)...');
      const latestBlock = blockchain[blockchain.length - 1];
      const index = latestBlock ? latestBlock.index + 1 : 0;
      const previousHash = latestBlock ? latestBlock.hash : "0".repeat(64);
      const difficulty = 2;
      const timestamp = new Date().toISOString();

      const mineRes = await mineBlock(index, timestamp, query, intentHash, previousHash, difficulty);

      const newBlock: Block = {
        index,
        timestamp,
        data: query,
        intentHash,
        previousHash,
        hash: mineRes.hash,
        nonce: mineRes.nonce,
        difficulty
      };

      const newChain = [...blockchain, newBlock];
      setBlockchain(newChain);
      localStorage.setItem('zenith_blockchain', JSON.stringify(newChain));
      
      setQuery('');
      setIsProcessing(false);
      setProcessingStatus('');

      // 3. Simulate secure AI Response
      setTimeout(() => {
        setAiResponse(
          `[Secure Agent Footprint]: Intent cryptographically chained on Block #${index}.\n` +
          `Intent Hash: ${intentHash}\n` +
          `Block Hash: ${mineRes.hash}\n\n` +
          `Zenith Mesh Agent response for authorized action:\n"Command received. Decentralized logs successfully verified compliance. Secure ledger state updated globally across the Zenith Mesh."`
        );
      }, 800);

    } catch (err) {
      console.error(err);
      setIsProcessing(false);
      setProcessingStatus('');
    }
  };

  // Simulate tampering of content inside a block
  const handleTamper = (index: number, newText: string) => {
    const updatedChain = blockchain.map((block) => {
      if (block.index === index) {
        return {
          ...block,
          data: newText // Altering the query data without re-mining/re-calculating the hash
        };
      }
      return block;
    });
    setBlockchain(updatedChain);
  };

  // Repair the chain starting from the first invalid block by re-mining blocks sequentially
  const handleRepair = async () => {
    if (chainValidation.isValid || chainValidation.brokenIndex === null) return;
    
    setIsProcessing(true);
    setProcessingStatus('RE-MINING AND RECONCILING BLOCKCHAIN STATE...');

    let tempChain = [...blockchain];
    const startIndex = chainValidation.brokenIndex;

    for (let i = startIndex; i < tempChain.length; i++) {
      const block = tempChain[i];
      const prevHash = i === 0 ? "0".repeat(64) : tempChain[i - 1].hash;
      
      setProcessingStatus(`RE-MINING BLOCK #${i} (POW)...`);
      
      const currentIntentHash = await computeHashOfIntent(block.data);
      const mineRes = await mineBlock(
        block.index,
        block.timestamp,
        block.data,
        currentIntentHash,
        prevHash,
        block.difficulty
      );

      tempChain[i] = {
        ...block,
        intentHash: currentIntentHash,
        previousHash: prevHash,
        hash: mineRes.hash,
        nonce: mineRes.nonce
      };
    }

    setBlockchain(tempChain);
    localStorage.setItem('zenith_blockchain', JSON.stringify(tempChain));
    setIsProcessing(false);
    setProcessingStatus('');
  };

  const handleReset = async () => {
    if (window.confirm("Are you sure you want to reset the blockchain ledger? This will clear all logged user queries and recreate the Genesis block.")) {
      localStorage.removeItem('zenith_blockchain');
      
      setIsProcessing(true);
      setProcessingStatus('RECREATING GENESIS BLOCK...');
      const genesisText = "Zenith-Mesh Decentralized Genesis Block";
      const genesisIntentHash = await computeHashOfIntent(genesisText);
      const difficulty = 2;
      const genesisTimestamp = new Date().toISOString();
      const previousHash = "0".repeat(64);
      
      const mineRes = await mineBlock(0, genesisTimestamp, genesisText, genesisIntentHash, previousHash, difficulty);
      
      const genesisBlock: Block = {
        index: 0,
        timestamp: genesisTimestamp,
        data: genesisText,
        intentHash: genesisIntentHash,
        previousHash,
        hash: mineRes.hash,
        nonce: mineRes.nonce,
        difficulty
      };
      
      setBlockchain([genesisBlock]);
      localStorage.setItem('zenith_blockchain', JSON.stringify([genesisBlock]));
      setIsProcessing(false);
      setProcessingStatus('');
    }
  };

  // Generate code script representation
  const generateStandaloneCode = () => {
    const chainJson = JSON.stringify(blockchain, null, 2);
    
    if (genLanguage === 'python') {
      return `import hashlib
import json

# Standalone Blockchain Verification Script
# Generated by Zenith-Mesh Query Logging Suite

blockchain_data = ${chainJson.replace(/true/g, 'True').replace(/false/g, 'False').replace(/null/g, 'None')}

def compute_block_hash(index, timestamp, data, intent_hash, previous_hash, nonce):
    # Formulates the block string in the exact order verified on-chain
    block_string = f"{index}-{timestamp}-{data}-{intent_hash}-{previous_hash}-{nonce}"
    return hashlib.sha256(block_string.encode('utf-8')).hexdigest()

def verify_blockchain(chain):
    print("--- Zenith-Mesh Offline Blockchain Verification Service ---")
    print(f"Verifying {len(chain)} block(s)...\\n")
    
    for i in range(len(chain)):
        block = chain[i]
        
        # 1. Verify index sequence
        if block['index'] != i:
            print(f"[-] Invalid Index sequence at block {i}: expected {i}, got {block['index']}")
            return False
            
        # 2. Check previous-link integrity
        if i == 0:
            expected_prev = "0" * 64
            if block['previousHash'] != expected_prev:
                print(f"[-] Genesis Block previousHash formatting error! Got {block['previousHash']}")
                return False
        else:
            prev_block = chain[i-1]
            if block['previousHash'] != prev_block['hash']:
                print(f"[-] Chain Broken at Block #{i}: 'previousHash' does not match Block #{i-1} hash!")
                print(f"    Expected: {prev_block['hash']}")
                print(f"    Got:      {block['previousHash']}")
                return False
                
        # 3. Verify cryptographic hash match
        calculated_hash = compute_block_hash(
            block['index'],
            block['timestamp'],
            block['data'],
            block['intentHash'],
            block['previousHash'],
            block['nonce']
        )
        if block['hash'] != calculated_hash:
            print(f"[-] Data Alteration Detected at Block #{i}: data hash does not match stored block hash!")
            print(f"    Stored Hash:     {block['hash']}")
            print(f"    Calculated Hash: {calculated_hash}")
            return False
            
        # 4. Verify difficulty target met
        target_prefix = "0" * block['difficulty']
        if not block['hash'].startswith(target_prefix):
            print(f"[-] Block #{i} did not satisfy Proof-of-Work difficulty target!")
            return False
            
        print(f"[+] Block #{i} [OK] | Hash: {block['hash'][:20]}...")
        
    print("\\n[SUCCESS] Blockchain status: 100% SECURE. Integrity successfully verified offline!")
    return True

if __name__ == "__main__":
    verify_blockchain(blockchain_data)
`;
    }

    return `const crypto = require('crypto');

// Standalone Blockchain Verification Script
// Generated by Zenith-Mesh Query Logging Suite

const blockchainData = ${chainJson};

function computeBlockHash(index, timestamp, data, intentHash, previousHash, nonce) {
  const blockString = \`\${index}-\${timestamp}-\${data}-\${intentHash}-\${previousHash}-\${nonce}\`;
  return crypto.createHash('sha256').update(blockString).digest('hex');
}

function verifyBlockchain(chain) {
  console.log("--- Zenith-Mesh Offline Blockchain Verification Service ---");
  console.log(\`Verifying \${chain.length} block(s)...\\n\`);
  
  for (let i = 0; i < chain.length; i++) {
    const block = chain[i];
    
    if (block.index !== i) {
      console.log(\`[-] Invalid Index sequence at block \${i}: expected \${i}, got \${block.index}\`);
      return false;
    }
    
    if (i === 0) {
      const expectedPrev = "0".repeat(64);
      if (block.previousHash !== expectedPrev) {
        console.log(\`[-] Genesis Block previousHash formatting error! Got \${block.previousHash}\`);
        return false;
      }
    } else {
      const prevBlock = chain[i-1];
      if (block.previousHash !== prevBlock.hash) {
        console.log(\`[-] Chain Broken at Block #\${i}: 'previousHash' does not match Block #\${i-1} hash!\`);
        console.log(\`    Expected: \${prevBlock.hash}\`);
        console.log(\`    Got:      \${block.previousHash}\`);
        return false;
      }
    }
    
    const calculatedHash = computeBlockHash(
      block.index,
      block.timestamp,
      block.data,
      block.intentHash,
      block.previousHash,
      block.nonce
    );
    
    if (block.hash !== calculatedHash) {
      console.log(\`[-] Data Alteration Detected at Block #\${i}: data hash does not match stored block hash!\`);
      console.log(\`    Stored Hash:     \${block.hash}\`);
      console.log(\`    Calculated Hash: \${calculatedHash}\`);
      return false;
    }
    
    const targetPrefix = "0".repeat(block.difficulty);
    if (!block.hash.startsWith(targetPrefix)) {
      console.log(\`[-] Block #\${i} did not satisfy Proof-of-Work difficulty target!\`);
      return false;
    }
    
    console.log(\`[+] Block #\${i} [OK] | Hash: \${block.hash.substring(0, 20)}...\`);
  }
  
  console.log("\\n[SUCCESS] Blockchain status: 100% SECURE. Integrity successfully verified offline!");
  return true;
}

verifyBlockchain(blockchainData);
`;
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(generateStandaloneCode());
    setCopyFeedback(true);
    setTimeout(() => setCopyFeedback(false), 2000);
  };

  return (
    <div className="container">
      <header style={{ marginBottom: '2rem', textAlign: 'center' }}>
        <h1 className="text-gradient" style={{ fontSize: '3rem', marginBottom: '0.5rem' }}>
          ZENITH-MESH
        </h1>
        <p style={{ color: 'var(--text-muted)' }}>Proof-of-Agency | Decentralized Query Ledger</p>
      </header>

      <div className="flex flex-col gap-6" style={{ maxWidth: '1000px', margin: '0 auto' }}>
        
        {/* Input Panel */}
        <div className="glass-panel" style={{ padding: '2rem' }}>
          <h2 style={{ marginBottom: '0.5rem', color: 'var(--accent-cyan)' }}>Intent Authorization</h2>
          <p style={{ marginBottom: '1.5rem', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
             Type a query to build a secure transaction. Zenith-Mesh stores the transaction inside a cryptographically linked decentralized blockchain.
          </p>
          
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div className="mesh-input-container">
              <textarea 
                className="mesh-input" 
                placeholder="Initialize agentic query / intent (e.g. Fetch system config, authenticate API route)..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                disabled={isProcessing}
              />
              <div className={`processing-overlay ${isProcessing ? 'active' : ''}`}>
                <div className="spinner"></div>
                <p style={{ color: 'var(--accent-cyan)', fontFamily: 'Outfit, sans-serif', fontWeight: 600 }}>
                  {processingStatus}
                </p>
              </div>
            </div>
            <div className="flex justify-between items-center">
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                Decentralized Blockchain Storage Core Active
              </span>
              <button 
                type="submit" 
                className="mesh-button" 
                disabled={!query.trim() || isProcessing}
              >
                {isProcessing ? 'Mining Block...' : 'Log & Mine Query'}
              </button>
            </div>
          </form>
        </div>

        {/* Validator / Integrity Dashboard */}
        <div className="glass-panel" style={{ padding: '1.5rem 2rem' }}>
          <div className="flex justify-between items-center flex-wrap gap-4">
            <div>
              <h3 style={{ color: '#fff', marginBottom: '0.25rem' }}>Blockchain Integrity Dashboard</h3>
              <div className="flex items-center gap-2">
                <span className={`status-dot ${chainValidation.isValid ? 'valid' : 'invalid'}`}></span>
                <span style={{ 
                  color: chainValidation.isValid ? '#4ade80' : '#f87171',
                  fontWeight: 600,
                  fontSize: '0.9rem' 
                }}>
                  {chainValidation.isValid ? 'STATUS: VALID & SECURE' : 'STATUS: SECURITY ALERT / CORRUPTED LINK'}
                </span>
              </div>
              {chainValidation.reason && (
                <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', marginTop: '0.4rem' }}>
                  {chainValidation.reason}
                </p>
              )}
            </div>
            <div className="flex gap-4">
              {!chainValidation.isValid && (
                <button 
                  onClick={handleRepair} 
                  className="mesh-button btn-repair"
                  disabled={isProcessing}
                >
                  Repair Chain (Re-mine)
                </button>
              )}
              <button 
                onClick={handleReset} 
                className="mesh-button btn-reset"
                disabled={isProcessing}
                style={{
                  background: 'rgba(239, 68, 68, 0.1)',
                  borderColor: 'rgba(239, 68, 68, 0.4)',
                  color: '#f87171'
                }}
              >
                Reset Ledger
              </button>
            </div>
          </div>
        </div>

        {/* Blockchain Visualizer Panel */}
        <div className="glass-panel" style={{ padding: '2rem' }}>
          <h2 style={{ marginBottom: '1rem', color: 'var(--accent-purple)' }}>Interactive Blockchain Ledger</h2>
          <p style={{ marginBottom: '1.5rem', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
            Scroll right to view the chain blocks. Every block carries the hash of the preceding block. Try editing the query content inside a block to test the anti-tampering verification!
          </p>
          
          <div className="blockchain-visual-container">
            {blockchain.length === 0 ? (
              <p style={{ color: 'rgba(255,255,255,0.2)', textAlign: 'center', margin: '2rem 0' }}>
                Initializing blockchain core...
              </p>
            ) : (
              <div className="blockchain-row">
                {blockchain.map((block, idx) => {
                  const isBlockInvalid = !chainValidation.isValid && 
                    chainValidation.brokenIndex !== null && 
                    idx >= chainValidation.brokenIndex;

                  return (
                    <React.Fragment key={block.index}>
                      {idx > 0 && (
                        <div className={`chain-link-connector ${isBlockInvalid ? 'link-broken' : ''}`}>
                          <div className="connector-line"></div>
                          <div className="connector-arrow">➔</div>
                        </div>
                      )}
                      <div className={`block-card ${isBlockInvalid ? 'block-corrupt' : 'block-secure'} ${expandedIndex === block.index ? 'expanded' : ''}`}>
                        <div className="block-header flex justify-between items-center">
                          <span className="block-index">BLOCK #{block.index}</span>
                          <span className="block-type">{block.index === 0 ? 'GENESIS' : 'QUERY LOG'}</span>
                        </div>
                        
                        <div className="block-body">
                          <div className="meta-row">
                            <span className="label">Timestamp:</span>
                            <span className="value truncate-text" title={block.timestamp}>{block.timestamp}</span>
                          </div>
                          
                          <div className="meta-row font-mono">
                            <span className="label">Prev Hash:</span>
                            <span className="value hash-val" title={block.previousHash}>
                              {block.previousHash.substring(0, 8)}...{block.previousHash.substring(56)}
                            </span>
                          </div>

                          <div className="data-section">
                            <div className="flex justify-between items-center" style={{ marginBottom: '0.3rem' }}>
                              <span className="label">Logged User Query:</span>
                              <span style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.4)' }}>[Editable for testing]</span>
                            </div>
                            <textarea
                              className="block-data-input"
                              value={tamperedData[block.index] !== undefined ? tamperedData[block.index] : block.data}
                              onChange={(e) => {
                                const val = e.target.value;
                                setTamperedData(prev => ({ ...prev, [block.index]: val }));
                                handleTamper(block.index, val);
                              }}
                              placeholder="Empty Block Data..."
                              rows={2}
                            />
                          </div>

                          {expandedIndex === block.index ? (
                            <div className="expanded-details">
                              <div className="meta-row font-mono">
                                <span className="label">Intent Hash:</span>
                                <span className="value hash-val" title={block.intentHash}>{block.intentHash}</span>
                              </div>
                              <div className="meta-row">
                                <span className="label">Nonce (PoW):</span>
                                <span className="value font-mono highlight-cyan">{block.nonce}</span>
                              </div>
                              <div className="meta-row">
                                <span className="label">Difficulty:</span>
                                <span className="value font-mono highlight-purple">{block.difficulty}</span>
                              </div>
                            </div>
                          ) : null}

                          <div className="meta-row font-mono block-hash-row">
                            <span className="label">Block Hash:</span>
                            <span className="value hash-val highlight-green" title={block.hash}>
                              {block.hash.substring(0, 8)}...{block.hash.substring(56)}
                            </span>
                          </div>
                        </div>

                        <div className="block-footer flex justify-between items-center">
                          <button 
                            className="btn-text"
                            onClick={() => setExpandedIndex(prev => prev === block.index ? null : block.index)}
                          >
                            {expandedIndex === block.index ? 'Show Less' : 'Full Details'}
                          </button>
                          <span className={`block-badge ${isBlockInvalid ? 'badge-invalid' : 'badge-valid'}`}>
                            {isBlockInvalid ? 'Corrupted' : 'Secure'}
                          </span>
                        </div>
                      </div>
                    </React.Fragment>
                  );
                })}
                <div ref={blockchainEndRef} />
              </div>
            )}
          </div>
        </div>

        {/* AI Reply Panel */}
        {aiResponse && (
          <div className="glass-panel animate-pulse" style={{ padding: '2rem', borderLeft: '4px solid var(--accent-cyan)' }}>
            <h2 style={{ marginBottom: '1rem', color: '#fff' }}>Mesh Network Intelligence</h2>
            <div style={{ whiteSpace: 'pre-wrap', fontFamily: 'Inter, sans-serif', color: 'var(--text-main)', lineHeight: '1.6', fontSize: '0.95rem' }}>
              {aiResponse}
            </div>
          </div>
        )}

        {/* Independent Code Generation Panel */}
        <div className="glass-panel" style={{ padding: '2rem' }}>
          <div className="flex justify-between items-center" style={{ marginBottom: '1rem' }}>
            <h2 style={{ color: 'var(--accent-cyan)' }}>Independent Code Generation</h2>
            <div className="flex gap-2" style={{ background: 'rgba(255,255,255,0.05)', padding: '0.2rem', borderRadius: '8px' }}>
              <button 
                onClick={() => setGenLanguage('javascript')} 
                className={`tab-btn ${genLanguage === 'javascript' ? 'active' : ''}`}
              >
                JavaScript
              </button>
              <button 
                onClick={() => setGenLanguage('python')} 
                className={`tab-btn ${genLanguage === 'python' ? 'active' : ''}`}
              >
                Python
              </button>
            </div>
          </div>
          <p style={{ marginBottom: '1.5rem', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
            Generate a standalone code script embedded with the current blockchain data. Copy and run this script on your local machine to verify the integrity of these logs independently.
          </p>

          <div className="code-container">
            <div className="code-header flex justify-between items-center">
              <span className="file-name">verify_mesh_blockchain.{genLanguage === 'python' ? 'py' : 'js'}</span>
              <button className="copy-btn" onClick={copyToClipboard}>
                {copyFeedback ? '✓ Copied!' : 'Copy Script'}
              </button>
            </div>
            <pre className="code-body">
              <code>{generateStandaloneCode()}</code>
            </pre>
          </div>
        </div>

      </div>
    </div>
  );
}

export default App;
