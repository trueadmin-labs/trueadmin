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
use App\Module\System\Model\AdminPosition;
use Hyperf\Database\Model\Builder;
use Hyperf\DbConnection\Db;
use stdClass;
use TrueAdmin\Kernel\Crud\CrudQuery;
use TrueAdmin\Kernel\Pagination\PageResult;

/**
 * @extends AbstractRepository<AdminPosition>
 */
final class AdminPositionRepository extends AbstractRepository
{
    protected ?string $modelClass = AdminPosition::class;

    protected array $keywordFields = ['code', 'name'];

    protected array $filterable = [
        'id' => ['eq', 'in'],
        'deptId' => ['eq', 'in'],
        'code' => ['eq', 'like'],
        'name' => ['eq', 'like'],
        'type' => ['eq', 'in'],
        'status' => ['eq', 'in'],
    ];

    protected array $sortable = ['id', 'sort', 'createdAt', 'updatedAt'];

    protected array $defaultSort = ['sort' => 'asc', 'id' => 'asc'];

    public function paginate(CrudQuery $adminQuery): PageResult
    {
        $query = AdminPosition::query();
        $this->applyDataPolicy($query, 'admin_position', [
            'deptColumn' => 'dept_id',
            'createdByColumn' => 'created_by',
        ]);

        return $this->pageQuery(
            $query,
            $adminQuery,
            fn (AdminPosition $position): array => $this->toArray($position),
        );
    }

    /**
     * @return list<array<string, mixed>>
     */
    public function options(?array $deptIds = null): array
    {
        $query = AdminPosition::query();
        $this->applyDataPolicy($query, 'admin_position', [
            'deptColumn' => 'dept_id',
            'createdByColumn' => 'created_by',
        ]);

        return $query
            ->when(is_array($deptIds) && $deptIds !== [], static function (Builder $query) use ($deptIds): void {
                $query->whereIn('dept_id', array_values(array_unique(array_map('intval', $deptIds))));
            })
            ->where('status', 'enabled')
            ->orderBy('dept_id')
            ->orderBy('sort')
            ->orderBy('id')
            ->get()
            ->map(fn (AdminPosition $position): array => $this->toOptionArray($position))
            ->all();
    }

    public function find(int $id): ?AdminPosition
    {
        /* @var null|AdminPosition $position */
        return $this->findModelById($id);
    }

    public function findByIdWithDataPolicy(int $id): ?AdminPosition
    {
        $position = $this->find($id);
        if ($position === null) {
            return null;
        }

        $query = AdminPosition::query()->where('id', $id);
        $this->assertDataPolicyAllows($query, 'admin_position', [
            'deptColumn' => 'dept_id',
            'createdByColumn' => 'created_by',
        ]);

        return $position;
    }

    public function assertDepartmentAllowedByDataPolicy(int $deptId): void
    {
        $this->assertDataPolicyAllows(Db::table('admin_departments')->where('id', $deptId), 'admin_position', [
            'deptColumn' => 'id',
            'createdByColumn' => '',
        ]);
    }

    public function findByDeptAndCode(int $deptId, string $code): ?AdminPosition
    {
        $position = AdminPosition::query()
            ->where('dept_id', $deptId)
            ->where('code', $code)
            ->first();

        return $position instanceof AdminPosition ? $position : null;
    }

    public function create(array $data): AdminPosition
    {
        /* @var AdminPosition $position */
        return $this->createModel($data);
    }

    public function update(AdminPosition $position, array $data): AdminPosition
    {
        /* @var AdminPosition $position */
        return $this->updateModel($position, $data);
    }

    public function delete(AdminPosition $position): void
    {
        $positionId = (int) $position->getAttribute('id');
        Db::table('admin_position_roles')->where('position_id', $positionId)->delete();
        $this->deleteModel($position);
    }

    /**
     * @param list<int> $roleIds
     */
    public function syncRoles(AdminPosition $position, array $roleIds): void
    {
        $positionId = (int) $position->getAttribute('id');
        Db::table('admin_position_roles')->where('position_id', $positionId)->delete();

        $now = date('Y-m-d H:i:s');
        foreach (array_values(array_unique($roleIds)) as $index => $roleId) {
            Db::table('admin_position_roles')->insert([
                'position_id' => $positionId,
                'role_id' => $roleId,
                'sort' => $index,
                'created_at' => $now,
                'updated_at' => $now,
            ]);
        }
    }

