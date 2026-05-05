<?php

declare(strict_types=1);

namespace App\Module\System\Repository;

use App\Foundation\Pagination\PageResult;
use App\Foundation\Query\AdminQuery;
use App\Foundation\Repository\AbstractRepository;
use App\Module\System\Model\AdminRole;
use Hyperf\DbConnection\Db;

final class AdminRoleRepository extends AbstractRepository
{
    protected array $keywordFields = ['code', 'name'];

    protected array $filterable = [
        'id' => ['=', 'in'],
        'parent_id' => ['=', 'in'],
        'code' => ['=', 'like'],
        'name' => ['=', 'like'],
        'level' => ['=', 'in', '>=', '<='],
        'status' => ['=', 'in'],
    ];

    protected array $sortable = ['id', 'level', 'sort', 'created_at', 'updated_at'];

    protected array $defaultSort = ['level' => 'asc', 'sort' => 'asc', 'id' => 'asc'];

    public function paginate(AdminQuery $adminQuery): PageResult
    {
        return $this->pageQuery(
            AdminRole::query(),
            $adminQuery,
            fn (AdminRole $role): array => $this->toArray($role),
        );
    }

    public function find(int $id): ?AdminRole
    {
        return AdminRole::query()->where('id', $id)->first();
    }

    public function findByCode(string $code): ?AdminRole
    {
        return AdminRole::query()->where('code', $code)->first();
    }

    public function create(array $data): AdminRole
    {
        return AdminRole::query()->create($data);
    }

    public function update(AdminRole $role, array $data): AdminRole
    {
        $role->fill($data);
        $role->save();

        return $role->refresh();
    }

    public function delete(AdminRole $role): void
    {
        $roleId = (int) $role->getAttribute('id');
        AdminRole::query()->where('parent_id', $roleId)->update(['parent_id' => 0, 'level' => 1, 'path' => '']);
        Db::table('admin_role_menu')->where('role_id', $roleId)->delete();
        Db::table('admin_role_user')->where('role_id', $roleId)->delete();
        $role->delete();
    }

    /**
     * @param list<int> $menuIds
     */
    public function syncMenus(AdminRole $role, array $menuIds): void
    {
        $roleId = (int) $role->getAttribute('id');
        Db::table('admin_role_menu')->where('role_id', $roleId)->delete();

        foreach (array_values(array_unique($menuIds)) as $menuId) {
            Db::table('admin_role_menu')->insert(['role_id' => $roleId, 'menu_id' => $menuId]);
        }
    }

    /**
     * @return list<int>
     */
    public function menuIds(AdminRole $role): array
    {
        return Db::table('admin_role_menu')
            ->where('role_id', (int) $role->getAttribute('id'))
            ->pluck('menu_id')
            ->map(static fn ($id): int => (int) $id)
            ->values()
            ->all();
    }

    public function childCount(int $roleId): int
    {
        return (int) AdminRole::query()->where('parent_id', $roleId)->count();
    }

    public function isDescendant(AdminRole $role, int $ancestorId): bool
    {
        $path = (string) $role->getAttribute('path');

        return str_contains($path, ',' . $ancestorId . ',');
    }


    /**
     * @return list<int>
     */
    public function existingIds(array $ids): array
    {
        return AdminRole::query()
            ->whereIn('id', array_values(array_unique(array_map('intval', $ids))))
            ->pluck('id')
            ->map(static fn ($id): int => (int) $id)
            ->values()
            ->all();
    }

    /**
     * @return list<array{id:int,code:string,name:string,status:string}>
     */
    public function options(): array
    {
        return AdminRole::query()
            ->where('status', 'enabled')
            ->orderBy('level')
            ->orderBy('sort')
            ->orderBy('id')
            ->get()
            ->map(fn (AdminRole $role): array => $this->toArray($role))
            ->all();
    }

    public function toArray(AdminRole $role): array
    {
        return [
            'id' => (int) $role->getAttribute('id'),
            'parentId' => (int) $role->getAttribute('parent_id'),
            'parent_id' => (int) $role->getAttribute('parent_id'),
            'code' => (string) $role->getAttribute('code'),
            'name' => (string) $role->getAttribute('name'),
            'level' => (int) $role->getAttribute('level'),
            'path' => (string) $role->getAttribute('path'),
            'sort' => (int) $role->getAttribute('sort'),
            'status' => (string) $role->getAttribute('status'),
        ];
    }
}
