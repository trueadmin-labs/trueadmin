<?php

declare(strict_types=1);

namespace App\Module\System\Repository;

use TrueAdmin\Kernel\Crud\CrudQuery;
use App\Foundation\Repository\AbstractRepository;
use TrueAdmin\Kernel\Support\TreeHelper;
use App\Module\System\Model\AdminDepartment;
use Hyperf\DbConnection\Db;

/**
 * @extends AbstractRepository<AdminDepartment>
 */
final class AdminDepartmentRepository extends AbstractRepository
{
    protected ?string $modelClass = AdminDepartment::class;

    protected array $keywordFields = ['code', 'name'];

    protected array $filterable = [
        'id' => ['eq', 'in'],
        'parent_id' => ['eq', 'in'],
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
        /** @var null|AdminDepartment $department */
        $department = $this->findModelById($id);

        return $department;
    }

    public function findByCode(string $code): ?AdminDepartment
    {
        $department = AdminDepartment::query()->where('code', $code)->first();

        return $department instanceof AdminDepartment ? $department : null;
    }

    public function create(array $data): AdminDepartment
    {
        /** @var AdminDepartment $department */
        $department = $this->createModel($data);

        return $department;
    }

    public function update(AdminDepartment $department, array $data): AdminDepartment
    {
        /** @var AdminDepartment $department */
        $department = $this->updateModel($department, $data);

        return $department;
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
    public function selfAndDescendantIds(int|array $ids): array
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
