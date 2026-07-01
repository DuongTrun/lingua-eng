"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/useAuthStore";
import Sidebar from "@/components/Sidebar";

interface GrammarStructure {
  id: string;
  pattern: string;
  vietnameseMeaning: string;
  usageContext: string;
  exampleStyle: string;
  exampleResponse: string;
  exampleTranslation: string;
  category: "Lashes" | "Hair" | "Checkout" | "Small Talk";
}

const BEAUTY_GRAMMARS: GrammarStructure[] = [
  // Nối mi - Lashes
  {
    id: "g1",
    pattern: "I highly recommend [style] for your eye shape because...",
    vietnameseMeaning: "Em rất khuyên dùng [kiểu dáng] cho dáng mắt của chị bởi vì...",
    usageContext: "Tư vấn kiểu mi phù hợp với mắt khách hàng (Cat-eye, Doll-eye...).",
    exampleStyle: "I highly recommend a hybrid set with a D-curl for your eye shape because it will make your eyes look bigger.",
    exampleResponse: "That sounds great, let's go with that!",
    exampleTranslation: "Em khuyên nên nối một bộ hybrid độ cong D cho dáng mắt của chị vì nó sẽ giúp mắt trông to tròn hơn.",
    category: "Lashes"
  },
  {
    id: "g2",
    pattern: "Would you prefer a natural length or something longer/fuller?",
    vietnameseMeaning: "Chị thích độ dài tự nhiên hay thích dài hơn/dày hơn ạ?",
    usageContext: "Xác định mong muốn của khách về độ dày và độ dài của mi nối.",
    exampleStyle: "Would you prefer a natural length or something longer like 12mm?",
    exampleResponse: "I think a natural length is fine, maybe around 10mm or 11mm.",
    exampleTranslation: "Chị thích độ dài tự nhiên hay dài hơn tầm 12mm ạ?",
    category: "Lashes"
  },
  {
    id: "g3",
    pattern: "Please make sure not to get your lashes wet for the first [number] hours.",
    vietnameseMeaning: "Vui lòng giữ cho mi nối của chị không bị dính nước trong vòng [số] giờ đầu nhé.",
    usageContext: "Dặn dò khách chăm sóc mi sau khi làm xong (Aftercare).",
    exampleStyle: "Please make sure not to get your lashes wet for the first 24 hours to let the glue fully dry.",
    exampleResponse: "Okay, I will be careful when washing my face.",
    exampleTranslation: "Vui lòng giữ cho mi nối của chị không dính nước trong 24 giờ đầu để keo khô hoàn toàn nhé.",
    category: "Lashes"
  },
  // Nối tóc - Hair
  {
    id: "g4",
    pattern: "To achieve this look, we will need to use [extensions type]...",
    vietnameseMeaning: "Để đạt được kiểu tóc này, chúng ta cần sử dụng [loại tóc nối]...",
    usageContext: "Tư vấn phương pháp nối tóc phù hợp để có kiểu tóc mong muốn.",
    exampleStyle: "To achieve this look, we will need to use tape-in extensions to add both length and volume.",
    exampleResponse: "Will it damage my natural hair?",
    exampleTranslation: "Để đạt được kiểu tóc này, chúng ta cần sử dụng tóc nối dạng dán để vừa tăng chiều dài vừa tăng độ dày.",
    category: "Hair"
  },
  {
    id: "g5",
    pattern: "Since your hair is [condition], I recommend using...",
    vietnameseMeaning: "Vì tóc của chị đang bị [tình trạng], em khuyên nên dùng...",
    usageContext: "Đưa ra lời khuyên dựa trên tình trạng tóc thật của khách hàng.",
    exampleStyle: "Since your hair is a bit fine, I recommend using micro-bead extensions so it won't feel too heavy.",
    exampleResponse: "Okay, I trust your recommendation.",
    exampleTranslation: "Vì tóc của chị hơi mảnh/yếu, em khuyên nên dùng nối hạt kim loại để mối nối không bị quá nặng.",
    category: "Hair"
  },
  {
    id: "g6",
    pattern: "How does the tension feel? Is it too tight or just right?",
    vietnameseMeaning: "Chị cảm thấy độ căng thế nào ạ? Có bị chặt quá hay vừa vặn rồi ạ?",
    usageContext: "Hỏi khách về cảm giác đau/chặt khi đang khâu hoặc thắt mối nối tóc.",
    exampleStyle: "How does the tension feel on your scalp? Is it too tight?",
    exampleResponse: "It feels fine, not too tight at all.",
    exampleTranslation: "Chị cảm thấy độ căng trên da đầu thế nào ạ? Có bị chặt quá không?",
    category: "Hair"
  },
  // Thanh toán & Chăm sóc khách - Checkout & Small Talk
  {
    id: "g7",
    pattern: "Your total comes to $[amount]. How would you like to pay?",
    vietnameseMeaning: "Tổng hóa đơn của chị hết $[số tiền]. Chị muốn thanh toán thế nào ạ?",
    usageContext: "Hỏi phương thức thanh toán khi checkout (Cash, Card, Venmo...).",
    exampleStyle: "Your total comes to $120. How would you like to pay today, cash or card?",
    exampleResponse: "I will pay with card, please.",
    exampleTranslation: "Tổng hóa đơn của chị hết 120 đô ạ. Hôm nay chị muốn trả tiền mặt hay quẹt thẻ?",
    category: "Checkout"
  },
  {
    id: "g8",
    pattern: "Would you like to book your next fill/maintenance appointment now?",
    vietnameseMeaning: "Chị có muốn đặt lịch hẹn dặm mi/nâng mối nối lần tới luôn không ạ?",
    usageContext: "Mời khách đặt lịch hẹn cho lần sau trước khi ra về.",
    exampleStyle: "Would you like to book your next fill appointment in two weeks to keep them looking fresh?",
    exampleResponse: "Yes, please. Let's schedule it for next Friday.",
    exampleTranslation: "Chị có muốn đặt lịch dặm mi lần tới sau hai tuần nữa luôn để mi luôn đẹp không?",
    category: "Checkout"
  }
];

