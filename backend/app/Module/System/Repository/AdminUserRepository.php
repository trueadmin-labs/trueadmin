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

namespace App\Module\System\Repository;

use App\Foundation\Repository\AbstractRepository;
use App\Module\System\Model\AdminDepartment;
use App\Module\System\Model\AdminUser;
use Hyperf\Database\Model\Builder;
use Hyperf\DbConnection\Db;
use stdClass;
use TrueAdmin\Kernel\Crud\CrudQuery;
use TrueAdmin\Kernel\Pagination\PageResult;

/**
 * @extends AbstractRepository<AdminUser>
 */
final class AdminUserRepository extends AbstractRepository
{
    protected ?string $modelClass = AdminUser::class;

    protected array $keywordFields = ['username', 'nickname'];

    protected array $filterable = [
        'id' => ['eq', 'in'],
        'username' => ['eq', 'like'],
        'nickname' => ['eq', 'like'],
        'status' => ['eq', 'in'],
        'primaryDeptId' => ['eq', 'in'],
        'createdAt' => ['between', 'gte', 'lte'],
    ];

    protected array $sortable = ['id', 'username', 'status', 'createdAt', 'updatedAt'];

    protected array $defaultSort = ['id' => 'asc'];

    public function findEnabledByUsername(string $username): ?AdminUser
    {
        $user = AdminUser::query()
            ->where('username', $username)
            ->where('status', 'enabled')
            ->first();

        return $user instanceof AdminUser ? $user : null;
    }

    public function findEnabledById(int $id): ?AdminUser
    {
        $user = AdminUser::query()
            ->where('id', $id)
            ->where('status', 'enabled')
            ->first();

        return $user instanceof AdminUser ? $user : null;
    }

    /**
     * @return list<string>
     */
    public function roleCodes(AdminUser $user): array
    {
        return $this->effectiveRoleCodes($user);
    }

    /**
     * @return list<string>
     */
    public function directRoleCodes(AdminUser $user): array
    {
        return $user->roles()
            ->where('admin_roles.status', 'enabled')
            ->pluck('code')
            ->map(static fn ($code): string => (string) $code)
            ->values()
            ->all();
    }

    /**
     * @return list<string>
     */
    public function permissions(AdminUser $user): array
    {
        if (in_array('super-admin', $this->roleCodes($user), true)) {
            return ['*'];
        }

        $roleIds = $this->roleIds($user);
        if ($roleIds === []) {
            return [];
        }

        return Db::table('admin_role_menu')
            ->join('admin_menus', 'admin_menus.id', '=', 'admin_role_menu.menu_id')
            ->whereIn('admin_role_menu.role_id', $roleIds)
            ->where('admin_menus.status', 'enabled')
            ->where('admin_menus.permission', '<>', '')
            ->pluck('admin_menus.permission')
            ->filter(static fn ($permission): bool => is_string($permission) && $permission !== '')
            ->unique()
            ->values()
            ->all();
    }

    public function paginate(CrudQuery $adminQuery): PageResult
    {
        $query = AdminUser::query();
        $this->applyDataPolicy($query, 'admin_user', $this->userDataPolicyTarget());

        return $this->pageQuery(
            $query,
            $adminQuery,
            fn (AdminUser $user): array => $this->toArray($user),
        );
    }

    public function findById(int $id): ?AdminUser
    {
        /* @var null|AdminUser $user */
        return $this->findModelById($id);
    }

    public function findByIdWithDataPolicy(int $id): ?AdminUser
    {
        $user = $this->findById($id);
        if ($user === null) {
            return null;
        }

        $query = AdminUser::query()->where('id', $id);
        $this->assertDataPolicyAllows($query, 'admin_user', $this->userDataPolicyTarget());

        return $user;
    }

    /**
     * @param list<int> $ids
     */
    public function assertIdsAllowedByDataPolicy(array $ids): void
    {
        $this->assertDataPolicyAllowsAll(AdminUser::query(), 'admin_user', $ids, 'id', $this->userDataPolicyTarget());
    }

    /**
     * @return list<int>
     */
    public function existingIds(array $ids): array
    {
        return $this->existingModelIds(array_values(array_unique(array_map('intval', $ids))));
    }

    /**
     * @param list<int> $deptIds
     */
    public function assertDepartmentIdsAllowedByDataPolicy(array $deptIds): void
    {
        $this->assertDataPolicyAllowsAll(Db::table('admin_departments'), 'admin_user', $deptIds, 'id', [
            'deptColumn' => 'id',
            'createdByColumn' => '',
        ]);
    }

