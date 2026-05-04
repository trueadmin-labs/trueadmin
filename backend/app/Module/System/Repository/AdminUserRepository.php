<?php

declare(strict_types=1);

namespace App\Module\System\Repository;

use App\Module\System\Model\AdminUser;

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
}
