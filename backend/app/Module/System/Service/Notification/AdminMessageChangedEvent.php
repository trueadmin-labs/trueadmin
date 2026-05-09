<?php

declare(strict_types=1);

namespace App\Module\System\Service\Notification;

final class AdminMessageChangedEvent
{
    public function __construct(public readonly string $reason)
    {
    }
}
