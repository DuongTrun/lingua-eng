import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import 'dotenv/config';
import * as fs from 'fs';
import * as path from 'path';

/**
 * 🌐 LINGUA-ENG — Database Seed Script (Real Vocabulary Data)
 * 
 * File này: Nạp 60 từ vựng cốt lõi từ danh mục Oxford 3000 phổ biến nhất.
 * Chia đều làm 6 chủ đề (Travel, Business, Food, Technology, Health, Socializing).
 * Trải dài từ level A1 đến B2 phục vụ cho việc học tập lâu dài của bạn.
 */

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error('❌ Không tìm thấy biến môi trường DATABASE_URL trong file .env!');
}

const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

/** Interface mô tả cấu trúc 1 entry từ vựng trong seed data */
interface WordSeedEntry {
  word: string;
  ipa: string;
  meaning: string;
  example: string;
  exampleMeaning: string;
  level: string;
  topic: string;
  partOfSpeech?: string;
}

const wordsData: WordSeedEntry[] = [
  // ==========================================
  // 🏖️ CHỦ ĐỀ: TRAVEL (Du lịch) - 10 từ
  // ==========================================
  {
    word: 'departure',
    ipa: '/dɪˈpɑːrtʃər/',
    meaning: 'sự khởi hành, sự ra đi',
    example: 'Please check the departure board for your flight status.',
    exampleMeaning: 'Vui lòng kiểm tra bảng khởi hành để biết trạng thái chuyến bay của bạn.',
    level: 'B1',
    topic: 'Travel',
  },
  {
    word: 'destination',
    ipa: '/ˌdestɪˈneɪʃn/',
    meaning: 'điểm đến, nơi đến',
    example: 'Hawaii is a popular holiday destination.',
    exampleMeaning: 'Hawaii là một điểm đến kỳ nghỉ nổi tiếng.',
    level: 'A2',
    topic: 'Travel',
  },
  {
    word: 'accommodation',
    ipa: '/əˌkɑːməˈdeɪʃn/',
    meaning: 'chỗ ở, nơi lưu trú',
    example: 'The hotel provides comfortable accommodation for tourists.',
    exampleMeaning: 'Khách sạn cung cấp chỗ ở thoải mái cho khách du lịch.',
    level: 'B1',
    topic: 'Travel',
  },
  {
    word: 'itinerary',
    ipa: '/aɪˈtɪnəreri/',
    meaning: 'lịch trình chuyến đi',
    example: 'We had to change our itinerary due to the bad weather.',
    exampleMeaning: 'Chúng tôi phải thay đổi lịch trình chuyến đi vì thời tiết xấu.',
    level: 'B2',
    topic: 'Travel',
  },
  {
    word: 'excursion',
    ipa: '/ɪkˈskɜːrʒn/',
    meaning: 'chuyến tham quan ngắn, dã ngoại',
    example: 'We went on a day excursion to the ancient city.',
    exampleMeaning: 'Chúng tôi đã đi tham quan một ngày đến thành phố cổ kính.',
    level: 'B2',
    topic: 'Travel',
  },
  {
    word: 'reservation',
    ipa: '/ˌrezərˈveɪʃn/',
    meaning: 'sự đặt chỗ trước',
    example: 'I made a reservation for a double room at the hotel.',
    exampleMeaning: 'Tôi đã đặt trước một phòng đôi tại khách sạn.',
    level: 'A2',
    topic: 'Travel',
  },
  {
    word: 'customs',
    ipa: '/ˈkʌstəmz/',
    meaning: 'hải quan, thuế quan',
    example: 'It took us an hour to get through airport customs.',
    exampleMeaning: 'Chúng tôi mất một tiếng để đi qua cổng hải quan sân bay.',
    level: 'B1',
    topic: 'Travel',
  },
  {
    word: 'souvenir',
    ipa: '/ˌsuːvəˈnɪr/',
    meaning: 'quà lưu niệm',
    example: 'She bought a keychain as a souvenir of Paris.',
    exampleMeaning: 'Cô ấy đã mua một chiếc móc khóa làm quà lưu niệm từ Paris.',
    level: 'A2',
    topic: 'Travel',
  },
  {
    word: 'boarding',
    ipa: '/ˈbɔːrdɪŋ/',
    meaning: 'sự lên tàu/máy bay',
    example: 'Boarding starts 45 minutes before departure.',
    exampleMeaning: 'Việc lên máy bay bắt đầu 45 phút trước khi khởi hành.',
    level: 'A2',
    topic: 'Travel',
  },
  {
    word: 'baggage',
    ipa: '/ˈbæɡɪdʒ/',
    meaning: 'hành lý',
    example: 'You can check in two pieces of baggage for free.',
    exampleMeaning: 'Bạn có thể ký gửi miễn phí hai kiện hành lý.',
    level: 'A2',
    topic: 'Travel',
  },

  // ==========================================
  // 💼 CHỦ ĐỀ: BUSINESS (Công việc / Kinh doanh) - 10 từ
  // ==========================================
  {
    word: 'negotiate',
    ipa: '/nɪˈɡoʊʃieɪt/',
    meaning: 'đàm phán, thương lượng',
    example: 'The company is trying to negotiate a new contract.',
    exampleMeaning: 'Công ty đang cố gắng đàm phán một hợp đồng mới.',
    level: 'B2',
    topic: 'Business',
  },
  {
    word: 'colleague',
    ipa: '/ˈkɑːliːɡ/',
    meaning: 'đồng nghiệp',
    example: 'I would like to introduce you to my colleague, Mary.',
    exampleMeaning: 'Tôi muốn giới thiệu bạn với đồng nghiệp của tôi, Mary.',
    level: 'A2',
    topic: 'Business',
  },
  {
    word: 'agenda',
    ipa: '/əˈdʒendə/',
    meaning: 'chương trình nghị sự, nội dung cuộc họp',
    example: 'The first item on the agenda is the financial report.',
    exampleMeaning: 'Mục đầu tiên trong chương trình họp là báo cáo tài chính.',
    level: 'B1',
    topic: 'Business',
  },
  {
    word: 'deadline',
    ipa: '/ˈdedlaɪn/',
    meaning: 'hạn chót, thời hạn cuối cùng',
    example: 'We are working hard to meet the project deadline.',
    exampleMeaning: 'Chúng tôi đang làm việc chăm chỉ để kịp thời hạn của dự án.',
    level: 'A2',
    topic: 'Business',
  },
  {
    word: 'presentation',
    ipa: '/ˌpriːzenˈteɪʃn/',
    meaning: 'bài thuyết trình, trình bày',
    example: 'Her presentation on sales strategy was very impressive.',
    exampleMeaning: 'Bài thuyết trình của cô ấy về chiến lược bán hàng rất ấn tượng.',
    level: 'B1',
    topic: 'Business',
  },
  {
    word: 'agreement',
    ipa: '/əˈɡriːmənt/',
    meaning: 'sự đồng ý, hợp đồng, thỏa thuận',
    example: 'Both sides have finally reached an agreement.',
    exampleMeaning: 'Cả hai bên cuối cùng đã đạt được một thỏa thuận.',
    level: 'B1',
    topic: 'Business',
  },
  {
    word: 'transaction',
    ipa: '/trænˈzækʃn/',
    meaning: 'giao dịch',
    example: 'The online transaction was completed successfully.',
    exampleMeaning: 'Giao dịch trực tuyến đã được hoàn thành thành công.',
    level: 'B2',
    topic: 'Business',
  },
  {
    word: 'interview',
    ipa: '/ˈɪntərvjuː/',
    meaning: 'cuộc phỏng vấn',
    example: 'He has a job interview tomorrow morning.',
    exampleMeaning: 'Anh ấy có một cuộc phỏng vấn xin việc vào sáng mai.',
    level: 'A1',
    topic: 'Business',
  },
  {
    word: 'feedback',
    ipa: '/ˈfiːdbæk/',
    meaning: 'phản hồi, ý kiến đóng góp',
    example: 'We appreciate receiving feedback from our clients.',
    exampleMeaning: 'Chúng tôi trân trọng nhận được những phản hồi từ khách hàng.',
    level: 'B1',
    topic: 'Business',
  },
  {
    word: 'brainstorm',
    ipa: '/ˈbreɪnstɔːrm/',
    meaning: 'động não, thảo luận tìm ý tưởng',
    example: 'Let\'s gather to brainstorm some ideas for the marketing campaign.',
    exampleMeaning: 'Hãy tập hợp lại để cùng nghĩ ra một vài ý tưởng cho chiến dịch tiếp thị.',
    level: 'B2',
    topic: 'Business',
  },

  // ==========================================
  // 🍔 CHỦ ĐỀ: FOOD (Ẩm thực) - 10 từ
  // ==========================================
  {
    word: 'ingredients',
    ipa: '/ɪnˈɡriːdiənts/',
    meaning: 'nguyên liệu',
    example: 'Please write down all the ingredients needed for the soup.',
    exampleMeaning: 'Vui lòng viết lại tất cả các nguyên liệu cần thiết cho món súp.',
    level: 'A2',
    topic: 'Food',
  },
  {
    word: 'cuisine',
    ipa: '/kwɪˈziːn/',
    meaning: 'ẩm thực',
    example: 'Vietnamese cuisine is famous for its fresh herbs.',
    exampleMeaning: 'Ẩm thực Việt Nam nổi tiếng vì sử dụng các loại rau thơm tươi.',
    level: 'B1',
    topic: 'Food',
  },
  {
    word: 'delicious',
    ipa: '/dɪˈlɪʃəs/',
    meaning: 'ngon miệng',
    example: 'This chicken curry tastes delicious.',
    exampleMeaning: 'Món cà ri gà này ăn rất ngon.',
    level: 'A1',
    topic: 'Food',
  },
  {
    word: 'recipe',
    ipa: '/ˈresəpi/',
    meaning: 'công thức nấu ăn',
    example: 'I followed the recipe, and the cake turned out perfect.',
    exampleMeaning: 'Tôi đã làm theo đúng công thức và món bánh đã thành công mỹ mãn.',
    level: 'A2',
    topic: 'Food',
  },
  {
    word: 'beverage',
    ipa: '/ˈbevərɪdʒ/',
    meaning: 'đồ uống, thức uống',
    example: 'Water is the healthiest beverage to stay hydrated.',
    exampleMeaning: 'Nước lọc là thức uống tốt nhất cho sức khỏe để giữ nước cho cơ thể.',
    level: 'B2',
    topic: 'Food',
  },
  {
    word: 'organic',
    ipa: '/ɔːrˈɡænɪk/',
    meaning: 'hữu cơ',
    example: 'This shop sells fresh organic vegetables.',
    exampleMeaning: 'Cửa hàng này bán các loại rau hữu cơ tươi sạch.',
    level: 'B1',
    topic: 'Food',
  },
  {
    word: 'buffet',
    ipa: '/ˈbʌfeɪ/',
    meaning: 'tiệc đứng, tiệc tự chọn',
    example: 'The hotel offers a breakfast buffet every morning.',
    exampleMeaning: 'Khách sạn cung cấp tiệc buffet ăn sáng mỗi sáng.',
    level: 'B1',
    topic: 'Food',
  },
  {
    word: 'appetite',
    ipa: '/ˈæpɪtaɪt/',
    meaning: 'sự thèm ăn, lòng thèm muốn',
    example: 'Walking in the fresh air gave us a good appetite.',
    exampleMeaning: 'Đi dạo ngoài không khí trong lành giúp chúng tôi ăn ngon miệng hơn.',
    level: 'B2',
    topic: 'Food',
  },
  {
    word: 'nutrition',
    ipa: '/nuˈtrɪʃn/',
    meaning: 'dinh dưỡng',
    example: 'Good nutrition is essential for a child\'s development.',
    exampleMeaning: 'Dinh dưỡng tốt là điều cần thiết cho sự phát triển của trẻ nhỏ.',
    level: 'B1',
    topic: 'Food',
  },
  {
    word: 'gourmet',
    ipa: '/ˈɡʊrmeɪ/',
    meaning: 'sành ăn, đồ ăn cao cấp',
    example: 'He bought some gourmet chocolate from the specialty shop.',
    exampleMeaning: 'Anh ấy đã mua sô-cô-la cao cấp từ một cửa hàng chuyên biệt.',
    level: 'B2',
    topic: 'Food',
  },

  // ==========================================
  // 💻 CHỦ ĐỀ: TECHNOLOGY (Công nghệ) - 10 từ
  // ==========================================
  {
    word: 'software',
    ipa: '/ˈsɔːftwer/',
    meaning: 'phần mềm',
    example: 'You need to install the latest software updates.',
    exampleMeaning: 'Bạn cần cài đặt các bản cập nhật phần mềm mới nhất.',
    level: 'A2',
    topic: 'Technology',
  },
  {
    word: 'database',
    ipa: '/ˈdeɪtəbeɪs/',
    meaning: 'cơ sở dữ liệu',
    example: 'The customer details are stored in a secure database.',
    exampleMeaning: 'Thông tin chi tiết của khách hàng được lưu trữ trong một cơ sở dữ liệu bảo mật.',
    level: 'B1',
    topic: 'Technology',
  },
  {
    word: 'application',
    ipa: '/ˌæplɪˈkeɪʃn/',
    meaning: 'ứng dụng (app)',
    example: 'She downloaded a language learning application to her phone.',
    exampleMeaning: 'Cô ấy đã tải một ứng dụng học ngoại ngữ về điện thoại.',
    level: 'A2',
    topic: 'Technology',
  },
  {
    word: 'security',
    ipa: '/sɪˈkjʊrəti/',
    meaning: 'sự an ninh, bảo mật',
    example: 'He set a strong password to improve his account security.',
    exampleMeaning: 'Anh ấy đã đặt một mật khẩu mạnh để nâng cao tính bảo mật cho tài khoản.',
    level: 'B1',
    topic: 'Technology',
  },
  {
    word: 'encrypt',
    ipa: '/ɪnˈkrɪpt/',
    meaning: 'mã hóa',
    example: 'The system will encrypt your data to prevent leaks.',
    exampleMeaning: 'Hệ thống sẽ mã hóa dữ liệu của bạn để ngăn chặn rò rỉ.',
    level: 'B2',
    topic: 'Technology',
  },
  {
    word: 'network',
    ipa: '/ˈnetwɜːrk/',
    meaning: 'mạng lưới, kết nối mạng',
    example: 'The computer network went down for maintenance.',
    exampleMeaning: 'Mạng máy tính tạm thời ngắt kết nối để bảo trì.',
    level: 'A2',
    topic: 'Technology',
  },
  {
    word: 'interface',
    ipa: '/ˈɪntərfeɪs/',
    meaning: 'giao diện',
    example: 'The app has a very user-friendly interface.',
    exampleMeaning: 'Ứng dụng có một giao diện rất thân thiện với người dùng.',
    level: 'B2',
    topic: 'Technology',
  },
  {
    word: 'developer',
    ipa: '/dɪˈveləpər/',
    meaning: 'nhà phát triển, lập trình viên',
    example: 'Trung is a talented fullstack web developer.',
    exampleMeaning: 'Trung là một nhà phát triển web fullstack tài năng.',
    level: 'B1',
    topic: 'Technology',
  },
  {
    word: 'algorithm',
    ipa: '/ˈælɡərɪðəm/',
    meaning: 'thuật toán',
    example: 'The search engine uses a complex algorithm to rank pages.',
    exampleMeaning: 'Công cụ tìm kiếm sử dụng một thuật toán phức tạp để xếp hạng các trang.',
    level: 'B2',
    topic: 'Technology',
  },
  {
    word: 'artificial',
    ipa: '/ˌɑːrtɪˈfɪʃl/',
    meaning: 'nhân tạo',
    example: 'Artificial intelligence is changing the way we work.',
    exampleMeaning: 'Trí tuệ nhân tạo đang thay đổi cách chúng ta làm việc.',
    level: 'B1',
    topic: 'Technology',
  },

  // ==========================================
  // 🏥 CHỦ ĐỀ: HEALTH (Sức khỏe) - 10 từ
  // ==========================================
  {
    word: 'symptom',
    ipa: '/ˈsɪmptəm/',
    meaning: 'triệu chứng bệnh',
    example: 'A sore throat is a common symptom of the flu.',
    exampleMeaning: 'Đau họng là một triệu chứng phổ biến của bệnh cúm.',
    level: 'B1',
    topic: 'Health',
  },
  {
    word: 'prescription',
    ipa: '/prɪˈskrɪpʃn/',
    meaning: 'đơn thuốc, toa thuốc',
    example: 'You can only buy these pills with a doctor\'s prescription.',
    exampleMeaning: 'Bạn chỉ có thể mua những viên thuốc này theo đơn thuốc của bác sĩ.',
    level: 'B2',
    topic: 'Health',
  },
  {
    word: 'vaccine',
    ipa: '/vækˈsiːn/',
    meaning: 'vắc-xin',
    example: 'Scientists developed a vaccine within a year.',
    exampleMeaning: 'Các nhà khoa học đã phát triển thành công vắc-xin trong vòng một năm.',
    level: 'B1',
    topic: 'Health',
  },
  {
    word: 'diagnose',
    ipa: '/ˌdaɪəɡˈnoʊz/',
    meaning: 'chẩn đoán',
    example: 'The doctor diagnosed him with high blood pressure.',
    exampleMeaning: 'Bác sĩ chẩn đoán anh ấy bị huyết áp cao.',
    level: 'B2',
    topic: 'Health',
  },
  {
    word: 'infection',
    ipa: '/ɪnˈfekʃn/',
    meaning: 'sự lây nhiễm, nhiễm trùng',
    example: 'Keep the wound clean to prevent infection.',
    exampleMeaning: 'Giữ vết thương sạch sẽ để phòng tránh nhiễm trùng.',
    level: 'B1',
    topic: 'Health',
  },
  {
    word: 'therapy',
    ipa: '/ˈθerəpi/',
    meaning: 'liệu pháp, phương pháp trị liệu',
    example: 'Physical therapy helped him walk again after the accident.',
    exampleMeaning: 'Vật lý trị liệu đã giúp anh ấy đi lại được sau tai nạn.',
    level: 'B2',
    topic: 'Health',
  },
  {
    word: 'prevention',
    ipa: '/prɪˈvenʃn/',
    meaning: 'sự ngăn ngừa, phòng chống',
    example: 'Prevention is always better than cure.',
    exampleMeaning: 'Phòng bệnh bao giờ cũng tốt hơn chữa bệnh.',
    level: 'B1',
    topic: 'Health',
  },
  {
    word: 'fitness',
    ipa: '/ˈfɪtnəs/',
    meaning: 'sự sung sức, thể trạng khỏe mạnh',
    example: 'Regular exercise is key to keeping your fitness level.',
    exampleMeaning: 'Tập thể dục thường xuyên là chìa khóa để duy trì thể lực.',
    level: 'B1',
    topic: 'Health',
  },
  {
    word: 'hygiene',
    ipa: '/ˈhaɪdʒiːn/',
    meaning: 'vệ sinh cá nhân, y tế',
    example: 'Washing your hands is basic personal hygiene.',
    exampleMeaning: 'Rửa tay là bước vệ sinh cá nhân cơ bản.',
    level: 'B2',
    topic: 'Health',
  },
  {
    word: 'immune',
    ipa: '/ɪˈmjuːn/',
    meaning: 'miễn dịch',
    example: 'Vitamin C helps boost your body\'s immune system.',
    exampleMeaning: 'Vitamin C giúp tăng cường hệ miễn dịch của cơ thể.',
    level: 'B2',
    topic: 'Health',
  },

  // ==========================================
  // 👋 CHỦ ĐỀ: SOCIALIZING (Giao tiếp xã hội) - 10 từ
  // ==========================================
  {
    word: 'introduce',
    ipa: '/ˌɪntrəˈdjuːs/',
    meaning: 'giới thiệu',
    example: 'Allow me to introduce myself, I\'m Trung.',
    exampleMeaning: 'Cho phép tôi tự giới thiệu, tôi là Trung.',
    level: 'A1',
    topic: 'Socializing',
  },
  {
    word: 'relationship',
    ipa: '/rɪˈleɪʃnʃɪp/',
    meaning: 'mối quan hệ',
    example: 'They have built a strong business relationship.',
    exampleMeaning: 'Họ đã xây dựng được một mối quan hệ đối tác kinh doanh vững chắc.',
    level: 'A2',
    topic: 'Socializing',
  },
  {
    word: 'hobby',
    ipa: '/ˈhɑːbi/',
    meaning: 'sở thích',
    example: 'My favorite hobby is reading English novels.',
    exampleMeaning: 'Sở thích yêu thích nhất của tôi là đọc tiểu thuyết tiếng Anh.',
    level: 'A1',
    topic: 'Socializing',
  },
  {
    word: 'personality',
    ipa: '/ˌpɜːrsəˈnæləti/',
    meaning: 'nhân cách, tính cách',
    example: 'She has a very outgoing and warm personality.',
    exampleMeaning: 'Cô ấy có một tính cách rất hướng ngoại và ấm áp.',
    level: 'B1',
    topic: 'Socializing',
  },
  {
    word: 'conversation',
    ipa: '/ˌkɑːnvərˈseɪʃn/',
    meaning: 'cuộc trò chuyện, hội thoại',
    example: 'I had an interesting conversation with my new neighbor.',
    exampleMeaning: 'Tôi đã có một cuộc nói chuyện thú vị với người hàng xóm mới.',
    level: 'A2',
    topic: 'Socializing',
  },
  {
    word: 'compliment',
    ipa: '/ˈkɑːmplɪmənt/',
    meaning: 'lời khen ngợi, ca tụng',
    example: 'She paid him a nice compliment on his presentation.',
    exampleMeaning: 'Cô ấy đã gửi tới anh một lời khen ngợi chân thành về bài thuyết trình.',
    level: 'B2',
    topic: 'Socializing',
  },
  {
    word: 'appointment',
    ipa: '/əˈpɔɪntmənt/',
    meaning: 'cuộc hẹn, sự bổ nhiệm',
    example: 'I have an appointment with the doctor at 3:00 PM.',
    exampleMeaning: 'Tôi có lịch hẹn với bác sĩ vào lúc 3 giờ chiều.',
    level: 'A2',
    topic: 'Socializing',
  },
  {
    word: 'acquaintance',
    ipa: '/əˈkweɪntəns/',
    meaning: 'người quen, sự quen biết',
    example: 'He is not a close friend, just an acquaintance.',
    exampleMeaning: 'Anh ấy không phải bạn thân, chỉ là một người quen.',
    level: 'B2',
    topic: 'Socializing',
  },
  {
    word: 'gesture',
    ipa: '/ˈdʒestʃər/',
    meaning: 'cử chỉ, điệu bộ',
    example: 'A handshake is a common gesture of greeting.',
    exampleMeaning: 'Bắt tay là một cử chỉ chào hỏi phổ biến.',
    level: 'B1',
    topic: 'Socializing',
  },
  {
    word: 'polite',
    ipa: '/pəˈlaɪt/',
    meaning: 'lịch sự, lịch thiệp',
    example: 'It is important to be polite to other people.',
    exampleMeaning: 'Việc lịch sự đối với những người khác là rất quan trọng.',
    level: 'A2',
    topic: 'Socializing',
  },
  {
    word: 'acrylic',
    ipa: '/əˈkrɪlɪk/',
    meaning: 'chất liệu bột đắp móng (acrylic)',
    example: 'Would you like a full set of acrylic nails?',
    exampleMeaning: 'Chị có muốn làm một bộ móng đắp bột đầy đủ không?',
    level: 'B1',
    topic: 'Beauty',
    partOfSpeech: 'Adjective',
  },
  {
    word: 'cuticle',
    ipa: '/ˈkjuːtɪkl/',
    meaning: 'lớp da thừa ở viền móng',
    example: 'I need to gently trim your cuticles before applying the polish.',
    exampleMeaning: 'Em cần cắt tỉa nhẹ nhàng lớp da viền móng của chị trước khi sơn nhé.',
    level: 'B1',
    topic: 'Beauty',
    partOfSpeech: 'Noun',
  },
  {
    word: 'pedicure',
    ipa: '/ˈpedɪkjʊr/',
    meaning: 'dịch vụ chăm sóc và sơn móng chân',
    example: 'A relaxing pedicure includes a foot massage and scrub.',
    exampleMeaning: 'Dịch vụ làm móng chân thư giãn bao gồm massage chân và tẩy tế bào chết.',
    level: 'A2',
    topic: 'Beauty',
    partOfSpeech: 'Noun',
  },
  {
    word: 'manicure',
    ipa: '/ˈmænɪkjʊr/',
    meaning: 'dịch vụ chăm sóc và sơn móng tay',
    example: 'She booked a gel manicure for her wedding day.',
    exampleMeaning: 'Cô ấy đã đặt lịch làm móng tay sơn gel cho ngày cưới.',
    level: 'A2',
    topic: 'Beauty',
    partOfSpeech: 'Noun',
  },
  {
    word: 'highlight',
    ipa: '/ˈhaɪlaɪt/',
    meaning: 'nhuộm tóc highlight (sáng màu)',
    example: 'Adding some blonde highlights will make your hair look thicker.',
    exampleMeaning: 'Nhuộm thêm vài lọn highlight màu vàng sáng sẽ giúp tóc chị trông dày hơn.',
    level: 'B1',
    topic: 'Beauty',
    partOfSpeech: 'Noun',
  },
  {
    word: 'blowout',
    ipa: '/ˈbloʊaʊt/',
    meaning: 'gội sấy tạo kiểu bồng bềnh',
    example: 'I have a party tonight, so I\'d like a wash and a blowout.',
    exampleMeaning: 'Tối nay em có tiệc nên muốn gội đầu và sấy tạo kiểu bồng bềnh.',
    level: 'B1',
    topic: 'Beauty',
    partOfSpeech: 'Noun',
  },
  {
    word: 'trim',
    ipa: '/trɪm/',
    meaning: 'cắt tỉa (tóc hoặc móng)',
    example: 'I just want a light trim to get rid of my split ends.',
    exampleMeaning: 'Em chỉ muốn tỉa nhẹ một chút để loại bỏ phần tóc chẻ ngọn thôi.',
    level: 'A2',
    topic: 'Beauty',
    partOfSpeech: 'Noun',
  },
  {
    word: 'balayage',
    ipa: '/ˌbæleɪˈjɑːʒ/',
    meaning: 'kỹ thuật nhuộm tóc loang màu tự nhiên',
    example: 'Balayage is very popular because it grows out naturally without harsh lines.',
    exampleMeaning: 'Nhuộm loang màu balayage rất phổ biến vì khi tóc dài ra trông vẫn tự nhiên, không bị lộ vạch màu rõ rệt.',
    level: 'B2',
    topic: 'Beauty',
    partOfSpeech: 'Noun',
  },
  {
    word: 'polish',
    ipa: '/ˈpɑːlɪʃ/',
    meaning: 'nước sơn móng, lớp sơn',
    example: 'We have a wide variety of gel polish colors for you to choose from.',
    exampleMeaning: 'Chúng em có rất nhiều màu sơn gel đa dạng để chị lựa chọn.',
    level: 'A1',
    topic: 'Beauty',
    partOfSpeech: 'Noun',
  },
  {
    word: 'complexion',
    ipa: '/kəmˈplekʃn/',
    meaning: 'nước da, vẻ ngoài của da mặt',
    example: 'This moisturizer is great for improving dry skin complexion.',
    exampleMeaning: 'Kem dưỡng ẩm này rất tuyệt vời để cải thiện nước da khô.',
    level: 'B2',
    topic: 'Beauty',
    partOfSpeech: 'Noun',
  },
  {
    word: 'exfoliate',
    ipa: '/eksˈfoʊlieɪt/',
    meaning: 'tẩy tế bào chết',
    example: 'You should exfoliate your skin twice a week for a smooth look.',
    exampleMeaning: 'Chị nên tẩy tế bào chết cho da hai lần một tuần để có vẻ ngoài mịn màng.',
    level: 'B2',
    topic: 'Beauty',
    partOfSpeech: 'Verb',
  },
];

