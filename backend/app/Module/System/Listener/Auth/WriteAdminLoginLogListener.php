<?php

declare(strict_types=1);

namespace App\Module\System\Listener\Auth;

use App\Module\Auth\Event\AdminLoginLogged;
use App\Module\System\Repository\AdminLoginLogRepository;
use Hyperf\Event\Annotation\Listener;
use Hyperf\Event\Contract\ListenerInterface;
use Psr\Log\LoggerInterface;
use Throwable;

#[Listener]
final class WriteAdminLoginLogListener implements ListenerInterface
{
    public function __construct(
        private readonly AdminLoginLogRepository $logs,
        private readonly LoggerInterface $logger,
    ) {
    }

    public function listen(): array
    {
        return [
            AdminLoginLogged::class,
        ];
    }

    public function process(object $event): void
    {
        if (! $event instanceof AdminLoginLogged) {
            return;
        }

        try {
            $this->logs->create([
                'admin_user_id' => $event->adminUserId,
                'username' => $event->username,
                'ip' => $event->ip,
                'user_agent' => $event->userAgent,
                'status' => $event->status,
                'reason' => $event->reason,
            ]);
        } catch (Throwable $exception) {
            $this->logger->warning('admin.login.log.persist_failed', [
                'message' => $exception->getMessage(),
                'username' => $event->username,
                'status' => $event->status,
            ]);
        }
    }
}
