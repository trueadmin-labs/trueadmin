<?php

declare(strict_types=1);

namespace App\Module\System\Crontab;

use App\Module\System\Service\Notification\AdminAnnouncementService;
use Hyperf\Crontab\Annotation\Crontab;

#[Crontab(
    rule: '* * * * *',
    name: 'system.admin_notification_schedule',
    callback: 'execute',
    memo: 'Publish scheduled admin announcements and expire outdated announcements.',
)]
final class AdminNotificationScheduleCrontab
{
    public function __construct(private readonly AdminAnnouncementService $announcements)
    {
    }

    public function execute(): void
    {
        $this->announcements->runSchedule();
    }
}
