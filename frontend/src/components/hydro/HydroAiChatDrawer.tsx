import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, X, Trash2, Sparkles, RefreshCw, Leaf, Maximize2, Minimize2, Activity, LineChart, BarChart2, Settings, ChevronDown, Sprout } from 'lucide-react';
import { CutePlantAvatar } from './CutePlantAvatar';

interface Message {
  id: string;
  sender: 'user' | 'ai';
  text: string;
  timestamp?: string;
}

interface HydroAiChatDrawerProps {
  isDark?: boolean;
}

export const HydroAiChatDrawer: React.FC<HydroAiChatDrawerProps> = ({ isDark = true }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [query, setQuery] = useState('');
  const [botState, setBotState] = useState<'idle' | 'thinking' | 'speaking' | 'happy'>('idle');
  const [showTooltip, setShowTooltip] = useState(true);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      sender: 'ai',
      text: "Hi there! 🌱 I'm HydroSprout, your AI companion. Ask me about water metrics, system diagnoses, or queries!",
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  ]);
  const [loading, setLoading] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Scroll to bottom when messages update
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  // Hide floating tooltip after drawer opens
  useEffect(() => {
    if (isOpen) setShowTooltip(false);
  }, [isOpen]);

  const handleSendMessage = async (textToSend?: string) => {
    const messageText = textToSend || query.trim();
    if (!messageText || loading) return;

    const userMsgId = Date.now().toString();
    const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    setMessages((prev) => [
      ...prev,
      { id: userMsgId, sender: 'user', text: messageText, timestamp: timeStr },
    ]);

    if (!textToSend) setQuery('');
    setLoading(true);
    setBotState('thinking');

    try {
      const res = await fetch('http://localhost:3001/api/hydro/ai/coordinator', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: messageText }),
      });

      if (!res.ok) throw new Error('Coordinator response error');
      const data = await res.json();

      setBotState('speaking');
      setMessages((prev) => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          sender: 'ai',
          text: data.response || 'No response generated.',
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);

      setTimeout(() => {
        setBotState('happy');
        setTimeout(() => setBotState('idle'), 2500);
      }, 1500);
    } catch (err) {
      setBotState('idle');
      setMessages((prev) => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          sender: 'ai',
          text: "Oops! 🍃 I couldn't reach the Hydroponics Coordinator server. Please verify Ollama or the backend service is running.",
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const clearChat = () => {
    setBotState('happy');
    setMessages([
      {
        id: Date.now().toString(),
        sender: 'ai',
        text: '🌱 Chat reset! How can I help you today?',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      },
    ]);
    setTimeout(() => setBotState('idle'), 2000);
  };

  const suggestionChips = [
    { label: '🌿 Health Check', query: 'Run a full hydroponic system health check.' },
    { label: '💧 Water & pH', query: 'What is the current pH, TDS, and water quality status?' },
    { label: '⚡ Pump Flow', query: 'Diagnose water pump flow rates and node statuses.' },
    { label: '📊 Analytics', query: 'Show historical sensor logs and node updates.' },
  ];

  return (
    <>
      {/* FLOATING CUTE PLANT TRIGGER BUTTON */}
      <div className="fixed bottom-6 right-6 z-40 flex items-center select-none">
        {/* Cute Floating Speech Tooltip */}
        <AnimatePresence>
          {!isOpen && showTooltip && (
            <motion.div
              initial={{ opacity: 0, y: 10, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.9 }}
              onClick={() => setIsOpen(true)}
              className="mr-3 px-4 py-2.5 rounded-2xl bg-emerald-950/90 border border-emerald-500/40 text-emerald-200 text-sm font-semibold shadow-2xl backdrop-blur-md cursor-pointer flex items-center gap-2.5 group hover:border-emerald-400 transition-all"
            >
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
              </span>
              <span>Need help? Ask AI! 🌱</span>
              <X
                className="w-4 h-4 text-emerald-400/60 hover:text-emerald-200 ml-1"
                onClick={(e) => {
                  e.stopPropagation();
                  setShowTooltip(false);
                }}
              />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Floating Plant Bot Trigger */}
        <motion.button
          onClick={() => setIsOpen(!isOpen)}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.95 }}
          animate={{ y: [0, -6, 0] }}
          transition={{ y: { duration: 3, repeat: Infinity, ease: 'easeInOut' } }}
          onMouseEnter={() => setBotState('happy')}
          onMouseLeave={() => !isOpen && setBotState('idle')}
          className="relative p-3 rounded-full flex items-center justify-center cursor-pointer shadow-2xl bg-gradient-to-tr from-emerald-600 via-teal-500 to-emerald-400 text-slate-950 border-2 border-emerald-300/40"
          style={{ boxShadow: '0 12px 40px rgba(16, 185, 129, 0.55)' }}
        >
          <CutePlantAvatar state={isOpen ? 'happy' : botState} size={54} />
          <motion.div
            animate={{ scale: [1, 1.25, 1], opacity: [0.7, 1, 0.7] }}
            transition={{ duration: 2, repeat: Infinity }}
            className="absolute -top-1 -right-1 p-1.5 bg-yellow-400 rounded-full text-xs shadow-md"
          >
            ✨
          </motion.div>
        </motion.button>
      </div>

      {/* SLIDE-OUT CUTE PLANT DRAWER */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ x: '100%', opacity: 0.5 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: '100%', opacity: 0 }}
            transition={{ type: 'spring', damping: 27, stiffness: 240 }}
            className={`fixed top-0 right-0 h-full z-50 shadow-2xl flex flex-col font-sans backdrop-blur-2xl border-l selection:bg-emerald-500 selection:text-slate-950 transition-all duration-300 ${
              isExpanded
                ? 'w-[750px] max-w-full'
                : 'w-[540px] sm:w-[600px] md:w-[640px] max-w-[98vw]'
            } ${
              isDark
                ? 'bg-[#080b11]/98 border-emerald-900/50 text-slate-100'
                : 'bg-white/98 border-emerald-200 text-slate-800'
            }`}
          >
            {/* DRAWER HEADER */}
            <div
              className={`p-5 border-b flex items-center justify-between shrink-0 relative overflow-visible ${
                isDark
                  ? 'border-emerald-900/30 bg-gradient-to-r from-[#0c131a] via-[#101c24] to-[#0c131a]'
                  : 'border-emerald-100 bg-gradient-to-r from-emerald-50 via-teal-50 to-emerald-50'
              }`}
            >
              {/* Subtle Decorative Leaf */}
              <div className="absolute top-0 right-16 opacity-10 pointer-events-none text-emerald-400">
                <Leaf className="w-32 h-32 rotate-12" />
              </div>

              {/* Bot Identity & Interactive Mascot */}
              <div className="flex items-center space-x-4 z-10">
                <div
                  className="cursor-pointer transition-transform hover:scale-110 shrink-0"
                  onClick={() => {
                    setBotState('happy');
                    setTimeout(() => setBotState('idle'), 1500);
                  }}
                  title="Click to give HydroSprout love! 🌱"
                >
                  <CutePlantAvatar state={botState} size={64} />
                </div>
                <div>
                  <div className="flex items-center space-x-2.5">
                    <span className="text-lg sm:text-xl font-black tracking-wide text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-teal-300 to-emerald-200">
                      HydroSprout AI
                    </span>
                    <span className="px-2.5 py-0.5 text-[10px] font-extrabold rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1.5 shrink-0">
                      <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                      v2.0
                    </span>
                  </div>

                  {/* Professional Interactive Tooltip Container */}
                  <div className="relative group mt-1.5 w-fit">
                    <span className="px-3.5 py-1 text-[11px] font-mono font-bold rounded-full bg-slate-800/80 hover:bg-slate-700/80 text-emerald-400 hover:text-emerald-300 border border-slate-700/50 hover:border-emerald-500/30 transition-all duration-200 cursor-help inline-block select-none text-center">
                      Active Model: qwen2.5:3b
                    </span>

                    {/* Tooltip Card */}
                    <div className="absolute top-full left-0 mt-3 w-[450px] max-w-[90vw] p-4.5 rounded-2xl border bg-[#080d14]/95 text-slate-300 border-slate-800 shadow-[0_20px_50px_rgba(0,0,0,0.9),0_0_30px_rgba(16,185,129,0.05)] opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto transition-all duration-300 translate-y-1 group-hover:translate-y-0 z-50 text-xs font-sans font-normal normal-case text-left backdrop-blur-xl">
                      
                      {/* Decorative Background Glows */}
                      <div className="absolute inset-0 rounded-2xl overflow-hidden pointer-events-none z-0">
                        <div className="absolute -top-20 -left-20 w-48 h-48 bg-emerald-500/10 rounded-full blur-[60px]" />
                        <div className="absolute -bottom-20 -right-20 w-48 h-48 bg-teal-500/10 rounded-full blur-[60px]" />
                      </div>

                      <div className="relative z-10">
                        {/* Tooltip Header */}
                        <div className="pb-3 mb-3.5 border-b border-slate-800/60">
                          <span className="block font-extrabold text-slate-100 text-sm tracking-wide">AI Core Engines</span>
                          <span className="text-[10px] text-emerald-400 font-bold uppercase tracking-wider block mt-0.5">Multi-Agent System</span>
                        </div>

                        {/* Agent / Model breakdown list */}
                        <div className="space-y-2.5">
                          
                          {/* Row 1: Hydroponic Controller */}
                          <div className="p-3 rounded-xl border border-slate-800/60 bg-slate-900/30 flex items-center justify-between gap-3">
                            <div className="flex items-center gap-2.5">
                              {/* Status Dot */}
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shrink-0" />
                              {/* Icon */}
                              <Sprout className="w-4 h-4 text-emerald-400 shrink-0" />
                              <div className="flex flex-col">
                                <span className="font-bold text-slate-100 text-[11px] leading-tight">Hydroponic Controller</span>
                                <span className="text-[10px] text-slate-400">Global Supervisor</span>
                              </div>
                            </div>
                            <div className="flex flex-col items-end gap-1 select-none">
                              <span className="px-2 py-0.5 text-[10px] font-mono font-medium rounded-full bg-slate-850 text-slate-300 border border-slate-700/50 flex items-center gap-1">
                                <span>qwen2.5:3b</span>
                                <ChevronDown className="w-3 h-3 text-slate-500" />
                              </span>
                              <span className="text-[9px] text-slate-500 font-mono">34.2 t/s • 120ms Latency</span>
                            </div>
                          </div>

                          {/* Row 2: Live */}
                          <div className="p-3 rounded-xl border border-slate-800/60 bg-slate-900/30 flex items-center justify-between gap-3">
                            <div className="flex items-center gap-2.5">
                              {/* Status Dot */}
                              <span className="w-1.5 h-1.5 rounded-full bg-yellow-400 shrink-0" />
                              {/* Icon */}
                              <Activity className="w-4 h-4 text-yellow-400 shrink-0" />
                              <div className="flex flex-col">
                                <div className="flex items-center gap-1">
                                  <span className="font-bold text-slate-100 text-[11px] leading-tight">Live</span>
                                  <Activity className="w-3 h-3 text-yellow-500/80" />
                                </div>
                                <span className="text-[10px] text-slate-400">Real-time Telemetry & Diagnostics</span>
                              </div>
                            </div>
                            <div className="flex flex-col items-end gap-1 select-none">
                              <span className="px-2 py-0.5 text-[10px] font-mono font-medium rounded-full bg-slate-850 text-slate-300 border border-slate-700/50 flex items-center gap-1">
                                <span>qwen2.5:1.5b</span>
                                <ChevronDown className="w-3 h-3 text-slate-500" />
                              </span>
                              <span className="text-[9px] text-slate-500 font-mono">1.9 GB VRAM • 120ms Latency</span>
                            </div>
                          </div>

                          {/* Row 3: Simulation */}
                          <div className="p-3 rounded-xl border border-slate-800/60 bg-slate-900/30 flex items-center justify-between gap-3">
                            <div className="flex items-center gap-2.5">
                              {/* Status Dot */}
                              <span className="w-1.5 h-1.5 rounded-full bg-red-500 shrink-0" />
                              {/* Icon */}
                              <LineChart className="w-4 h-4 text-rose-500 shrink-0" />
                              <div className="flex flex-col">
                                <div className="flex items-center gap-1">
                                  <span className="font-bold text-slate-100 text-[11px] leading-tight">Simulation</span>
                                  <LineChart className="w-3 h-3 text-rose-500/80" />
                                </div>
                                <span className="text-[10px] text-slate-400">What-if Dosing Forecasts</span>
                              </div>
                            </div>
                            <div className="flex flex-col items-end gap-1 select-none">
                              <span className="px-2 py-0.5 text-[10px] font-mono font-medium rounded-full bg-slate-850 text-slate-300 border border-slate-700/50 flex items-center gap-1">
                                <span>deepseek-r1:1.5b</span>
                                <ChevronDown className="w-3 h-3 text-slate-500" />
                              </span>
                              <span className="text-[9px] text-slate-500 font-mono">1.9 GB VRAM • 120ms Latency</span>
                            </div>
                          </div>

                          {/* Row 4: Dashboard */}
                          <div className="p-3 rounded-xl border border-slate-800/60 bg-slate-900/30 flex items-center justify-between gap-3">
                            <div className="flex items-center gap-2.5">
                              {/* Status Dot */}
                              <span className="w-1.5 h-1.5 rounded-full bg-red-500 shrink-0" />
                              {/* Icon */}
                              <BarChart2 className="w-4 h-4 text-emerald-400 shrink-0" />
                              <div className="flex flex-col">
                                <div className="flex items-center gap-1">
                                  <span className="font-bold text-slate-100 text-[11px] leading-tight">Dashboard</span>
                                  <BarChart2 className="w-3 h-3 text-emerald-500/80" />
                                </div>
                                <span className="text-[10px] text-slate-400">Historical Log Queries</span>
                              </div>
                            </div>
                            <div className="flex flex-col items-end gap-1 select-none">
                              <span className="px-2 py-0.5 text-[10px] font-mono font-medium rounded-full bg-slate-855 text-slate-300 border border-slate-700/50 flex items-center gap-1">
                                <span>qwen2.5-coder:1.5b</span>
                                <ChevronDown className="w-3 h-3 text-slate-500" />
                              </span>
                              <span className="text-[9px] text-slate-500 font-mono">1.9 GB VRAM • 120ms Latency</span>
                            </div>
                          </div>

                        </div>

                        {/* Footer section */}
                        <div className="mt-4 pt-3 border-t border-slate-800/60 flex items-center justify-between text-[10px] text-slate-500 font-semibold select-none">
                          <div className="flex items-center gap-1">
                            <span>Status: Connected</span>
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                            <span className="text-emerald-500">online</span>
                          </div>
                          <span>Total System Load: 45%</span>
                          <button title="Settings" className="p-0.5 rounded hover:bg-slate-800 transition-colors text-slate-500 hover:text-slate-300 cursor-pointer">
                            <Settings className="w-3.5 h-3.5" />
                          </button>
                        </div>

                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Controls */}
              <div className="flex items-center space-x-1.5 z-10 shrink-0">
                <button
                  onClick={() => setIsExpanded(!isExpanded)}
                  title={isExpanded ? 'Standard Width' : 'Expand Drawer'}
                  className={`p-2.5 rounded-xl transition-all cursor-pointer ${
                    isDark
                      ? 'hover:bg-emerald-500/10 text-slate-400 hover:text-emerald-300 border border-transparent hover:border-emerald-500/20'
                      : 'hover:bg-emerald-100 text-slate-600'
                  }`}
                >
                  {isExpanded ? <Minimize2 className="w-4.5 h-4.5" /> : <Maximize2 className="w-4.5 h-4.5" />}
                </button>
                <button
                  onClick={clearChat}
                  title="Clear Chat History"
                  className={`p-2.5 rounded-xl transition-all cursor-pointer ${
                    isDark
                      ? 'hover:bg-red-500/10 text-slate-400 hover:text-red-400 border border-transparent hover:border-red-500/20'
                      : 'hover:bg-red-50 text-slate-500 hover:text-red-600'
                  }`}
                >
                  <Trash2 className="w-4.5 h-4.5" />
                </button>
                <button
                  onClick={() => setIsOpen(false)}
                  title="Close Drawer"
                  className={`p-2.5 rounded-xl transition-all cursor-pointer ${
                    isDark
                      ? 'hover:bg-emerald-500/10 text-slate-400 hover:text-white border border-transparent hover:border-emerald-500/20'
                      : 'hover:bg-emerald-100 text-slate-600'
                  }`}
                >
                  <X className="w-4.5 h-4.5" />
                </button>
              </div>
            </div>

            {/* QUICK SUGGESTIONS CHIPS */}
            <div
              className={`px-5 py-3 border-b flex items-center gap-2.5 overflow-x-auto no-scrollbar shrink-0 text-xs sm:text-sm ${
                isDark ? 'border-emerald-900/20 bg-[#06080d]' : 'border-emerald-100 bg-emerald-50/50'
              }`}
            >
              <Sparkles className="w-4 h-4 text-emerald-400 shrink-0" />
              {suggestionChips.map((chip, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSendMessage(chip.query)}
                  disabled={loading}
                  className={`px-3.5 py-1.5 rounded-xl whitespace-nowrap transition-all cursor-pointer font-medium border flex items-center gap-1.5 shrink-0 ${
                    isDark
                      ? 'bg-emerald-950/40 border-emerald-800/40 text-emerald-300 hover:bg-emerald-800/50 hover:border-emerald-400'
                      : 'bg-white border-emerald-200 text-emerald-800 hover:bg-emerald-100'
                  }`}
                >
                  {chip.label}
                </button>
              ))}
            </div>

            {/* CHAT MESSAGES BODY */}
            <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-5 flex flex-col">
              {messages.map((msg) => {
                const isUser = msg.sender === 'user';
                return (
                  <motion.div
                    key={msg.id}
                    initial={{ opacity: 0, y: 8, scale: 0.98 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    transition={{ duration: 0.2 }}
                    className={`flex items-start space-x-3.5 ${isUser ? 'justify-end' : 'justify-start'}`}
                  >
                    {!isUser && (
                      <div className="shrink-0 mt-0.5">
                        <CutePlantAvatar state={botState === 'speaking' ? 'speaking' : 'idle'} size={40} />
                      </div>
                    )}
                    <div className="flex flex-col space-y-1.5 max-w-[85%]">
                      <div
                        className={`px-5 py-3.5 rounded-2xl text-xs sm:text-sm md:text-base leading-relaxed whitespace-pre-wrap shadow-md ${
                          isUser
                            ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-slate-950 font-semibold rounded-tr-none shadow-emerald-500/20'
                            : isDark
                            ? 'bg-[#101522]/95 text-slate-100 border border-emerald-900/40 rounded-tl-none backdrop-blur-md'
                            : 'bg-slate-100 text-slate-800 rounded-tl-none border border-slate-200'
                        }`}
                      >
                        {msg.text}
                      </div>
                      {msg.timestamp && (
                        <span
                          className={`text-[11px] px-1 font-mono ${
                            isUser ? 'text-right text-emerald-400/80' : 'text-slate-500'
                          }`}
                        >
                          {msg.timestamp}
                        </span>
                      )}
                    </div>
                    {isUser && (
                      <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-emerald-600 to-teal-500 flex items-center justify-center shrink-0 text-slate-950 font-bold text-sm shadow-md">
                        🌱
                      </div>
                    )}
                  </motion.div>
                );
              })}

              {/* THINKING INDICATOR */}
              {loading && (
                <motion.div
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex items-center space-x-3.5"
                >
                  <div className="shrink-0">
                    <CutePlantAvatar state="thinking" size={42} />
                  </div>
                  <div
                    className={`px-4.5 py-3 rounded-2xl flex items-center space-x-2.5 border ${
                      isDark
                        ? 'bg-[#101522] border-emerald-900/40 text-emerald-400'
                        : 'bg-emerald-50 border-emerald-200 text-emerald-700'
                    }`}
                  >
                    <RefreshCw className="w-4 h-4 animate-spin text-emerald-400" />
                    <span className="text-xs sm:text-sm font-medium font-mono animate-pulse">
                      HydroSprout is thinking... 🍃
                    </span>
                  </div>
                </motion.div>
              )}
              <div ref={chatEndRef} />
            </div>

            {/* INPUT FORM - SHORT & CUTE CAPSULE BAR */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSendMessage();
              }}
              className={`p-4 sm:p-5 border-t shrink-0 ${
                isDark ? 'border-emerald-900/40 bg-[#080b11]' : 'bg-slate-50 border-emerald-100'
              }`}
            >
              <div
                className={`flex items-center gap-3 p-2 pl-5 rounded-2xl border transition-all ${
                  isDark
                    ? 'bg-[#121724] border-emerald-900/70 focus-within:border-emerald-400 focus-within:ring-2 focus-within:ring-emerald-400/20 shadow-xl'
                    : 'bg-white border-emerald-300 focus-within:border-emerald-500 focus-within:ring-2 focus-within:ring-emerald-500/20 shadow-md'
                }`}
              >
                <input
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Ask AI companion... 🌱"
                  className={`flex-1 bg-transparent text-sm sm:text-base font-sans placeholder-slate-500 focus:outline-none py-2 min-w-0 ${
                    isDark ? 'text-slate-100' : 'text-slate-800'
                  }`}
                />
                <button
                  type="submit"
                  disabled={loading || !query.trim()}
                  className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-400 hover:from-emerald-400 hover:to-teal-300 disabled:opacity-30 disabled:cursor-not-allowed text-slate-950 font-extrabold transition-all shrink-0 cursor-pointer shadow-lg shadow-emerald-500/25 active:scale-95 flex items-center justify-center"
                  title="Send Message"
                >
                  <Send className="w-5 h-5" />
                </button>
              </div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};