    /**
     * @return list<int>
     */
    public function roleIds(AdminPosition $position): array
    {
        return Db::table('admin_position_roles')
            ->where('position_id', (int) $position->getAttribute('id'))
            ->orderBy('sort')
            ->pluck('role_id')
            ->map(static fn (mixed $id): int => (int) $id)
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
     * @param list<int> $ids
     */
    public function assertIdsAllowedByDataPolicy(array $ids): void
    {
        $this->assertDataPolicyAllowsAll(AdminPosition::query(), 'admin_position', $ids, 'id', [
            'deptColumn' => 'dept_id',
            'createdByColumn' => 'created_by',
        ]);
    }

    /**
     * @param list<int> $positionIds
     * @return array<int, int>
     */
    public function deptIdsByPositionIds(array $positionIds): array
    {
        if ($positionIds === []) {
            return [];
        }

        $rows = Db::table('admin_positions')
            ->whereIn('id', array_values(array_unique($positionIds)))
            ->pluck('dept_id', 'id')
            ->all();

        $result = [];
        foreach ($rows as $positionId => $deptId) {
            $result[(int) $positionId] = (int) $deptId;
        }

        return $result;
    }

    public function memberCount(int $positionId): int
    {
        return (int) Db::table('admin_user_positions')
            ->where('position_id', $positionId)
            ->count();
    }

    /**
     * @return list<int>
     */
    public function memberIds(int $positionId): array
    {
        return Db::table('admin_user_positions')
            ->where('position_id', $positionId)
            ->pluck('user_id')
            ->map(static fn (mixed $id): int => (int) $id)
            ->values()
            ->all();
    }

    /**
     * @param list<int> $userIds
     */
    public function syncMembers(AdminPosition $position, array $userIds): void
    {
        $positionId = (int) $position->getAttribute('id');
        $userIds = array_values(array_unique($userIds));
        $currentUserIds = $this->memberIds($positionId);
        $removeUserIds = array_values(array_diff($currentUserIds, $userIds));
        $addUserIds = array_values(array_diff($userIds, $currentUserIds));

        if ($removeUserIds !== []) {
            Db::table('admin_user_positions')
                ->where('position_id', $positionId)
                ->whereIn('user_id', $removeUserIds)
                ->delete();
        }

        $now = date('Y-m-d H:i:s');
        foreach ($addUserIds as $userId) {
            Db::table('admin_user_positions')->updateOrInsert(
                ['user_id' => $userId, 'position_id' => $positionId],
                [
                    'is_primary' => $this->memberPositionCount($userId) === 0,
                    'assigned_at' => $now,
                ]
            );
        }
    }

    /**
     * @param list<int> $userIds
     * @return list<int>
     */
    public function userIdsWithoutOtherPositionInDepartment(int $positionId, int $deptId, array $userIds): array
    {
        if ($userIds === []) {
            return [];
        }

        $userIds = array_values(array_unique($userIds));
        $coveredUserIds = Db::table('admin_user_positions')
            ->join('admin_positions', 'admin_positions.id', '=', 'admin_user_positions.position_id')
            ->whereIn('admin_user_positions.user_id', $userIds)
            ->where('admin_user_positions.position_id', '<>', $positionId)
            ->where('admin_positions.dept_id', $deptId)
            ->pluck('admin_user_positions.user_id')
            ->map(static fn (mixed $id): int => (int) $id)
            ->all();

        return array_values(array_diff($userIds, $coveredUserIds));
    }

    public function toArray(AdminPosition $position): array
    {
        $deptId = (int) $position->getAttribute('dept_id');
        $department = $this->department($deptId);

        return [
            'id' => (int) $position->getAttribute('id'),
            'deptId' => $deptId,
            'deptName' => $department?->name === null ? '' : (string) $department->name,
            'deptPath' => $department === null ? '' : $this->departmentPath($department),
            'code' => (string) $position->getAttribute('code'),
            'name' => (string) $position->getAttribute('name'),
            'type' => (string) $position->getAttribute('type'),
            'isLeadership' => (bool) $position->getAttribute('is_leadership'),
            'description' => (string) $position->getAttribute('description'),
            'sort' => (int) $position->getAttribute('sort'),
            'status' => (string) $position->getAttribute('status'),
            'roleIds' => $this->roleIds($position),
            'roleNames' => $this->roleNames($position),
            'memberCount' => $this->memberCount((int) $position->getAttribute('id')),
            'createdAt' => (string) $position->getAttribute('created_at'),
            'updatedAt' => (string) $position->getAttribute('updated_at'),
        ];
    }

    public function toOptionArray(AdminPosition $position): array
    {
        $detail = $this->toArray($position);

        return [
            'id' => $detail['id'],
            'deptId' => $detail['deptId'],
            'deptName' => $detail['deptName'],
            'deptPath' => $detail['deptPath'],
            'code' => $detail['code'],
            'name' => $detail['name'],
            'status' => $detail['status'],
            'roleIds' => $detail['roleIds'],
        ];
    }

    /**
     * @return list<string>
     */
    private function roleNames(AdminPosition $position): array
    {
        return $position->roles()
            ->where('admin_roles.status', 'enabled')
            ->orderBy('admin_position_roles.sort')
            ->pluck('name')
            ->map(static fn (mixed $name): string => (string) $name)
            ->values()
            ->all();
    }

    private function department(int $deptId): ?stdClass
    {
        $department = Db::table('admin_departments')
            ->where('id', $deptId)
            ->first(['id', 'name', 'path']);

        return $department instanceof stdClass ? $department : null;
    }

    private function departmentPath(stdClass $department): string
    {
        $ids = array_values(array_filter(
            array_map('intval', explode(',', (string) $department->path)),
            static fn (int $id): bool => $id > 0,
        ));
        $ids[] = (int) $department->id;

        $names = Db::table('admin_departments')
            ->whereIn('id', $ids)
            ->pluck('name', 'id')
            ->all();

        $pathNames = [];
        foreach ($ids as $id) {
            if (isset($names[$id])) {
                $pathNames[] = (string) $names[$id];
            }
        }

        return implode('/', $pathNames);
    }

    private function memberPositionCount(int $userId): int
    {
        return (int) Db::table('admin_user_positions')
            ->where('user_id', $userId)
            ->count();
    }
}
