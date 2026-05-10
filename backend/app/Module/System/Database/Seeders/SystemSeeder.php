<?php

declare(strict_types=1);

namespace App\Module\System\Database\Seeders;

use App\Foundation\Metadata\MetadataSynchronizer;
use App\Foundation\DataPermission\DataPolicyRegistry;
use App\Foundation\Support\Password;
use Hyperf\Database\Seeders\Seeder;
use Hyperf\DbConnection\Db;

final class SystemSeeder extends Seeder
{
    public function __construct(
        private readonly MetadataSynchronizer $metadata,
        private readonly DataPolicyRegistry $dataPolicyRegistry,
    ) {
    }

    public function run(): void
    {
        $now = date('Y-m-d H:i:s');

        Db::table('admin_departments')->updateOrInsert(
            ['code' => 'headquarters'],
            [
                'parent_id' => 0,
                'name' => '总部',
                'level' => 1,
                'path' => '',
                'sort' => 10,
                'status' => 'enabled',
                'updated_at' => $now,
                'created_at' => $now,
            ]
        );
        $deptId = (int) Db::table('admin_departments')->where('code', 'headquarters')->value('id');

        Db::table('admin_users')->updateOrInsert(
            ['username' => 'admin'],
            [
                'password' => Password::make('trueadmin'),
                'nickname' => 'TrueAdmin',
                'status' => 'enabled',
                'primary_dept_id' => $deptId,
                'updated_at' => $now,
                'created_at' => $now,
            ]
        );

        Db::table('admin_roles')->updateOrInsert(
            ['code' => 'super-admin'],
            [
                'parent_id' => 0,
                'name' => '超级管理员',
                'level' => 1,
                'path' => '',
                'sort' => 0,
                'status' => 'enabled',
                'updated_at' => $now,
                'created_at' => $now,
            ]
        );

        $userId = (int) Db::table('admin_users')->where('username', 'admin')->value('id');
        $roleId = (int) Db::table('admin_roles')->where('code', 'super-admin')->value('id');

        Db::table('admin_role_user')->updateOrInsert(['user_id' => $userId, 'role_id' => $roleId]);
        Db::table('admin_user_departments')->updateOrInsert(
            ['user_id' => $userId, 'dept_id' => $deptId],
            ['is_primary' => true]
        );

        $this->metadata->sync();
        foreach ($this->dataPolicyRegistry->allScopeRules($roleId) as $index => $rule) {
            Db::table('admin_role_data_policies')->updateOrInsert(
                ['role_id' => $roleId, 'resource' => $rule->resource, 'action' => $rule->action, 'strategy' => $rule->strategy],
                [
                    'effect' => $rule->effect,
                    'scope' => $rule->scope,
                    'config' => json_encode($rule->config, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES),
                    'status' => 'enabled',
                    'sort' => $index,
                    'updated_at' => $now,
                    'created_at' => $now,
                ]
            );
        }

        $menuIds = Db::table('admin_menus')->pluck('id')->all();
        foreach ($menuIds as $menuId) {
            Db::table('admin_role_menu')->updateOrInsert(['role_id' => $roleId, 'menu_id' => (int) $menuId]);
        }
    }
}
