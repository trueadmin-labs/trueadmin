<?php

declare(strict_types=1);

namespace App\Module\System\Repository;

use TrueAdmin\Kernel\Crud\CrudQuery;
use TrueAdmin\Kernel\Metadata\MetadataMenuRepositoryInterface;
use App\Foundation\Repository\AbstractRepository;
use TrueAdmin\Kernel\Support\TreeHelper;
use App\Module\System\Model\AdminMenu;
use Hyperf\DbConnection\Db;

/**
 * @extends AbstractRepository<AdminMenu>
 */
final class AdminMenuRepository extends AbstractRepository implements MetadataMenuRepositoryInterface
{
    protected ?string $modelClass = AdminMenu::class;

    protected array $keywordFields = ['code', 'name', 'path', 'url', 'permission'];

    protected array $filterable = [
        'id' => ['eq', 'in'],
        'parentId' => ['eq', 'in'],
        'code' => ['eq', 'like'],
        'type' => ['eq', 'in'],
        'name' => ['eq', 'like'],
        'path' => ['eq', 'like'],
        'url' => ['eq', 'like'],
        'openMode' => ['eq', 'in'],
        'permission' => ['eq', 'like'],
        'source' => ['eq', 'in'],
        'status' => ['eq', 'in'],
    ];

    protected array $sortable = ['id', 'sort', 'createdAt', 'updatedAt'];

    protected array $defaultSort = ['sort' => 'asc', 'id' => 'asc'];

    public function __construct(private readonly TreeHelper $tree)
    {
    }

    public function all(CrudQuery $adminQuery): array
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
        $menu = AdminMenu::query()->where('code', $code)->first();

        return $menu instanceof AdminMenu ? $menu : null;
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

    public function deleteCodeMenusExcept(array $codes): void
    {
        $ids = AdminMenu::query()
            ->where('source', 'code')
            ->whereNotIn('code', $codes)
            ->pluck('id')
            ->map(static fn ($id): int => (int) $id)
            ->all();

        if ($ids === []) {
            return;
        }

        Db::table('admin_role_menu')->whereIn('menu_id', $ids)->delete();
        AdminMenu::query()->whereIn('id', $ids)->delete();
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
            'url' => (string) $menu->getAttribute('url'),
            'openMode' => (string) $menu->getAttribute('open_mode'),
            'showLinkHeader' => (bool) $menu->getAttribute('show_link_header'),
            'icon' => (string) $menu->getAttribute('icon'),
            'permission' => (string) $menu->getAttribute('permission'),
            'source' => (string) $menu->getAttribute('source'),
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
            'i18n' => 'menu.' . (string) $menu->getAttribute('code'),
            'path' => (string) $menu->getAttribute('path'),
            'url' => (string) $menu->getAttribute('url'),
            'openMode' => (string) $menu->getAttribute('open_mode'),
            'showLinkHeader' => (bool) $menu->getAttribute('show_link_header'),
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
            ->whereIn('type', ['directory', 'menu', 'link'])
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

    public function managementTree(CrudQuery $adminQuery): array
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

    public function upsertMenu(array $menu, int $parentId, string $syncedAt, bool $force = false): int
    {
        $code = (string) $menu['code'];
        $exists = AdminMenu::query()->where('code', $code)->first();
        if ($exists !== null && ! $exists instanceof AdminMenu) {
            $exists = null;
        }
        $type = (string) ($menu['type'] ?? 'menu');

        $defaults = [
            'parent_id' => $parentId,
            'code' => $code,
            'type' => $type,
            'name' => (string) ($menu['title'] ?? $code),
            'path' => (string) ($menu['path'] ?? ''),
            'url' => $type === 'link' ? (string) ($menu['url'] ?? '') : '',
            'open_mode' => $type === 'link' ? (string) ($menu['openMode'] ?? 'blank') : '',
            'show_link_header' => $type === 'link' ? (bool) ($menu['showLinkHeader'] ?? false) : false,
            'icon' => (string) ($menu['icon'] ?? ''),
            'permission' => (string) ($menu['permission'] ?? ''),
            'source' => 'code',
            'sort' => (int) ($menu['sort'] ?? 0),
            'status' => (string) ($menu['status'] ?? 'enabled'),
            'metadata_synced_at' => $syncedAt,
            'created_at' => $syncedAt,
            'updated_at' => $syncedAt,
        ];

        if ($exists === null) {
            $created = AdminMenu::query()->create($defaults);
            return (int) $created->getAttribute('id');
        }

        $updates = [
            'code' => $code,
            'type' => $defaults['type'],
            'path' => $defaults['path'],
            'url' => $defaults['url'],
            'open_mode' => $defaults['open_mode'],
            'show_link_header' => $defaults['show_link_header'],
            'permission' => $defaults['permission'],
            'source' => 'code',
            'metadata_synced_at' => $syncedAt,
            'updated_at' => $syncedAt,
        ];

        if ($force) {
            $updates = [
                ...$updates,
                'parent_id' => $defaults['parent_id'],
                'name' => $defaults['name'],
                'icon' => $defaults['icon'],
                'sort' => $defaults['sort'],
                'status' => $defaults['status'],
            ];
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
