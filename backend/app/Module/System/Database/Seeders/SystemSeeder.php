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

        $departments = $this->seedDefaultDepartments($now);
        $roles = $this->seedDefaultRoles($now);
        $headquartersId = $departments['headquarters'];
        $superAdminRoleId = $roles['super-admin'];
        $adminRoleId = $roles['admin'];
        $managementRoleIds = [
            $roles['sales-management'],
            $roles['finance-management'],
            $roles['warehouse-management'],
            $roles['technology-management'],
        ];
        $staffRoleId = $roles['staff'];

        Db::table('admin_users')->updateOrInsert(
            ['username' => 'trueadmin'],
            [
                'password' => Password::make($superAdminPassword),
                'nickname' => 'TrueAdmin',
                'avatar' => '',
                'preferences' => json_encode([], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES),
                'status' => 'enabled',
                'primary_dept_id' => $headquartersId,
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
                'primary_dept_id' => $headquartersId,
                'deleted_at' => null,
                'updated_at' => $now,
                'created_at' => $now,
            ]
        );

        $superAdminUserId = (int) Db::table('admin_users')->where('username', 'trueadmin')->value('id');
        $adminUserId = (int) Db::table('admin_users')->where('username', 'admin')->value('id');

        Db::table('admin_role_user')->whereIn('user_id', [$superAdminUserId, $adminUserId])->delete();
        Db::table('admin_role_user')->updateOrInsert(['user_id' => $superAdminUserId, 'role_id' => $superAdminRoleId]);
        foreach ([$superAdminUserId, $adminUserId] as $userId) {
            Db::table('admin_user_departments')->updateOrInsert(
                ['user_id' => $userId, 'dept_id' => $headquartersId],
                ['is_primary' => true]
            );
        }

        $positions = $this->seedDefaultPositions($departments, $roles, $now);
        Db::table('admin_user_positions')->updateOrInsert(
            ['user_id' => $superAdminUserId, 'position_id' => $positions['super-admin']],
            ['is_primary' => true, 'assigned_at' => $now]
        );
        Db::table('admin_user_positions')->updateOrInsert(
            ['user_id' => $adminUserId, 'position_id' => $positions['admin']],
            ['is_primary' => true, 'assigned_at' => $now]
        );

        $this->metadata->sync();

        $this->syncRoleMenusByCodes($adminRoleId, ['*']);
        $this->syncRoleMenusByCodes($roles['sales-management'], $this->managementMenuCodes([
            'system.announcementManagement',
            'system.announcementManagement.detail',
            'system.announcementManagement.create',
            'system.announcementManagement.update',
            'system.announcementManagement.publish',
        ]));
        $this->syncRoleMenusByCodes($roles['finance-management'], $this->managementMenuCodes([
            'system.operationLogs',
            'system.operationLogs.detail',
            'system.loginLogs',
            'system.loginLogs.detail',
        ]));
        $this->syncRoleMenusByCodes($roles['warehouse-management'], $this->managementMenuCodes());
        $this->syncRoleMenusByCodes($roles['technology-management'], $this->managementMenuCodes([
            'system.menus',
            'system.menus.detail',
            'system.permissions',
            'system.files.list',
            'system.files.detail',
            'system.files.upload',
        ]));
        $this->syncRoleMenusByCodes($staffRoleId, $this->staffMenuCodes());

        $this->syncRoleDataPolicies($adminRoleId, $this->policyRules('all'), $now);
        foreach ($managementRoleIds as $managementRoleId) {
            $this->syncRoleDataPolicies($managementRoleId, $this->policyRules('department_and_children'), $now);
        }
        $this->syncRoleDataPolicies($staffRoleId, $this->policyRules('self', ['admin_user']), $now);
    }

    /**
     * @return array<string, int>
     */
    private function seedDefaultDepartments(string $now): array
    {
        $headquartersId = $this->seedDepartment('headquarters', '总部', 0, 1, '', 10, $now);

        return [
            'headquarters' => $headquartersId,
            'executive' => $this->seedDepartment('executive-office', '总经办', $headquartersId, 2, ',' . $headquartersId . ',', 20, $now),
            'sales' => $this->seedDepartment('sales', '销售部', $headquartersId, 2, ',' . $headquartersId . ',', 30, $now),
            'finance' => $this->seedDepartment('finance', '财务部', $headquartersId, 2, ',' . $headquartersId . ',', 40, $now),
            'warehouse' => $this->seedDepartment('warehouse', '仓储部', $headquartersId, 2, ',' . $headquartersId . ',', 50, $now),
            'technology' => $this->seedDepartment('technology', '技术部', $headquartersId, 2, ',' . $headquartersId . ',', 60, $now),
        ];
    }

    private function seedDepartment(string $code, string $name, int $parentId, int $level, string $path, int $sort, string $now): int
    {
        Db::table('admin_departments')->updateOrInsert(
            ['code' => $code],
            [
                'parent_id' => $parentId,
                'name' => $name,
                'level' => $level,
                'path' => $path,
                'sort' => $sort,
                'status' => 'enabled',
                'updated_at' => $now,
                'created_at' => $now,
            ]
        );

        return (int) Db::table('admin_departments')->where('code', $code)->value('id');
    }

    /**
     * @return array<string, int>
     */
    private function seedDefaultRoles(string $now): array
    {
        return [
            'super-admin' => $this->seedRole('super-admin', '超级管理员', 0, $now),
            'admin' => $this->seedRole('admin', '管理员', 10, $now),
            'sales-management' => $this->seedRole('sales-management', '销售管理', 20, $now),
            'finance-management' => $this->seedRole('finance-management', '财务管理', 30, $now),
            'warehouse-management' => $this->seedRole('warehouse-management', '仓储管理', 40, $now),
            'technology-management' => $this->seedRole('technology-management', '技术管理', 50, $now),
            'staff' => $this->seedRole('staff', '普通成员', 60, $now),
        ];
    }

    private function seedRole(string $code, string $name, int $sort, string $now): int
    {
        Db::table('admin_roles')->updateOrInsert(
            ['code' => $code],
            [
                'name' => $name,
                'sort' => $sort,
                'status' => 'enabled',
                'updated_at' => $now,
                'created_at' => $now,
            ]
        );

        return (int) Db::table('admin_roles')->where('code', $code)->value('id');
    }

    /**
     * @param array<string, int> $departments
     * @param array<string, int> $roles
     * @return array<string, int>
     */
    private function seedDefaultPositions(array $departments, array $roles, string $now): array
    {
        /**
         * @var array<string, array{
         *     department: string,
         *     code: string,
         *     name: string,
         *     type: string,
         *     leadership: bool,
         *     description: string,
         *     sort: int,
         *     roles: list<string>
         * }> $definitions
         */
        $definitions = [
            'super-admin' => [
                'department' => 'headquarters',
                'code' => 'super-admin',
                'name' => '超级管理员',
                'type' => 'system',
                'leadership' => true,
                'description' => '系统内置超级管理员岗位',
                'sort' => 0,
                'roles' => ['super-admin'],
            ],
            'admin' => [
                'department' => 'headquarters',
                'code' => 'admin',
                'name' => '管理员',
                'type' => 'system',
                'leadership' => true,
                'description' => '系统内置管理员岗位',
                'sort' => 10,
                'roles' => ['admin'],
            ],
            'general-manager' => [
                'department' => 'executive',
                'code' => 'general-manager',
                'name' => '总经理',
                'type' => 'normal',
                'leadership' => true,
                'description' => '总经办管理岗位，示例绑定管理员权限包',
                'sort' => 20,
                'roles' => ['admin'],
            ],
            'executive-specialist' => [
                'department' => 'executive',
                'code' => 'executive-specialist',
                'name' => '总经办专员',
                'type' => 'normal',
                'leadership' => false,
                'description' => '总经办普通成员岗位',
                'sort' => 30,
                'roles' => ['staff'],
            ],
            'sales-manager' => [
                'department' => 'sales',
                'code' => 'sales-manager',
                'name' => '销售负责人',
                'type' => 'normal',
                'leadership' => true,
                'description' => '销售部负责人，绑定销售管理权限包',
                'sort' => 40,
                'roles' => ['sales-management'],
            ],
            'sales-specialist' => [
                'department' => 'sales',
                'code' => 'sales-specialist',
                'name' => '销售专员',
                'type' => 'normal',
                'leadership' => false,
                'description' => '销售部普通成员岗位',
                'sort' => 50,
                'roles' => ['staff'],
            ],
            'finance-manager' => [
                'department' => 'finance',
                'code' => 'finance-manager',
                'name' => '财务负责人',
                'type' => 'normal',
                'leadership' => true,
                'description' => '财务部负责人，绑定财务管理权限包',
                'sort' => 60,
                'roles' => ['finance-management'],
            ],
            'finance-specialist' => [
                'department' => 'finance',
                'code' => 'finance-specialist',
                'name' => '财务专员',
                'type' => 'normal',
                'leadership' => false,
                'description' => '财务部普通成员岗位',
                'sort' => 70,
                'roles' => ['staff'],
            ],
            'warehouse-manager' => [
                'department' => 'warehouse',
                'code' => 'warehouse-manager',
                'name' => '仓储负责人',
                'type' => 'normal',
                'leadership' => true,
                'description' => '仓储部负责人，绑定仓储管理权限包',
                'sort' => 80,
                'roles' => ['warehouse-management'],
            ],
            'warehouse-keeper' => [
                'department' => 'warehouse',
                'code' => 'warehouse-keeper',
                'name' => '仓管员',
                'type' => 'normal',
                'leadership' => false,
                'description' => '仓储部普通成员岗位',
                'sort' => 90,
                'roles' => ['staff'],
            ],
            'tech-manager' => [
                'department' => 'technology',
                'code' => 'tech-manager',
                'name' => '技术负责人',
                'type' => 'normal',
                'leadership' => true,
                'description' => '技术部负责人，绑定技术管理权限包',
                'sort' => 100,
                'roles' => ['technology-management'],
            ],
            'developer' => [
                'department' => 'technology',
                'code' => 'developer',
                'name' => '开发工程师',
                'type' => 'normal',
                'leadership' => false,
                'description' => '技术部普通成员岗位',
                'sort' => 110,
                'roles' => ['staff'],
            ],
        ];

        $positions = [];
        foreach ($definitions as $key => $definition) {
            $roleIds = [];
            foreach ($definition['roles'] as $roleKey) {
                $roleIds[] = $roles[$roleKey];
            }

            $positions[$key] = $this->seedPosition(
                $departments[$definition['department']],
                $definition['code'],
                $definition['name'],
                $definition['type'],
                $definition['leadership'],
                $definition['description'],
                $definition['sort'],
                $roleIds,
                $now,
            );
        }

        return $positions;
    }

    /**
     * @param list<int> $roleIds
     */
    private function seedPosition(
        int $deptId,
        string $code,
        string $name,
        string $type,
        bool $isLeadership,
        string $description,
        int $sort,
        array $roleIds,
        string $now,
    ): int {
        Db::table('admin_positions')->updateOrInsert(
            ['dept_id' => $deptId, 'code' => $code],
            [
                'name' => $name,
                'type' => $type,
                'is_leadership' => $isLeadership,
                'description' => $description,
                'sort' => $sort,
                'status' => 'enabled',
                'updated_at' => $now,
                'created_at' => $now,
            ]
        );

        $positionId = (int) Db::table('admin_positions')->where('dept_id', $deptId)->where('code', $code)->value('id');
        $this->syncPositionRoles($positionId, $roleIds, $now);

        return $positionId;
    }

    /**
     * @param list<int> $roleIds
     */
    private function syncPositionRoles(int $positionId, array $roleIds, string $now): void
    {
        Db::table('admin_position_roles')->where('position_id', $positionId)->delete();
        foreach (array_values(array_unique($roleIds)) as $index => $roleId) {
            Db::table('admin_position_roles')->insert([
                'position_id' => $positionId,
                'role_id' => $roleId,
                'sort' => $index,
                'created_at' => $now,
                'updated_at' => $now,
            ]);
        }
    }

    /**
     * @param list<string> $codes
     */
    private function syncRoleMenusByCodes(int $roleId, array $codes): void
    {
        Db::table('admin_role_menu')->where('role_id', $roleId)->delete();
        $query = Db::table('admin_menus');
        if ($codes !== ['*']) {
            $query->whereIn('code', array_values(array_unique($codes)));
        }

        foreach ($query->pluck('id')->all() as $menuId) {
            Db::table('admin_role_menu')->insert([
                'role_id' => $roleId,
                'menu_id' => (int) $menuId,
            ]);
        }
    }

    /**
     * @param list<string> $extraCodes
     * @return list<string>
     */
    private function managementMenuCodes(array $extraCodes = []): array
    {
        return array_values(array_unique([
            ...$this->staffMenuCodes(),
            'organization',
            'system.departments',
            'system.departments.detail',
            'system.users',
            'system.users.detail',
            'system.users.create',
            'system.users.update',
            'system.positions',
            'system.positions.detail',
            'system.positions.create',
            'system.positions.update',
            ...$extraCodes,
        ]));
    }

    /**
     * @return list<string>
     */
    private function staffMenuCodes(): array
    {
        return [
            'workbench',
            'system.messages',
            'system.messages.detail',
            'system.messages.update',
        ];
    }

    /**
     * @param null|list<string> $resources
     * @return list<array<string, mixed>>
     */
    private function policyRules(string $scope, ?array $resources = null): array
    {
        $resourceSet = $resources === null ? null : array_fill_keys($resources, true);
        $rules = [];
        foreach ($this->dataPolicyRegistry->allScopeRules() as $index => $rule) {
            if ($resourceSet !== null && ! isset($resourceSet[$rule->resource])) {
                continue;
            }
            $rules[] = [
                'resource' => $rule->resource,
                'strategy' => $rule->strategy,
                'effect' => $rule->effect,
                'scope' => $scope,
                'config' => [],
                'status' => 'enabled',
                'sort' => $index,
            ];
        }

        return $rules;
    }

    /**
     * @param list<array<string, mixed>> $policies
     */
    private function syncRoleDataPolicies(int $roleId, array $policies, string $now): void
    {
        Db::table('admin_role_data_policies')->where('role_id', $roleId)->delete();
        foreach (array_values($policies) as $index => $policy) {
            Db::table('admin_role_data_policies')->insert([
                'role_id' => $roleId,
                'resource' => (string) $policy['resource'],
                'strategy' => (string) $policy['strategy'],
                'effect' => (string) ($policy['effect'] ?? 'allow'),
                'scope' => (string) $policy['scope'],
                'config' => json_encode(
                    (array) ($policy['config'] ?? []),
                    JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES,
                ),
                'status' => (string) ($policy['status'] ?? 'enabled'),
                'sort' => (int) ($policy['sort'] ?? $index),
                'updated_at' => $now,
                'created_at' => $now,
            ]);
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
