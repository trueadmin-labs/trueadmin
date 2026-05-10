<?php

declare(strict_types=1);

return [
    'strategies' => [
        App\Module\System\Service\DataPermission\OrganizationDataPolicyStrategy::class,
    ],
    'resources' => [
        [
            'key' => 'admin_user',
            'label' => '管理员用户',
            'i18n' => 'dataPolicy.resource.adminUser',
            'strategies' => ['organization'],
            'sort' => 10,
        ],
    ],
];
