<?php

declare(strict_types=1);

namespace App\Module\System\Repository;

use App\Foundation\Query\AdminQuery;
use App\Foundation\Repository\AbstractRepository;
use App\Foundation\Tree\TreeHelper;
use App\Module\System\Model\AdminDepartment;
use Hyperf\DbConnection\Db;

final class AdminDepartmentRepository extends AbstractRepository
{
    protected ?string $modelClass = AdminDepartment::class;

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

    public function __construct(private readonly TreeHelper $tree)
    {
    }

    public function all(AdminQuery $adminQuery): array
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
        return AdminDepartment::query()->where('code', $code)->first();
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
        return (int) Db::table('admin_user_departments')->where('dept_id', $id)->count();
    }

    public function primaryUserCount(int $id): int
    {
        return (int) Db::table('admin_users')->where('primary_dept_id', $id)->count();
    }

    /**
     * @param list<int> $ids
     * @return list<int>
     */
    public function existingIds(array $ids): array
    {
        return $this->existingModelIds(array_values(array_unique(array_map('intval', $ids))));
    }

    public function toArray(AdminDepartment $department): array
    {
        return [
            'id' => (int) $department->getAttribute('id'),
            'parentId' => (int) $department->getAttribute('parent_id'),
            'parent_id' => (int) $department->getAttribute('parent_id'),
            'code' => (string) $department->getAttribute('code'),
            'name' => (string) $department->getAttribute('name'),
            'level' => (int) $department->getAttribute('level'),
            'path' => (string) $department->getAttribute('path'),
            'sort' => (int) $department->getAttribute('sort'),
            'status' => (string) $department->getAttribute('status'),
        ];
    }

    public function tree(AdminQuery $adminQuery): array
    {
        return $this->tree->build($this->all($adminQuery));
    }
}
