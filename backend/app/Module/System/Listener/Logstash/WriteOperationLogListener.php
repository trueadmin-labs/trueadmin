<?php

declare(strict_types=1);

namespace App\Module\System\Listener\Logstash;

use Hyperf\Event\Annotation\Listener;
use Hyperf\Event\Contract\ListenerInterface;
use Psr\Log\LoggerInterface;
use TrueAdmin\Kernel\OperationLog\Event\OperationLogged;

#[Listener]
final class WriteOperationLogListener implements ListenerInterface
{
    public function __construct(private readonly LoggerInterface $logger)
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

        $this->logger->info('operation.logged', [
            'module' => $event->module,
            'action' => $event->action,
            'remark' => $event->remark,
            'context' => $event->context,
        ]);
    }
}