export default function GrammarPage() {
  const router = useRouter();
  const { user, isAuthenticated, loadUser } = useAuthStore();
  const [selectedCategory, setSelectedCategory] = useState<"All" | "Lashes" | "Hair" | "Checkout">("All");
  const [flippedCardId, setFlippedCardId] = useState<string | null>(null);

  useEffect(() => {
    const checkAuth = async () => {
      await loadUser();
      if (!useAuthStore.getState().isAuthenticated) {
        router.push("/login");
      }
    };
    checkAuth();
  }, [loadUser, router]);

  if (!isAuthenticated || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <span className="material-symbols-outlined text-primary text-5xl animate-spin">sync</span>
      </div>
    );
  }

  const filteredGrammars = BEAUTY_GRAMMARS.filter(
    (g) => selectedCategory === "All" || g.category === selectedCategory
  );

  return (
    <div className="bg-background min-h-screen text-on-surface flex flex-col md:flex-row relative">
      <Sidebar activeItem="grammar" />

      <main className="flex-grow md:pl-[280px] mt-16 md:mt-0 p-6 md:p-margin-page relative z-10 overflow-y-auto max-w-container-max mx-auto w-full pb-unit-xl">
        <header className="mb-8">
          <h2 className="text-3xl font-extrabold text-on-surface flex items-center gap-3">
            <span className="material-symbols-outlined text-amber-600 text-3xl">menu_book</span>
            Cấu trúc Ngữ pháp Salon
          </h2>
          <p className="text-body-lg text-on-surface-variant mt-2 text-sm max-w-2xl">
            Học các mẫu câu đàm thoại thiết yếu để giao tiếp tự nhiên với khách hàng tại tiệm Mi và Tóc. Bấm vào thẻ để lật xem câu ví dụ thực tế.
          </p>
        </header>

        {/* Filter Categories */}
        <div className="flex flex-wrap gap-2 mb-8 bg-surface-container-low p-1.5 rounded-2xl border border-outline-variant/30 w-max max-w-full">
          {(["All", "Lashes", "Hair", "Checkout"] as const).map((cat) => (
            <button
              key={cat}
              onClick={() => {
                setSelectedCategory(cat);
                setFlippedCardId(null);
              }}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                selectedCategory === cat
                  ? "bg-amber-500 text-white shadow-sm"
                  : "text-on-surface-variant hover:bg-surface-variant/50"
              }`}
            >
              {cat === "All" ? "Tất cả" : cat === "Lashes" ? "Nối Mi" : cat === "Hair" ? "Nối/Làm Tóc" : "Thanh Toán"}
            </button>
          ))}
        </div>

        {/* Grid of Grammar Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {filteredGrammars.map((g) => {
            const isFlipped = flippedCardId === g.id;
            return (
              <div
                key={g.id}
                onClick={() => setFlippedCardId(isFlipped ? null : g.id)}
                className="h-64 flashcard-container cursor-pointer select-none"
              >
                <div
                  className={`relative w-full h-full flashcard-inner rounded-2xl border border-outline-variant/30 bg-pure-white shadow-sm hover:shadow-md ${
                    isFlipped ? "flashcard-flipped" : ""
                  }`}
                >
                  {/* FRONT SIDE */}
                  <div className="absolute inset-0 p-6 flex flex-col justify-between flashcard-face">
                    <div>
                      <div className="flex justify-between items-center mb-4">
                        <span className="text-[10px] uppercase tracking-wider font-extrabold px-2.5 py-1 bg-amber-500/10 text-amber-700 rounded-full">
                          {g.category === "Lashes" ? "Nối Mi" : g.category === "Hair" ? "Nối Tóc" : "Thanh Toán"}
                        </span>
                        <span className="material-symbols-outlined text-outline-variant text-lg">flip</span>
                      </div>
                      <h3 className="text-lg font-bold text-on-surface leading-snug font-mono text-primary mb-2">
                        {g.pattern}
                      </h3>
                      <p className="text-xs text-on-surface-variant italic font-semibold">
                        💡 {g.vietnameseMeaning}
                      </p>
                    </div>
                    <div className="text-[11px] text-outline flex items-center gap-1 font-bold">
                      <span className="material-symbols-outlined text-[14px]">info</span>
                      Ngữ cảnh: {g.usageContext}
                    </div>
                  </div>

                  {/* BACK SIDE */}
                  <div className="absolute inset-0 p-6 flex flex-col justify-between bg-amber-500/5 flashcard-face flashcard-back">
                    <div>
                      <div className="flex justify-between items-center mb-4">
                        <span className="text-xs font-bold text-amber-700">Ví dụ đàm thoại thực tế</span>
                        <span className="material-symbols-outlined text-amber-400 text-lg">flip</span>
                      </div>
                      <div className="space-y-3">
                        <div>
                          <p className="text-xs text-outline font-bold">Thợ nói (Stylist/Lash Tech):</p>
                          <p className="text-sm font-bold text-on-surface leading-relaxed">
                            &quot;{g.exampleStyle}&quot;
                          </p>
                          <p className="text-xs text-on-surface-variant italic">
                            ({g.exampleTranslation})
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-outline font-bold">Khách trả lời (Client):</p>
                          <p className="text-sm font-semibold text-slate-700 italic">
                            &quot;{g.exampleResponse}&quot;
                          </p>
                        </div>

                      </div>
                    </div>
                    <div className="text-[11px] text-amber-700 font-extrabold flex items-center gap-1">
                      <span className="material-symbols-outlined text-[14px]">touch_app</span>
                      Bấm để xem lại cấu trúc câu
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </main>
    </div>
  );
}
