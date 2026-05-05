<?php

declare(strict_types=1);

namespace App\Module\System\Repository;

use App\Foundation\Pagination\PageResult;
use App\Module\System\Model\AdminRole;
use Hyperf\DbConnection\Db;

final class AdminRoleRepository
{
    public function paginate(int $page, int $pageSize, string $keyword = '', string $status = ''): PageResult
    {
        $query = AdminRole::query()->when($keyword !== '', static function ($query) use ($keyword): void {
            $query->where(static function ($query) use ($keyword): void {
                $query->where('code', 'like', '%' . $keyword . '%')
                    ->orWhere('name', 'like', '%' . $keyword . '%');
            });
        })->when($status !== '', static function ($query) use ($status): void {
            $query->where('status', $status);
        });

        $total = (int) (clone $query)->count();
        $items = $query->orderBy('id')
            ->forPage($page, $pageSize)
            ->get()
            ->map(fn (AdminRole $role): array => $this->toArray($role))
            ->all();

        return new PageResult($items, $total, $page, $pageSize);
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
            ->orderBy('id')
            ->get()
            ->map(fn (AdminRole $role): array => $this->toArray($role))
            ->all();
    }

    public function toArray(AdminRole $role): array
    {
        return [
            'id' => (int) $role->getAttribute('id'),
            'code' => (string) $role->getAttribute('code'),
            'name' => (string) $role->getAttribute('name'),
            'status' => (string) $role->getAttribute('status'),
        ];
    }
}