async function main() {
  const jsonPath = path.join(__dirname, 'words.json');
  // 💅 File chứa từ vựng chuyên ngành Nail Salon / Beauty (dữ liệu riêng cho thợ Việt tại Mỹ)
  const beautySalonPath = path.join(__dirname, 'beauty-salon-vocab.json');
  let finalWords: WordSeedEntry[] = wordsData;
  let isFromJSON = false;

  if (fs.existsSync(jsonPath)) {
    try {
      const fileContent = fs.readFileSync(jsonPath, 'utf-8');
      const jsonData = JSON.parse(fileContent);
      if (Array.isArray(jsonData) && jsonData.length > 0) {
        // Lọc ra các từ từ wordsData thuộc chủ đề Beauty để gộp vào
        const customBeautyWords = wordsData.filter(w => w.topic === 'Beauty');
        finalWords = [...jsonData, ...customBeautyWords];
        isFromJSON = true;
        console.log(`📂 Tìm thấy file words.json. Đang chuẩn bị nạp ${finalWords.length} từ vựng (gồm ${customBeautyWords.length} từ chủ đề Beauty)...`);
      }
    } catch (e) {
      console.warn('⚠️ Lỗi khi đọc file words.json, chuyển sang nạp 60 từ mặc định.');
    }
  }

  // 💅 Đọc thêm file từ vựng chuyên ngành Nail Salon nếu có
  // File này chứa ~50 từ vựng/cụm từ giao tiếp thực tế tại salon Mỹ
  // (thuật ngữ, dụng cụ, kỹ thuật, phom móng, tính tiền & tip...)
  if (fs.existsSync(beautySalonPath)) {
    try {
      const beautySalonContent = fs.readFileSync(beautySalonPath, 'utf-8');
      const beautySalonData = JSON.parse(beautySalonContent);
      if (Array.isArray(beautySalonData) && beautySalonData.length > 0) {
        finalWords = [...finalWords, ...beautySalonData];
        console.log(`💅 Tìm thấy file beauty-salon-vocab.json. Đã gộp thêm ${beautySalonData.length} từ vựng chuyên ngành Nail Salon!`);
      }
    } catch (e) {
      console.warn('⚠️ Lỗi khi đọc file beauty-salon-vocab.json, bỏ qua file này.');
    }
  }

  // 💇 Đọc thêm file từ vựng chuyên ngành Hair Salon nếu có
  // File này chứa ~50 từ vựng/cụm từ giao tiếp thực tế tại tiệm làm tóc ở Mỹ
  const hairSalonPath = path.join(__dirname, 'hair-salon-vocab.json');
  if (fs.existsSync(hairSalonPath)) {
    try {
      const hairSalonContent = fs.readFileSync(hairSalonPath, 'utf-8');
      const hairSalonData = JSON.parse(hairSalonContent);
      if (Array.isArray(hairSalonData) && hairSalonData.length > 0) {
        finalWords = [...finalWords, ...hairSalonData];
        console.log(`💇 Tìm thấy file hair-salon-vocab.json. Đã gộp thêm ${hairSalonData.length} từ vựng chuyên ngành Hair Salon!`);
      }
    } catch (e) {
      console.warn('⚠️ Lỗi khi đọc file hair-salon-vocab.json, bỏ qua file này.');
    }
  }

  // 🔄 Loại bỏ từ trùng lặp (deduplicate theo trường `word`)
  // Khi có nhiều nguồn dữ liệu (words.json, wordsData, beauty-salon-vocab.json),
  // các từ có thể xuất hiện trùng. Giữ lại bản xuất hiện SAU CÙNG (ưu tiên dữ liệu mới hơn).
  const wordMap = new Map<string, WordSeedEntry>();
  for (const w of finalWords) {
    wordMap.set(w.word.toLowerCase(), w);
  }
  finalWords = Array.from(wordMap.values());

  if (!isFromJSON) {
    console.log('🌱 Bắt đầu nạp 60 từ vựng Oxford 3000 mặc định...');
  } else {
    console.log(`🚀 Bắt đầu nạp ${finalWords.length} từ vựng thực tế (đã loại bỏ trùng lặp) vào database Supabase...`);
  }
  
  let count = 0;
  for (const w of finalWords) {
    await prisma.word.upsert({
      where: { word: w.word },
      update: {
        ipa: w.ipa,
        meaning: w.meaning,
        example: w.example,
        exampleMeaning: w.exampleMeaning,
        level: w.level,
        topic: w.topic,
        partOfSpeech: w.partOfSpeech,
      },
      create: w,
    });
    
    count++;
    if (count % 100 === 0) {
      console.log(`⚡ Tiến trình seed: Đã nạp thành công ${count}/${finalWords.length} từ...`);
    }
  }
  
  console.log(`✅ Hoàn thành! Đã nạp thành công tổng cộng ${finalWords.length} từ vựng vào database!`);

  // ==========================================
  // 🎙️ SEED: ShadowingPassage (Bài luyện đọc Shadowing mẫu)
  // ==========================================
  console.log('🌱 Bắt đầu nạp các bài Shadowing mẫu...');
  const shadowingPassages = [
    {
      title: 'At the Airport — Checking In',
      referenceText: "Good morning! I'd like to check in for my flight to London. Here is my passport and booking reference.",
      vietnameseTranslation: 'Chào buổi sáng! Tôi muốn làm thủ tục cho chuyến bay đến Luân Đôn. Đây là hộ chiếu và mã đặt chỗ của tôi.',
      level: 'B1',
      topic: 'Travel',
      duration: '0:15',
    },
    {
      title: 'Asking for Directions',
      referenceText: 'Excuse me, is there a pharmacy near here? I need to buy some medicine.',
      vietnameseTranslation: 'Xin lỗi, có hiệu thuốc nào gần đây không? Tôi cần mua một ít thuốc.',
      level: 'A2',
      topic: 'Daily Life',
      duration: '0:12',
    },
    {
      title: 'Self-Introduction in an Interview',
      referenceText: 'Hello, thank you for giving me this opportunity. My name is Trung, and I have two years of experience in fullstack web development.',
      vietnameseTranslation: 'Xin chào, cảm ơn bạn đã cho tôi cơ hội này. Tôi tên là Trung, và tôi có hai năm kinh nghiệm trong lĩnh vực phát triển web fullstack.',
      level: 'B2',
      topic: 'Business',
      duration: '0:25',
    },
    {
      title: 'Weather Report',
      referenceText: 'Heavy rain is expected to continue across the northern region until Friday, causing potential flooding in low-lying areas.',
      vietnameseTranslation: 'Mưa lớn dự kiến sẽ tiếp tục kéo dài khắp khu vực phía Bắc cho đến thứ Sáu, có khả năng gây ngập lụt ở các vùng trũng thấp.',
      level: 'B2',
      topic: 'News',
      duration: '0:18',
    },
    {
      title: 'Ordering Popcorn',
      referenceText: 'Hi, can I get one large popcorn and two medium sodas, please? We would also like to sit near the back.',
      vietnameseTranslation: 'Xin chào, tôi có thể lấy một bắp rang bơ cỡ lớn và hai ly nước ngọt cỡ vừa được không? Chúng tôi cũng muốn ngồi gần hàng ghế sau.',
      level: 'B1',
      topic: 'Movies',
      duration: '0:15',
    },
    {
      title: 'Making a Restaurant Reservation',
      referenceText: 'I would like to book a table for four people tonight at seven o\'clock, preferably near the window.',
      vietnameseTranslation: 'Tôi muốn đặt một bàn bốn người vào lúc bảy giờ tối nay, tốt nhất là ở gần cửa sổ.',
      level: 'A2',
      topic: 'Daily Life',
      duration: '0:15',
    },
    {
      title: 'Greeting and consulting at a Nail Salon',
      referenceText: "Hi! Welcome to our salon. What shape and length are you looking for today? We can do almond, square, or coffin shape.",
      vietnameseTranslation: 'Chào chị! Chào mừng chị đến với tiệm của chúng em. Hôm nay chị muốn làm móng dáng gì và độ dài thế nào ạ? Chúng em có thể làm dáng hạnh nhân, vuông hoặc quan tài.',
      level: 'A2',
      topic: 'Beauty',
      duration: '0:15',
    },
    {
      title: 'Eyelash Extensions Consultation',
      referenceText: "For your eye shape, I highly recommend a hybrid set with a D-curl to open up your eyes. Would you prefer a natural length or something longer?",
      vietnameseTranslation: 'Với dáng mắt của chị, em khuyên nên nối một bộ hybrid độ cong D để giúp mắt trông to tròn hơn. Chị thích độ dài tự nhiên hay dài hơn một chút ạ?',
      level: 'B1',
      topic: 'Lashes',
      duration: '0:18',
    },
    {
      title: 'Lash Extension Aftercare Advice',
      referenceText: "Please avoid getting your lashes wet for the first twenty-four hours to let the glue fully cure. Also, brush them gently once a day.",
      vietnameseTranslation: 'Chị vui lòng tránh để mi dính nước trong hai mươi tư giờ đầu để keo khô hoàn toàn nhé. Ngoài ra, hãy chải mi nhẹ nhàng mỗi ngày một lần.',
      level: 'A2',
      topic: 'Lashes',
      duration: '0:15',
    },
    {
      title: 'Hair Extensions Consultation',
      referenceText: "We can use tape-in extensions to add length and blend them with your natural hair. For a full look, we'll need about three to four packs.",
      vietnameseTranslation: 'Chúng em có thể dùng phương pháp nối tóc dán để tăng độ dài và giúp tóc tiệp với tóc thật. Để có bộ tóc dày đẹp, mình sẽ cần khoảng ba đến bốn tép/phím.',
      level: 'B1',
      topic: 'Hair',
      duration: '0:18',
    },
    {
      title: 'Small talk during manicure service',
      referenceText: "So, do you have any exciting plans for the weekend? I'm just planning to relax and maybe catch up on my favorite TV shows.",
      vietnameseTranslation: 'Thế cuối tuần này chị có kế hoạch gì thú vị không? Em thì chỉ định nghỉ ngơi và có thể xem nốt mấy bộ phim truyền hình yêu thích thôi.',
      level: 'B1',
      topic: 'Beauty',
      duration: '0:18',
    },
    {
      title: 'Hair Salon cut and color check-in',
      referenceText: "I want to get a trim to remove split ends, and maybe some light balayage to brighten up my face. What do you think?",
      vietnameseTranslation: 'Tôi muốn cắt tỉa một chút để bỏ phần tóc chẻ ngọn, và có thể nhuộm loang màu nhẹ để làm sáng khuôn mặt hơn. Bạn nghĩ sao?',
      level: 'B2',
      topic: 'Beauty',
      duration: '0:16',
    },
  ];

  for (const passage of shadowingPassages) {
    const existing = await prisma.shadowingPassage.findFirst({
      where: { title: passage.title },
    });
    if (existing) {
      await prisma.shadowingPassage.update({
        where: { id: existing.id },
        data: {
          referenceText: passage.referenceText,
          vietnameseTranslation: passage.vietnameseTranslation,
          level: passage.level,
          topic: passage.topic,
          duration: passage.duration,
        },
      });
    } else {
      await prisma.shadowingPassage.create({
        data: passage,
      });
    }
  }
  console.log(`✅ Hoàn thành! Đã nạp thành công các bài Shadowing mẫu vào database!`);
}

main()
  .catch((e) => {
    console.error('❌ Có lỗi xảy ra khi nạp dữ liệu mẫu:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
