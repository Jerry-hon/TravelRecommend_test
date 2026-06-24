import {ChatOpenAI} from '@langchain/openai';
import {convertToChunk, HumanMessage, SystemMessage} from '@langchain/core/messages';
import 'dotenv/config';

class TravelService {
  constructor() {
    this.llm = null;
    this.initLLM();
  }

  initLLM() {
    // 初始化 LLM 模型
    this.llm = new ChatOpenAI({
      apiKey: process.env.DEEPSEEK_API_KEY,
      configuration: {
        baseURL: process.env.BASE_URL,
      },
      modelName: process.env.MODEL,
      temperature: 0.5,
      streaming: false,
      timeout: 30000,
    });
  }

  async recommend(destination, budget, days) {
    if(budget <= 100||days < 1||days > 30) {
      throw new Error('Budget must be greater than 100 and days must be greater than 1 and less than 30');
    }
    const messages = this.getTravelPrompt(destination, budget, days);

    try {
      const response = await this.llm.invoke(messages);
      console.log(response);
      return response;
    } catch (error) {
      return {success: false, error: error.message};
    }
  }

  getTravelPrompt(destination, budget, days) {
    return [
        new HumanMessage(`你是资深环球旅行规划师。根据目的地、预算、天数，生成精细旅行规划。输出必须为合法JSON，
            结构为：预算、天数、目的地、行程，行程按天编号，每天分上午、下午、晚上，每时段含景点、预算、路线三个字符
            串字段。规划内容需包含：行前精算表；每日动线剧本；备选预案；避坑红榜。
            目的地为${destination}，预算为${budget}，天数为${days}，预算不包含住宿并在预算中详细说明，返回的json文件的每一天的budget字段里详细说明预算交通，景区分配。
            
            输出格式为：
            
            {
            "budget": "3500元",
            "days": 3,
            "destination": "云南大理",
            "plan": {
              "day1": {
                "morning": {
                  "spot": "大理古城南门 - 五华楼 - 洋人街",
                  "budget": "0元",
                  "route": "从古城南门进入，沿复兴路向北步行至五华楼登高观景，再转入洋人街感受早间文艺氛围，全程约1.5小时"
                },
                "afternoon": {
                  "spot": "崇圣寺三塔公园",
                  "budget": "75元",
                  "route": "从古城步行或乘景区摆渡车（5元）至三塔公园，游览主塔千寻塔及南北小塔，参观南诏建极大钟和雨铜观音殿，全程约2.5小时"
                },
                "night": {
                  "spot": "人民路夜市 - 复兴路酒吧街",
                  "budget": "80元",
                  "route": "从三塔返回古城后，步行至人民路逛地摊夜市，品尝烤饵块和包浆豆腐，随后沿复兴路南段选择一家静吧听民谣，全程约2小时"
                }
              },
              "day2": {
                "morning": {
                  "spot": "才村码头 - 洱海生态廊道骑行",
                  "budget": "30元",
                  "route": "从古城乘C2路公交（2元）至才村码头，租自行车后沿生态廊道向北骑行至下鸡邑村，沿途观洱海晨光与湿地水鸟，往返约10公里，全程约2.5小时"
                },
                "afternoon": {
                  "spot": "喜洲古镇 - 转角楼 - 海舌公园",
                  "budget": "60元",
                  "route": "从才村乘古镇直通车（15元）至喜洲，步行游览四方街、转角楼老宅，随后至海舌公园看洱海三面环水的半岛景观，全程约3小时"
                },
                "night": {
                  "spot": "周城白族歌舞表演 + 火塘烧烤",
                  "budget": "60元",
                  "route": "从喜洲乘微型车（10元）至周城，观看村内广场晚间白族打歌表演，随后在当地火塘烧烤摊体验围炉烤豆腐和五花肉，全程约2小时"
                }
              },
              "day3": {
                "morning": {
                  "spot": "苍山洗马潭索道（半程） - 清碧溪",
                  "budget": "180元",
                  "route": "从古城打车（15元）至苍山感通索道站，乘索道上至清碧溪站，沿玉带路徒步观赏溪涧潭水与山景，往返约2小时"
                },
                "afternoon": {
                  "spot": "寂照庵 - 多肉花园 - 斋饭",
                  "budget": "20元",
                  "route": "从清碧溪沿步道步行下山至寂照庵（约40分钟），参观网红多肉庭院，并在庵内用午斋（11:30-13:00供应），全程约2小时"
                },
                "night": {
                  "spot": "古城南门夜市 - 伴手礼采购",
                  "budget": "90元",
                  "route": "从寂照庵打车返回古城（20元），在南门夜市品尝最后一顿白族酸辣鱼，随后采购嘉华鲜花饼和雕梅作为伴手礼，全程约1.5小时"
                }
              }
            }
            "notice": "旅行过程中的注意事项",
            "avoid": "各个景点的避雷事项",
            "success": true
}`),
    ]
  }

  async chat(message, streamCallback) {
    const messages = [new SystemMessage('你是一个专业的旅行规划师，用中文回答用户关于旅游的问题。'), 
                      new HumanMessage(message)];

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
      return {
        success: false,
        error: error.message
      }
    }
  }
}

export default new TravelService();