    public function existsUsername(string $username, ?int $exceptId = null): bool
    {
        return AdminUser::query()
            ->withTrashed()
            ->where('username', $username)
            ->when($exceptId !== null, static function ($query) use ($exceptId): void {
                $query->where('id', '<>', $exceptId);
            })
            ->exists();
    }

    public function create(array $data): AdminUser
    {
        /* @var AdminUser $user */
        return $this->createModel($data);
    }

    public function update(AdminUser $user, array $data): AdminUser
    {
        /* @var AdminUser $user */
        return $this->updateModel($user, $data);
    }

    public function delete(AdminUser $user): void
    {
        $userId = (int) $user->getAttribute('id');
        $this->deleteModel($user);
        Db::table('admin_user_departments')->where('user_id', $userId)->delete();
        Db::table('admin_role_user')->where('user_id', $userId)->delete();
        Db::table('admin_user_positions')->where('user_id', $userId)->delete();
    }

    /**
     * @param list<int> $roleIds
     */
    public function syncRoles(AdminUser $user, array $roleIds): void
    {
        $userId = (int) $user->getAttribute('id');
        Db::table('admin_role_user')->where('user_id', $userId)->delete();

        foreach (array_values(array_unique($roleIds)) as $roleId) {
            Db::table('admin_role_user')->insert([
                'user_id' => $userId,
                'role_id' => $roleId,
            ]);
        }
    }

    /**
     * @return list<int>
     */
    public function roleIds(AdminUser $user): array
    {
        return $this->effectiveRoleIds($user);
    }

    /**
     * @return list<int>
     */
    public function directRoleIds(AdminUser $user): array
    {
        return Db::table('admin_role_user')
            ->where('user_id', (int) $user->getAttribute('id'))
            ->pluck('role_id')
            ->map(static fn ($id): int => (int) $id)
            ->values()
            ->all();
    }

    /**
     * @param list<int> $positionIds
     */
    public function syncPositions(AdminUser $user, array $positionIds): void
    {
        $userId = (int) $user->getAttribute('id');
        Db::table('admin_user_positions')->where('user_id', $userId)->delete();

        $now = date('Y-m-d H:i:s');
        foreach (array_values(array_unique($positionIds)) as $index => $positionId) {
            Db::table('admin_user_positions')->insert([
                'user_id' => $userId,
                'position_id' => $positionId,
                'is_primary' => $index === 0,
                'assigned_at' => $now,
            ]);
        }
    }

    /**
     * @return list<int>
     */
    public function positionIds(AdminUser $user): array
    {
        return Db::table('admin_user_positions')
            ->where('user_id', (int) $user->getAttribute('id'))
            ->pluck('position_id')
            ->map(static fn ($id): int => (int) $id)
            ->values()
            ->all();
    }

    /**
     * @param list<int> $roleIds
     * @return list<int>
     */
    public function userIdsByEffectiveRoleIds(array $roleIds): array
    {
        $roleIds = array_values(array_unique(array_filter(array_map('intval', $roleIds), static fn (int $id): bool => $id > 0)));
        if ($roleIds === []) {
            return [];
        }

        $directUserIds = Db::table('admin_role_user')
            ->whereIn('role_id', $roleIds)
            ->pluck('user_id')
            ->map(static fn (mixed $id): int => (int) $id)
            ->all();

        $positionUserIds = Db::table('admin_user_positions')
            ->join('admin_positions', 'admin_positions.id', '=', 'admin_user_positions.position_id')
            ->join('admin_position_roles', 'admin_position_roles.position_id', '=', 'admin_positions.id')
            ->where('admin_positions.status', 'enabled')
            ->whereIn('admin_position_roles.role_id', $roleIds)
            ->pluck('admin_user_positions.user_id')
            ->map(static fn (mixed $id): int => (int) $id)
            ->all();

        return array_values(array_unique(array_filter(
            array_merge($directUserIds, $positionUserIds),
            static fn (int $id): bool => $id > 0,
        )));
    }

    /**
     * @param list<int> $roleIds
     */
    public function enabledUserCountByEffectiveRoleIds(array $roleIds): int
    {
        $userIds = $this->userIdsByEffectiveRoleIds($roleIds);
        if ($userIds === []) {
            return 0;
        }

        return (int) Db::table('admin_users')
            ->whereIn('id', $userIds)
            ->where('status', 'enabled')
            ->whereNull('deleted_at')
            ->count();
    }

