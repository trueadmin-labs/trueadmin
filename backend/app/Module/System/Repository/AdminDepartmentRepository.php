<?php

declare(strict_types=1);

namespace App\Module\System\Repository;

use App\Foundation\Query\AdminQuery;
use App\Foundation\Repository\AbstractRepository;
use App\Module\System\Model\AdminDepartment;
use Hyperf\DbConnection\Db;

final class AdminDepartmentRepository extends AbstractRepository
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
        return AdminDepartment::query()->where('id', $id)->first();
    }

    public function findByCode(string $code): ?AdminDepartment
    {
        return AdminDepartment::query()->where('code', $code)->first();
    }

    public function create(array $data): AdminDepartment
    {
        return AdminDepartment::query()->create($data);
    }

    public function update(AdminDepartment $department, array $data): AdminDepartment
    {
        $department->fill($data);
        $department->save();

        return $department->refresh();
    }

    public function delete(AdminDepartment $department): void
    {
        $department->delete();
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

    public function isDescendant(AdminDepartment $department, int $ancestorId): bool
    {
        $path = (string) $department->getAttribute('path');

        return str_contains($path, ',' . $ancestorId . ',');
    }

    /**
     * @param list<int> $ids
     * @return list<int>
     */
    public function existingIds(array $ids): array
    {
        return AdminDepartment::query()
            ->whereIn('id', array_values(array_unique(array_map('intval', $ids))))
            ->pluck('id')
            ->map(static fn ($id): int => (int) $id)
            ->values()
            ->all();
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
        $departments = $this->all($adminQuery);
        $nodes = [];
        foreach ($departments as $department) {
            $department['children'] = [];
            $nodes[$department['id']] = $department;
        }

        $tree = [];
        foreach ($nodes as &$node) {
            $parentId = (int) $node['parentId'];
            if ($parentId > 0 && isset($nodes[$parentId])) {
                $nodes[$parentId]['children'][] = &$node;
                continue;
            }

            $tree[] = &$node;
        }
        unset($node);

        return $this->withoutEmptyChildren($tree);
    }

    private function withoutEmptyChildren(array $departments): array
    {
        return array_map(function (array $department): array {
            $department['children'] = $this->withoutEmptyChildren($department['children']);
            if ($department['children'] === []) {
                unset($department['children']);
            }

            return $department;
        }, $departments);
    }
}
