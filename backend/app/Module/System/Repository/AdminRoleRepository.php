<?php

declare(strict_types=1);
/**
 * This file is part of Hyperf.
 *
 * @link     https://www.hyperf.io
 * @document https://hyperf.wiki
 * @contact  group@hyperf.io
 * @license  https://github.com/hyperf/hyperf/blob/master/LICENSE
 */

namespace App\Module\System\Repository;

use App\Foundation\Repository\AbstractRepository;
use App\Module\System\Model\AdminRole;
use Hyperf\DbConnection\Db;
use TrueAdmin\Kernel\Crud\CrudQuery;
use TrueAdmin\Kernel\Pagination\PageResult;

/**
 * @extends AbstractRepository<AdminRole>
 */
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

    protected array $sortable = ['id', 'sort', 'createdAt', 'updatedAt'];

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
        /* @var null|AdminRole $role */
        return $this->findModelById($id);
    }

    public function findByCode(string $code): ?AdminRole
    {
        $role = AdminRole::query()->where('code', $code)->first();

        return $role instanceof AdminRole ? $role : null;
    }

    public function create(array $data): AdminRole
    {
        /* @var AdminRole $role */
        return $this->createModel($data);
    }

    public function update(AdminRole $role, array $data): AdminRole
    {
        /* @var AdminRole $role */
        return $this->updateModel($role, $data);
    }

    public function delete(AdminRole $role): void
    {
        $roleId = (int) $role->getAttribute('id');
        Db::table('admin_role_data_policies')->where('role_id', $roleId)->delete();
        Db::table('admin_role_menu')->where('role_id', $roleId)->delete();
        Db::table('admin_role_user')->where('role_id', $roleId)->delete();
        Db::table('admin_position_roles')->where('role_id', $roleId)->delete();
        $this->deleteModel($role);
    }

    /**
     * @param list<int> $menuIds
     */
    public function syncMenus(AdminRole $role, array $menuIds): void
    {
        $roleId = (int) $role->getAttribute('id');
        Db::table('admin_role_menu')->where('role_id', $roleId)->delete();

        foreach (array_values(array_unique($menuIds)) as $menuId) {
            Db::table('admin_role_menu')->insert([
                'role_id' => $roleId,
                'menu_id' => $menuId,
            ]);
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
        return $this->existingModelIds(array_values(array_unique(array_map('intval', $ids))));
    }

    /**
     * @return list<array<string, mixed>>
     */
    public function options(): array
    {
        $roles = AdminRole::query()
            ->where('status', 'enabled')
            ->orderBy('sort')
            ->orderBy('id')
            ->get();

        $roleIds = $roles
            ->map(static fn (AdminRole $role): int => (int) $role->getAttribute('id'))
            ->all();
        $policiesByRoleId = $this->policiesByRoleId($roleIds);

        return $roles
            ->map(fn (AdminRole $role): array => [
                ...$this->toArray($role),
                'dataPolicies' => $policiesByRoleId[(int) $role->getAttribute('id')] ?? [],
            ])
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

    /**
     * @param list<int> $roleIds
     * @return array<int, list<array<string, mixed>>>
     */
    private function policiesByRoleId(array $roleIds): array
    {
        if ($roleIds === []) {
            return [];
        }

        $result = [];
        $rows = Db::table('admin_role_data_policies')
            ->whereIn('role_id', array_values(array_unique($roleIds)))
            ->where('status', 'enabled')
            ->orderBy('sort')
            ->orderBy('id')
            ->get();

        foreach ($rows as $row) {
            $roleId = (int) $row->role_id;
            $config = json_decode((string) $row->config, true);
            $result[$roleId][] = [
                'id' => (int) $row->id,
                'roleId' => $roleId,
                'resource' => (string) $row->resource,
                'strategy' => (string) $row->strategy,
                'effect' => (string) $row->effect,
                'scope' => (string) $row->scope,
                'config' => is_array($config) ? $config : [],
                'status' => (string) $row->status,
                'sort' => (int) $row->sort,
            ];
        }

        return $result;
    }
}
