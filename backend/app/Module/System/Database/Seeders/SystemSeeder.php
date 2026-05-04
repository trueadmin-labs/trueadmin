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

        $menus = [
            ['name' => '系统管理', 'path' => '/system', 'permission' => '', 'type' => 'directory', 'sort' => 10],
            ['name' => '用户管理', 'path' => '/system/users', 'permission' => 'system:user:list', 'type' => 'menu', 'sort' => 20],
            ['name' => '角色管理', 'path' => '/system/roles', 'permission' => 'system:role:list', 'type' => 'menu', 'sort' => 30],
            ['name' => '菜单管理', 'path' => '/system/menus', 'permission' => 'system:menu:list', 'type' => 'menu', 'sort' => 40],
            ['name' => '商品管理', 'path' => '/products', 'permission' => 'product:list', 'type' => 'menu', 'sort' => 50],
        ];

        foreach ($menus as $menu) {
            Db::table('admin_menus')->updateOrInsert(
                ['permission' => $menu['permission'], 'path' => $menu['path']],
                [...$menu, 'parent_id' => 0, 'status' => 'enabled', 'updated_at' => $now, 'created_at' => $now]
            );
        }

        $menuIds = Db::table('admin_menus')->pluck('id')->all();
        foreach ($menuIds as $menuId) {
            Db::table('admin_role_menu')->updateOrInsert(['role_id' => $roleId, 'menu_id' => (int) $menuId]);
        }
    }
}
