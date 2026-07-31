import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { Send, X, Bot, Sparkles, User, RefreshCw } from 'lucide-react';

interface Message {
  sender: 'user' | 'agent';
  text: string;
  timestamp: Date;
}

interface AICopilotDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  pageContext: 'live' | 'dashboard' | 'simulation';
  dark: boolean;
  topologyId: string;
}

export default function AICopilotDrawer({ isOpen, onClose, pageContext, dark, topologyId }: AICopilotDrawerProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Dynamic Suggestion Chips based on page context
  const getSuggestionChips = () => {
    if (pageContext === 'simulation') {
      return [
        'Explain the current state of the simulation',
        'What will happen to T1 if I turn off the pump?',
        'Does mud impurity affect pH?'
      ];
    } else if (pageContext === 'dashboard') {
      return [
        'Explain the health of our system based on current metrics',
        'What is the average water quality score?',
        'Are there any active alerts right now?'
      ];
    } else {
      return [
        'Is the system operating normally?',
        'What is the pH level of TANK - 1?',
        'List the water levels of all tanks'
      ];
    }
  };

  // Pre-load a friendly welcome message on mount/context swap
  useEffect(() => {
    const topologyName = topologyId === '6' ? 'Bus Topology' : topologyId === '1' ? 'Star Topology' : 'Line Topology';
    
    const welcomeMsg = pageContext === 'simulation'
      ? `Hello! I am your Simulation Sandbox Copilot. Ask me how changing pump speeds, scenarios, or contaminants will impact your ${topologyName} network.`
      : pageContext === 'dashboard'
      ? "Welcome to the Digital Twin Dashboard Assistant. I can help audit system-wide KPI averages, health index percentages, and warn about active alarms."
      : `Hi, I am your SCADA Live Assistant. Ask me about real-time sensor levels, valve states, or node alarms on this ${topologyName} canvas.`;

    setMessages([
      {
        sender: 'agent',
        text: welcomeMsg,
        timestamp: new Date()
      }
    ]);
  }, [pageContext, topologyId]);

  // Scroll to bottom whenever messages update
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  const handleSendMessage = async (textToSend: string) => {
    if (!textToSend.trim() || isLoading) return;

    // Append user message
    const userMsg: Message = {
      sender: 'user',
      text: textToSend,
      timestamp: new Date()
    };
    setMessages(prev => [...prev, userMsg]);
    setInputValue('');
    setIsLoading(true);

    try {
      // Gather active sandbox parameters if on simulation page
      let sandboxState = null;
      if (pageContext === 'simulation' && (window as any).__getSimulatedState) {
        sandboxState = (window as any).__getSimulatedState();
      }

      // Query the backend unified coordinator API
      const res = await axios.post('http://localhost:3001/api/llm/chat', {
        query: textToSend,
        pageContext,
        sandboxState,
        topologyId
      });

      const replyText = res.data.reply || "No response generated.";
      
      setMessages(prev => [
        ...prev,
        {
          sender: 'agent',
          text: replyText,
          timestamp: new Date()
        }
      ]);
    } catch (err: any) {
      console.error('Failed to get response from AI Agent:', err);
      setMessages(prev => [
        ...prev,
        {
          sender: 'agent',
          text: `Error: ${err.response?.data?.error || "Offline AI Engine connection failed. Please verify Ollama is active."}`,
          timestamp: new Date()
        }
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClearHistory = () => {
    setMessages([
      {
        sender: 'agent',
        text: `Chat history cleared. How can I help you with this ${pageContext} view?`,
        timestamp: new Date()
      }
    ]);
  };

  if (!isOpen) return null;

  return (
    <div style={{
      position: 'fixed', top: 0, right: 0, bottom: 0,
      width: 380, zIndex: 1000, display: 'flex', flexDirection: 'column',
      background: dark ? '#1a1b22' : '#ffffff',
      borderLeft: `1px solid ${dark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'}`,
      boxShadow: '-10px 0 35px rgba(0, 0, 0, 0.25)',
      fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif",
      transition: 'transform 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
      animation: 'slideIn 0.3s ease-out'
    }}>
      <style>{`
        @keyframes slideIn {
          from { transform: translateX(100%); }
          to { transform: translateX(0); }
        }
        @keyframes pulseGlow {
          0% { box-shadow: 0 0 5px rgba(0, 255, 255, 0.4); }
          50% { box-shadow: 0 0 15px rgba(0, 255, 255, 0.8); }
          100% { box-shadow: 0 0 5px rgba(0, 255, 255, 0.4); }
        }
        .ai-message-bubble {
          line-height: 1.5;
          font-size: 13px;
        }
        .ai-message-bubble p {
          margin: 0 0 8px 0;
        }
        .ai-message-bubble p:last-child {
          margin-bottom: 0;
        }
      `}</style>

      {/* Drawer Header */}
      <div style={{
        padding: '16px 20px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        borderBottom: `1px solid ${dark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)'}`,
        background: dark ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.01)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{
            width: 32, height: 32, borderRadius: 8,
            background: 'linear-gradient(135deg, #00ffff 0%, #0088ff 100%)',
            display: 'flex', alignItems: 'center', justifyContent: 'center'
          }}>
            <Bot size={16} color="#000" />
          </div>
          <div>
            <h3 style={{ margin: 0, fontSize: 14, fontWeight: 700, color: dark ? '#fff' : '#111' }}>
              Digital Twin Copilot
            </h3>
            <span style={{ fontSize: 9, color: dark ? '#9ca3af' : '#6b7280', fontWeight: 600, display: 'block', marginTop: 2 }}>
              Model: Qwen 2.5 (3B)
            </span>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <button 
            onClick={handleClearHistory} 
            title="Clear Chat History"
            style={{
              background: 'none', border: 'none', cursor: 'pointer', padding: 4,
              color: dark ? '#9ca3af' : '#4b5563', borderRadius: 6, display: 'flex'
            }}
          >
            <RefreshCw size={14} />
          </button>
          <button 
            onClick={onClose}
            style={{
              background: 'none', border: 'none', cursor: 'pointer', padding: 4,
              color: dark ? '#9ca3af' : '#4b5563', borderRadius: 6, display: 'flex'
            }}
          >
            <X size={18} />
          </button>
        </div>
      </div>

      {/* Chat Messages Block */}
      <div style={{
        flex: 1, overflowY: 'auto', padding: '20px 16px',
        display: 'flex', flexDirection: 'column', gap: 16
      }}>
        {messages.map((msg, i) => (
          <div 
            key={i} 
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: msg.sender === 'user' ? 'flex-end' : 'flex-start',
              width: '100%'
            }}
          >
            {/* Sender Label */}
            <span style={{
              fontSize: 10, fontWeight: 600, color: '#6b7280',
              marginBottom: 4, display: 'flex', alignItems: 'center', gap: 4
            }}>
              {msg.sender === 'user' ? (
                <>Operator <User size={10} /></>
              ) : (
                <><Bot size={10} /> Copilot Agent</>
              )}
            </span>

            {/* Bubble */}
            <div style={{
              maxWidth: '85%', padding: '12px 14px', borderRadius: 12,
              fontSize: 13, color: msg.sender === 'user' ? '#fff' : (dark ? '#e5e7eb' : '#1f2937'),
              background: msg.sender === 'user'
                ? '#2563eb'
                : (dark ? '#252630' : '#f3f4f6'),
              border: msg.sender === 'user'
                ? 'none'
                : `1px solid ${dark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)'}`,
              wordBreak: 'break-word',
              whiteSpace: 'pre-wrap'
            }} className="ai-message-bubble">
              {msg.text}
            </div>
          </div>
        ))}

        {/* Thinking State */}
        {isLoading && (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
            <span style={{ fontSize: 10, fontWeight: 600, color: '#6b7280', marginBottom: 4, display: 'flex', alignItems: 'center', gap: 4 }}>
              <Bot size={10} /> Analyzing telemetry...
            </span>
            <div style={{
              padding: '12px 16px', borderRadius: 12,
              background: dark ? '#252630' : '#f3f4f6',
              border: `1px solid ${dark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)'}`,
              display: 'flex', alignItems: 'center', gap: 6
            }}>
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#00ffff', animation: 'pulseGlow 1s infinite' }} />
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#00ffff', animation: 'pulseGlow 1.2s infinite 0.2s' }} />
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#00ffff', animation: 'pulseGlow 1.4s infinite 0.4s' }} />
            </div>
          </div>
        )}
        <div ref={chatEndRef} />
      </div>

      {/* Suggestion Chips Panel */}
      <div style={{
        padding: '8px 12px',
        display: 'flex', flexDirection: 'column', gap: 6,
        borderTop: `1px solid ${dark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)'}`,
        background: dark ? 'rgba(0,0,0,0.1)' : 'rgba(0,0,0,0.02)'
      }}>
        <span style={{ fontSize: 9, fontWeight: 700, textTransform: 'uppercase', color: '#6b7280', letterSpacing: '0.5px' }}>
          Suggested Inquiries
        </span>
        <div style={{ display: 'flex', gap: 6, overflowX: 'auto', paddingBottom: 4 }}>
          {getSuggestionChips().map((chipText, i) => (
            <button
              key={i}
              onClick={() => handleSendMessage(chipText)}
              disabled={isLoading}
              style={{
                whiteSpace: 'nowrap', padding: '6px 12px', borderRadius: 10,
                fontSize: 11, fontWeight: 600, cursor: 'pointer',
                background: dark ? '#2c2d3a' : '#eaeaea',
                border: 'none',
                color: dark ? '#00ffff' : '#2563eb',
                opacity: isLoading ? 0.5 : 1
              }}
            >
              {chipText}
            </button>
          ))}
        </div>
      </div>

      {/* Input Panel */}
      <div style={{
        padding: '16px',
        borderTop: `1px solid ${dark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)'}`,
        display: 'flex', alignItems: 'center', gap: 10,
        background: dark ? 'rgba(255,255,255,0.01)' : 'rgba(0,0,0,0.01)'
      }}>
        <input
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') handleSendMessage(inputValue); }}
          placeholder="Ask AI Copilot..."
          disabled={isLoading}
          style={{
            flex: 1, height: 42, padding: '0 14px', borderRadius: 10,
            border: `1px solid ${dark ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.12)'}`,
            background: dark ? '#20212a' : '#ffffff',
            color: dark ? '#fff' : '#000',
            fontSize: 13, outline: 'none'
          }}
        />
        <button
          onClick={() => handleSendMessage(inputValue)}
          disabled={isLoading || !inputValue.trim()}
          style={{
            width: 42, height: 42, borderRadius: 10,
            background: 'linear-gradient(135deg, #00ffff 0%, #0088ff 100%)',
            border: 'none', cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifySelf: 'center', justifyContent: 'center',
            opacity: (isLoading || !inputValue.trim()) ? 0.6 : 1
          }}
        >
          <Send size={16} color="#000" />
        </button>
      </div>
    </div>
  );
}
