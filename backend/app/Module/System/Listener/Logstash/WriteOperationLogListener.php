<?php

declare(strict_types=1);

namespace App\Module\System\Listener\Logstash;

use App\Module\System\Repository\AdminOperationLogRepository;
use Hyperf\Event\Annotation\Listener;
use Hyperf\Event\Contract\ListenerInterface;
use Throwable;
use Psr\Log\LoggerInterface;
use TrueAdmin\Kernel\Context\ActorContext;
use TrueAdmin\Kernel\OperationLog\Event\OperationLogged;

#[Listener]
final class WriteOperationLogListener implements ListenerInterface
{
    public function __construct(
        private readonly AdminOperationLogRepository $logs,
        private readonly LoggerInterface $logger,
    )
    {
    }

    public function listen(): array
    {
        return [
            OperationLogged::class,
        ];
    }

    public function process(object $event): void
    {
        if (! $event instanceof OperationLogged) {
            return;
        }

        $principal = ActorContext::principal();
        $operator = ActorContext::operator();

        try {
            $this->logs->create([
                'module' => $event->module,
                'action' => $event->action,
                'remark' => $event->remark,
                'principal_type' => $principal?->type ?? '',
                'principal_id' => $principal === null ? '' : (string) $principal->id,
                'operator_type' => $operator?->type ?? '',
                'operator_id' => $operator === null ? '' : (string) $operator->id,
                'operation_dept_id' => $operator?->claims['operationDeptId'] ?? null,
                'context' => $event->context,
            ]);
        } catch (Throwable $exception) {
            $this->logger->warning('operation.log.persist_failed', [
                'message' => $exception->getMessage(),
                'module' => $event->module,
                'action' => $event->action,
            ]);
        }
    }
}
