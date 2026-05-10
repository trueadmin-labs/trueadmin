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
            'actions' => [
                ['key' => 'list', 'label' => '列表', 'i18n' => 'dataPolicy.action.list', 'sort' => 10],
                ['key' => 'view', 'label' => '详情', 'i18n' => 'dataPolicy.action.view', 'sort' => 20],
                ['key' => 'update', 'label' => '编辑', 'i18n' => 'dataPolicy.action.update', 'sort' => 30],
                ['key' => 'delete', 'label' => '删除', 'i18n' => 'dataPolicy.action.delete', 'sort' => 40],
            ],
            'strategies' => ['organization'],
            'sort' => 10,
        ],
    ],
];
