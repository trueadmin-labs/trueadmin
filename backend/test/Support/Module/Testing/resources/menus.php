<?php

declare(strict_types=1);

return [
    [
        'code' => 'testing.permissions',
        'title' => '测试权限',
        'path' => '/testing/permissions',
        'sort' => 9900,
        'type' => 'button',
    ],
    [
        'code' => 'testing.permissions.anyA',
        'title' => '测试任一权限 A',
        'parent' => 'testing.permissions',
        'permission' => 'testing:permission:any-a',
        'sort' => 5,
        'type' => 'button',
    ],
    [
        'code' => 'testing.permissions.anyB',
        'title' => '测试任一权限 B',
        'parent' => 'testing.permissions',
        'permission' => 'testing:permission:any-b',
        'sort' => 10,
        'type' => 'button',
    ],
    [
        'code' => 'testing.permissions.allA',
        'title' => '测试全部权限 A',
        'parent' => 'testing.permissions',
        'permission' => 'testing:permission:all-a',
        'sort' => 20,
        'type' => 'button',
    ],
    [
        'code' => 'testing.permissions.allB',
        'title' => '测试全部权限 B',
        'parent' => 'testing.permissions',
        'permission' => 'testing:permission:all-b',
        'sort' => 30,
        'type' => 'button',
    ],
];
