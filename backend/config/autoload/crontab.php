<?php

declare(strict_types=1);

use App\Module\System\Service\Notification\AdminNotificationScheduleTask;
use Hyperf\Crontab\Crontab;

return [
    'enable' => true,
    'crontab' => [
        (new Crontab())
            ->setName('admin_notification_schedule')
            ->setRule('* * * * *')
            ->setCallback([AdminNotificationScheduleTask::class, 'execute'])
            ->setMemo('Publish scheduled admin announcements and expire outdated announcements.'),
    ],
];
