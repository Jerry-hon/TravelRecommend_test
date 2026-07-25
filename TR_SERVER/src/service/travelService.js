import {ChatOpenAI} from '@langchain/openai';
import {HumanMessage, SystemMessage, AIMessage} from '@langchain/core/messages';
import logger from '../utils/logger.js';
import 'dotenv/config';

class TravelService {
  constructor() {
    this.llm = null;
    this.initLLM();
  }

  initLLM() {
    this.llm = new ChatOpenAI({
      apiKey: process.env.DEEPSEEK_API_KEY,
      configuration: {
        baseURL: process.env.BASE_URL,
      },
      modelName: process.env.MODEL,
      temperature: 0.3,
      streaming: true,
      timeout: 60000,
    });
  }

  async recommend(destination, budget, days, streamCallback) {
    if(budget <= 100||days < 1||days > 30) {
      throw new Error('Budget must be greater than 100 and days must be greater than 1 and less than 30');
    }
    const messages = this.getTravelPrompt(destination, budget, days);

    try {
      const stream = await this.llm.stream(messages);
      let fullResponse = '';

      for await (const chunk of stream) {
        const content = chunk.content || '';
        if (!content.trim()) continue;
        fullResponse += content;
        if (streamCallback) {
          streamCallback(content);
        }
      }

      logger.info('AI 推荐生成完成', { destination, days, budget });
      return { success: true, content: fullResponse };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  getTravelPrompt(destination, budget, days) {
    return [
        new HumanMessage(`你是资深旅行规划师。请为${destination}规划${days}天行程，预算${budget}元（不含住宿）。
          
必须输出合法JSON，结构如下：
{
  "budget": "总预算说明",
  "days": 天数,
  "destination": "目的地",
  "plan": {
    "day1": { "morning": {"spot":"景点","budget":"费用明细","route":"路线"}, "afternoon": {...}, "night": {...} },
    "day2": { ... }
  },
  "notice": "注意事项",
  "avoid": "避坑指南"
}

要求：
- 每天分上午、下午、晚上三个时段
- budget字段详细说明交通和门票分配
- route字段给出具体交通方式和步行路线
- 只输出JSON，不要其他文字`),
    ]
  }

  async chat(message, history, streamCallback) {
    // 构建带历史记录的消息列表，历史取最近 20 条（10 轮对话）
    const historyMessages = (history || []).slice(-20).map(msg => {
      return msg.role === 'user' ? new HumanMessage(msg.content) : new AIMessage(msg.content);
    });
    const messages = [
      new SystemMessage('你是一个专业的旅行规划师，用中文回答用户关于旅游的问题。'),
      ...historyMessages,
      new HumanMessage(message)
    ];

    try {
      const stream = await this.llm.stream(messages);

      let fullResponse = '';

      for await (const chunk of stream) {
        const content = chunk.content || '';
        if (content.trim()==='') {
          continue
        }
        fullResponse += content;
        if(streamCallback){
          streamCallback(content);
        }
      }
      return {
        success: true,
        reply: fullResponse
      }
    } catch(error){
      logger.error('AI 对话失败', { error: error.message });
      return {
        success: false,
        error: error.message
      }
    }
  }
}

export default new TravelService();