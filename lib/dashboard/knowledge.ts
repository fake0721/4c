import { createClient } from "@/lib/supabase/server-client";
import { hasSupabaseEnv } from "@/lib/supabase/env";

export type KnowledgeRow = {
  id: string;
  title: string;
  displayTitle: string;
  category: string;
  summary: string;
  cause: string;
  solutionPreview: string;
  source: string;
  sourceLabel: string;
};

export type KnowledgePageData = {
  rows: KnowledgeRow[];
};

function toKnowledgeDisplayTitle(value: string | null | undefined) {
  const raw = String(value ?? "").trim();
  if (!raw) return "未命名知识条目";
  if (/[\u4e00-\u9fa5]/.test(raw)) return raw;

  const lower = raw.toLowerCase();
  const map: Record<string, string> = {
    "nginx upstream timed out": "Nginx 上游请求超时",
    "nginx 502 bad gateway": "Nginx 502 网关错误",
    "nginx 503 service unavailable": "Nginx 503 服务不可用",
    "nginx worker process core dumped": "Nginx 工作进程崩溃（Core Dump）",
    "postgresql too many connections": "PostgreSQL 连接数超限",
    "postgresql remaining connection slots are reserved": "PostgreSQL 连接槽已保留",
    "postgresql deadlock detected": "PostgreSQL 检测到死锁",
    "postgresql password authentication failed": "PostgreSQL 认证失败",
    "system out of memory or oom killer": "系统内存不足或触发 OOM",
    "system no space left on device": "磁盘空间不足",
    "system permission denied or operation not permitted": "系统权限不足或操作被拒绝",
    "openssh daemon internal error": "OpenSSH 服务内部错误",
    "dns zone transfer failed": "DNS 区域传送失败",
    "spring security access denied or csrf exception": "Spring Security 访问拒绝或 CSRF 异常",
    "django suspiciousoperation or disallowedhost": "Django 可疑请求或非法主机",
    "sql syntax or injection style error message": "SQL 语法异常或注入特征告警",
    "java process execution error": "Java 进程执行异常",
    "node.js child_process execution error": "Node.js 子进程执行异常",
    "velocity template engine exception": "Velocity 模板引擎异常",
    "application connection refused": "应用连接被拒绝",
    "application read timeout": "应用读取超时",
    "bitbucket login failure": "Bitbucket 登录失败",
    "apache worker segmentation fault": "Apache 工作进程段错误",
    "application retry exhausted": "应用重试耗尽",
    "kubernetes pod pending insufficient resources": "Kubernetes Pod 资源不足（Pending）",
  };

  if (map[lower]) return map[lower];
  if (/^[a-z0-9\s._:-]+$/i.test(raw)) return `英文条目（${raw}）`;
  return raw;
}

function toKnowledgeSourceLabel(value: string | null | undefined) {
  const raw = String(value ?? "").trim().toLowerCase();
  if (raw === "official_doc") return "官方文档";
  if (raw === "internal_runbook") return "内部手册";
  if (raw === "community") return "社区经验";
  if (!raw) return "内部资料";
  return raw.replace(/_/g, "-");
}

export async function getKnowledgePageData(): Promise<KnowledgePageData> {
  if (!hasSupabaseEnv()) {
    return { rows: [] };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { rows: [] };
  }

  const { data: knowledgeRows } = await supabase
    .from("knowledge_base")
    .select("id, title, category, symptom, possible_cause, solution, source")
    .order("id", { ascending: false })
    .limit(48);

  return {
    rows: (knowledgeRows ?? []).map((item) => {
      const title = String(item.title ?? "未命名知识条目").trim();
      const category = String(item.category ?? "general").trim();
      const symptom = String(item.symptom ?? "").trim();
      const possibleCause = String(item.possible_cause ?? "").trim();
      const solution = String(item.solution ?? "").trim();
      const source = String(item.source ?? "internal").trim();

      return {
        id: String(item.id),
        title,
        displayTitle: toKnowledgeDisplayTitle(title),
        category,
        summary: symptom.length > 0 ? symptom : "暂无根因摘要",
        cause: possibleCause.length > 0 ? possibleCause : "暂无根因分析",
        solutionPreview: solution.length > 0 ? solution : "暂无解决方案",
        source,
        sourceLabel: toKnowledgeSourceLabel(source),
      };
    }),
  };
}
