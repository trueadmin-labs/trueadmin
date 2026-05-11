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
            ['username' => 'trueadmin'],
            [
                'password' => Password::make('123456'),
                'nickname' => 'TrueAdmin',
                'avatar' => '',
                'preferences' => json_encode([], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES),
                'status' => 'enabled',
                'primary_dept_id' => $deptId,
                'deleted_at' => null,
                'updated_at' => $now,
                'created_at' => $now,
            ]
        );

        Db::table('admin_users')->updateOrInsert(
            ['username' => 'admin'],
            [
                'password' => Password::make('123456'),
                'nickname' => 'Admin',
                'avatar' => '',
                'preferences' => json_encode([], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES),
                'status' => 'enabled',
                'primary_dept_id' => $deptId,
                'deleted_at' => null,
                'updated_at' => $now,
                'created_at' => $now,
            ]
        );

        Db::table('admin_roles')->updateOrInsert(
            ['code' => 'super-admin'],
            [
                'name' => '超级管理员',
                'sort' => 0,
                'status' => 'enabled',
                'updated_at' => $now,
                'created_at' => $now,
            ]
        );

        Db::table('admin_roles')->updateOrInsert(
            ['code' => 'admin'],
            [
                'name' => '管理员',
                'sort' => 10,
                'status' => 'enabled',
                'updated_at' => $now,
                'created_at' => $now,
            ]
        );

        $superAdminUserId = (int) Db::table('admin_users')->where('username', 'trueadmin')->value('id');
        $adminUserId = (int) Db::table('admin_users')->where('username', 'admin')->value('id');
        $superAdminRoleId = (int) Db::table('admin_roles')->where('code', 'super-admin')->value('id');
        $adminRoleId = (int) Db::table('admin_roles')->where('code', 'admin')->value('id');

        Db::table('admin_role_user')->whereIn('user_id', [$superAdminUserId, $adminUserId])->delete();
        Db::table('admin_role_user')->updateOrInsert(['user_id' => $superAdminUserId, 'role_id' => $superAdminRoleId]);
        Db::table('admin_role_user')->updateOrInsert(['user_id' => $adminUserId, 'role_id' => $adminRoleId]);
        foreach ([$superAdminUserId, $adminUserId] as $userId) {
            Db::table('admin_user_departments')->updateOrInsert(
                ['user_id' => $userId, 'dept_id' => $deptId],
                ['is_primary' => true]
            );
        }

        $this->metadata->sync();

        $menuIds = Db::table('admin_menus')->pluck('id')->all();
        foreach ($menuIds as $menuId) {
            Db::table('admin_role_menu')->updateOrInsert([
                'role_id' => $adminRoleId,
                'menu_id' => (int) $menuId,
            ]);
        }

        foreach ($this->dataPolicyRegistry->allScopeRules($adminRoleId) as $index => $rule) {
            Db::table('admin_role_data_policies')->updateOrInsert(
                ['role_id' => $adminRoleId, 'resource' => $rule->resource, 'strategy' => $rule->strategy],
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
    }
}
