<?php

declare(strict_types=1);

namespace App\Module\System\Database\Seeders;

use App\Foundation\Support\Password;
use Hyperf\Database\Seeders\Seeder;
use Hyperf\DbConnection\Db;

final class SystemSeeder extends Seeder
{
    public function run(): void
    {
        $now = date('Y-m-d H:i:s');

        Db::table('admin_users')->updateOrInsert(
            ['username' => 'admin'],
            [
                'password' => Password::make('trueadmin'),
                'nickname' => 'TrueAdmin',
                'status' => 'enabled',
                'updated_at' => $now,
                'created_at' => $now,
            ]
        );

        Db::table('admin_roles')->updateOrInsert(
            ['code' => 'super-admin'],
            ['name' => '超级管理员', 'status' => 'enabled', 'updated_at' => $now, 'created_at' => $now]
        );

        $userId = (int) Db::table('admin_users')->where('username', 'admin')->value('id');
        $roleId = (int) Db::table('admin_roles')->where('code', 'super-admin')->value('id');

        Db::table('admin_role_user')->updateOrInsert(['user_id' => $userId, 'role_id' => $roleId]);

        $systemMenuId = $this->upsertMenu([
            'name' => '系统管理',
            'path' => '/system',
            'permission' => '',
            'type' => 'directory',
            'sort' => 10,
        ], 0, $now);
        $userMenuId = $this->upsertMenu([
            'name' => '用户管理',
            'path' => '/system/users',
            'permission' => 'system:user:list',
            'type' => 'menu',
            'sort' => 20,
        ], $systemMenuId, $now);
        $roleMenuId = $this->upsertMenu([
            'name' => '角色管理',
            'path' => '/system/roles',
            'permission' => 'system:role:list',
            'type' => 'menu',
            'sort' => 30,
        ], $systemMenuId, $now);
        $menuMenuId = $this->upsertMenu([
            'name' => '菜单管理',
            'path' => '/system/menus',
            'permission' => 'system:menu:list',
            'type' => 'menu',
            'sort' => 40,
        ], $systemMenuId, $now);
        $this->upsertMenu([
            'name' => '商品管理',
            'path' => '/products',
            'permission' => 'product:list',
            'type' => 'menu',
            'sort' => 50,
        ], 0, $now);

        foreach ([
            ['parentId' => $userMenuId, 'name' => '用户详情', 'permission' => 'system:user:detail', 'sort' => 21],
            ['parentId' => $userMenuId, 'name' => '新增用户', 'permission' => 'system:user:create', 'sort' => 22],
            ['parentId' => $userMenuId, 'name' => '编辑用户', 'permission' => 'system:user:update', 'sort' => 23],
            ['parentId' => $userMenuId, 'name' => '删除用户', 'permission' => 'system:user:delete', 'sort' => 24],
            ['parentId' => $roleMenuId, 'name' => '角色详情', 'permission' => 'system:role:detail', 'sort' => 31],
            ['parentId' => $roleMenuId, 'name' => '新增角色', 'permission' => 'system:role:create', 'sort' => 32],
            ['parentId' => $roleMenuId, 'name' => '编辑角色', 'permission' => 'system:role:update', 'sort' => 33],
            ['parentId' => $roleMenuId, 'name' => '删除角色', 'permission' => 'system:role:delete', 'sort' => 34],
            ['parentId' => $roleMenuId, 'name' => '角色授权', 'permission' => 'system:role:authorize', 'sort' => 35],
            ['parentId' => $menuMenuId, 'name' => '菜单详情', 'permission' => 'system:menu:detail', 'sort' => 41],
            ['parentId' => $menuMenuId, 'name' => '新增菜单', 'permission' => 'system:menu:create', 'sort' => 42],
            ['parentId' => $menuMenuId, 'name' => '编辑菜单', 'permission' => 'system:menu:update', 'sort' => 43],
            ['parentId' => $menuMenuId, 'name' => '删除菜单', 'permission' => 'system:menu:delete', 'sort' => 44],
            ['parentId' => $menuMenuId, 'name' => '权限点列表', 'permission' => 'system:permission:list', 'sort' => 45],
        ] as $button) {
            $this->upsertMenu([
                'name' => $button['name'],
                'path' => '',
                'permission' => $button['permission'],
                'type' => 'button',
                'sort' => $button['sort'],
            ], $button['parentId'], $now);
        }

        $menuIds = Db::table('admin_menus')->pluck('id')->all();
        foreach ($menuIds as $menuId) {
            Db::table('admin_role_menu')->updateOrInsert(['role_id' => $roleId, 'menu_id' => (int) $menuId]);
        }
    }

    private function upsertMenu(array $menu, int $parentId, string $now): int
    {
        Db::table('admin_menus')->updateOrInsert(
            ['permission' => $menu['permission'], 'path' => $menu['path'], 'name' => $menu['name']],
            [...$menu, 'parent_id' => $parentId, 'status' => 'enabled', 'updated_at' => $now, 'created_at' => $now]
        );

        return (int) Db::table('admin_menus')
            ->where('permission', $menu['permission'])
            ->where('path', $menu['path'])
            ->where('name', $menu['name'])
            ->value('id');
    }
}