    /**
     * @param list<int> $deptIds
     */
    public function syncDepartments(AdminUser $user, array $deptIds, ?int $primaryDeptId): void
    {
        $userId = (int) $user->getAttribute('id');
        Db::table('admin_user_departments')->where('user_id', $userId)->delete();

        foreach (array_values(array_unique($deptIds)) as $deptId) {
            Db::table('admin_user_departments')->insert([
                'user_id' => $userId,
                'dept_id' => $deptId,
                'is_primary' => $primaryDeptId !== null && $deptId === $primaryDeptId,
            ]);
        }
    }

    /**
     * @return list<int>
     */
    public function departmentIds(AdminUser $user): array
    {
        return Db::table('admin_user_departments')
            ->where('user_id', (int) $user->getAttribute('id'))
            ->pluck('dept_id')
            ->map(static fn ($id): int => (int) $id)
            ->values()
            ->all();
    }

    /**
     * @param list<int> $userIds
     * @return list<int>
     */
    public function userIdsMissingDepartment(array $userIds, int $deptId): array
    {
        if ($userIds === []) {
            return [];
        }

        $assignedUserIds = Db::table('admin_user_departments')
            ->whereIn('user_id', array_values(array_unique($userIds)))
            ->where('dept_id', $deptId)
            ->pluck('user_id')
            ->map(static fn (mixed $id): int => (int) $id)
            ->all();

        return array_values(array_diff(array_values(array_unique($userIds)), $assignedUserIds));
    }

    public function toArray(AdminUser $user): array
    {
        return [
            'id' => (int) $user->getAttribute('id'),
            'username' => (string) $user->getAttribute('username'),
            'nickname' => (string) $user->getAttribute('nickname'),
            'avatar' => (string) $user->getAttribute('avatar'),
            'preferences' => $this->preferences($user),
            'status' => (string) $user->getAttribute('status'),
            'primaryDeptId' => $user->getAttribute('primary_dept_id') === null ? null : (int) $user->getAttribute('primary_dept_id'),
            'primaryDeptName' => $this->primaryDepartmentName($user),
            'primaryDeptPath' => $this->primaryDepartmentPath($user),
            'deptIds' => $this->departmentIds($user),
            'positions' => $this->positions($user),
            'positionIds' => $this->positionIds($user),
            'roles' => $this->roleCodes($user),
            'roleNames' => $this->roleNames($user),
            'roleIds' => $this->roleIds($user),
            'directRoles' => $this->directRoleCodes($user),
            'directRoleNames' => $this->directRoleNames($user),
            'directRoleIds' => $this->directRoleIds($user),
            'createdAt' => (string) $user->getAttribute('created_at'),
            'updatedAt' => (string) $user->getAttribute('updated_at'),
        ];
    }

    /**
     * @return list<array<string, mixed>>
     */
    public function positions(AdminUser $user): array
    {
        $bindings = $this->positionRoleBindings($user);

        $roleIdsByPosition = [];
        $roleNamesByPosition = [];
        foreach ($bindings as $binding) {
            $positionId = (int) $binding['positionId'];
            $roleIdsByPosition[$positionId][] = (int) $binding['roleId'];
            $roleNamesByPosition[$positionId][] = (string) $binding['roleName'];
        }

        return Db::table('admin_user_positions')
            ->join('admin_positions', 'admin_positions.id', '=', 'admin_user_positions.position_id')
            ->leftJoin('admin_departments', 'admin_departments.id', '=', 'admin_positions.dept_id')
            ->where('admin_user_positions.user_id', (int) $user->getAttribute('id'))
            ->orderBy('admin_positions.dept_id')
            ->orderBy('admin_positions.sort')
            ->orderBy('admin_positions.id')
            ->get([
                'admin_positions.id',
                'admin_positions.dept_id',
                'admin_positions.code',
                'admin_positions.name',
                'admin_positions.status',
                'admin_departments.name as dept_name',
                'admin_departments.path as dept_path',
                'admin_user_positions.is_primary',
            ])
            ->map(function (mixed $row) use ($roleIdsByPosition, $roleNamesByPosition): array {
                $positionId = (int) $row->id;

                return [
                    'id' => $positionId,
                    'deptId' => (int) $row->dept_id,
                    'deptName' => (string) ($row->dept_name ?? ''),
                    'deptPath' => $this->departmentPath((int) $row->dept_id, (string) ($row->dept_path ?? '')),
                    'code' => (string) $row->code,
                    'name' => (string) $row->name,
                    'status' => (string) $row->status,
                    'primary' => (bool) $row->is_primary,
                    'roleIds' => array_values(array_unique($roleIdsByPosition[$positionId] ?? [])),
                    'roleNames' => array_values(array_unique($roleNamesByPosition[$positionId] ?? [])),
                ];
            })
            ->all();
    }

