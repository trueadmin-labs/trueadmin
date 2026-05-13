<?php

declare(strict_types=1);
/**
 * This file is part of Hyperf.
 *
 * @link     https://www.hyperf.io
 * @document https://hyperf.wiki
 * @contact  group@hyperf.io
 * @license  https://github.com/hyperf/hyperf/blob/master/LICENSE
 */
use App\Foundation\DataPermission\Organization\OrganizationDataPolicyStrategy;

return [
    'strategies' => [
        OrganizationDataPolicyStrategy::class,
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
            'sort' => 25,
        ],
        [
            'key' => 'admin_position',
            'label' => '岗位管理',
            'i18n' => 'dataPolicy.resource.adminPosition',
            'strategies' => ['organization'],
            'sort' => 30,
        ],
    ],
];
