<?php

declare(strict_types=1);

return [
    [
        'code' => 'organization',
        'title' => '组织权限',
        'path' => '/organization',
        'icon' => 'ApartmentOutlined',
        'sort' => 30,
        'type' => 'directory',
    ],
    [
        'code' => 'messageManagement',
        'title' => '消息管理',
        'path' => '/message-management',
        'icon' => 'NotificationOutlined',
        'sort' => 40,
        'type' => 'directory',
    ],
    [
        'code' => 'systemConfig',
        'title' => '系统配置',
        'path' => '/system-config',
        'icon' => 'SettingOutlined',
        'sort' => 90,
        'type' => 'directory',
    ],
    [
        'code' => 'system.loginLogs',
        'title' => '登录日志',
        'path' => '/system-config/login-logs',
        'icon' => 'LoginOutlined',
        'parent' => 'systemConfig',
        'permission' => 'system:login-log:list',
        'sort' => 80,
        'type' => 'menu',
    ],
    [
        'code' => 'system.operationLogs',
        'title' => '操作日志',
        'path' => '/system-config/operation-logs',
        'icon' => 'AuditOutlined',
        'parent' => 'systemConfig',
        'permission' => 'system:operation-log:list',
        'sort' => 90,
        'type' => 'menu',
    ],
];
