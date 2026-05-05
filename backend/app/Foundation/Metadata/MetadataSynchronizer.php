<?php

declare(strict_types=1);

namespace App\Foundation\Metadata;

use App\Module\System\Model\AdminMenu;
use Hyperf\DbConnection\Db;

final class MetadataSynchronizer
{
    public function __construct(private readonly InterfaceMetadataScanner $scanner)
    {
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
                $this->upsertMenu([
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
                $this->upsertMenu([
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

        return $menuIds[$code] = $this->upsertMenu($menu, $parentId, $now);
    }

    private function upsertMenu(array $menu, int $parentId, string $now): int
    {
        $code = (string) $menu['code'];
        $exists = AdminMenu::query()->where('code', $code)->first();
        if ($exists === null && (string) ($menu['permission'] ?? '') !== '') {
            $exists = AdminMenu::query()->where('permission', (string) $menu['permission'])->first();
        }

        $defaults = [
            'parent_id' => $parentId,
            'code' => $code,
            'type' => (string) ($menu['type'] ?? 'menu'),
            'name' => (string) ($menu['title'] ?? $code),
            'path' => (string) ($menu['path'] ?? ''),
            'component' => (string) ($menu['component'] ?? ''),
            'icon' => (string) ($menu['icon'] ?? ''),
            'permission' => (string) ($menu['permission'] ?? ''),
            'sort' => (int) ($menu['sort'] ?? 0),
            'status' => 'enabled',
            'metadata_synced_at' => $now,
            'created_at' => $now,
            'updated_at' => $now,
        ];

        if ($exists === null) {
            $created = AdminMenu::query()->create($defaults);
            return (int) $created->getAttribute('id');
        }

        $updates = ['code' => $code, 'metadata_synced_at' => $now, 'updated_at' => $now];
        foreach (['permission', 'type', 'path', 'component', 'icon', 'parent_id'] as $field) {
            $current = $exists->getAttribute($field);
            if ($current === null || $current === '' || ($field === 'parent_id' && (int) $current === 0 && $parentId > 0)) {
                $updates[$field] = $defaults[$field];
            }
        }

        $exists->fill($updates);
        $exists->save();

        return (int) $exists->getAttribute('id');
    }
}
