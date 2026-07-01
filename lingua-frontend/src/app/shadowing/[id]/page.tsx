"use client";

import React, { useEffect, useState, useRef } from "react";
import { useRouter, useParams } from "next/navigation";
import { useAuthStore } from "@/store/useAuthStore";
import { api } from "@/lib/api";

interface WordFeedback {
  word: string;
  status: "correct" | "mispronounced" | "missed";
  feedback?: string;
}

interface EvaluationResponse {
  score: number;
  words: WordFeedback[];
}

interface PassageDetail {
  id: string;
  title: string;
  referenceText: string;
  vietnameseTranslation: string;
  level: string;
  topic: string;
  duration: string;
  bestScore: number | null;
}

export default function ShadowingPracticePage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;

  const { token, isAuthenticated, loadUser } = useAuthStore();

  const [passage, setPassage] = useState<PassageDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [recordingState, setRecordingState] = useState<"idle" | "recording" | "processing" | "done">("idle");
  const [recordingTime, setRecordingTime] = useState(0);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [spokenText, setSpokenText] = useState("");
  const [evaluation, setEvaluation] = useState<EvaluationResponse | null>(null);
  const [errorMessage, setErrorMessage] = useState("");

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const recognitionRef = useRef<any>(null);
  const timerIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Khởi động Auth check
  useEffect(() => {
    const checkAuth = async () => {
      await loadUser();
      if (!useAuthStore.getState().isAuthenticated) {
        router.push("/login");
      }
    };
    checkAuth();
  }, [loadUser, router]);

  // Load chi tiết bài Shadowing
  useEffect(() => {
    if (isAuthenticated && token && id) {
      const fetchPassage = async () => {
        try {
          const response = await api.get(`/shadowing/passages/${id}`);
          setPassage(response.data);
        } catch (error) {
          console.error("Lỗi khi tải chi tiết bài shadowing:", error);
          setErrorMessage("Không thể tải thông tin bài luyện tập.");
        } finally {
          setLoading(false);
        }
      };
      fetchPassage();
    }
  }, [isAuthenticated, token, id]);

  // Khởi tạo SpeechRecognition
  useEffect(() => {
    if (typeof window !== "undefined") {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SpeechRecognition) {
        const rec = new SpeechRecognition();
        rec.continuous = false;
        rec.interimResults = false;
        rec.lang = "en-US";

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        rec.onresult = (event: any) => {
          const transcript = event.results[0][0].transcript;
          setSpokenText(transcript);
        };

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        rec.onerror = (event: any) => {
          console.error("Lỗi nhận dạng giọng nói:", event.error);
          if (event.error !== "no-speech") {
            setErrorMessage(`Lỗi micro: ${event.error}. Vui lòng kiểm tra lại mic.`);
          }
        };

        recognitionRef.current = rec;
      }
    }
  }, []);

  // Hủy timers & clean URLs khi unmount
  useEffect(() => {
    return () => {
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
      if (audioUrl) URL.revokeObjectURL(audioUrl);
    };
  }, [audioUrl]);

  // Đọc câu chuẩn mẫu (TTS)
  const playNativeAudio = () => {
    if (!passage) return;
    if (typeof window !== "undefined" && window.speechSynthesis) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(passage.referenceText);
      utterance.lang = "en-US";
      utterance.rate = 0.85; // nói hơi chậm cho dễ nghe
      window.speechSynthesis.speak(utterance);
    }
  };

  // Bắt đầu ghi âm
  const startRecording = async () => {
    setErrorMessage("");
    setSpokenText("");
    setEvaluation(null);
    if (audioUrl) {
      URL.revokeObjectURL(audioUrl);
      setAudioUrl(null);
    }
    audioChunksRef.current = [];

    try {
      // 1. Xin quyền micro và thiết lập MediaRecorder
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: "audio/webm" });
        const url = URL.createObjectURL(audioBlob);
        setAudioUrl(url);
        stream.getTracks().forEach((track) => track.stop());
      };

      // 2. Bắt đầu ghi âm và nhận dạng giọng nói cùng lúc
      mediaRecorder.start();
      if (recognitionRef.current) {
        recognitionRef.current.start();
      }

      setRecordingState("recording");
      setRecordingTime(0);

      // 3. Khởi chạy timer
      timerIntervalRef.current = setInterval(() => {
        setRecordingTime((prev) => prev + 1);
      }, 1000);

    } catch (error) {
      console.error("Lỗi truy cập micro:", error);
      setErrorMessage("Không thể truy cập microphone. Vui lòng cấp quyền micro cho trình duyệt.");
    }
  };

  // Dừng ghi âm
  const stopRecording = () => {
    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
    }

    if (mediaRecorderRef.current && mediaRecorderRef.current.state === "recording") {
      mediaRecorderRef.current.stop();
    }

    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }

    setRecordingState("processing");

    // Đợi 1.5 giây để SpeechRecognition cập nhật kết quả transcript rồi gửi lên AI chấm điểm
    setTimeout(() => {
      submitEvaluation();
    }, 1500);
  };

  // Gửi lên backend chấm điểm phát âm bằng Gemini
  const submitEvaluation = async () => {
    // Lấy transcript cuối cùng được lưu trong state, nếu trống thì tìm từ ref/state
    setSpokenText((currentSpoken) => {
      if (!currentSpoken.trim()) {
        setRecordingState("idle");
        setErrorMessage("Chúng mình không nghe thấy tiếng bạn nói. Hãy bấm nút micro và thử đọc lại nhé!");
        return "";
      }

      if (!passage) return currentSpoken;

      const evaluate = async () => {
        try {
          const response = await api.post("/shadowing/evaluate", {
            passageId: passage.id,
            passageTitle: passage.title,
            referenceText: passage.referenceText,
            spokenText: currentSpoken,
          });

          setEvaluation(response.data);
          setRecordingState("done");
        } catch (error: unknown) {
          console.error("Lỗi khi chấm điểm phát âm:", error);
          const msg = error instanceof Error ? error.message : "Không thể kết nối tới dịch vụ AI chấm điểm.";
          setErrorMessage(msg);
          setRecordingState("idle");
        }
      };

      evaluate();
      return currentSpoken;
    });
  };

  // Nghe lại giọng của bản thân
  const playSelfVoice = () => {
    if (audioUrl) {
      const audio = new Audio(audioUrl);
      audio.play();
    }
  };

  // Format thời gian đếm giây
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  // Reset để luyện lại
  const handleTryAgain = () => {
    setEvaluation(null);
    setSpokenText("");
    if (audioUrl) {
      URL.revokeObjectURL(audioUrl);
      setAudioUrl(null);
    }
    setRecordingState("idle");
    setErrorMessage("");
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <span className="material-symbols-outlined text-primary text-5xl animate-spin">sync</span>
      </div>
    );
  }

  if (errorMessage && !passage) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-background">
        <span className="material-symbols-outlined text-error text-5xl mb-4">error</span>
        <p className="text-on-surface font-bold text-center mb-6">{errorMessage}</p>
        <button
          onClick={() => router.push("/shadowing")}
          className="py-2.5 px-6 bg-primary text-pure-white font-bold rounded-xl text-sm transition-all"
        >
          Quay lại danh sách
        </button>
      </div>
    );
  }

  const passageDetail = passage!;

  // Chọn màu sắc hiển thị vòng tròn điểm
  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-emerald-500 border-emerald-500 bg-emerald-50";
    if (score >= 50) return "text-amber-500 border-amber-500 bg-amber-50";
    return "text-error-rose border-error-rose bg-red-50";
  };

  return (
    <div className="bg-background min-h-screen text-on-surface flex flex-col md:flex-row relative">
      
      {/* Focused Mode Header */}
      <div className="absolute top-6 left-0 right-0 px-6 md:px-12 flex justify-between items-center max-w-4xl mx-auto w-full z-10">
        <button
          onClick={() => router.push("/shadowing")}
          className="flex items-center gap-2 text-on-surface-variant hover:text-primary transition-colors cursor-pointer group"
        >
          <span className="material-symbols-outlined text-lg group-hover:-translate-x-0.5 transition-transform">arrow_back</span>
          <span className="text-sm font-bold text-on-surface truncate max-w-[200px] md:max-w-xs">
            Quay lại
          </span>
        </button>

        <div className="flex items-center gap-2">
          <span className="px-2.5 py-0.5 bg-primary/10 text-primary text-[10px] font-extrabold rounded-full uppercase">
            Cấp độ {passageDetail.level}
          </span>
          <span className="px-2.5 py-0.5 bg-secondary/10 text-secondary text-[10px] font-extrabold rounded-full uppercase">
            {passageDetail.topic}
          </span>
        </div>

        <button
          onClick={() => router.push("/shadowing")}
          className="text-on-surface-variant hover:text-error-rose transition-colors cursor-pointer"
          title="Đóng phiên học"
        >
          <span className="material-symbols-outlined">close</span>
        </button>
      </div>

      {/* Main Focused Container */}
      <main className="flex-grow flex flex-col items-center justify-center p-6 mt-16 md:mt-0 relative min-h-screen max-w-4xl mx-auto w-full">
        
        {/* Error message flash */}
        {errorMessage && (
          <div className="w-full max-w-xl mb-4 bg-error-container/30 border border-error-rose/20 text-error text-xs font-semibold px-4 py-3 rounded-xl flex items-center gap-2 animate-[fadeIn_0.3s_ease-out]">
            <span className="material-symbols-outlined text-sm shrink-0">error</span>
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Section 1: Passage Detail Card */}
        <section className="w-full max-w-2xl bg-pure-white rounded-2xl p-6 md:p-8 border border-outline-variant/30 shadow-sm mb-8 flex flex-col items-center">
          <h2 className="text-sm text-outline font-bold uppercase tracking-widest mb-4">Câu luyện phát âm mẫu</h2>
          <div className="text-center w-full">
            <h1 className="text-xl md:text-2xl font-extrabold text-on-surface leading-relaxed select-all">
              {passageDetail.referenceText}
            </h1>
            <p className="text-sm md:text-base text-on-surface-variant italic mt-3">
              {passageDetail.vietnameseTranslation}
            </p>
          </div>

          {/* Button Speaker */}
          <button
            onClick={playNativeAudio}
            className="mt-6 flex items-center gap-2 px-5 py-2.5 bg-primary/5 hover:bg-primary/10 text-primary font-bold rounded-full text-sm transition-all cursor-pointer active:scale-95"
            title="Nghe phát âm chuẩn"
          >
            <span className="material-symbols-outlined text-lg" style={{ fontVariationSettings: "'FILL' 1" }}>
              volume_up
            </span>
            Nghe phát âm mẫu
          </button>
        </section>

        {/* Section 2: Recording Interactive Area */}
        <section className="w-full max-w-2xl flex flex-col items-center mb-8">
          
          {recordingState === "idle" && (
            <div className="flex flex-col items-center">
              <button
                onClick={startRecording}
                className="w-20 h-20 rounded-full bg-primary text-pure-white flex items-center justify-center hover:bg-primary/95 transition-all shadow-md shadow-primary/10 active:scale-95 cursor-pointer"
                title="Bắt đầu ghi âm"
              >
                <span className="material-symbols-outlined text-3xl">mic</span>
              </button>
              <p className="text-xs font-extrabold text-on-surface-variant tracking-wider uppercase mt-4">
                Bấm nút để bắt đầu đọc
              </p>
            </div>
          )}

          {recordingState === "recording" && (
            <div className="flex flex-col items-center">
              <button
                onClick={stopRecording}
                className="w-20 h-20 rounded-full bg-error-rose text-pure-white flex items-center justify-center animate-[pulse_1.5s_infinite] shadow-md shadow-error-rose/20 cursor-pointer"
                title="Bấm để dừng và chấm điểm"
              >
                <span className="material-symbols-outlined text-3xl">stop</span>
              </button>
              <div className="flex items-center gap-2 mt-4 text-error-rose font-bold text-sm">
                <span className="h-2 w-2 rounded-full bg-error-rose animate-ping"></span>
                <span>Đang ghi âm... {formatTime(recordingTime)}</span>
              </div>
            </div>
          )}

          {recordingState === "processing" && (
            <div className="flex flex-col items-center">
              <div className="w-20 h-20 rounded-full bg-outline-variant/30 flex items-center justify-center">
                <span className="material-symbols-outlined text-primary text-3xl animate-spin">sync</span>
              </div>
              <p className="text-xs font-extrabold text-primary tracking-wider uppercase mt-4 animate-pulse">
                Gemini đang phân tích phát âm...
              </p>
            </div>
          )}
        </section>

        {/* Section 3: AI Evaluation Result Panel */}
        {recordingState === "done" && evaluation && (
          <section className="w-full max-w-2xl bg-pure-white rounded-2xl p-6 md:p-8 border border-outline-variant/30 shadow-md flex flex-col gap-6 animate-[fadeIn_0.5s_ease-out] mb-12">
            
            {/* Score & Audio play back */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-6 pb-6 border-b border-outline-variant/20">
              <div className="flex items-center gap-4">
                <div className={`w-20 h-20 rounded-full border-4 flex flex-col items-center justify-center font-black ${getScoreColor(evaluation.score)}`}>
                  <span className="text-2xl">{evaluation.score}</span>
                  <span className="text-[10px] leading-none uppercase tracking-wider text-outline font-bold">/ 100</span>
                </div>
                <div>
                  <h3 className="font-extrabold text-lg">Kết quả phát âm</h3>
                  <p className="text-xs text-on-surface-variant mt-0.5">
                    {evaluation.score >= 80
                      ? "Tuyệt vời! Bạn phát âm cực kỳ chuẩn xác rồi đấy."
                      : evaluation.score >= 50
                      ? "Khá tốt! Bạn chỉ cần cải thiện một vài từ nữa thôi."
                      : "Hãy tiếp tục luyện tập nhé! Bạn sẽ tiến bộ rất nhanh đấy."}
                  </p>
                </div>
              </div>

              {/* Play back recorded voice */}
              {audioUrl && (
                <button
                  onClick={playSelfVoice}
                  className="flex items-center gap-2 px-4 py-2 border border-secondary text-secondary font-bold rounded-xl text-xs hover:bg-secondary/5 transition-all cursor-pointer active:scale-95"
                >
                  <span className="material-symbols-outlined text-sm">play_arrow</span>
                  Nghe lại giọng của bạn
                </button>
              )}
            </div>

            {/* Word-by-word Breakdown */}
            <div>
              <h4 className="text-xs font-bold text-outline uppercase tracking-wider mb-3">Đánh giá chi tiết từng từ</h4>
              
              {/* Word Chips */}
              <div className="flex flex-wrap gap-2 text-sm leading-loose">
                {evaluation.words.map((w, index) => {
                  if (w.status === "correct") {
                    return (
                      <span
                        key={index}
                        className="px-3 py-1 bg-emerald-50 border border-emerald-200 text-emerald-700 font-bold rounded-xl flex items-center gap-1 cursor-default select-none"
                      >
                        {w.word}
                        <span className="material-symbols-outlined text-xs text-emerald-600 font-black">check</span>
                      </span>
                    );
                  }

                  if (w.status === "mispronounced") {
                    return (
                      <div key={index} className="relative group">
                        <span className="px-3 py-1 bg-rose-50 border border-rose-200 text-error-rose font-bold rounded-xl flex items-center gap-1 cursor-help select-none">
                          {w.word}
                          <span className="material-symbols-outlined text-xs text-error-rose font-black">close</span>
                        </span>
                        
                        {/* Simple Tooltip on Hover */}
                        {w.feedback && (
                          <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 w-52 bg-slate-900 text-pure-white text-[11px] p-2.5 rounded-lg shadow-lg z-20 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity">
                            <span className="font-bold block text-primary-fixed mb-0.5">Mẹo phát âm:</span>
                            {w.feedback}
                            {/* Arrow */}
                            <div className="absolute top-full left-1/2 transform -translate-x-1/2 -mt-1 w-2 h-2 bg-slate-900 rotate-45"></div>
                          </div>
                        )}
                      </div>
                    );
                  }

                  // Missed/Omitted words
                  return (
                    <span
                      key={index}
                      className="px-3 py-1 bg-surface border border-dashed border-outline-variant/60 text-outline font-semibold rounded-xl flex items-center gap-1 cursor-default select-none"
                      title="Từ này bạn bị bỏ sót hoặc AI không nghe rõ"
                    >
                      {w.word}
                      <span className="material-symbols-outlined text-xs text-outline">help_outline</span>
                    </span>
                  );
                })}
              </div>
            </div>

            {/* Đoạn text nhận diện */}
            <div className="bg-surface-container-low p-4 rounded-xl border border-outline-variant/20">
              <span className="text-[10px] font-bold uppercase tracking-wider text-outline block mb-1">Giọng đọc của bạn (Text nhận dạng)</span>
              <p className="text-sm font-semibold italic text-on-surface-variant">&ldquo;{spokenText}&rdquo;</p>
            </div>

            {/* General AI Tip Box */}
            {evaluation.words.some((w) => w.status === "mispronounced" && w.feedback) && (
              <div className="bg-primary/5 border border-primary/10 rounded-xl p-4 flex gap-3 items-start">
                <span className="material-symbols-outlined text-primary text-xl shrink-0">lightbulb</span>
                <div>
                  <h4 className="font-bold text-sm text-primary">Mẹo huấn luyện từ AI Coach</h4>
                  <p className="text-xs text-on-surface-variant leading-relaxed mt-1">
                    Chú ý các âm bị lỗi màu đỏ. Bạn hãy rà chuột (hoặc chạm điện thoại) vào các từ màu đỏ để xem chi tiết cách sửa đổi khẩu hình miệng và luyện phát âm tốt hơn nhé!
                  </p>
                </div>
              </div>
            )}

            {/* Action buttons */}
            <div className="flex gap-4 mt-2">
              <button
                onClick={handleTryAgain}
                className="flex-1 py-3 border border-outline text-on-surface font-bold rounded-xl text-sm hover:bg-surface-container-low transition-all cursor-pointer flex items-center justify-center gap-2"
              >
                <span className="material-symbols-outlined text-sm">replay</span>
                Luyện lại câu này
              </button>
              
              <button
                onClick={() => router.push("/shadowing")}
                className="flex-1 py-3 bg-primary text-pure-white font-bold rounded-xl text-sm hover:bg-primary/95 transition-all cursor-pointer flex items-center justify-center gap-2 shadow-sm shadow-primary/10"
              >
                Tiếp tục bài khác
                <span className="material-symbols-outlined text-sm">arrow_forward</span>
              </button>
            </div>

          </section>
        )}
      </main>
    </div>
  );
}
