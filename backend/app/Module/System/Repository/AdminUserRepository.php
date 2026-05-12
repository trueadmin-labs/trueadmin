<?php

declare(strict_types=1);

namespace App\Module\System\Repository;

use TrueAdmin\Kernel\Crud\CrudQuery;
use TrueAdmin\Kernel\Pagination\PageResult;
use App\Foundation\Repository\AbstractRepository;
use App\Module\System\Model\AdminDepartment;
use App\Module\System\Model\AdminUser;
use Hyperf\Database\Model\Builder;
use Hyperf\DbConnection\Db;
use stdClass;

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

        return $user->roles()
            ->where('admin_roles.status', 'enabled')
            ->with(['menus' => static function ($query): void {
                $query->where('admin_menus.status', 'enabled')
                    ->where('admin_menus.permission', '<>', '');
            }])
            ->get()
            ->flatMap(static fn ($role) => $role->menus->pluck('permission'))
            ->filter(static fn ($permission): bool => is_string($permission) && $permission !== '')
            ->unique()
            ->values()
            ->all();
    }

    public function paginate(CrudQuery $adminQuery): PageResult
    {
        $query = AdminUser::query();
        $this->applyDataPolicy($query, 'admin_user', [
            'deptColumn' => 'primary_dept_id',
            'createdByColumn' => 'created_by',
        ]);

        return $this->pageQuery(
            $query,
            $adminQuery,
            fn (AdminUser $user): array => $this->toArray($user),
        );
    }

    protected function applyParams(Builder $query, CrudQuery $adminQuery): void
    {
        $deptId = (int) $adminQuery->param('deptId', 0);
        if ($deptId > 0) {
            $deptIds = $this->truthy($adminQuery->param('includeChildren', false))
                ? $this->selfAndDescendantDepartmentIds($deptId)
                : [$deptId];
            if ($deptIds !== []) {
                $query->whereIn('primary_dept_id', $deptIds);
            }
        }

        $roleCodes = $this->stringList($adminQuery->param('roleCodes', []));
        if ($roleCodes !== []) {
            $query->whereHas('roles', static function ($query) use ($roleCodes): void {
                $query->whereIn('admin_roles.code', $roleCodes);
            });
        }
    }

    public function findById(int $id): ?AdminUser
    {
        /** @var null|AdminUser $user */
        $user = $this->findModelById($id);

        return $user;
    }

    public function findByIdWithDataPolicy(int $id): ?AdminUser
    {
        $user = $this->findById($id);
        if ($user === null) {
            return null;
        }

        $query = AdminUser::query()->where('id', $id);
        $this->assertDataPolicyAllows($query, 'admin_user', [
            'deptColumn' => 'primary_dept_id',
            'createdByColumn' => 'created_by',
        ]);

        return $user;
    }

    /**
     * @param list<int> $ids
     */
    public function assertIdsAllowedByDataPolicy(array $ids): void
    {
        $this->assertDataPolicyAllowsAll(AdminUser::query(), 'admin_user', $ids, 'id', [
            'deptColumn' => 'primary_dept_id',
            'createdByColumn' => 'created_by',
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
        /** @var AdminUser $user */
        $user = $this->createModel($data);

        return $user;
    }

    public function update(AdminUser $user, array $data): AdminUser
    {
        /** @var AdminUser $user */
        $user = $this->updateModel($user, $data);

        return $user;
    }

    public function delete(AdminUser $user): void
    {
        $userId = (int) $user->getAttribute('id');
        $this->deleteModel($user);
        Db::table('admin_user_departments')->where('user_id', $userId)->delete();
        Db::table('admin_role_user')->where('user_id', $userId)->delete();
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
        return Db::table('admin_role_user')
            ->where('user_id', (int) $user->getAttribute('id'))
            ->pluck('role_id')
            ->map(static fn ($id): int => (int) $id)
            ->values()
            ->all();
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
            'roles' => $this->roleCodes($user),
            'roleNames' => $this->roleNames($user),
            'roleIds' => $this->roleIds($user),
            'createdAt' => (string) $user->getAttribute('created_at'),
            'updatedAt' => (string) $user->getAttribute('updated_at'),
        ];
    }

    /**
     * @return list<string>
     */
    private function roleNames(AdminUser $user): array
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
        if ($department === null) {
            return '';
        }

        $ids = array_values(array_filter(
            array_map('intval', explode(',', (string) $department->path)),
            static fn (int $id): bool => $id > 0,
        ));
        $ids[] = (int) $department->id;

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

    public function passwordHash(AdminUser $user): string
    {
        return (string) $user->getAttribute('password');
    }

    /** @return array<string, mixed> */
    private function preferences(AdminUser $user): array
    {
        $preferences = $user->getAttribute('preferences');

        return is_array($preferences) ? $preferences : [];
    }
}
