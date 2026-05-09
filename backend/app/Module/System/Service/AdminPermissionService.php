<?php

declare(strict_types=1);

namespace App\Module\System\Service;

use App\Foundation\Contract\AdminPermissionProviderInterface;
use App\Module\System\Repository\AdminMenuRepository;
use TrueAdmin\Kernel\Context\Actor;
use TrueAdmin\Kernel\Context\ActorContext;

final class AdminPermissionService implements AdminPermissionProviderInterface
{
    public function __construct(private readonly AdminMenuRepository $menus)
    {
    }

    public function can(Actor $actor, string $permission): bool
    {
        if ($permission === '' || $actor->type !== 'admin') {
            return false;
        }

        $permissions = $actor->claims['permissions'] ?? [];
        if (! is_array($permissions)) {
            return false;
        }

        return in_array('*', $permissions, true) || in_array($permission, $permissions, true);
    }

    public function menuTree(): array
    {
        $actor = ActorContext::principal();
        if ($actor === null || $actor->type !== 'admin') {
            return [];
        }

        $permissions = $actor->claims['permissions'] ?? [];
        if (! is_array($permissions)) {
            return [];
        }

        $menus = $this->menus->runtimeTree();
        if (! in_array('*', $permissions, true)) {
            $menus = $this->filterVisibleMenus($menus, $permissions);
        }

        return $this->withoutRuntimePrivateFields($menus);
    }

    public function permissionCodes(): array
    {
        return $this->menus->permissionCodes();
    }

    private function filterVisibleMenus(array $menus, array $permissions): array
    {
        $visible = [];
        foreach ($menus as $menu) {
            $children = isset($menu['children']) && is_array($menu['children'])
                ? $this->filterVisibleMenus($menu['children'], $permissions)
                : [];
            $permission = (string) ($menu['permission'] ?? '');
            $allowed = $permission === '' || in_array($permission, $permissions, true);

            if (! $allowed && $children === []) {
                continue;
            }

            if ($children === []) {
                unset($menu['children']);
            } else {
                $menu['children'] = $children;
            }

            $visible[] = $menu;
        }

        return $visible;
    }

    private function withoutRuntimePrivateFields(array $menus): array
    {
        return array_map(function (array $menu): array {
            unset($menu['permission']);
            if (isset($menu['children']) && is_array($menu['children'])) {
                $menu['children'] = $this->withoutRuntimePrivateFields($menu['children']);
            }

            return $menu;
        }, $menus);
    }
}
