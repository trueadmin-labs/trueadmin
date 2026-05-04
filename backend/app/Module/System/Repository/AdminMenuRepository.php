<?php

declare(strict_types=1);

namespace App\Module\System\Repository;

use App\Module\System\Model\AdminMenu;

final class AdminMenuRepository
{
    public function allEnabled(): array
    {
        return AdminMenu::query()
            ->where('status', 'enabled')
            ->orderBy('sort')
            ->orderBy('id')
            ->get()
            ->toArray();
    }

    /**
     * @return list<string>
     */
    public function permissionCodes(): array
    {
        return AdminMenu::query()
            ->where('status', 'enabled')
            ->where('permission', '<>', '')
            ->pluck('permission')
            ->map(static fn ($permission): string => (string) $permission)
            ->unique()
            ->values()
            ->all();
    }
}
