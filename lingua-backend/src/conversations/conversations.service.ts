import { Injectable, NotFoundException, BadRequestException, InternalServerErrorException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { StartSessionDto } from './dto/start-session.dto';
import { SendMessageDto } from './dto/send-message.dto';
import { GoogleGenAI } from '@google/genai';
import { UsersService } from '../users/users.service';

/**
 * 🌐 LINGUA-ENG — Conversations Service
 * 
 * File này: Quản lý các phiên hội thoại luyện nói với AI,
 * gọi Gemini API để nhận câu trả lời + chấm lỗi ngữ pháp thời gian thực,
 * và sinh báo cáo tổng kết khi kết thúc cuộc trò chuyện.
 */
@Injectable()
export class ConversationsService {
  private readonly ai: GoogleGenAI;

  constructor(
    private readonly prisma: PrismaService,
    private readonly usersService: UsersService,
  ) {
    const apiKey = process.env.GEMINI_API_KEY;
    this.ai = new GoogleGenAI({ apiKey });
  }

  /**
   * 💅 Thiết lập ngữ cảnh vai diễn cho AI dựa trên từng kịch bản (Scenario)
   */
  private getScenarioInstructions(scenario: string): string {
    const lower = scenario.toLowerCase();
    if (lower.includes('nail salon')) {
      return `You are a friendly but detailed American client visiting a nail salon. The USER is your nail technician (nail tech). You want to get your nails done (acrylics, gel, specific shapes like almond/coffin, or nail art). Act as the customer: ask questions about shapes, colors, pricing, or request modifications, and respond to the technician's suggestions naturally.`;
    }
    if (lower.includes('hair salon')) {
      return `You are an American client visiting a hair salon. The USER is your hair stylist. You want to get a haircut (trim, layers, bangs), a color service (highlights, balayage), or hair styling. Act as the customer: explain what style you want, ask for professional advice on tones (warm/cool), or express concerns about hair damage, and respond to the stylist naturally.`;
    }
    if (lower.includes('small talk') || lower.includes('checkout')) {
      return `You are an American client who has just finished getting their nails/hair done. The USER is the salon worker checking you out. Act as the customer: engage in casual small talk (weekend plans, weather) and handle the payment, receipt, and tipping process (asking about tipping policies, paying cash/card/Venmo) naturally.`;
    }
    return `You are a helpful and natural English conversation partner or interviewer.`;
  }

  /**
   * 🗣️ 1. Khởi tạo phiên hội thoại mới và nhận câu chào từ AI
   */
  async startSession(userId: string, dto: StartSessionDto) {
    const { scenario, level } = dto;

    // Tạo phiên hội thoại mới dưới DB
    const session = await this.prisma.conversationSession.create({
      data: {
        userId,
        scenario,
        level,
        status: 'ACTIVE',
      },
    });

    const roleInstructions = this.getScenarioInstructions(scenario);
    // Gọi Gemini để sinh lời chào mở đầu tương ứng với tình huống và level
    const prompt = `You are playing a role for an English conversation practice.
Role Context: ${roleInstructions}
Target English Level: "${level}"

Your task:
Introduce yourself briefly in character as the client/customer (e.g., greet the technician/stylist) and make a starting request or ask a question to begin the service.
Keep it very short (maximum 2 sentences).
Return ONLY the text of your welcome message. Do not add any markdown or quote marks.`;

    try {
      const response = await this.ai.models.generateContent({
        model: 'gemini-3.5-flash',
        contents: prompt,
      });

      const aiWelcome = response.text?.trim() || `Hi! I have an appointment today to get my nails/hair done.`;

      // Lưu tin nhắn chào mừng này của AI vào DB
      const initialMessage = await this.prisma.conversationMessage.create({
        data: {
          sessionId: session.id,
          sender: 'AI',
          text: aiWelcome,
        },
      });

      return {
        session,
        welcomeMessage: initialMessage,
      };
    } catch (error) {
      console.error('❌ Lỗi khởi tạo hội thoại với Gemini:', error);
      throw new InternalServerErrorException('Không thể kết nối với AI Partner lúc này.');
    }
  }

  /**
   * 💬 2. Gửi tin nhắn của người dùng và nhận phản hồi kèm phân tích ngữ pháp từ AI
   */
  async sendMessage(userId: string, dto: SendMessageDto) {
    const { sessionId, text } = dto;

    // Kiểm tra session có tồn tại và thuộc quyền của user không
    const session = await this.prisma.conversationSession.findFirst({
      where: { id: sessionId, userId },
    });

    if (!session) {
      throw new NotFoundException('Không tìm thấy phiên hội thoại này!');
    }

    if (session.status !== 'ACTIVE') {
      throw new BadRequestException('Phiên hội thoại này đã kết thúc!');
    }

    // 1. Lưu tin nhắn của User vào DB
    const userMessage = await this.prisma.conversationMessage.create({
      data: {
        sessionId,
        sender: 'USER',
        text,
      },
    });

    // 2. Lấy lịch sử tin nhắn trong session để làm ngữ cảnh gửi lên AI
    const historyMessages = await this.prisma.conversationMessage.findMany({
      where: { sessionId },
      orderBy: { createdAt: 'desc' },
      take: 20, // Giới hạn sliding window 20 tin nhắn gần nhất
    });
    historyMessages.reverse(); // Sắp xếp lại theo thứ tự thời gian (cũ → mới)

    // Định dạng lịch sử trò chuyện
    const formattedHistory = historyMessages
      .map((m) => `${m.sender}: ${m.text}`)
      .join('\n');

    const roleInstructions = this.getScenarioInstructions(session.scenario);
    // Thiết kế prompt yêu cầu Gemini:
    // A. Trả lời tự nhiên tiếp nối đoạn chat dưới vai trò Client.
    // B. Phân tích ngữ pháp câu chat cuối cùng của USER (chính là biến `text`).
    const prompt = `You are playing a role for an English conversation practice.
Role Context: ${roleInstructions}
Target English Level: "${session.level}"

Here is the conversation history so far:
${formattedHistory}

Your task:
1. Generate your next response ("aiResponse") continuing the conversation naturally in character as the client. Keep it concise (1-3 sentences) and ask a follow-up question or make a request to keep the service going.
2. Analyze the grammar, vocabulary, and naturalness of the USER's last sentence: "${text}".
   Provide the results in "grammarFeedback":
   - "isCorrect": true if it is 100% correct, false otherwise.
   - "issues": array of strings listing any grammatical or vocabulary mistakes, translated to Vietnamese. Empty array if correct.
   - "suggestion": how the user should have said it in natural, idiomatic English.

Ensure your response conforms strictly to the provided JSON Schema. Explanation fields in grammarFeedback must be in Vietnamese.`;

    try {
      const response = await this.ai.models.generateContent({
        model: 'gemini-3.5-flash',
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
          responseSchema: {
            type: 'OBJECT',
            properties: {
              aiResponse: { type: 'STRING' },
              grammarFeedback: {
                type: 'OBJECT',
                properties: {
                  isCorrect: { type: 'BOOLEAN' },
                  issues: {
                    type: 'ARRAY',
                    items: { type: 'STRING' },
                  },
                  suggestion: { type: 'STRING' },
                },
                required: ['isCorrect', 'issues', 'suggestion'],
              },
            },
            required: ['aiResponse', 'grammarFeedback'],
          },
        },
      });

      const responseText = response.text;
      if (!responseText) {
        throw new Error('Không nhận được phản hồi JSON từ Gemini!');
      }

      const result = JSON.parse(responseText);

      // 3. Lưu câu trả lời của AI vào DB
      const aiMessage = await this.prisma.conversationMessage.create({
        data: {
          sessionId,
          sender: 'AI',
          text: result.aiResponse,
        },
      });

      // 4. Cập nhật kết quả chấm lỗi ngữ pháp vào tin nhắn vừa gửi của User
      await this.prisma.conversationMessage.update({
        where: { id: userMessage.id },
        data: {
          grammarFeedback: JSON.stringify(result.grammarFeedback),
        },
      });

      return {
        aiMessage,
        grammarFeedback: result.grammarFeedback,
      };
    } catch (error) {
      console.error('❌ Lỗi khi gửi tin nhắn hội thoại:', error);
      throw new InternalServerErrorException('Có lỗi xảy ra khi xử lý phản hồi từ AI Partner.');
    }
  }

  /**
   * 🏆 3. Kết thúc hội thoại, chấm điểm và tạo Report Card tổng quan
   */
  async endSession(userId: string, sessionId: string) {
    // Xác thực quyền sở hữu
    const session = await this.prisma.conversationSession.findFirst({
      where: { id: sessionId, userId },
      include: { report: true },
    });

    if (!session) {
      throw new NotFoundException('Không tìm thấy phiên hội thoại này!');
    }

    // Nếu đã có báo cáo rồi thì trả về luôn không cần gọi AI chấm lại
    if (session.status === 'COMPLETED' && session.report) {
      return session.report;
    }

    // Lấy toàn bộ hội thoại
    const messages = await this.prisma.conversationMessage.findMany({
      where: { sessionId },
      orderBy: { createdAt: 'asc' },
    });

    if (messages.length < 3) {
      throw new BadRequestException('Cuộc hội thoại quá ngắn để có thể đánh giá và tổng kết!');
    }

    const formattedHistory = messages
      .map((m) => `${m.sender}: ${m.text}`)
      .join('\n');

    // Prompt yêu cầu chấm điểm hội thoại dựa trên 4 tiêu chí
    const prompt = `Analyze the following English conversation history between the USER and the AI Partner:
${formattedHistory}

Provide a comprehensive feedback report card in Vietnamese.
Evaluate and score the USER's performance from 0 to 100 on these 4 metrics:
1. Grammar (scoreGrammar): Sentence structure, tenses, word agreement.
2. Vocabulary (scoreVocabulary): Word choice, variety, and appropriateness.
3. Fluency (scoreFluency): Conversation flow, response ease.
4. Relevance (scoreRelevance): How well the user answered questions and stayed on topic.

Also provide:
- "feedbackStrength": What the user did well, in Vietnamese.
- "feedbackImprovement": Specific areas for improvement and tips, in Vietnamese.

Your response must strictly conform to the provided JSON Schema.`;

    try {
      const response = await this.ai.models.generateContent({
        model: 'gemini-3.5-flash',
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
          responseSchema: {
            type: 'OBJECT',
            properties: {
              scoreGrammar: { type: 'INTEGER' },
              scoreVocabulary: { type: 'INTEGER' },
              scoreFluency: { type: 'INTEGER' },
              scoreRelevance: { type: 'INTEGER' },
              feedbackStrength: { type: 'STRING' },
              feedbackImprovement: { type: 'STRING' },
            },
            required: [
              'scoreGrammar',
              'scoreVocabulary',
              'scoreFluency',
              'scoreRelevance',
              'feedbackStrength',
              'feedbackImprovement',
            ],
          },
        },
      });

      const responseText = response.text;
      if (!responseText) {
        throw new Error('Không nhận được báo cáo từ Gemini!');
      }

      const reportData = JSON.parse(responseText);

      // Lưu báo cáo vào Database
      const report = await this.prisma.conversationReport.create({
        data: {
          sessionId,
          scoreGrammar: reportData.scoreGrammar,
          scoreVocabulary: reportData.scoreVocabulary,
          scoreFluency: reportData.scoreFluency,
          scoreRelevance: reportData.scoreRelevance,
          feedbackStrength: reportData.feedbackStrength,
          feedbackImprovement: reportData.feedbackImprovement,
        },
      });

      // Cập nhật trạng thái session thành COMPLETED
      await this.prisma.conversationSession.update({
        where: { id: sessionId },
        data: { status: 'COMPLETED' },
      });

      // Tự động thưởng 50 XP và cập nhật Streak cho người dùng khi hoàn thành một phiên hội thoại AI
      await this.usersService.updateActivity(userId, 50);

      return report;
    } catch (error) {
      console.error('❌ Lỗi tạo báo cáo tổng kết hội thoại:', error);
      throw new InternalServerErrorException('Có lỗi xảy ra khi tạo báo cáo tổng kết hội thoại.');
    }
  }

  /**
   * 📊 Lấy danh sách lịch sử hội thoại của User
   */
  async getHistory(userId: string) {
    // 🚀 PERFORMANCE: Giới hạn 20 phiên gần nhất, tránh trả toàn bộ dữ liệu
    return this.prisma.conversationSession.findMany({
      where: { userId },
      include: { report: true },
      orderBy: { createdAt: 'desc' },
      take: 20,
    });
  }

  /**
   * 📊 Lấy chi tiết lịch sử tin nhắn trong một cuộc trò chuyện cũ
   */
  async getSessionDetails(userId: string, sessionId: string) {
    const session = await this.prisma.conversationSession.findFirst({
      where: { id: sessionId, userId },
      include: {
        messages: {
          orderBy: { createdAt: 'asc' },
        },
        report: true,
      },
    });

    if (!session) {
      throw new NotFoundException('Không tìm thấy phiên hội thoại này!');
    }

    return session;
  }
}
