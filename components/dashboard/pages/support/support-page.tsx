import Link from "next/link";

type SectionCard = {
  title: string;
  body: string;
};

type SupportSection = {
  id: string;
  title: string;
  description?: string;
  bullets?: string[];
  cards?: SectionCard[];
  codeBlock?: string;
};

type SupportPageConfig = {
  badgeIcon: string;
  badgeLabel: string;
  title: string;
  description: string;
  heroStats: Array<{ label: string; value: string }>;
  toc: Array<{ id: string; label: string }>;
  sections: SupportSection[];
  switchHref: string;
  switchLabel: string;
  switchIcon: string;
};

function SupportPageTemplate({ config }: { config: SupportPageConfig }) {
  return (
    <div className="space-y-6 text-[#1F2A37]">
      <section className="glass-panel rounded-[28px] p-8 shadow-[0_24px_64px_-32px_rgba(31,78,121,0.45)] md:p-10">
        <div className="flex flex-col gap-6 xl:flex-row xl:items-end xl:justify-between">
          <div>
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-[#1F4E79]/15 bg-[#1F4E79]/10 px-3 py-1 text-[11px] font-label uppercase tracking-[0.25em] text-[#1F4E79]">
              <span className="material-symbols-outlined text-sm">{config.badgeIcon}</span>
              <span>{config.badgeLabel}</span>
            </div>
            <h1 className="font-headline text-4xl font-extrabold tracking-tight md:text-5xl">{config.title}</h1>
            <p className="mt-3 max-w-3xl text-base leading-8 text-[#5F554E] md:text-lg">{config.description}</p>
          </div>
          <div className="grid min-w-[300px] grid-cols-2 gap-3">
            {config.heroStats.map((item) => (
              <div key={item.label} className="rounded-2xl border border-white/40 bg-white/60 p-4">
                <p className="text-xs font-label uppercase tracking-widest text-[#1F4E79]">{item.label}</p>
                <p className="mt-2 font-headline text-2xl font-extrabold">{item.value}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="grid grid-cols-1 gap-6 xl:grid-cols-[280px_minmax(0,1fr)]">
        <aside className="glass-panel sticky top-24 h-fit rounded-[24px] p-5">
          <p className="mb-4 text-xs font-label uppercase tracking-[0.3em] text-[#1F4E79]">目录</p>
          <nav className="space-y-2 text-sm">
            {config.toc.map((item, index) => (
              <a
                key={item.id}
                href={`#${item.id}`}
                className={
                  index === 0
                    ? "block rounded-xl bg-white/60 px-4 py-3 transition-colors hover:bg-white"
                    : "block rounded-xl bg-white/30 px-4 py-3 transition-colors hover:bg-white/60"
                }
              >
                {item.label}
              </a>
            ))}
          </nav>
        </aside>

        <div className="space-y-6">
          {config.sections.map((section) => (
            <section key={section.id} id={section.id} className="glass-panel rounded-[24px] p-7">
              <div className="mb-4 flex items-center justify-between gap-4">
                <h2 className="font-headline text-2xl font-extrabold">{section.title}</h2>
                {section.id === config.sections[0]?.id ? (
                  <Link
                    href={config.switchHref}
                    className="inline-flex items-center gap-2 rounded-full bg-white/50 px-4 py-2 text-sm font-medium transition-colors hover:bg-white/70"
                  >
                    <span className="material-symbols-outlined text-base">{config.switchIcon}</span>
                    <span>{config.switchLabel}</span>
                  </Link>
                ) : null}
              </div>
              {section.description ? <p className="mb-4 text-sm leading-7 text-[#5F554E]">{section.description}</p> : null}
              {section.cards ? (
                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-2">
                  {section.cards.map((card) => (
                    <div key={card.title} className="rounded-2xl border border-white/40 bg-white/50 p-5 text-sm leading-7 text-[#5F554E]">
                      <h3 className="mb-2 font-bold text-[#1F2A37]">{card.title}</h3>
                      <p>{card.body}</p>
                    </div>
                  ))}
                </div>
              ) : null}
              {section.bullets ? (
                <ul className="space-y-3 text-sm leading-7 text-[#5F554E]">
                  {section.bullets.map((bullet) => (
                    <li key={bullet}>{bullet}</li>
                  ))}
                </ul>
              ) : null}
              {section.codeBlock ? (
                <div className="overflow-x-auto rounded-2xl bg-[#2D241E] p-5">
                  <pre className="text-sm leading-7 text-[#F6EAD8]">
                    <code>{section.codeBlock}</code>
                  </pre>
                </div>
              ) : null}
            </section>
          ))}
        </div>
      </section>
    </div>
  );
}

const helpConfig: SupportPageConfig = {
  badgeIcon: "help",
  badgeLabel: "快速上手",
  title: "帮助中心",
  description:
    "这里汇总当前系统最常见的使用路径。建议按“上传日志 -> 查看报告 -> 处理问题 -> 人工复核”的顺序使用，遇到卡点时再查看下方常见问题。",
  heroStats: [
    { label: "推荐入口", value: "日志分析" },
    { label: "后续动作", value: "人工复核" },
  ],
  switchHref: "/dashboard/docs",
  switchLabel: "查看技术文档",
  switchIcon: "description",
  toc: [
    { id: "quick-start", label: "快速开始" },
    { id: "upload-flow", label: "日志上传与分析" },
    { id: "report-guide", label: "分析报告怎么看" },
    { id: "review-guide", label: "人工复核怎么处理" },
    { id: "history-guide", label: "历史与知识怎么用" },
    { id: "faq", label: "常见问题" },
  ],
  sections: [
    {
      id: "quick-start",
      title: "快速开始",
      description: "第一次使用建议按这四步走。",
      cards: [
        { title: "步骤 1: 上传日志", body: "进入日志分析页上传待排查日志，系统会自动进入规则识别与混合分析流程。" },
        { title: "步骤 2: 查看报告", body: "分析完成后优先看核心结论、问题类型分布和问题详情列表。" },
        { title: "步骤 3: 处理问题", body: "到问题中心筛选待处理问题，结合报告和建议安排排障动作。" },
        { title: "步骤 4: 人工复核", body: "针对高风险、低置信度或双检分歧问题，进入人工复核页做最终确认。" },
      ],
    },
    {
      id: "upload-flow",
      title: "日志上传与分析",
      bullets: [
        "上传前尽量确认日志文件完整，避免只截取零散片段。",
        "分析完成后会自动跳到分析报告页，而不是历史页。",
        "如果报告里出现高风险或建议复核，优先处理这些问题。",
        "如果模型不可用，系统会回退到规则结果，但仍会保留复核路径。",
      ],
    },
    {
      id: "report-guide",
      title: "分析报告怎么看",
      cards: [
        { title: "核心分析结论", body: "这里只展示当前最优先处理的主问题，不代表系统只发现了这一类问题。" },
        { title: "问题详情列表", body: "这里会逐条展示问题样本和对应建议，适合继续排查其它问题。" },
        { title: "日志片段", body: "深色代码块显示原始日志证据，用来说明系统为什么判断出该异常。" },
        { title: "Word/PDF 导出", body: "Word 和 PDF 都支持直接导出下载，适合发送给排障、复核或汇报场景。" },
      ],
    },
    {
      id: "review-guide",
      title: "人工复核怎么处理",
      description: "人工复核页用于处理系统不确定、风险较高或规则与模型结论不一致的问题。重点看原始日志片段、异常原因、处理建议三块。",
      bullets: [
        "先确认日志片段和文件上下文是否一致。",
        "高风险问题优先给出人工结论并更新状态。",
        "如果系统建议和实际情况不一致，以人工判断为准。",
      ],
    },
    {
      id: "history-guide",
      title: "历史与知识怎么用",
      bullets: [
        "历史日志存档用于查看既往分析任务和报告入口。",
        "历史问题库适合按问题类型回看过往案例。",
        "探索根因知识库用于搜索已有处理经验，不替代当前日志的实时分析。",
      ],
    },
    {
      id: "faq",
      title: "常见问题",
      cards: [
        { title: "为什么报告里只看到一个主问题？", body: "核心分析结论只展示最优先处理的主问题，其它问题会继续在问题详情列表中逐条显示。" },
        { title: "系统会不会漏查？", body: "当前有低置信度、高风险、双检分歧等复核兜底，但还不是完整的全量漏查发现机制。" },
        { title: "前端改了以后，大模型链路还在吗？", body: "在。前端改动不影响后端的规则、模型和混合分析流程，模型失败时会自动回退到规则结果。" },
      ],
    },
  ],
};

const docsConfig: SupportPageConfig = {
  badgeIcon: "description",
  badgeLabel: "系统说明",
  title: "技术文档",
  description: "这里整理当前系统的规则层、模型层、RAG 层和 UI 导出链路说明，方便内部维护、交付演示和功能对齐。",
  heroStats: [
    { label: "默认模式", value: "Hybrid" },
    { label: "输出面向", value: "报告 + 复核" },
  ],
  switchHref: "/dashboard/help",
  switchLabel: "查看帮助中心",
  switchIcon: "help",
  toc: [
    { id: "overview", label: "系统架构概览" },
    { id: "rules", label: "规则层" },
    { id: "model", label: "模型层" },
    { id: "rag", label: "RAG 层" },
    { id: "flow", label: "主要数据流" },
    { id: "exports", label: "导出与复核" },
    { id: "limits", label: "当前边界" },
  ],
  sections: [
    {
      id: "overview",
      title: "系统架构概览",
      cards: [
        { title: "规则层", body: "负责初步异常检测、类型归类和快速结果产出，是整条链路的入口层。" },
        { title: "模型层", body: "负责根因总结、处理建议和代表样本分析，在规则命中后参与混合判断。" },
        { title: "RAG 层", body: "负责知识检索、历史案例复用和解释补强，不直接替代规则与模型。" },
      ],
    },
    {
      id: "rules",
      title: "规则层",
      bullets: [
        "先对日志做快速异常检测，产出疑似问题样本。",
        "决定后续是否走 rules_fast、hybrid 或 summarized_hybrid。",
        "规则命中后会把结构化结果传给模型层和 UI 层。",
      ],
    },
    {
      id: "model",
      title: "模型层",
      bullets: [
        "当前环境支持真实的 OpenAI-compatible provider。",
        "模型调用主要负责代表样本分析、建议生成和报告结论组织。",
        "如果模型失败，系统会回退到规则结果，不会阻塞整条分析链路。",
      ],
    },
    {
      id: "rag",
      title: "RAG 层",
      description: "RAG 层用于接入历史问题库与根因知识库，让建议和结论更贴近既有经验。当前前端已经提供历史问题与知识探索页，后续可继续补强知识模板与检索结果呈现。",
    },
    {
      id: "flow",
      title: "主要数据流",
      codeBlock: "日志上传\n  -> 规则检测\n  -> 代表样本规划\n  -> 模型分析 / 混合判断\n  -> analysis_results / review_cases\n  -> 报告页 / 问题中心 / 人工复核 / 导出",
    },
    {
      id: "exports",
      title: "导出与复核",
      bullets: [
        "分析报告支持 Word、PDF 导出，适合复核和汇报场景。",
        "高风险、低置信度、双检分歧问题会进入人工复核。",
        "人工复核页面会显示原始日志片段、异常原因和处理建议。",
      ],
    },
    {
      id: "limits",
      title: "当前边界",
      bullets: [
        "当前系统有低置信度、高风险和双检分歧等兜底机制，但还没有完整的全量漏查发现能力。",
        "性能分析页目前更适合看运行表现，而不是严格学术实验；等后续三种模式的分析数据更丰富，再补更强的对照证明。",
      ],
    },
  ],
};

export function HelpCenterPage() {
  return <SupportPageTemplate config={helpConfig} />;
}

export function TechnicalDocsPage() {
  return <SupportPageTemplate config={docsConfig} />;
}