    /**
     * @return list<array{positionId:int,positionName:string,deptId:int,deptName:string,roleId:int,roleCode:string,roleName:string}>
     */
    public function positionRoleBindings(AdminUser $user): array
    {
        return Db::table('admin_user_positions')
            ->join('admin_positions', 'admin_positions.id', '=', 'admin_user_positions.position_id')
            ->join('admin_position_roles', 'admin_position_roles.position_id', '=', 'admin_positions.id')
            ->join('admin_roles', 'admin_roles.id', '=', 'admin_position_roles.role_id')
            ->leftJoin('admin_departments', 'admin_departments.id', '=', 'admin_positions.dept_id')
            ->where('admin_user_positions.user_id', (int) $user->getAttribute('id'))
            ->where('admin_positions.status', 'enabled')
            ->where('admin_roles.status', 'enabled')
            ->orderBy('admin_positions.dept_id')
            ->orderBy('admin_positions.sort')
            ->orderBy('admin_position_roles.sort')
            ->get([
                'admin_positions.id as position_id',
                'admin_positions.name as position_name',
                'admin_positions.dept_id',
                'admin_departments.name as dept_name',
                'admin_roles.id as role_id',
                'admin_roles.code as role_code',
                'admin_roles.name as role_name',
            ])
            ->map(static fn (mixed $row): array => [
                'positionId' => (int) $row->position_id,
                'positionName' => (string) $row->position_name,
                'deptId' => (int) $row->dept_id,
                'deptName' => (string) ($row->dept_name ?? ''),
                'roleId' => (int) $row->role_id,
                'roleCode' => (string) $row->role_code,
                'roleName' => (string) $row->role_name,
            ])
            ->all();
    }

    public function passwordHash(AdminUser $user): string
    {
        return (string) $user->getAttribute('password');
    }

    protected function applyParams(Builder $query, CrudQuery $adminQuery): void
    {
        $deptId = (int) $adminQuery->param('deptId', 0);
        if ($deptId > 0) {
            $deptIds = $this->truthy($adminQuery->param('includeChildren', false))
                ? $this->selfAndDescendantDepartmentIds($deptId)
                : [$deptId];
            if ($deptIds !== []) {
                $query->whereExists(static function ($subQuery) use ($deptIds): void {
                    $subQuery
                        ->selectRaw('1')
                        ->from('admin_user_departments')
                        ->whereColumn('admin_user_departments.user_id', 'admin_users.id')
                        ->whereIn('admin_user_departments.dept_id', $deptIds);
                });
            }
        }

        $positionId = (int) $adminQuery->param('positionId', 0);
        if ($positionId > 0) {
            $query->whereExists(static function ($subQuery) use ($positionId): void {
                $subQuery
                    ->selectRaw('1')
                    ->from('admin_user_positions')
                    ->whereColumn('admin_user_positions.user_id', 'admin_users.id')
                    ->where('admin_user_positions.position_id', $positionId);
            });
        }

        $roleCodes = $this->stringList($adminQuery->param('roleCodes', []));
        if ($roleCodes !== []) {
            $query->where(function (Builder $query) use ($roleCodes): void {
                $query
                    ->whereHas('roles', static function ($query) use ($roleCodes): void {
                        $query->whereIn('admin_roles.code', $roleCodes);
                    })
                    ->orWhereExists(static function ($subQuery) use ($roleCodes): void {
                        $subQuery
                            ->selectRaw('1')
                            ->from('admin_user_positions')
                            ->join('admin_positions', 'admin_positions.id', '=', 'admin_user_positions.position_id')
                            ->join('admin_position_roles', 'admin_position_roles.position_id', '=', 'admin_positions.id')
                            ->join('admin_roles', 'admin_roles.id', '=', 'admin_position_roles.role_id')
                            ->whereColumn('admin_user_positions.user_id', 'admin_users.id')
                            ->where('admin_positions.status', 'enabled')
                            ->where('admin_roles.status', 'enabled')
                            ->whereIn('admin_roles.code', $roleCodes);
                    });
            });
        }
    }

