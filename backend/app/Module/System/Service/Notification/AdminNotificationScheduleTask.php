<?php

declare(strict_types=1);

namespace App\Module\System\Service\Notification;

final class AdminNotificationScheduleTask
{
    public function __construct(private readonly AdminAnnouncementService $announcements)
    {
    }

    public function execute(): void
    {
        $this->announcements->runSchedule();
    }
}
