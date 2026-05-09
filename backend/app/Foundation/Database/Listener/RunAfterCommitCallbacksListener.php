<?php

declare(strict_types=1);

namespace App\Foundation\Database\Listener;

use App\Foundation\Database\AfterCommitCallbacks;
use Hyperf\Database\Events\TransactionCommitted;
use Hyperf\Database\Events\TransactionRolledBack;
use Hyperf\Event\Annotation\Listener;
use Hyperf\Event\Contract\ListenerInterface;

#[Listener]
final class RunAfterCommitCallbacksListener implements ListenerInterface
{
    public function __construct(private readonly AfterCommitCallbacks $callbacks)
    {
    }

    public function listen(): array
    {
        return [
            TransactionCommitted::class,
            TransactionRolledBack::class,
        ];
    }

    public function process(object $event): void
    {
        if ($event instanceof TransactionCommitted) {
            $this->callbacks->committed($event->connection);
            return;
        }

        if ($event instanceof TransactionRolledBack) {
            $this->callbacks->rolledBack($event->connection);
        }
    }
}