    /**
     * @return list<string>
     */
    private function roleNames(AdminUser $user): array
    {
        $roleIds = $this->roleIds($user);
        if ($roleIds === []) {
            return [];
        }

        return Db::table('admin_roles')
            ->whereIn('id', $roleIds)
            ->where('status', 'enabled')
            ->orderBy('sort')
            ->orderBy('id')
            ->pluck('name')
            ->map(static fn (mixed $name): string => (string) $name)
            ->values()
            ->all();
    }

    /**
     * @return list<string>
     */
    private function directRoleNames(AdminUser $user): array
    {
        return $user->roles()
            ->where('admin_roles.status', 'enabled')
            ->pluck('name')
            ->map(static fn ($name): string => (string) $name)
            ->values()
            ->all();
    }

    /**
     * @return list<int>
     */
    private function effectiveRoleIds(AdminUser $user): array
    {
        return array_values(array_unique(array_merge(
            $this->directRoleIds($user),
            array_column($this->positionRoleBindings($user), 'roleId'),
        )));
    }

    /**
     * @return list<string>
     */
    private function effectiveRoleCodes(AdminUser $user): array
    {
        $roleIds = $this->effectiveRoleIds($user);
        if ($roleIds === []) {
            return [];
        }

        return Db::table('admin_roles')
            ->whereIn('id', $roleIds)
            ->where('status', 'enabled')
            ->orderBy('sort')
            ->orderBy('id')
            ->pluck('code')
            ->map(static fn (mixed $code): string => (string) $code)
            ->values()
            ->all();
    }

    /**
     * @return array<string, string>
     */
    private function userDataPolicyTarget(): array
    {
        return [
            'deptColumn' => 'primary_dept_id',
            'createdByColumn' => 'created_by',
            'membershipTable' => 'admin_user_departments',
            'membershipOwnerColumn' => 'admin_user_departments.user_id',
            'membershipDeptColumn' => 'admin_user_departments.dept_id',
            'ownerColumn' => 'admin_users.id',
        ];
    }

    /**
     * @return list<int>
     */
    private function selfAndDescendantDepartmentIds(int $departmentId): array
    {
        return AdminDepartment::query()
            ->where('id', $departmentId)
            ->orWhere('path', 'like', '%,' . $departmentId . ',%')
            ->pluck('id')
            ->map(static fn (mixed $id): int => (int) $id)
            ->values()
            ->all();
    }

    /**
     * @return list<string>
     */
    private function stringList(mixed $value): array
    {
        $items = is_array($value) ? $value : explode(',', (string) $value);

        return array_values(array_unique(array_filter(
            array_map(static fn (mixed $item): string => trim((string) $item), $items),
            static fn (string $item): bool => $item !== '',
        )));
    }

    private function truthy(mixed $value): bool
    {
        return in_array(strtolower((string) $value), ['1', 'true', 'yes', 'on'], true);
    }

    private function primaryDepartmentName(AdminUser $user): string
    {
        $department = $this->primaryDepartment($user);

        return $department === null ? '' : (string) $department->name;
    }

    private function primaryDepartmentPath(AdminUser $user): string
    {
        $department = $this->primaryDepartment($user);

        return $department === null ? '' : $this->departmentPath((int) $department->id, (string) $department->path);
    }

    private function primaryDepartment(AdminUser $user): ?stdClass
    {
        $primaryDeptId = $user->getAttribute('primary_dept_id');
        if ($primaryDeptId === null) {
            return null;
        }

        $department = Db::table('admin_departments')
            ->where('id', (int) $primaryDeptId)
            ->first(['id', 'name', 'path']);

        return $department instanceof stdClass ? $department : null;
    }

    private function departmentPath(int $deptId, string $path): string
    {
        $ids = array_values(array_filter(
            array_map('intval', explode(',', $path)),
            static fn (int $id): bool => $id > 0,
        ));
        $ids[] = $deptId;

        $names = Db::table('admin_departments')
            ->whereIn('id', $ids)
            ->pluck('name', 'id')
            ->all();

        $pathNames = [];
        foreach ($ids as $id) {
            if (isset($names[$id])) {
                $pathNames[] = (string) $names[$id];
            }
        }

        return implode('/', $pathNames);
    }

    /** @return array<string, mixed> */
    private function preferences(AdminUser $user): array
    {
        $preferences = $user->getAttribute('preferences');

        return is_array($preferences) ? $preferences : [];
    }
}
