<?php

declare(strict_types=1);

namespace App\Module\System\Repository;

use App\Foundation\Query\AdminQuery;
use App\Foundation\Repository\AbstractRepository;
use App\Module\System\Model\AdminMenu;
use Hyperf\DbConnection\Db;

final class AdminMenuRepository extends AbstractRepository
{
    protected array $keywordFields = ['code', 'name', 'path', 'permission'];

    protected array $filterable = [
        'id' => ['=', 'in'],
        'parent_id' => ['=', 'in'],
        'code' => ['=', 'like'],
        'type' => ['=', 'in'],
        'name' => ['=', 'like'],
        'path' => ['=', 'like'],
        'permission' => ['=', 'like'],
        'status' => ['=', 'in'],
    ];

    protected array $sortable = ['id', 'sort', 'created_at', 'updated_at'];

    protected array $defaultSort = ['sort' => 'asc', 'id' => 'asc'];

    public function all(AdminQuery $adminQuery): array
    {
        return $this->listQuery(
            AdminMenu::query(),
            $adminQuery,
            fn (AdminMenu $menu): array => $this->toArray($menu),
        );
    }

    public function find(int $id): ?AdminMenu
    {
        return AdminMenu::query()->where('id', $id)->first();
    }

    public function create(array $data): AdminMenu
    {
        return AdminMenu::query()->create($data);
    }

    public function update(AdminMenu $menu, array $data): AdminMenu
    {
        $menu->fill($data);
        $menu->save();

        return $menu->refresh();
    }

    public function delete(AdminMenu $menu): void
    {
        $menuId = (int) $menu->getAttribute('id');
        Db::table('admin_role_menu')->where('menu_id', $menuId)->delete();
        $menu->delete();
    }

    /**
     * @return list<int>
     */
    public function existingIds(array $ids): array
    {
        return AdminMenu::query()
            ->whereIn('id', array_values(array_unique(array_map('intval', $ids))))
            ->pluck('id')
            ->map(static fn ($id): int => (int) $id)
            ->values()
            ->all();
    }

    public function toArray(AdminMenu $menu): array
    {
        return [
            'id' => (int) $menu->getAttribute('id'),
            'parentId' => (int) $menu->getAttribute('parent_id'),
            'parent_id' => (int) $menu->getAttribute('parent_id'),
            'code' => (string) $menu->getAttribute('code'),
            'type' => (string) $menu->getAttribute('type'),
            'name' => (string) $menu->getAttribute('name'),
            'path' => (string) $menu->getAttribute('path'),
            'component' => (string) $menu->getAttribute('component'),
            'icon' => (string) $menu->getAttribute('icon'),
            'permission' => (string) $menu->getAttribute('permission'),
            'sort' => (int) $menu->getAttribute('sort'),
            'status' => (string) $menu->getAttribute('status'),
        ];
    }

    public function allEnabled(): array
    {
        return AdminMenu::query()
            ->where('status', 'enabled')
            ->orderBy('sort')
            ->orderBy('id')
            ->get()
            ->map(fn (AdminMenu $menu): array => $this->toArray($menu))
            ->all();
    }


    public function enabledTree(): array
    {
        return $this->tree($this->allEnabled());
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

    private function tree(array $menus): array
    {
        $nodes = [];
        foreach ($menus as $menu) {
            $menu['children'] = [];
            $nodes[$menu['id']] = $menu;
        }

        $tree = [];
        foreach ($nodes as $id => &$node) {
            $parentId = (int) $node['parentId'];
            if ($parentId > 0 && isset($nodes[$parentId])) {
                $nodes[$parentId]['children'][] = &$node;
                continue;
            }

            $tree[] = &$node;
        }
        unset($node);

        return $this->withoutEmptyChildren($tree);
    }

    private function withoutEmptyChildren(array $menus): array
    {
        return array_map(function (array $menu): array {
            $menu['children'] = $this->withoutEmptyChildren($menu['children']);
            if ($menu['children'] === []) {
                unset($menu['children']);
            }

            return $menu;
        }, $menus);
    }
}
