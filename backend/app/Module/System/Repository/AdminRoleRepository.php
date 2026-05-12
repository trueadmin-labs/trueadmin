<?php

declare(strict_types=1);

namespace App\Module\System\Repository;

use App\Foundation\Crud\CrudQuery;
use App\Foundation\Pagination\PageResult;
use App\Foundation\Repository\AbstractRepository;
use App\Module\System\Model\AdminRole;
use Hyperf\DbConnection\Db;

final class AdminRoleRepository extends AbstractRepository
{
    public const SUPER_ADMIN_CODE = 'super-admin';

    protected ?string $modelClass = AdminRole::class;

    protected array $keywordFields = ['code', 'name'];

    protected array $filterable = [
        'id' => ['eq', 'in'],
        'code' => ['eq', 'like'],
        'name' => ['eq', 'like'],
        'status' => ['eq', 'in'],
    ];

    protected array $sortable = ['id', 'sort', 'created_at', 'updated_at'];

    protected array $defaultSort = ['sort' => 'asc', 'id' => 'asc'];

    public function paginate(CrudQuery $adminQuery): PageResult
    {
        return $this->pageQuery(
            AdminRole::query(),
            $adminQuery,
            fn (AdminRole $role): array => $this->toArray($role),
        );
    }

    public function all(CrudQuery $adminQuery): array
    {
        return $this->listQuery(
            AdminRole::query(),
            $adminQuery,
            fn (AdminRole $role): array => $this->toArray($role),
        );
    }

    public function find(int $id): ?AdminRole
    {
        /** @var null|AdminRole $role */
        $role = $this->findModelById($id);

        return $role;
    }

    public function findByCode(string $code): ?AdminRole
    {
        return AdminRole::query()->where('code', $code)->first();
    }

    public function create(array $data): AdminRole
    {
        /** @var AdminRole $role */
        $role = $this->createModel($data);

        return $role;
    }

    public function update(AdminRole $role, array $data): AdminRole
    {
        /** @var AdminRole $role */
        $role = $this->updateModel($role, $data);

        return $role;
    }

    public function delete(AdminRole $role): void
    {
        $roleId = (int) $role->getAttribute('id');
        Db::table('admin_role_data_policies')->where('role_id', $roleId)->delete();
        Db::table('admin_role_menu')->where('role_id', $roleId)->delete();
        Db::table('admin_role_user')->where('role_id', $roleId)->delete();
        $this->deleteModel($role);
    }

    /**
     * @param list<int> $menuIds
     */
    public function syncMenus(AdminRole $role, array $menuIds): void
    {
        $roleId = (int) $role->getAttribute('id');
        $this->syncPivot('admin_role_menu', 'role_id', $roleId, 'menu_id', $menuIds);
    }

    /**
     * @return list<int>
     */
    public function menuIds(AdminRole $role): array
    {
        return $this->pivotIds('admin_role_menu', 'role_id', (int) $role->getAttribute('id'), 'menu_id');
    }

    /**
     * @return list<int>
     */
    public function existingIds(array $ids): array
    {
        return $this->existingModelIds(array_values(array_unique(array_map('intval', $ids))));
    }

    /**
     * @return list<array{id:int,code:string,name:string,status:string}>
     */
    public function options(): array
    {
        return AdminRole::query()
            ->where('status', 'enabled')
            ->orderBy('sort')
            ->orderBy('id')
            ->get()
            ->map(fn (AdminRole $role): array => $this->toArray($role))
            ->all();
    }


    /**
     * @param list<string> $codes
     * @return list<int>
     */
    public function idsByCodes(array $codes): array
    {
        if ($codes === []) {
            return [];
        }

        return AdminRole::query()
            ->whereIn('code', array_values(array_unique($codes)))
            ->where('status', 'enabled')
            ->pluck('id')
            ->map(static fn ($id): int => (int) $id)
            ->values()
            ->all();
    }

    public function toArray(AdminRole $role): array
    {
        $code = (string) $role->getAttribute('code');

        return [
            'id' => (int) $role->getAttribute('id'),
            'code' => $code,
            'name' => (string) $role->getAttribute('name'),
            'sort' => (int) $role->getAttribute('sort'),
            'status' => (string) $role->getAttribute('status'),
            'builtin' => $code === self::SUPER_ADMIN_CODE,
        ];
    }
}
