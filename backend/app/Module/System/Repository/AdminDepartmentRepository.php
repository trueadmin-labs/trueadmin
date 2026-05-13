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
use App\Module\System\Model\AdminDepartment;
use Hyperf\DbConnection\Db;
use TrueAdmin\Kernel\Crud\CrudQuery;
use TrueAdmin\Kernel\Support\TreeHelper;

/**
 * @extends AbstractRepository<AdminDepartment>
 */
final class AdminDepartmentRepository extends AbstractRepository
{
    protected ?string $modelClass = AdminDepartment::class;

    protected array $keywordFields = ['code', 'name'];

    protected array $filterable = [
        'id' => ['eq', 'in'],
        'parentId' => ['eq', 'in'],
        'code' => ['eq', 'like'],
        'name' => ['eq', 'like'],
        'level' => ['eq', 'in', 'gte', 'lte'],
        'status' => ['eq', 'in'],
    ];

    protected array $sortable = ['id', 'level', 'sort', 'createdAt', 'updatedAt'];

    protected array $defaultSort = ['level' => 'asc', 'sort' => 'asc', 'id' => 'asc'];

    public function __construct(private readonly TreeHelper $tree)
    {
    }

    public function all(CrudQuery $adminQuery): array
    {
        return $this->listQuery(
            AdminDepartment::query(),
            $adminQuery,
            fn (AdminDepartment $department): array => $this->toArray($department),
        );
    }

    public function find(int $id): ?AdminDepartment
    {
        /* @var null|AdminDepartment $department */
        return $this->findModelById($id);
    }

    public function findByCode(string $code): ?AdminDepartment
    {
        $department = AdminDepartment::query()->where('code', $code)->first();

        return $department instanceof AdminDepartment ? $department : null;
    }

    public function create(array $data): AdminDepartment
    {
        /* @var AdminDepartment $department */
        return $this->createModel($data);
    }

    public function update(AdminDepartment $department, array $data): AdminDepartment
    {
        /* @var AdminDepartment $department */
        return $this->updateModel($department, $data);
    }

    public function delete(AdminDepartment $department): void
    {
        $this->deleteModel($department);
    }

    public function childCount(int $id): int
    {
        return (int) AdminDepartment::query()->where('parent_id', $id)->count();
    }

    public function assignedUserCount(int $id): int
    {
        return (int) Db::table('admin_user_departments')
            ->join('admin_users', 'admin_users.id', '=', 'admin_user_departments.user_id')
            ->where('admin_user_departments.dept_id', $id)
            ->whereNull('admin_users.deleted_at')
            ->count();
    }

    public function primaryUserCount(int $id): int
    {
        return (int) Db::table('admin_users')
            ->where('primary_dept_id', $id)
            ->whereNull('deleted_at')
            ->count();
    }

    public function positionCount(int $id): int
    {
        return (int) Db::table('admin_positions')
            ->where('dept_id', $id)
            ->count();
    }

    public function updateDescendantTreeState(int $id, string $oldSubtreePath, string $newSubtreePath, int $levelDelta): void
    {
        if ($oldSubtreePath === $newSubtreePath && $levelDelta === 0) {
            return;
        }

        AdminDepartment::query()
            ->where('path', 'like', '%,' . $id . ',%')
            ->get()
            ->each(function (AdminDepartment $department) use ($oldSubtreePath, $newSubtreePath, $levelDelta): void {
                $path = (string) $department->getAttribute('path');
                $nextPath = str_starts_with($path, $oldSubtreePath)
                    ? $newSubtreePath . substr($path, strlen($oldSubtreePath))
                    : str_replace($oldSubtreePath, $newSubtreePath, $path);

                $this->updateModel($department, [
                    'path' => $nextPath,
                    'level' => max(1, (int) $department->getAttribute('level') + $levelDelta),
                ]);
            });
    }

    /**
     * @param list<int> $ids
     * @return list<int>
     */
    public function existingIds(array $ids): array
    {
        return $this->existingModelIds(array_values(array_unique(array_map('intval', $ids))));
    }

    /**
     * @param int|list<int> $ids
     * @return list<int>
     */
    public function selfAndDescendantIds(array|int $ids): array
    {
        $normalizedIds = array_values(array_unique(array_filter(array_map('intval', is_array($ids) ? $ids : [$ids]), static fn (int $id): bool => $id > 0)));
        if ($normalizedIds === []) {
            return [];
        }

        $query = AdminDepartment::query()->whereIn('id', $normalizedIds);
        foreach ($normalizedIds as $id) {
            $query->orWhere('path', 'like', '%,' . $id . ',%');
        }

        $departmentIds = $query
            ->pluck('id')
            ->map(static fn ($value): int => (int) $value)
            ->values()
            ->all();

        return array_values(array_unique($departmentIds));
    }

    public function toArray(AdminDepartment $department): array
    {
        return [
            'id' => (int) $department->getAttribute('id'),
            'parentId' => (int) $department->getAttribute('parent_id'),
            'code' => (string) $department->getAttribute('code'),
            'name' => (string) $department->getAttribute('name'),
            'level' => (int) $department->getAttribute('level'),
            'path' => (string) $department->getAttribute('path'),
            'sort' => (int) $department->getAttribute('sort'),
            'status' => (string) $department->getAttribute('status'),
        ];
    }

    public function tree(CrudQuery $adminQuery): array
    {
        return $this->tree->build($this->all($adminQuery));
    }
}
