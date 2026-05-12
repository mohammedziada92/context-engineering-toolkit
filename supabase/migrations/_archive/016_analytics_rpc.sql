-- 016_analytics_rpc.sql
-- RPC functions for analytics aggregations (last 30 days, scoped to user_id)

-- 1. Summary KPIs
CREATE OR REPLACE FUNCTION public.analytics_summary(p_user_id UUID)
RETURNS TABLE (
    total_runs       BIGINT,
    total_tokens     BIGINT,
    total_cost_usd   NUMERIC,
    avg_latency_ms   NUMERIC,
    success_count    BIGINT,
    active_pipelines BIGINT
)
LANGUAGE sql STABLE
AS $$
    SELECT
        COALESCE(SUM(1), 0)                                    AS total_runs,
        COALESCE(SUM(pr.total_tokens), 0)                      AS total_tokens,
        COALESCE(SUM(pr.cost_usd), 0)                          AS total_cost_usd,
        COALESCE(AVG(pr.latency_ms), 0)                        AS avg_latency_ms,
        COALESCE(SUM(CASE WHEN pr.status = 'success' THEN 1 END), 0) AS success_count,
        (SELECT COUNT(*) FROM public.pipelines
         WHERE user_id = p_user_id AND is_active = true)        AS active_pipelines
    FROM public.pipelineruns pr
    WHERE pr.user_id = p_user_id
      AND pr.created_at >= now() - interval '30 days';
$$;


-- 2. Daily token usage
CREATE OR REPLACE FUNCTION public.analytics_token_usage(p_user_id UUID)
RETURNS TABLE (
    date              TEXT,
    prompt_tokens     BIGINT,
    completion_tokens BIGINT,
    total_tokens      BIGINT
)
LANGUAGE sql STABLE
AS $$
    SELECT
        to_char(pr.created_at, 'YYYY-MM-DD') AS date,
        COALESCE(SUM(pr.prompt_tokens), 0)     AS prompt_tokens,
        COALESCE(SUM(pr.completion_tokens), 0)  AS completion_tokens,
        COALESCE(SUM(pr.total_tokens), 0)       AS total_tokens
    FROM public.pipelineruns pr
    WHERE pr.user_id = p_user_id
      AND pr.created_at >= now() - interval '30 days'
    GROUP BY to_char(pr.created_at, 'YYYY-MM-DD')
    ORDER BY date;
$$;


-- 3. Daily cost by model
CREATE OR REPLACE FUNCTION public.analytics_cost(p_user_id UUID)
RETURNS TABLE (
    date        TEXT,
    model_used  TEXT,
    cost_usd    NUMERIC
)
LANGUAGE sql STABLE
AS $$
    SELECT
        to_char(pr.created_at, 'YYYY-MM-DD') AS date,
        pr.model_used,
        COALESCE(SUM(pr.cost_usd), 0) AS cost_usd
    FROM public.pipelineruns pr
    WHERE pr.user_id = p_user_id
      AND pr.created_at >= now() - interval '30 days'
    GROUP BY to_char(pr.created_at, 'YYYY-MM-DD'), pr.model_used
    ORDER BY date, model_used;
$$;


-- 4. Latency percentiles per pipeline
CREATE OR REPLACE FUNCTION public.analytics_latency(p_user_id UUID)
RETURNS TABLE (
    pipeline_id   UUID,
    pipeline_name TEXT,
    p50_ms        NUMERIC,
    p95_ms        NUMERIC,
    p99_ms        NUMERIC,
    run_count     BIGINT
)
LANGUAGE sql STABLE
AS $$
    SELECT
        pr.pipeline_id,
        p.name AS pipeline_name,
        COALESCE(percentile_cont(0.50) WITHIN GROUP (ORDER BY pr.latency_ms), 0) AS p50_ms,
        COALESCE(percentile_cont(0.95) WITHIN GROUP (ORDER BY pr.latency_ms), 0) AS p95_ms,
        COALESCE(percentile_cont(0.99) WITHIN GROUP (ORDER BY pr.latency_ms), 0) AS p99_ms,
        COUNT(*) AS run_count
    FROM public.pipelineruns pr
    LEFT JOIN public.pipelines p ON p.id = pr.pipeline_id
    WHERE pr.user_id = p_user_id
      AND pr.created_at >= now() - interval '30 days'
      AND pr.pipeline_id IS NOT NULL
    GROUP BY pr.pipeline_id, p.name
    ORDER BY run_count DESC;
$$;
