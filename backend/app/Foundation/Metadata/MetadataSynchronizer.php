<?php

declare(strict_types=1);

namespace App\Foundation\Metadata;

use Hyperf\DbConnection\Db;

final class MetadataSynchronizer
{
    public function __construct(
        private readonly InterfaceMetadataScanner $scanner,
        private readonly MetadataMenuRepositoryInterface $menus,
    ) {
    }

    public function sync(bool $force = false): array
    {
        $metadata = $this->scanner->scan();
        $now = date('Y-m-d H:i:s');
        $synced = ['menus' => 0, 'buttons' => 0, 'permissions' => 0];

        Db::transaction(function () use ($metadata, $now, $force, &$synced): void {
            $menuIds = [];
            $menus = [];
            foreach ($metadata['menus'] ?? [] as $menu) {
                $menus[$menu['code']] = $menu;
            }

            foreach (array_keys($menus) as $code) {
                if (! isset($menuIds[$code])) {
                    $menuIds[$code] = $this->syncMenu($code, $menus, $menuIds, $now, $force, []);
                    ++$synced['menus'];
                }
            }

            $menuPermissions = array_values(array_filter(array_map(
                static fn (array $menu): string => (string) ($menu['permission'] ?? ''),
                $menus,
            )));

            $syncedCodes = array_keys($menus);

            foreach ($metadata['permissions'] ?? [] as $permission) {
                if ((bool) ($permission['public'] ?? false) || in_array((string) $permission['code'], $menuPermissions, true)) {
                    continue;
                }

                $parentCode = (string) ($permission['menu'] ?? '');
                $parentId = $parentCode !== '' ? ($menuIds[$parentCode] ?? 0) : 0;
                $this->menus->upsertMenu([
                    'code' => $permission['code'],
                    'title' => $permission['title'] ?: $permission['code'],
                    'path' => '',
                    'permission' => $permission['code'],
                    'type' => 'button',
                    'sort' => 0,
                    'icon' => '',
                ], $parentId, $now, $force);
                $syncedCodes[] = (string) $permission['code'];
                ++$synced['permissions'];
            }

            foreach ($metadata['menuButtons'] ?? [] as $button) {
                $parentCode = (string) ($button['parent'] ?? '');
                $parentId = $parentCode !== '' ? $this->requireSyncedMenuId($parentCode, $menuIds, (string) $button['code']) : 0;
                $this->menus->upsertMenu([
                    'code' => $button['code'],
                    'title' => $button['title'],
                    'path' => '',
                    'permission' => $button['permission'] ?: $button['code'],
                    'type' => 'button',
                    'sort' => $button['sort'],
                    'icon' => '',
                ], $parentId, $now, $force);
                $syncedCodes[] = (string) $button['code'];
                ++$synced['buttons'];
            }

            if ($force) {
                $this->menus->deleteCodeMenusExcept(array_values(array_unique($syncedCodes)));
            }
        });

        return $synced;
    }

    private function syncMenu(string $code, array $menus, array &$menuIds, string $now, bool $force, array $visiting): int
    {
        if (isset($menuIds[$code])) {
            return $menuIds[$code];
        }
        if (! isset($menus[$code])) {
            throw new \RuntimeException(sprintf('Menu [%s] is referenced but not defined.', $code));
        }
        if (isset($visiting[$code])) {
            $cycle = implode(' -> ', [...array_keys($visiting), $code]);
            throw new \RuntimeException(sprintf('Circular menu parent relationship detected: %s.', $cycle));
        }

        $menu = $menus[$code];
        $parentCode = (string) ($menu['parent'] ?? '');
        if ($parentCode !== '' && ! isset($menus[$parentCode])) {
            throw new \RuntimeException(sprintf('Menu [%s] references missing parent menu [%s].', $code, $parentCode));
        }

        $parentId = $parentCode !== ''
            ? $this->syncMenu($parentCode, $menus, $menuIds, $now, $force, [...$visiting, $code => true])
            : 0;

        return $menuIds[$code] = $this->menus->upsertMenu($menu, $parentId, $now, $force);
    }

    /**
     * @param array<string, int> $menuIds
     */
    private function requireSyncedMenuId(string $parentCode, array $menuIds, string $childCode): int
    {
        if (! isset($menuIds[$parentCode])) {
            throw new \RuntimeException(sprintf('Menu button [%s] references missing parent menu [%s].', $childCode, $parentCode));
        }

        return $menuIds[$parentCode];
    }
}
