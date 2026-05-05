<?php

declare(strict_types=1);

namespace App\Module\System\Repository;

use App\Foundation\Pagination\PageResult;
use App\Module\System\Model\AdminUser;
use Hyperf\DbConnection\Db;

final class AdminUserRepository
{
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

    public function paginate(int $page, int $pageSize, string $keyword = '', string $status = ''): PageResult
    {
        $query = AdminUser::query()->when($keyword !== '', static function ($query) use ($keyword): void {
            $query->where(static function ($query) use ($keyword): void {
                $query->where('username', 'like', '%' . $keyword . '%')
                    ->orWhere('nickname', 'like', '%' . $keyword . '%');
            });
        })->when($status !== '', static function ($query) use ($status): void {
            $query->where('status', $status);
        });

        $total = (int) (clone $query)->count();
        $items = $query->orderBy('id')
            ->forPage($page, $pageSize)
            ->get()
            ->map(fn (AdminUser $user): array => $this->toArray($user))
            ->all();

        return new PageResult($items, $total, $page, $pageSize);
    }

    public function findById(int $id): ?AdminUser
    {
        return AdminUser::query()->where('id', $id)->first();
    }

    public function existsUsername(string $username, ?int $exceptId = null): bool
    {
        return AdminUser::query()
            ->where('username', $username)
            ->when($exceptId !== null, static function ($query) use ($exceptId): void {
                $query->where('id', '<>', $exceptId);
            })
            ->exists();
    }

    public function create(array $data): AdminUser
    {
        return AdminUser::query()->create($data);
    }

    public function update(AdminUser $user, array $data): AdminUser
    {
        $user->fill($data);
        $user->save();

        return $user->refresh();
    }

    public function delete(AdminUser $user): void
    {
        $userId = (int) $user->getAttribute('id');
        Db::table('admin_role_user')->where('user_id', $userId)->delete();
        $user->delete();
    }

    /**
     * @param list<int> $roleIds
     */
    public function syncRoles(AdminUser $user, array $roleIds): void
    {
        $userId = (int) $user->getAttribute('id');
        Db::table('admin_role_user')->where('user_id', $userId)->delete();

        foreach (array_values(array_unique($roleIds)) as $roleId) {
            Db::table('admin_role_user')->insert(['user_id' => $userId, 'role_id' => $roleId]);
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

    public function toArray(AdminUser $user): array
    {
        return [
            'id' => (int) $user->getAttribute('id'),
            'username' => (string) $user->getAttribute('username'),
            'nickname' => (string) $user->getAttribute('nickname'),
            'status' => (string) $user->getAttribute('status'),
            'deptId' => $user->getAttribute('dept_id') === null ? null : (int) $user->getAttribute('dept_id'),
            'roles' => $this->roleCodes($user),
            'roleIds' => $this->roleIds($user),
            'createdAt' => (string) $user->getAttribute('created_at'),
            'updatedAt' => (string) $user->getAttribute('updated_at'),
        ];
    }
}
