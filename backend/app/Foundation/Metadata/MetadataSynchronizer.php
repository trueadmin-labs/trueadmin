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

    public function sync(): array
    {
        $metadata = $this->scanner->scan();
        $now = date('Y-m-d H:i:s');
        $synced = ['menus' => 0, 'buttons' => 0, 'permissions' => 0];

        Db::transaction(function () use ($metadata, $now, &$synced): void {
            $menuIds = [];
            $menus = [];
            foreach ($metadata['menus'] ?? [] as $menu) {
                $menus[$menu['code']] = $menu;
            }

            foreach (array_keys($menus) as $code) {
                if (! isset($menuIds[$code])) {
                    $menuIds[$code] = $this->syncMenu($code, $menus, $menuIds, $now);
                    ++$synced['menus'];
                }
            }

            $menuPermissions = array_values(array_filter(array_map(
                static fn (array $menu): string => (string) ($menu['permission'] ?? ''),
                $menus,
            )));

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
                    'component' => '',
                ], $parentId, $now);
                ++$synced['permissions'];
            }

            foreach ($metadata['menuButtons'] ?? [] as $button) {
                $parentId = $button['parent'] !== '' ? ($menuIds[$button['parent']] ?? 0) : 0;
                $this->menus->upsertMenu([
                    'code' => $button['code'],
                    'title' => $button['title'],
                    'path' => '',
                    'permission' => $button['permission'] ?: $button['code'],
                    'type' => 'button',
                    'sort' => $button['sort'],
                    'icon' => '',
                    'component' => '',
                ], $parentId, $now);
                ++$synced['buttons'];
            }
        });

        return $synced;
    }

    private function syncMenu(string $code, array $menus, array &$menuIds, string $now): int
    {
        if (isset($menuIds[$code])) {
            return $menuIds[$code];
        }

        $menu = $menus[$code];
        $parentCode = (string) ($menu['parent'] ?? '');
        $parentId = $parentCode !== '' && isset($menus[$parentCode])
            ? $this->syncMenu($parentCode, $menus, $menuIds, $now)
            : 0;

        return $menuIds[$code] = $this->menus->upsertMenu($menu, $parentId, $now);
    }
}
