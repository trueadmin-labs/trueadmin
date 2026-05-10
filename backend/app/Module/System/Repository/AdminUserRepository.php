<?php

declare(strict_types=1);

namespace App\Module\System\Repository;

use App\Foundation\Query\AdminQuery;
use App\Foundation\Pagination\PageResult;
use App\Foundation\Repository\AbstractRepository;
use App\Module\System\Model\AdminUser;
use Hyperf\DbConnection\Db;

final class AdminUserRepository extends AbstractRepository
{
    protected ?string $modelClass = AdminUser::class;

    protected array $keywordFields = ['username', 'nickname'];

    protected array $filterable = [
        'id' => ['=', 'in'],
        'username' => ['=', 'like'],
        'nickname' => ['=', 'like'],
        'status' => ['=', 'in'],
        'primary_dept_id' => ['=', 'in'],
        'created_at' => ['between', '>=', '<='],
    ];

    protected array $sortable = ['id', 'username', 'status', 'created_at', 'updated_at'];

    protected array $defaultSort = ['id' => 'asc'];

    public function findEnabledByUsername(string $username): ?AdminUser
    {
        return AdminUser::query()
            ->where('username', $username)
            ->where('status', 'enabled')
            ->first();
    }

    public function findEnabledById(int $id): ?AdminUser
    {
        return AdminUser::query()
            ->where('id', $id)
            ->where('status', 'enabled')
            ->first();
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

    public function paginate(AdminQuery $adminQuery): PageResult
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
        $this->syncPivot('admin_role_user', 'user_id', $userId, 'role_id', $roleIds);
    }

    /**
     * @return list<int>
     */
    public function roleIds(AdminUser $user): array
    {
        return $this->pivotIds('admin_role_user', 'user_id', (int) $user->getAttribute('id'), 'role_id');
    }

    /**
     * @param list<int> $deptIds
     */
    public function syncDepartments(AdminUser $user, array $deptIds, ?int $primaryDeptId): void
    {
        $userId = (int) $user->getAttribute('id');
        $this->syncPivot(
            'admin_user_departments',
            'user_id',
            $userId,
            'dept_id',
            $deptIds,
            static fn (int $deptId): array => ['is_primary' => $primaryDeptId !== null && $deptId === $primaryDeptId],
        );
    }

    /**
     * @return list<int>
     */
    public function departmentIds(AdminUser $user): array
    {
        return $this->pivotIds('admin_user_departments', 'user_id', (int) $user->getAttribute('id'), 'dept_id');
    }

    public function toArray(AdminUser $user): array
    {
        return [
            'id' => (int) $user->getAttribute('id'),
            'username' => (string) $user->getAttribute('username'),
            'nickname' => (string) $user->getAttribute('nickname'),
            'status' => (string) $user->getAttribute('status'),
            'primaryDeptId' => $user->getAttribute('primary_dept_id') === null ? null : (int) $user->getAttribute('primary_dept_id'),
            'deptIds' => $this->departmentIds($user),
            'roles' => $this->roleCodes($user),
            'roleIds' => $this->roleIds($user),
            'createdAt' => (string) $user->getAttribute('created_at'),
            'updatedAt' => (string) $user->getAttribute('updated_at'),
        ];
    }
}
