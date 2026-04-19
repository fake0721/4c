import type { DetectedIncident } from "@/lib/rules/types";

type RuleAnalysisDraft = {
  cause: string;
  riskLevel: "low" | "medium" | "high";
  confidence: number;
  repairSuggestion: string;
};

const analysisTemplates: Record<string, RuleAnalysisDraft> = {
  timeout: {
    cause: "请求处理超时，通常与上游服务响应变慢、线程阻塞或数据库查询堆积有关。",
    riskLevel: "high",
    confidence: 0.86,
    repairSuggestion:
      "优先检查上游服务耗时、数据库慢查询和连接池占用，必要时先扩容或降级超时接口。",
  },
  connection_refused: {
    cause: "目标服务或端口不可达，通常是实例未启动、健康检查失败或服务发现异常。",
    riskLevel: "high",
    confidence: 0.89,
    repairSuggestion:
      "先确认目标服务进程、容器或 Pod 状态，再检查端口监听、服务注册和网络策略。",
  },
  http_5xx: {
    cause: "服务端处理请求失败，通常与应用异常、依赖调用失败或网关上游错误有关。",
    riskLevel: "high",
    confidence: 0.84,
    repairSuggestion:
      "排查对应接口的应用日志、依赖服务健康状态和最近发布记录，必要时先回滚变更。",
  },
  http_403: {
    cause: "请求被权限或策略拦截，可能是鉴权失败、访问控制策略命中或异常访问行为。",
    riskLevel: "medium",
    confidence: 0.74,
    repairSuggestion:
      "核对调用身份、权限配置和网关访问策略，确认是正常拦截还是误封禁。",
  },
  permission_denied: {
    cause: "权限不足导致操作失败，常见于文件权限、数据库权限或运行账号配置错误。",
    riskLevel: "medium",
    confidence: 0.78,
    repairSuggestion:
      "检查执行账号权限、文件属主和数据库授权，确认最近是否有权限策略变更。",
  },
  exception: {
    cause: "应用出现未捕获异常，通常需要结合堆栈和上下文进一步定位真实根因。",
    riskLevel: "medium",
    confidence: 0.7,
    repairSuggestion:
      "结合异常堆栈、发布记录和依赖变更继续排查，必要时转入人工复核或模型分析。",
  },
  generic_error: {
    cause: "日志中出现通用错误特征，但根因信息有限，适合作为进一步分析入口。",
    riskLevel: "medium",
    confidence: 0.62,
    repairSuggestion:
      "结合前后文日志、服务监控和最近变更继续定位；高频重复后可沉淀为动态规则。",
  },
  database_error: {
    cause: "数据库出现连接、锁竞争或严重错误，可能直接影响核心链路稳定性。",
    riskLevel: "high",
    confidence: 0.9,
    repairSuggestion:
      "优先检查数据库连接数、慢查询、锁等待和资源负载，必要时先限制流量保护核心业务。",
  },
  fatal_error: {
    cause: "系统或应用记录了致命级别错误，通常意味着服务已部分不可用或即将退出。",
    riskLevel: "high",
    confidence: 0.93,
    repairSuggestion:
      "立即检查对应服务实例状态、崩溃堆栈和重启记录，并评估是否需要应急切流或回滚。",
  },
};

function normalizeAnalysis(
  incident: DetectedIncident,
  sourceType: string,
): RuleAnalysisDraft {
  const template = analysisTemplates[incident.errorType];

  if (template) {
    return template;
  }

  return {
    cause: `${sourceType} 日志中出现未分类异常特征，当前规则层只能确认异常存在，尚不能精确定位根因。`,
    riskLevel: incident.riskLevel,
    confidence: 0.55,
    repairSuggestion:
      "建议结合原始日志上下文继续分析；如果后续高频重复，可沉淀为动态规则或候选规则。",
  };
}

export function buildRuleAnalysisDraft(
  incident: DetectedIncident,
  sourceType: string,
) {
  return normalizeAnalysis(incident, sourceType);
}
