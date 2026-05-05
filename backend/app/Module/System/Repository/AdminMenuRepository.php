<?php

declare(strict_types=1);

namespace App\Module\System\Repository;

use App\Foundation\Query\AdminQuery;
use App\Foundation\Repository\AbstractRepository;
use App\Foundation\Tree\TreeHelper;
use App\Module\System\Model\AdminMenu;
use Hyperf\DbConnection\Db;

final class AdminMenuRepository extends AbstractRepository
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
        return $this->tree->build($menus);
    }
}
