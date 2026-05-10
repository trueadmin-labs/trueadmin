<?php

declare(strict_types=1);

return [
    'strategies' => [
        App\Module\System\Service\DataPermission\OrganizationDataPolicyStrategy::class,
    ],
    'resources' => [
        [
            'key' => 'admin_user',
            'label' => '成员管理',
            'i18n' => 'dataPolicy.resource.adminUser',
            'strategies' => ['organization'],
            'sort' => 10,
        ],
        [
            'key' => 'admin_announcement',
            'label' => '公告管理',
            'i18n' => 'dataPolicy.resource.adminAnnouncement',
            'strategies' => ['organization'],
            'sort' => 20,
        ],
        [
            'key' => 'admin_notification_batch',
            'label' => '通知管理',
            'i18n' => 'dataPolicy.resource.adminNotificationBatch',
            'strategies' => ['organization'],
            'sort' => 30,
        ],
    ],
];
