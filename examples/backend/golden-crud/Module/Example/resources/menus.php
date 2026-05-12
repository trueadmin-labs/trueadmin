<?php

declare(strict_types=1);

return [
    [
        'code' => 'example',
        'title' => '示例模块',
        'path' => '/example',
        'icon' => 'AppstoreOutlined',
        'sort' => 900,
        'type' => 'directory',
    ],
    [
        'code' => 'example.dicts',
        'title' => '示例字典',
        'path' => '/example/dicts',
        'parent' => 'example',
        'permission' => 'example:dict:list',
        'icon' => 'BookOutlined',
        'sort' => 10,
        'type' => 'menu',
    ],
    [
        'code' => 'example.dicts.detail',
        'title' => '示例字典详情',
        'parent' => 'example.dicts',
        'permission' => 'example:dict:detail',
        'sort' => 11,
        'type' => 'button',
    ],
    [
        'code' => 'example.dicts.create',
        'title' => '新增示例字典',
        'parent' => 'example.dicts',
        'permission' => 'example:dict:create',
        'sort' => 12,
        'type' => 'button',
    ],
    [
        'code' => 'example.dicts.update',
        'title' => '编辑示例字典',
        'parent' => 'example.dicts',
        'permission' => 'example:dict:update',
        'sort' => 13,
        'type' => 'button',
    ],
    [
        'code' => 'example.dicts.delete',
        'title' => '删除示例字典',
        'parent' => 'example.dicts',
        'permission' => 'example:dict:delete',
        'sort' => 14,
        'type' => 'button',
    ],
];
