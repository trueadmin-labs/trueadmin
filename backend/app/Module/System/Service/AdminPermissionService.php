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

        if (in_array('*', $permissions, true)) {
            return $this->menus->enabledTree();
        }

        return $this->filterVisibleMenus($this->menus->enabledTree(), $permissions);
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
}
