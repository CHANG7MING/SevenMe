export type ChapterKey = "research" | "skills" | "photography" | "articles";

export type Chapter = {
  key: ChapterKey;
  label: string;
  eyebrow: string;
  detailEyebrow: string;
  heading: string;
  description: string;
  note: string;
  items: string[];
  detailIntro: string;
  details: Array<[string, string, string]>;
};

export const chapters: Chapter[] = [
  {
    key: "research",
    label: "研究",
    eyebrow: "RESEARCH & PRACTICE",
    detailEyebrow: "RESEARCH & PRACTICE",
    heading: "研究正在发生的未来。",
    description: "以真实原型验证 Agent、长期记忆与 AI 产品交互，不只讨论可能性。",
    note: "把正在发生的问题，做成可以被使用、被验证的工具。",
    items: ["长期记忆与上下文选择", "多 Agent 协作与交付接口", "可被打断的生成式界面"],
    detailIntro: "以原型、实验和长期观察，记录 AI 产品从概念进入真实工作流的过程。",
    details: [
      ["FIELD NOTE 024", "让 AI 产品拥有工作记忆", "关于长期记忆、上下文选择和可控遗忘的一次产品实验。"],
      ["EXPERIMENT 017", "多 Agent 协作不等于多人聊天", "从角色拆分、交付接口和验证机制重新理解团队式智能。"],
      ["PROTOTYPE 011", "可被打断的生成式界面", "探索流式反馈、即时控制和可逆交互如何共同建立信任。"],
      ["ONGOING", "AI 原生产品观察", "持续收集那些只有模型参与后才成立的新交互模式。"],
    ],
  },
  {
    key: "skills",
    label: "Skills",
    eyebrow: "SELECTED SKILLS",
    detailEyebrow: "SELECTED SKILLS",
    heading: "把方法变成可复用工具。",
    description: "每个 Skill 都是一件作品，也是我对设计、工程与协作的回答。",
    note: "从意图到执行，把经验整理成可以继续生长的能力。",
    items: ["design-core · 高完成度产品界面", "ai-native · AI 原生产品方法", "apple-design · 流体交互与材料", "team-mode · 多角色协作协议"],
    detailIntro: "Skills 是公开作品，也是我在设计、AI、工程和协作上的个人能力体系。",
    details: [
      ["DESIGN", "design-core", "高完成度产品界面的设计、实现与质量审查方法。"],
      ["AI PRODUCT", "ai-native", "面向 AI 原生产品的模式、状态、信任和评估框架。"],
      ["INTERACTION", "apple-design", "将流体反馈、空间连续性和克制的动效转译到 Web。"],
      ["COLLABORATION", "team-mode", "拆分任务、调度多个执行者并收敛结果的协作协议。"],
    ],
  },
  {
    key: "photography",
    label: "摄影",
    eyebrow: "PHOTOGRAPHY",
    detailEyebrow: "PHOTOGRAPHY ARCHIVE",
    heading: "技术之外，仍然看见。",
    description: "城市、自然与旅途中那些没有被算法安排的瞬间。",
    note: "一面可以持续替换成你的真实照片的私人图墙。",
    items: ["城市中的静默结构", "旅途中未命名的光"],
    detailIntro: "这里会是一面可替换成你真实照片的自适应图墙，按地点、时间和系列组织。",
    details: [
      ["SHANGHAI", "城市中的静默结构", "玻璃、混凝土、雾和人群之间短暂形成的秩序。"],
      ["ON THE ROAD", "旅途中未命名的光", "不是地标，而是路上真正停下来的理由。"],
      ["NATURE", "风经过之后", "山、树、水面和天气留下的细小变化。"],
      ["ARCHIVE", "全部摄影系列", "按时间、地点、镜头和主题浏览个人影像档案。"],
    ],
  },
  {
    key: "articles",
    label: "文章",
    eyebrow: "ARTICLES & ABOUT",
    detailEyebrow: "ARTICLES & ABOUT",
    heading: "公开我的判断与过程。",
    description: "关于 AI 应用、Agent、全栈工程、产品设计，以及尚未得到答案的问题。",
    note: "文章是思考留下的痕迹，也是和别人建立连接的方式。",
    items: ["Agent 产品真正的边界", "把 Skills 当成软件来设计", "关于 CHANG7AN"],
    detailIntro: "文章覆盖 AI 应用、Agent、全栈工程和产品设计，并保留一个完整的个人介绍页面。",
    details: [
      ["AI NATIVE", "Agent 产品真正的边界", "从聊天框走向可执行、可验证、可恢复的工作系统。"],
      ["ENGINEERING", "把 Skills 当成软件来设计", "版本、接口、测试和文档为何同样适用于个人方法。"],
      ["PRODUCT", "技术选择背后的产品判断", "什么时候追求能力上限，什么时候优先可靠与清晰。"],
      ["ABOUT", "关于 CHANG7AN", "经历、关注的问题、现在正在做什么，以及联系入口。"],
    ],
  },
];
