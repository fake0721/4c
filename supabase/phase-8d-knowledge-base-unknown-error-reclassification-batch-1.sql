with mapped(title, error_type, source_type_override) as (
  values
    ('Application bean creation or dependency injection failed', 'configuration_error', null),
    ('Application broken pipe', 'network_error', null),
    ('Application circuit breaker open', 'service_error', null),
    ('Application class not found or no such method after deploy', 'service_error', null),
    ('Application external API quota exceeded', 'resource_exhaustion', null),
    ('Application JSON parse or deserialization error', 'service_error', 'application'),
    ('Application rate limit exceeded', 'resource_exhaustion', null),
    ('Application retry exhausted', 'timeout', null),
    ('Elasticsearch cluster health red', 'service_error', null),
    ('Elasticsearch master not discovered', 'service_error', null),
    ('Java IllegalStateException', 'service_error', null),
    ('Java NullPointerException', 'service_error', null),
    ('Java OutOfMemoryError', 'resource_exhaustion', null),
    ('Kafka leader not available', 'service_error', null),
    ('Kafka not enough replicas after append', 'service_error', null),
    ('Kafka offset out of range', 'service_error', null),
    ('Kafka record too large', 'configuration_error', null),
    ('Kafka unknown topic or partition', 'configuration_error', null),
    ('Nginx 502 bad gateway', 'service_error', null),
    ('Nginx client closed request 499', 'timeout', null),
    ('Nginx client intended to send too large body', 'configuration_error', null),
    ('Nginx limiting requests excess burst', 'resource_exhaustion', null),
    ('Nginx no live upstreams', 'service_error', null),
    ('Nginx rewrite or internal redirection cycle', 'configuration_error', null),
    ('Nginx upstream keepalive exhausted', 'resource_exhaustion', null),
    ('Nginx upstream prematurely closed connection', 'service_error', null),
    ('Nginx upstream sent invalid header', 'service_error', null),
    ('Nginx upstream sent no valid HTTP header', 'service_error', null),
    ('OpenSSH daemon internal error', 'service_error', null),
    ('Python KeyError or ValueError', 'service_error', null),
    ('Python traceback most recent call last', 'service_error', null),
    ('RabbitMQ memory or disk alarm blocked connection', 'resource_exhaustion', null),
    ('RabbitMQ precondition failed inequivalent arg', 'configuration_error', null),
    ('Redis cluster down or moved response', 'service_error', null),
    ('Redis loading dataset in memory', 'service_error', null),
    ('System cannot allocate memory', 'resource_exhaustion', null),
    ('System filesystem corruption detected', 'service_error', null),
    ('System hung task blocked for too long', 'service_error', null),
    ('System read-only file system', 'service_error', null),
    ('System service failed to start', 'service_error', null),
    ('Velocity template engine exception', 'service_error', null)
)
update public.knowledge_base kb
set
  error_type = mapped.error_type,
  category = mapped.error_type,
  source_type = coalesce(mapped.source_type_override, kb.source_type),
  updated_at = now(),
  cluster_key = md5(lower(concat_ws('::', kb.title, mapped.error_type, coalesce(mapped.source_type_override, kb.source_type))))
from mapped
where kb.title = mapped.title
  and kb.archived_at is null
  and kb.error_type = 'unknown_error';
