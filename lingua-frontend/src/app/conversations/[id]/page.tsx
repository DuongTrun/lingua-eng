"use client";

import React, { useEffect, useState, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/useAuthStore";
import { useConversationStore, GrammarFeedback, ConversationMessage } from "@/store/useConversationStore";
import Sidebar from "@/components/Sidebar";

interface SpeechRecognitionResult {
  transcript: string;
}

interface SpeechRecognitionEvent {
  results: {
    [index: number]: {
      [index: number]: SpeechRecognitionResult;
    };
  };
}

interface SpeechRecognitionErrorEvent {
  error: string;
}

interface SpeechRecognitionInstance {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  onstart: (() => void) | null;
  onresult: ((event: SpeechRecognitionEvent) => void) | null;
  onerror: ((event: SpeechRecognitionErrorEvent) => void) | null;
  onend: (() => void) | null;
  start: () => void;
  stop: () => void;
}

interface SpeechRecognitionWindow extends Window {
  SpeechRecognition?: new () => SpeechRecognitionInstance;
  webkitSpeechRecognition?: new () => SpeechRecognitionInstance;
}

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function ConversationChatPage({ params }: PageProps) {
  const router = useRouter();
  const { user, isAuthenticated, loadUser } = useAuthStore();
  const {
    activeSession,
    messages,
    currentReport,
    isLoading,
    fetchSessionDetails,
    sendMessage,
    endSession,
    resetActiveSession,
  } = useConversationStore();

  const [sessionId, setSessionId] = useState<string | null>(null);
  const [inputText, setInputText] = useState("");
  const [isVoiceMode, setIsVoiceMode] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [recognition, setRecognition] = useState<SpeechRecognitionInstance | null>(null);
  const [expandedFeedbackId, setExpandedFeedbackId] = useState<string | null>(null);
  const [showReport, setShowReport] = useState(false);
  const [showEndConfirm, setShowEndConfirm] = useState(false);

  // 🔊 TTS (Text-to-Speech) States
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [speakingMessageId, setSpeakingMessageId] = useState<string | null>(null);
  const prevMessagesLenRef = useRef(0);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Await params on mount
  useEffect(() => {
    params.then((p) => {
      setSessionId(p.id);
    });
  }, [params]);

  // Check authentication
  useEffect(() => {
    const checkAuth = async () => {
      await loadUser();
      if (!useAuthStore.getState().isAuthenticated) {
        router.push("/login");
      }
    };
    checkAuth();
  }, [loadUser, router]);

  // Fetch session details on mount/sessionId change
  useEffect(() => {
    if (sessionId) {
      fetchSessionDetails(sessionId).catch(() => {
        router.push("/conversations");
      });
    }
  }, [sessionId, fetchSessionDetails, router]);

  // Auto scroll to bottom of messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // If session is already completed, show report directly
  useEffect(() => {
    if (activeSession?.status === "COMPLETED") {
      setShowReport(true);
    }
  }, [activeSession]);

  // Initialize Speech Recognition API
  useEffect(() => {
    if (typeof window !== "undefined") {
      const win = window as unknown as SpeechRecognitionWindow;
      const SpeechRecognition = win.SpeechRecognition || win.webkitSpeechRecognition;
      if (SpeechRecognition) {
        const rec = new SpeechRecognition();
        rec.continuous = false;
        rec.interimResults = false;
        rec.lang = "en-US";

        rec.onstart = () => {
          setIsRecording(true);
        };

        rec.onresult = (event: SpeechRecognitionEvent) => {
          const transcript = event.results[0][0].transcript;
          if (transcript) {
            setInputText(transcript);
          }
        };

        rec.onerror = (event: SpeechRecognitionErrorEvent) => {
          console.error("Speech recognition error:", event.error);
          setIsRecording(false);
        };

        rec.onend = () => {
          setIsRecording(false);
        };

        setRecognition(rec);
      }
    }
  }, []);

  // Textarea auto-resize
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${Math.min(128, textareaRef.current.scrollHeight)}px`;
    }
  }, [inputText]);

  // 🔊 TTS: Đọc to một đoạn text bằng giọng nói tiếng Anh
  const speakText = useCallback((text: string, messageId?: string) => {
    if (typeof window === "undefined" || !window.speechSynthesis) return;

    // Dừng bất kỳ giọng nói nào đang phát
    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = "en-US";
    utterance.rate = 0.92; // Tốc độ hơi chậm hơn bình thường để dễ nghe
    utterance.pitch = 1.0;

    // Ưu tiên chọn giọng nữ tiếng Anh Mỹ nếu có
    const voices = window.speechSynthesis.getVoices();
    const preferredVoice = voices.find(
      (v) => v.lang.startsWith("en") && v.name.toLowerCase().includes("female")
    ) || voices.find(
      (v) => v.lang.startsWith("en-US")
    ) || voices.find(
      (v) => v.lang.startsWith("en")
    );
    if (preferredVoice) utterance.voice = preferredVoice;

    utterance.onstart = () => {
      setIsSpeaking(true);
      if (messageId) setSpeakingMessageId(messageId);
    };
    utterance.onend = () => {
      setIsSpeaking(false);
      setSpeakingMessageId(null);
    };
    utterance.onerror = () => {
      setIsSpeaking(false);
      setSpeakingMessageId(null);
    };

    window.speechSynthesis.speak(utterance);
  }, []);

  // 🔊 Dừng giọng nói
  const stopSpeaking = useCallback(() => {
    if (typeof window !== "undefined" && window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
    setIsSpeaking(false);
    setSpeakingMessageId(null);
  }, []);

  // 🔊 Auto-speak: Tự động đọc câu trả lời AI khi ở Voice Mode
  useEffect(() => {
    if (!isVoiceMode || messages.length === 0) {
      prevMessagesLenRef.current = messages.length;
      return;
    }

    // Chỉ trigger khi có tin nhắn mới được thêm vào
    if (messages.length > prevMessagesLenRef.current) {
      const lastMsg = messages[messages.length - 1];
      if (lastMsg.sender === "AI" && lastMsg.text) {
        speakText(lastMsg.text, lastMsg.id);
      }
    }
    prevMessagesLenRef.current = messages.length;
  }, [messages, isVoiceMode, speakText]);

  // 🔊 Dừng giọng nói khi chuyển sang Text Mode hoặc unmount
  useEffect(() => {
    if (!isVoiceMode) {
      stopSpeaking();
    }
  }, [isVoiceMode, stopSpeaking]);

  useEffect(() => {
    return () => {
      if (typeof window !== "undefined" && window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  const handleSend = async () => {
    if (!inputText.trim() || isLoading) return;
    const textToSend = inputText;
    setInputText("");
    try {
      await sendMessage(textToSend);
    } catch (e) {
      console.error(e);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleToggleMic = () => {
    if (!recognition) {
      alert("Trình duyệt của bạn không hỗ trợ nhận diện giọng nói Web Speech API.");
      return;
    }

    if (isRecording) {
      recognition.stop();
    } else {
      try {
        recognition.start();
      } catch {
        // Recognition start failed
      }
    }
  };

  const handleEndConversation = async () => {
    try {
      setShowEndConfirm(false);
      await endSession();
      setShowReport(true);
    } catch (err) {
      console.error("Failed to end session:", err);
    }
  };

  const handleCloseSession = () => {
    resetActiveSession();
    router.push("/conversations");
  };

  if (!isAuthenticated || !user || !activeSession) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <span className="material-symbols-outlined text-primary text-5xl animate-spin">sync</span>
      </div>
    );
  }

  // Parse feedback from JSON
  const getGrammarFeedback = (msg: ConversationMessage): GrammarFeedback | null => {
    if (!msg.grammarFeedback) return null;
    try {
      return JSON.parse(msg.grammarFeedback) as GrammarFeedback;
    } catch {
      return null;
    }
  };

  return (
    <div className="bg-background min-h-screen text-on-surface flex flex-col md:flex-row relative overflow-hidden h-screen">
      {/* Decorative background blobs */}
      <div aria-hidden="true" className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute top-[-10%] left-[-10%] w-[35vw] h-[35vw] rounded-full bg-primary-fixed-dim/10 blur-[80px]"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[45vw] h-[45vw] rounded-full bg-secondary-fixed-dim/10 blur-[100px]"></div>
      </div>

      {/* Navigation Sidebar */}
      <Sidebar activeItem="conversations" />

      {/* Main Content Wrapper */}
      <div className="flex-1 flex flex-col md:ml-[280px] h-full relative z-10">
        {/* Chat Container */}
        <main className="flex-grow overflow-hidden flex flex-col w-full max-w-[760px] mx-auto px-4 md:px-6 relative">
          
          {/* Chat Header */}
          <div className="flex items-center justify-between py-4 border-b border-outline-variant/20 bg-background/80 backdrop-blur-md z-10 shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary border border-primary/20 shadow-sm select-none font-bold text-xl">
                🗣️
              </div>
              <div>
                <h2 className="text-base md:text-lg font-bold text-on-surface leading-tight flex items-center gap-2">
                  AI Partner
                  <span className="w-2 h-2 rounded-full bg-secondary-fixed-dim animate-pulse"></span>
                </h2>
                <p className="text-[11px] font-bold text-on-surface-variant flex items-center gap-1 uppercase tracking-wider">
                  <span>💼 {activeSession.scenario} — {activeSession.level}</span>
                </p>
              </div>
            </div>
            
            {activeSession.status === "ACTIVE" ? (
              <button 
                onClick={() => setShowEndConfirm(true)}
                className="px-4 py-2 rounded-xl border border-error-rose/40 text-error-rose text-xs font-bold hover:bg-error-rose/5 transition-all flex items-center gap-2 active:scale-95 cursor-pointer"
              >
                <span className="material-symbols-outlined text-[18px]">close</span>
                <span className="hidden sm:inline">End Conversation</span>
              </button>
            ) : (
              <button 
                onClick={() => setShowReport(true)}
                className="px-4 py-2 rounded-xl bg-primary text-on-primary text-xs font-bold hover:bg-primary-container transition-all flex items-center gap-2 active:scale-95 cursor-pointer shadow-sm"
              >
                <span className="material-symbols-outlined text-[18px]">analytics</span>
                <span>Xem báo cáo</span>
              </button>
            )}
          </div>

          {/* Chat Messages Area */}
          <div className="flex-1 overflow-y-auto py-6 space-y-6 px-1 chat-scroll scroll-smooth flex flex-col">
            {messages.map((msg, index) => {
              const isAI = msg.sender === "AI";
              const feedback = getGrammarFeedback(msg);
              const isFeedbackExpanded = expandedFeedbackId === msg.id;

              return (
                <div 
                  key={msg.id || index} 
                  className={`flex flex-col gap-1 max-w-[85%] ${isAI ? "self-start items-start" : "self-end items-end"}`}
                >
                  <div className="flex gap-3 items-end">
                    {isAI && (
                      <div className="w-8 h-8 rounded-full bg-primary/10 text-primary border border-primary/20 flex items-center justify-center font-bold text-xs select-none shrink-0 mb-1">
                        🤖
                      </div>
                    )}
                    
                    <div 
                      className={`p-4 rounded-2xl shadow-sm relative ${
                        isAI 
                          ? "bg-primary-fixed text-on-surface rounded-bl-none border border-outline-variant/10" 
                          : "bg-primary-container text-pure-white rounded-br-none"
                      }`}
                    >
                      <p className="text-sm md:text-base font-normal leading-relaxed whitespace-pre-wrap">
                        {msg.text}
                      </p>

                      {/* 🔊 Nút nghe lại giọng AI */}
                      {isAI && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            if (speakingMessageId === msg.id) {
                              stopSpeaking();
                            } else {
                              speakText(msg.text, msg.id);
                            }
                          }}
                          className={`absolute -bottom-2 -right-2 w-7 h-7 rounded-full flex items-center justify-center transition-all cursor-pointer shadow-sm border ${
                            speakingMessageId === msg.id
                              ? "bg-primary text-pure-white border-primary/30 animate-pulse"
                              : "bg-surface text-primary border-outline-variant/30 hover:bg-primary/10"
                          }`}
                          title={speakingMessageId === msg.id ? "Dừng đọc" : "Nghe AI đọc"}
                        >
                          <span className="material-symbols-outlined text-[16px]" style={{ fontVariationSettings: "'FILL' 1" }}>
                            {speakingMessageId === msg.id ? "stop" : "volume_up"}
                          </span>
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Grammar feedback section for User messages */}
                  {!isAI && feedback && (
                    <div className="mt-1 flex flex-col items-end">
                      {feedback.isCorrect ? (
                        <div className="bg-secondary/10 text-secondary border border-secondary/30 px-3 py-1 rounded-full text-[10px] font-extrabold flex items-center gap-1 select-none shadow-sm">
                          <span>✅</span> Grammar OK
                        </div>
                      ) : (
                        <div className="flex flex-col items-end">
                          <button
                            onClick={() => setExpandedFeedbackId(isFeedbackExpanded ? null : msg.id)}
                            className="bg-tertiary-fixed text-on-tertiary-fixed px-3 py-1 rounded-full text-[10px] font-extrabold flex items-center gap-1 shadow-sm hover:bg-tertiary transition-colors active:scale-95 group cursor-pointer border border-tertiary/20"
                          >
                            <span>⚠️</span> {feedback.issues.length} {feedback.issues.length === 1 ? "grammar issue" : "grammar issues"}
                            <span className={`material-symbols-outlined text-[14px] ml-0.5 transition-transform duration-200 ${isFeedbackExpanded ? "rotate-180" : ""}`}>
                              expand_more
                            </span>
                          </button>

                          {/* Expanded Feedback Panel */}
                          {isFeedbackExpanded && (
                            <div className="mt-2 bg-amber-50/95 text-slate-800 rounded-xl p-4 border border-amber-200/80 shadow-md text-xs space-y-3 max-w-md animate-[fadeIn_0.2s_ease-out] text-left">
                              <div>
                                <h4 className="font-extrabold text-amber-800 uppercase tracking-wider text-[9px] mb-1">Phân tích lỗi:</h4>
                                <ul className="list-disc list-inside space-y-1 text-slate-700">
                                  {feedback.issues.map((issue, idx) => (
                                    <li key={idx} className="leading-relaxed">{issue}</li>
                                  ))}
                                </ul>
                              </div>
                              <div className="pt-2 border-t border-amber-200/50">
                                <h4 className="font-extrabold text-teal-800 uppercase tracking-wider text-[9px] mb-1">Gợi ý cách nói tự nhiên:</h4>
                                <p className="font-semibold text-teal-950 bg-teal-50/50 p-2 rounded-lg border border-teal-100 italic">
                                  &quot;{feedback.suggestion}&quot;
                                </p>
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}

            {/* AI Loading Message */}
            {isLoading && (
              <div className="flex gap-3 items-end max-w-[85%] self-start animate-pulse">
                <div className="w-8 h-8 rounded-full bg-primary/10 text-primary border border-primary/20 flex items-center justify-center font-bold text-xs select-none shrink-0 mb-1">
                  🤖
                </div>
                <div className="bg-primary-fixed text-on-surface rounded-2xl rounded-bl-none p-4 shadow-sm border border-outline-variant/10 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-primary/60 animate-bounce"></span>
                  <span className="w-2 h-2 rounded-full bg-primary/60 animate-bounce [animation-delay:0.2s]"></span>
                  <span className="w-2 h-2 rounded-full bg-primary/60 animate-bounce [animation-delay:0.4s]"></span>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Chat Input Area */}
          {activeSession.status === "ACTIVE" && (
            <div className="pt-4 pb-8 border-t border-outline-variant/20 bg-background shrink-0 mt-auto relative z-20">
              {/* Toggle Mode */}
              <div className="flex justify-center mb-4">
                <div className="bg-surface-container-high rounded-full p-1 flex items-center shadow-inner select-none">
                  <button 
                    onClick={() => {
                      setIsVoiceMode(true);
                      if (isRecording) recognition?.stop();
                    }}
                    className={`px-4 py-1.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider transition-all cursor-pointer ${
                      isVoiceMode 
                        ? "bg-surface shadow-sm text-primary" 
                        : "text-on-surface-variant hover:text-on-surface"
                    }`}
                  >
                    🎤 Voice mode
                  </button>
                  <button 
                    onClick={() => {
                      setIsVoiceMode(false);
                      if (isRecording) recognition?.stop();
                    }}
                    className={`px-4 py-1.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider transition-all cursor-pointer ${
                      !isVoiceMode 
                        ? "bg-surface shadow-sm text-primary" 
                        : "text-on-surface-variant hover:text-on-surface"
                    }`}
                  >
                    ⌨️ Text mode
                  </button>
                </div>
              </div>

              {/* Input Box */}
              <div className="relative flex items-end gap-2 bg-surface-container-lowest rounded-2xl border border-outline-variant/30 p-2 shadow-sm focus-within:border-primary focus-within:ring-1 focus-within:ring-primary transition-all">
                {isVoiceMode ? (
                  <button 
                    onClick={handleToggleMic}
                    className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 active:scale-95 transition-all relative cursor-pointer ${
                      isRecording 
                        ? "bg-error-rose text-white recording-pulse" 
                        : "bg-surface-container-high text-primary hover:bg-primary-container hover:text-pure-white"
                    }`}
                  >
                    <span className="material-symbols-outlined text-[28px] style={{ fontVariationSettings: `'FILL' 1` }}">
                      {isRecording ? "stop" : "mic"}
                    </span>
                  </button>
                ) : (
                  <div className="w-1"></div>
                )}

                {/* Text Area */}
                <textarea 
                  ref={textareaRef}
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder={
                    isVoiceMode 
                      ? (isRecording ? "Đang lắng nghe... Hãy nói tiếng Anh..." : "Nhấn nút Mic để bắt đầu nói tiếng Anh...") 
                      : "Type your message or use the mic..."
                  }
                  rows={1}
                  disabled={isLoading || isRecording}
                  className="w-full bg-transparent border-none focus:ring-0 resize-none py-3 px-2 text-sm text-on-surface placeholder:text-outline max-h-32 chat-scroll outline-none leading-relaxed"
                  style={{ minHeight: "48px" }}
                />

                {/* Send Button */}
                <button 
                  onClick={handleSend}
                  disabled={isLoading || !inputText.trim() || isRecording}
                  className="w-12 h-12 rounded-xl bg-primary-container text-pure-white hover:bg-primary transition-colors flex items-center justify-center shrink-0 shadow-md active:scale-95 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
                >
                  <span className="material-symbols-outlined text-[24px]">send</span>
                </button>
              </div>

              {/* Keyboard Tip */}
              <div className="text-center mt-3 select-none">
                <p className="text-[10px] text-outline font-semibold">
                  Gõ tiếng Anh để luyện viết • Nhấn <kbd className="bg-surface-container-high px-1.5 py-0.5 rounded border border-outline-variant/30 font-sans font-bold">Enter</kbd> để gửi
                </p>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* Confirmation Modal to End Session */}
      {showEndConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-[fadeIn_0.2s_ease-out]">
          <div className="bg-surface-container-lowest rounded-2xl max-w-sm w-full p-6 border border-outline-variant/30 shadow-2xl relative text-center">
            <div className="w-12 h-12 rounded-full bg-error-rose/10 text-error-rose flex items-center justify-center mx-auto mb-4">
              <span className="material-symbols-outlined text-2xl font-bold">warning</span>
            </div>
            <h3 className="text-lg font-bold text-on-surface">Kết thúc hội thoại?</h3>
            <p className="text-xs text-on-surface-variant mt-2 leading-relaxed">
              Bạn có chắc chắn muốn kết thúc phiên trò chuyện này để chấm điểm? Cuộc hội thoại cần ít nhất 3 tin nhắn để có thể đánh giá.
            </p>
            <div className="flex gap-3 mt-6">
              <button 
                onClick={() => setShowEndConfirm(false)}
                className="flex-grow py-2.5 rounded-xl border border-outline-variant/50 hover:bg-surface-container-low font-bold text-xs text-on-surface transition-all active:scale-[0.98] cursor-pointer"
              >
                Tiếp tục trò chuyện
              </button>
              <button 
                onClick={handleEndConversation}
                className="flex-grow bg-error hover:bg-error-rose text-white py-2.5 rounded-xl font-bold text-xs shadow-sm transition-all active:scale-[0.98] cursor-pointer"
              >
                Đồng ý kết thúc
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Report Card Modal */}
      {showReport && currentReport && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md overflow-y-auto">
          <div className="bg-surface-container-lowest rounded-[24px] max-w-2xl w-full p-6 md:p-8 border border-outline-variant/30 shadow-2xl relative glass-panel my-8 animate-[fadeIn_0.3s_ease-out]">
            
            {/* Header Section */}
            <div className="text-center mb-6">
              <div className="text-[54px] leading-none mb-3 animate-bounce inline-block">🎉</div>
              <h2 className="text-2xl md:text-3xl font-extrabold text-primary mb-1">
                Conversation Finished!
              </h2>
              <p className="text-xs text-on-surface-variant">
                {activeSession.scenario} — {activeSession.level} • Nhận được +50 XP
              </p>
            </div>

            {/* Metrics Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
              {/* Grammar */}
              <div className="bg-surface-container-low rounded-xl p-4 flex flex-col items-center justify-center border border-outline-variant/20 text-center shadow-sm">
                <span className="text-headline-md font-extrabold text-primary mb-0.5">
                  {currentReport.scoreGrammar}
                </span>
                <span className="text-[9px] font-extrabold text-on-surface-variant uppercase tracking-wider">Grammar</span>
              </div>
              {/* Vocabulary */}
              <div className="bg-surface-container-low rounded-xl p-4 flex flex-col items-center justify-center border border-outline-variant/20 text-center shadow-sm">
                <span className="text-headline-md font-extrabold text-secondary mb-0.5">
                  {currentReport.scoreVocabulary}
                </span>
                <span className="text-[9px] font-extrabold text-on-surface-variant uppercase tracking-wider">Vocabulary</span>
              </div>
              {/* Fluency */}
              <div className="bg-surface-container-low rounded-xl p-4 flex flex-col items-center justify-center border border-outline-variant/20 text-center shadow-sm">
                <span className="text-headline-md font-extrabold text-amber-600 mb-0.5">
                  {currentReport.scoreFluency}
                </span>
                <span className="text-[9px] font-extrabold text-on-surface-variant uppercase tracking-wider">Fluency</span>
              </div>
              {/* Relevance */}
              <div className="bg-surface-container-low rounded-xl p-4 flex flex-col items-center justify-center border border-outline-variant/20 text-center shadow-sm">
                <span className="text-headline-md font-extrabold text-teal-600 mb-0.5">
                  {currentReport.scoreRelevance}
                </span>
                <span className="text-[9px] font-extrabold text-on-surface-variant uppercase tracking-wider">Relevance</span>
              </div>
            </div>

            {/* Feedback Details */}
            <div className="space-y-4 mb-8">
              <div className="bg-secondary/5 rounded-2xl p-5 border border-secondary/20 shadow-inner">
                <h3 className="font-extrabold text-secondary text-xs uppercase tracking-wider flex items-center gap-1.5 mb-2">
                  <span className="material-symbols-outlined text-[18px]" style={{ fontVariationSettings: "'FILL' 1" }}>
                    thumb_up
                  </span>
                  Điểm mạnh (Strengths)
                </h3>
                <p className="text-xs text-on-surface-variant leading-relaxed font-medium">
                  {currentReport.feedbackStrength}
                </p>
              </div>

              <div className="bg-tertiary/5 rounded-2xl p-5 border border-tertiary/20 shadow-inner">
                <h3 className="font-extrabold text-tertiary text-xs uppercase tracking-wider flex items-center gap-1.5 mb-2">
                  <span className="material-symbols-outlined text-[18px]">
                    trending_up
                  </span>
                  Cần cải thiện (Improvements)
                </h3>
                <p className="text-xs text-on-surface-variant leading-relaxed font-medium">
                  {currentReport.feedbackImprovement}
                </p>
              </div>
            </div>

            {/* Footer Actions */}
            <div className="flex flex-col sm:flex-row gap-4">
              <button 
                onClick={() => setShowReport(false)}
                className="flex-1 py-3 px-4 rounded-xl border border-primary text-primary font-bold text-sm hover:bg-primary/5 transition-all active:scale-[0.98] cursor-pointer flex items-center justify-center gap-1.5"
              >
                <span className="material-symbols-outlined text-[18px]">forum</span>
                Xem lại lịch sử chat
              </button>
              <button 
                onClick={handleCloseSession}
                className="flex-1 bg-primary hover:bg-primary-container text-on-primary py-3 px-4 rounded-xl font-bold text-sm shadow-sm transition-all active:scale-[0.98] cursor-pointer flex items-center justify-center gap-1.5"
              >
                <span className="material-symbols-outlined text-[18px]">dashboard</span>
                Trang chủ đề kịch bản
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
