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

namespace App\Module\System\Database\Seeders;

use Hyperf\Database\Seeders\Seeder;
use Hyperf\DbConnection\Db;
use RuntimeException;
use TrueAdmin\Kernel\DataPermission\DataPolicyRegistry;
use TrueAdmin\Kernel\Metadata\MetadataSynchronizer;
use TrueAdmin\Kernel\Support\Password;

use function Hyperf\Support\env;

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
        $superAdminPassword = $this->resolveBootstrapPassword('TRUEADMIN_SUPER_ADMIN_PASSWORD');
        $adminPassword = $this->resolveBootstrapPassword('TRUEADMIN_ADMIN_PASSWORD');

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
                'password' => Password::make($superAdminPassword),
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
                'password' => Password::make($adminPassword),
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
        foreach ([$superAdminUserId, $adminUserId] as $userId) {
            Db::table('admin_user_departments')->updateOrInsert(
                ['user_id' => $userId, 'dept_id' => $deptId],
                ['is_primary' => true]
            );
        }

        Db::table('admin_positions')->updateOrInsert(
            ['dept_id' => $deptId, 'code' => 'super-admin'],
            [
                'name' => '超级管理员',
                'type' => 'system',
                'is_leadership' => true,
                'description' => '系统内置超级管理员岗位',
                'sort' => 0,
                'status' => 'enabled',
                'updated_at' => $now,
                'created_at' => $now,
            ]
        );
        Db::table('admin_positions')->updateOrInsert(
            ['dept_id' => $deptId, 'code' => 'admin'],
            [
                'name' => '管理员',
                'type' => 'system',
                'is_leadership' => true,
                'description' => '系统内置管理员岗位',
                'sort' => 10,
                'status' => 'enabled',
                'updated_at' => $now,
                'created_at' => $now,
            ]
        );

        $superAdminPositionId = (int) Db::table('admin_positions')->where('dept_id', $deptId)->where('code', 'super-admin')->value('id');
        $adminPositionId = (int) Db::table('admin_positions')->where('dept_id', $deptId)->where('code', 'admin')->value('id');

        Db::table('admin_position_roles')->updateOrInsert(
            ['position_id' => $superAdminPositionId, 'role_id' => $superAdminRoleId],
            ['sort' => 0, 'updated_at' => $now, 'created_at' => $now]
        );
        Db::table('admin_position_roles')->updateOrInsert(
            ['position_id' => $adminPositionId, 'role_id' => $adminRoleId],
            ['sort' => 0, 'updated_at' => $now, 'created_at' => $now]
        );
        Db::table('admin_user_positions')->updateOrInsert(
            ['user_id' => $superAdminUserId, 'position_id' => $superAdminPositionId],
            ['is_primary' => true, 'assigned_at' => $now]
        );
        Db::table('admin_user_positions')->updateOrInsert(
            ['user_id' => $adminUserId, 'position_id' => $adminPositionId],
            ['is_primary' => true, 'assigned_at' => $now]
        );

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

    private function resolveBootstrapPassword(string $envName): string
    {
        $password = trim((string) env($envName, ''));
        if ($password === '') {
            throw new RuntimeException(sprintf('%s must be configured before running SystemSeeder.', $envName));
        }

        if ($this->isProduction() && (strlen($password) < 12 || in_array($password, ['123456', 'password', 'admin', 'trueadmin'], true))) {
            throw new RuntimeException(sprintf('%s must not use a weak bootstrap password in production.', $envName));
        }

        return $password;
    }

    private function isProduction(): bool
    {
        return in_array(strtolower((string) env('APP_ENV', 'dev')), ['prod', 'production'], true);
    }
}
