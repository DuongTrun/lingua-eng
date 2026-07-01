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
  {
    id: "g9",
    pattern: "If you feel any stinging or burning, please let me know immediately.",
    vietnameseMeaning: "Nếu chị cảm thấy bị cay hay rát mắt, vui lòng báo cho em biết ngay nhé.",
    usageContext: "Nhắc nhở khách báo ngay khi bị cay mắt do hơi keo khi đang nối mi.",
    exampleStyle: "If you feel any stinging or burning during the process, please let me know immediately.",
    exampleResponse: "Actually, it's burning a little bit right now in my left eye.",
    exampleTranslation: "Nếu chị cảm thấy bị cay hay rát mắt trong quá trình nối, vui lòng bảo em ngay nhé.",
    category: "Lashes"
  },
  {
    id: "g10",
    pattern: "Do you prefer a cat-eye look or a doll-eye look?",
    vietnameseMeaning: "Chị thích dáng mi mắt mèo (dài ở đuôi) hay dáng mắt búp bê (dài ở giữa) ạ?",
    usageContext: "Hỏi khách về phong cách dáng mi (mapping) yêu thích.",
    exampleStyle: "Do you prefer a cat-eye look to wing out your eyes, or a doll-eye look to make them look rounder?",
    exampleResponse: "I'd like a cat-eye look, please. I like it a bit dramatic.",
    exampleTranslation: "Chị thích dáng mi mắt mèo để kéo dài mắt ra, hay dáng mắt búp bê để mắt trông tròn hơn?",
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
  {
    id: "g11",
    pattern: "How many inches of length are you looking to add today?",
    vietnameseMeaning: "Hôm nay chị muốn nối dài thêm khoảng bao nhiêu inch ạ?",
    usageContext: "Xác định độ dài tóc nối mà khách mong muốn (ví dụ: 18 inches, 22 inches).",
    exampleStyle: "How many inches of length are you looking to add today? We have eighteen, twenty, and twenty-four inches.",
    exampleResponse: "I think twenty inches would be perfect for me.",
    exampleTranslation: "Hôm nay chị muốn nối dài thêm khoảng bao nhiêu inch ạ? Chúng em có loại 18, 20 và 24 inch.",
    category: "Hair"
  },
  {
    id: "g12",
    pattern: "We should do a color match to see which extension shade blends best with your hair.",
    vietnameseMeaning: "Chúng ta nên so tông màu để xem mã màu tóc nối nào tiệp nhất với tóc thật của chị.",
    usageContext: "So màu tóc của khách và tóc nối trước khi thực hiện.",
    exampleStyle: "We should do a color match first to see which extension shade blends best with your natural hair.",
    exampleResponse: "Yes, please. My ends are a bit lighter than my roots.",
    exampleTranslation: "Chúng ta nên so tông màu trước để xem mã màu tóc nối nào tiệp nhất với tóc thật của chị.",
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
  },
  {
    id: "g13",
    pattern: "How did you like your service today? Is there anything you'd like to adjust?",
    vietnameseMeaning: "Chị cảm thấy dịch vụ hôm nay thế nào ạ? Có phần nào chị muốn chỉnh sửa lại không?",
    usageContext: "Hỏi phản hồi của khách hàng sau khi hoàn thành dịch vụ làm đẹp.",
    exampleStyle: "How did you like your service today? Is there anything you'd like to adjust before you leave?",
    exampleResponse: "I love it! The length is absolutely perfect.",
    exampleTranslation: "Chị cảm thấy dịch vụ hôm nay thế nào ạ? Có phần nào chị muốn chỉnh sửa lại trước khi về không?",
    category: "Checkout"
  },
  {
    id: "g14",
    pattern: "Are you planning anything special for the upcoming holiday?",
    vietnameseMeaning: "Chị có kế hoạch gì đặc biệt cho kỳ nghỉ sắp tới không?",
    usageContext: "Trò chuyện xã giao thân mật (Small Talk) để tạo không khí thoải mái cho khách.",
    exampleStyle: "Are you planning anything special for the upcoming holiday? Any traveling?",
    exampleResponse: "We're going to visit family in Florida for a week.",
    exampleTranslation: "Chị có kế hoạch gì đặc biệt cho kỳ nghỉ sắp tới không? Có đi du lịch đâu không ạ?",
    category: "Checkout"
  },
  // Nhóm mới bổ sung cho đủ 30 cấu trúc
  // Nối mi - Lashes (Tiếp tục)
  {
    id: "g15",
    pattern: "Your natural lashes are a bit weak, so we should use a lighter thickness.",
    vietnameseMeaning: "Mi thật của chị hơi yếu, nên chúng ta nên dùng độ dày mỏng nhẹ hơn.",
    usageContext: "Tư vấn độ dày mi để bảo vệ mi thật không bị gãy rụng.",
    exampleStyle: "Your natural lashes are a bit weak, so we should use a point zero five thickness for the volume set.",
    exampleResponse: "That makes sense. I don't want to damage my real lashes.",
    exampleTranslation: "Mi thật của chị hơi yếu, nên chúng ta nên dùng độ dày 0.05 cho bộ mi volume nhé.",
    category: "Lashes"
  },
  {
    id: "g16",
    pattern: "Please try to keep your eyes completely closed and relaxed.",
    vietnameseMeaning: "Chị vui lòng cố gắng nhắm mắt hoàn toàn và thả lỏng nhé.",
    usageContext: "Dặn khách nhắm mắt và thư giãn trong lúc dán gel pad hoặc đang nối mi.",
    exampleStyle: "Please try to keep your eyes completely closed and relaxed during the application.",
    exampleResponse: "Sure, I'll probably fall asleep anyway.",
    exampleTranslation: "Chị vui lòng cố gắng nhắm mắt hoàn toàn và thả lỏng trong suốt quá trình nối mi nhé.",
    category: "Lashes"
  },
  {
    id: "g17",
    pattern: "I need to clean your lashes with a lash shampoo to remove dirt and oils.",
    vietnameseMeaning: "Em cần vệ sinh mi của chị bằng bọt rửa mi để loại bỏ bụi bẩn và dầu nhờn.",
    usageContext: "Chuẩn bị mi (prep) trước khi tiến hành nối.",
    exampleStyle: "I need to clean your lashes first with a lash shampoo to ensure the glue bonds properly.",
    exampleResponse: "Go ahead, my eyes feel a bit oily today.",
    exampleTranslation: "Em cần vệ sinh mi của chị trước bằng bọt rửa mi để đảm bảo keo bám tốt nhất.",
    category: "Lashes"
  },
  {
    id: "g18",
    pattern: "Do you want a full set or just a fill today?",
    vietnameseMeaning: "Hôm nay chị muốn nối mới cả bộ hay chỉ dặm mi thôi ạ?",
    usageContext: "Xác định gói dịch vụ nối mi khách yêu cầu.",
    exampleStyle: "Do you want a full set of hybrid lashes or just a fill today?",
    exampleResponse: "I need a full set because most of my old lashes fell out.",
    exampleTranslation: "Hôm nay chị muốn nối mới cả bộ mi hybrid hay chỉ dặm lại thôi ạ?",
    category: "Lashes"
  },
  {
    id: "g19",
    pattern: "It is normal to lose about two to five natural lashes per day.",
    vietnameseMeaning: "Việc rụng khoảng 2 đến 5 sợi mi thật mỗi ngày là hoàn toàn bình thường.",
    usageContext: "Giải thích chu kỳ rụng mi tự nhiên khi khách thắc mắc mi nối nhanh rụng.",
    exampleStyle: "It is completely normal to lose about two to five natural lashes per day due to the growth cycle.",
    exampleResponse: "Oh, I see. I was worried I was doing something wrong.",
    exampleTranslation: "Việc rụng khoảng 2 đến 5 sợi mi thật mỗi ngày là hoàn toàn bình thường do chu kỳ phát triển của tóc/mi.",
    category: "Lashes"
  },
  {
    id: "g20",
    pattern: "Do not use any oil-based makeup removers around your eyes.",
    vietnameseMeaning: "Đừng sử dụng bất kỳ nước tẩy trang dạng dầu nào quanh vùng mắt nhé.",
    usageContext: "Dặn dò aftercare phòng tránh bong keo nối mi.",
    exampleStyle: "To keep the glue strong, do not use any oil-based makeup removers around your eyes.",
    exampleResponse: "Okay, I'll switch to micellar water.",
    exampleTranslation: "Để giữ mối keo bền, chị đừng sử dụng bất kỳ nước tẩy trang dạng dầu nào quanh vùng mắt nhé.",
    category: "Lashes"
  },
  // Nối tóc - Hair (Tiếp tục)
  {
    id: "g21",
    pattern: "We need to install the extensions in sections for a seamless blend.",
    vietnameseMeaning: "Chúng ta cần chia tóc thành từng lớp để nối giúp tóc tiệp tự nhiên nhất.",
    usageContext: "Giải thích quy trình chia phân khu tóc nối.",
    exampleStyle: "We need to install the extensions in neat sections for a seamless blend with your hair.",
    exampleResponse: "Take your time, I want it to look natural.",
    exampleTranslation: "Chúng ta cần đi các tép nối theo từng phân khu gọn gàng để tóc nối tiệp tự nhiên với tóc thật.",
    category: "Hair"
  },
  {
    id: "g22",
    pattern: "You should brush your hair extensions starting from the ends and moving up.",
    vietnameseMeaning: "Chị nên chải tóc nối bắt đầu từ ngọn tóc rồi mới chải dần lên trên chân tóc.",
    usageContext: "Hướng dẫn khách chải tóc nối tránh đứt rụng.",
    exampleStyle: "You should always brush your hair extensions starting from the ends and slowly moving up to the roots.",
    exampleResponse: "Thanks for the tip, I usually brush from the top down.",
    exampleTranslation: "Chị nên chải tóc nối bắt đầu từ ngọn tóc rồi mới chải dần lên trên sát chân tóc nhé.",
    category: "Hair"
  },
  {
    id: "g23",
    pattern: "We recommend coming in for maintenance every six to eight weeks.",
    vietnameseMeaning: "Em khuyên nên quay lại tiệm để nâng mối nối sau mỗi 6 đến 8 tuần.",
    usageContext: "Tư vấn chu kỳ bảo dưỡng, nâng mối nối tóc phím/dán/keo.",
    exampleStyle: "To prevent tangling, we recommend coming in for maintenance every six to eight weeks.",
    exampleResponse: "I'll make sure to book that in advance.",
    exampleTranslation: "Để tránh tóc bị rối cục, em khuyên nên quay lại nâng mối nối sau mỗi 6 đến 8 tuần nhé.",
    category: "Hair"
  },
  {
    id: "g24",
    pattern: "Avoid applying conditioner directly onto the bonds or tapes.",
    vietnameseMeaning: "Tránh bôi dầu xả trực tiếp lên các mối keo hoặc miếng dán tóc nối.",
    usageContext: "Lưu ý khách khi gội đầu dưỡng tại nhà.",
    exampleStyle: "Avoid applying conditioner directly onto the bonds or tapes, as it can cause them to slip.",
    exampleResponse: "Got it, only apply from the mid-shaft down.",
    exampleTranslation: "Tránh bôi dầu xả trực tiếp lên các mối keo hoặc miếng dán, vì nó có thể làm tuột mối nối.",
    category: "Hair"
  },
  {
    id: "g25",
    pattern: "We should use a sulfate-free shampoo to protect the extension hair.",
    vietnameseMeaning: "Chúng ta nên dùng dầu gội không chứa sulfate để bảo vệ chất tóc nối.",
    usageContext: "Khuyên khách sử dụng dòng sản phẩm gội xả chuyên biệt.",
    exampleStyle: "We should use a sulfate-free shampoo to keep the extension hair from drying out.",
    exampleResponse: "Do you sell that shampoo here in the salon?",
    exampleTranslation: "Chúng ta nên dùng dầu gội không chứa sulfate để giữ cho tóc nối không bị khô xơ.",
    category: "Hair"
  },
  {
    id: "g26",
    pattern: "Would you like me to style it with beach waves or keep it straight?",
    vietnameseMeaning: "Chị muốn em làm xoăn sóng nước nhẹ hay để thẳng tự nhiên ạ?",
    usageContext: "Hỏi sở thích tạo kiểu tóc sau khi nối xong.",
    exampleStyle: "Would you like me to style it with beach waves today or keep it straight?",
    exampleResponse: "I'd love some beach waves for my dinner party tonight.",
    exampleTranslation: "Hôm nay chị muốn em uốn tạo kiểu xoăn sóng nước nhẹ hay để thẳng tự nhiên ạ?",
    category: "Hair"
  },
  // Giao tiếp / Checkout (Tiếp tục)
  {
    id: "g27",
    pattern: "We accept payments through Venmo, Zelle, cash, or credit card.",
    vietnameseMeaning: "Tiệm em nhận thanh toán qua Venmo, Zelle, tiền mặt hoặc thẻ tín dụng.",
    usageContext: "Liệt kê các kênh thanh toán khi khách chuẩn bị checkout.",
    exampleStyle: "We accept payments through Venmo, Zelle, cash, or credit card. Which is easiest for you?",
    exampleResponse: "I'll do Zelle, it's very convenient.",
    exampleTranslation: "Tiệm em nhận thanh toán qua Venmo, Zelle, tiền mặt hoặc thẻ tín dụng. Cái nào tiện nhất cho chị?",
    category: "Checkout"
  },
  {
    id: "g28",
    pattern: "Here is your receipt. Have a wonderful rest of your day!",
    vietnameseMeaning: "Đây là hóa đơn của chị ạ. Chúc chị một ngày tốt lành nhé!",
    usageContext: "Đưa biên lai thanh toán và chúc khách hàng khi kết thúc.",
    exampleStyle: "Here is your receipt. Thank you so much, and have a wonderful rest of your day!",
    exampleResponse: "Thank you, you too! See you next time.",
    exampleTranslation: "Đây là hóa đơn của chị ạ. Cảm ơn chị rất nhiều và chúc chị có những giờ còn lại trong ngày thật tốt lành nhé!",
    category: "Checkout"
  },
  {
    id: "g29",
    pattern: "How was your experience today? Did everything meet your expectations?",
    vietnameseMeaning: "Trải nghiệm hôm nay của chị thế nào ạ? Mọi thứ có đúng như kỳ vọng không ạ?",
    usageContext: "Kiểm tra chất lượng dịch vụ và độ hài lòng tổng quát của khách.",
    exampleStyle: "How was your experience today? Did everything meet your expectations?",
    exampleResponse: "Yes, absolutely. The salon is so clean and you did a great job.",
    exampleTranslation: "Trải nghiệm hôm nay của chị thế nào ạ? Mọi thứ có đúng như kỳ vọng của chị không?",
    category: "Checkout"
  },
  {
    id: "g30",
    pattern: "Is this your first time getting professional extensions?",
    vietnameseMeaning: "Đây là lần đầu tiên chị nối mi/nối tóc chuyên nghiệp phải không ạ?",
    usageContext: "Small talk hỏi thăm lịch sử làm đẹp của khách hàng để tư vấn sâu.",
    exampleStyle: "Is this your first time getting professional extensions, or have you had them before?",
    exampleResponse: "I had them once last year, but I wanted to try a different style this time.",
    exampleTranslation: "Đây là lần đầu tiên chị đi nối mi/tóc chuyên nghiệp phải không ạ, hay chị đã từng nối trước đây rồi?",
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
