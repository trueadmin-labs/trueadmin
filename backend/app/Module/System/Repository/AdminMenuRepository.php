<?php

declare(strict_types=1);

namespace App\Module\System\Repository;

use App\Foundation\Metadata\MetadataMenuRepositoryInterface;
use App\Foundation\Query\AdminQuery;
use App\Foundation\Repository\AbstractRepository;
use App\Foundation\Tree\TreeHelper;
use App\Module\System\Model\AdminMenu;
use Hyperf\DbConnection\Db;

final class AdminMenuRepository extends AbstractRepository implements MetadataMenuRepositoryInterface
{
    protected ?string $modelClass = AdminMenu::class;

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

    public function __construct(private readonly TreeHelper $tree)
    {
    }

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
        /** @var null|AdminMenu $menu */
        $menu = $this->findModelById($id);

        return $menu;
    }

    public function findByCode(string $code): ?AdminMenu
    {
        return AdminMenu::query()->where('code', $code)->first();
    }

    public function childCount(int $id): int
    {
        return (int) AdminMenu::query()->where('parent_id', $id)->count();
    }

    public function hasAncestor(int $menuId, int $ancestorId): bool
    {
        $current = $this->find($menuId);
        while ($current !== null) {
            $parentId = (int) $current->getAttribute('parent_id');
            if ($parentId <= 0) {
                return false;
            }
            if ($parentId === $ancestorId) {
                return true;
            }
            $current = $this->find($parentId);
        }

        return false;
    }

    public function create(array $data): AdminMenu
    {
        /** @var AdminMenu $menu */
        $menu = $this->createModel($data);

        return $menu;
    }

    public function update(AdminMenu $menu, array $data): AdminMenu
    {
        /** @var AdminMenu $menu */
        $menu = $this->updateModel($menu, $data);

        return $menu;
    }

    public function delete(AdminMenu $menu): void
    {
        $menuId = (int) $menu->getAttribute('id');
        Db::table('admin_role_menu')->where('menu_id', $menuId)->delete();
        $this->deleteModel($menu);
    }

    /**
     * @return list<int>
     */
    public function existingIds(array $ids): array
    {
        return $this->existingModelIds(array_values(array_unique(array_map('intval', $ids))));
    }

    public function toArray(AdminMenu $menu): array
    {
        return [
            'id' => (int) $menu->getAttribute('id'),
            'parentId' => (int) $menu->getAttribute('parent_id'),
            'code' => (string) $menu->getAttribute('code'),
            'type' => (string) $menu->getAttribute('type'),
            'name' => (string) $menu->getAttribute('name'),
            'path' => (string) $menu->getAttribute('path'),
            'icon' => (string) $menu->getAttribute('icon'),
            'permission' => (string) $menu->getAttribute('permission'),
            'sort' => (int) $menu->getAttribute('sort'),
            'status' => (string) $menu->getAttribute('status'),
        ];
    }

    public function toRuntimeArray(AdminMenu $menu): array
    {
        return [
            'id' => (int) $menu->getAttribute('id'),
            'parentId' => (int) $menu->getAttribute('parent_id'),
            'code' => (string) $menu->getAttribute('code'),
            'title' => (string) $menu->getAttribute('name'),
            'path' => (string) $menu->getAttribute('path'),
            'icon' => (string) $menu->getAttribute('icon'),
            'type' => (string) $menu->getAttribute('type'),
            'status' => (string) $menu->getAttribute('status'),
            'sort' => (int) $menu->getAttribute('sort'),
            'permission' => (string) $menu->getAttribute('permission'),
        ];
    }

    public function allEnabledRuntimeMenus(): array
    {
        return AdminMenu::query()
            ->where('status', 'enabled')
            ->whereIn('type', ['directory', 'menu'])
            ->orderBy('sort')
            ->orderBy('id')
            ->get()
            ->map(fn (AdminMenu $menu): array => $this->toRuntimeArray($menu))
            ->all();
    }

    public function runtimeTree(): array
    {
        return $this->tree($this->allEnabledRuntimeMenus());
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

    public function managementTree(AdminQuery $adminQuery): array
    {
        return $this->tree($this->all($adminQuery));
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

    public function upsertMenu(array $menu, int $parentId, string $syncedAt): int
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
            'icon' => (string) ($menu['icon'] ?? ''),
            'permission' => (string) ($menu['permission'] ?? ''),
            'sort' => (int) ($menu['sort'] ?? 0),
            'status' => 'enabled',
            'metadata_synced_at' => $syncedAt,
            'created_at' => $syncedAt,
            'updated_at' => $syncedAt,
        ];

        if ($exists === null) {
            $created = AdminMenu::query()->create($defaults);
            return (int) $created->getAttribute('id');
        }

        $updates = ['code' => $code, 'metadata_synced_at' => $syncedAt, 'updated_at' => $syncedAt];
        foreach (['permission', 'type', 'path', 'icon', 'parent_id'] as $field) {
            $current = $exists->getAttribute($field);
            if ($current === null || $current === '' || ($field === 'parent_id' && (int) $current === 0 && $parentId > 0)) {
                $updates[$field] = $defaults[$field];
            }
        }

        $exists->fill($updates);
        $exists->save();

        return (int) $exists->getAttribute('id');
    }

    private function tree(array $menus): array
    {
        return $this->tree->build($menus);
    }
}
