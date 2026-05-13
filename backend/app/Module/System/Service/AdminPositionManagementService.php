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

namespace App\Module\System\Service;

use App\Module\System\Model\AdminPosition;
use App\Module\System\Repository\AdminDepartmentRepository;
use App\Module\System\Repository\AdminPositionRepository;
use App\Module\System\Repository\AdminRoleRepository;
use App\Module\System\Repository\AdminUserRepository;
use Hyperf\DbConnection\Db;
use TrueAdmin\Kernel\Constant\ErrorCode;
use TrueAdmin\Kernel\Crud\CrudQuery;
use TrueAdmin\Kernel\Exception\BusinessException;
use TrueAdmin\Kernel\Pagination\PageResult;
use TrueAdmin\Kernel\Service\AbstractService;

final class AdminPositionManagementService extends AbstractService
{
    public function __construct(
        private readonly AdminPositionRepository $positions,
        private readonly AdminDepartmentRepository $departments,
        private readonly AdminRoleRepository $roles,
        private readonly AdminUserRepository $users,
    ) {
    }

    public function paginate(CrudQuery $query): PageResult
    {
        return $this->positions->paginate($query);
    }

    /**
     * @return list<array<string, mixed>>
     */
    public function options(?array $deptIds = null): array
    {
        return $this->positions->options($deptIds);
    }

    public function detail(int $id): array
    {
        return $this->positions->toArray($this->mustFind($id));
    }

    public function create(array $payload): array
    {
        return Db::transaction(function () use ($payload): array {
            $deptId = (int) $payload['deptId'];
            $code = (string) $payload['code'];
            $this->assertExistingIds([$deptId], $this->departments->existingIds([$deptId]), 'deptId', 'contains_missing_department');
            $this->positions->assertDepartmentAllowedByDataPolicy($deptId);
            $this->assertUnique($this->positions->findByDeptAndCode($deptId, $code) !== null, 'code');

            $position = $this->positions->create([
                'dept_id' => $deptId,
                'code' => $code,
                'name' => (string) $payload['name'],
                'type' => (string) ($payload['type'] ?? 'normal'),
                'is_leadership' => (bool) ($payload['isLeadership'] ?? false),
                'description' => (string) ($payload['description'] ?? ''),
                'sort' => (int) ($payload['sort'] ?? 0),
                'status' => (string) ($payload['status'] ?? 'enabled'),
            ]);

            $this->positions->syncRoles($position, $this->roleIds($payload['roleIds'] ?? []));

            return $this->detail((int) $position->getAttribute('id'));
        });
    }

    public function update(int $id, array $payload): array
    {
        return Db::transaction(function () use ($id, $payload): array {
            $position = $this->mustFind($id);
            $oldDeptId = (int) $position->getAttribute('dept_id');
            $deptId = (int) $payload['deptId'];
            $code = (string) $payload['code'];
            $this->assertExistingIds([$deptId], $this->departments->existingIds([$deptId]), 'deptId', 'contains_missing_department');
            $this->positions->assertDepartmentAllowedByDataPolicy($deptId);

            $exists = $this->positions->findByDeptAndCode($deptId, $code);
            $this->assertUnique($exists !== null && (int) $exists->getAttribute('id') !== $id, 'code');
            if ($deptId !== $oldDeptId) {
                $this->assertDepartmentMoveKeepsMemberCoverage($id, $oldDeptId, $deptId);
            }

            $position = $this->positions->update($position, [
                'dept_id' => $deptId,
                'code' => $code,
                'name' => (string) $payload['name'],
                'type' => (string) ($payload['type'] ?? $position->getAttribute('type')),
                'is_leadership' => (bool) ($payload['isLeadership'] ?? $position->getAttribute('is_leadership')),
                'description' => (string) ($payload['description'] ?? $position->getAttribute('description')),
                'sort' => (int) ($payload['sort'] ?? $position->getAttribute('sort')),
                'status' => (string) ($payload['status'] ?? $position->getAttribute('status')),
            ]);

            if (array_key_exists('roleIds', $payload)) {
                $this->positions->syncRoles($position, $this->roleIds($payload['roleIds']));
            }

            return $this->detail((int) $position->getAttribute('id'));
        });
    }

    public function delete(int $id): void
    {
        Db::transaction(function () use ($id): void {
            $position = $this->mustFind($id);
            if ($this->positions->memberCount($id) > 0) {
                throw new BusinessException(ErrorCode::VALIDATION_FAILED, 422, [
                    'field' => 'position',
                    'reason' => 'position_has_members',
                ]);
            }

            $this->positions->delete($position);
        });
    }

    /**
     * @return list<int>
     */
    public function memberIds(int $id): array
    {
        $position = $this->mustFind($id);

        return $this->positions->memberIds((int) $position->getAttribute('id'));
    }

    /**
     * @param list<int> $userIds
     */
    public function syncMembers(int $id, array $userIds): array
    {
        return Db::transaction(function () use ($id, $userIds): array {
            $position = $this->mustFind($id);
            $deptId = (int) $position->getAttribute('dept_id');
            $userIds = array_values(array_unique(array_filter(array_map('intval', $userIds), static fn (int $userId): bool => $userId > 0)));
            $this->assertExistingIds($userIds, $this->users->existingIds($userIds), 'userIds', 'contains_missing_user');
            $this->users->assertIdsAllowedByDataPolicy($userIds);

            $missingDepartmentUserIds = $this->users->userIdsMissingDepartment($userIds, $deptId);
            if ($missingDepartmentUserIds !== []) {
                throw new BusinessException(ErrorCode::VALIDATION_FAILED, 422, [
                    'field' => 'userIds',
                    'reason' => 'position_member_must_belong_to_position_department',
                    'userIds' => $this->idList($missingDepartmentUserIds),
                ]);
            }

            $currentUserIds = $this->positions->memberIds($id);
            $removeUserIds = array_values(array_diff($currentUserIds, $userIds));
            $removedUsersMissingDepartment = $this->users->userIdsMissingDepartment($removeUserIds, $deptId);
            $departmentMemberRemoveUserIds = array_values(array_diff($removeUserIds, $removedUsersMissingDepartment));
            $uncoveredUserIds = $this->positions->userIdsWithoutOtherPositionInDepartment($id, $deptId, $departmentMemberRemoveUserIds);
            if ($uncoveredUserIds !== []) {
                throw new BusinessException(ErrorCode::VALIDATION_FAILED, 422, [
                    'field' => 'userIds',
                    'reason' => 'position_removal_would_leave_department_without_position',
                    'userIds' => $this->idList($uncoveredUserIds),
                ]);
            }

            $this->positions->syncMembers($position, $userIds);

            return $this->detail($id);
        });
    }

    private function mustFind(int $id): AdminPosition
    {
        $position = $this->positions->findByIdWithDataPolicy($id);
        if ($position === null) {
            throw $this->notFound('admin_position', $id);
        }

        return $position;
    }

    private function assertDepartmentMoveKeepsMemberCoverage(int $positionId, int $oldDeptId, int $newDeptId): void
    {
        $currentUserIds = $this->positions->memberIds($positionId);
        if ($currentUserIds === []) {
            return;
        }

        $missingTargetDepartmentUserIds = $this->users->userIdsMissingDepartment($currentUserIds, $newDeptId);
        if ($missingTargetDepartmentUserIds !== []) {
            throw new BusinessException(ErrorCode::VALIDATION_FAILED, 422, [
                'field' => 'deptId',
                'reason' => 'position_member_must_belong_to_position_department',
                'userIds' => $this->idList($missingTargetDepartmentUserIds),
            ]);
        }

        $oldDepartmentMissingUserIds = $this->users->userIdsMissingDepartment($currentUserIds, $oldDeptId);
        $oldDepartmentMemberUserIds = array_values(array_diff($currentUserIds, $oldDepartmentMissingUserIds));
        $uncoveredUserIds = $this->positions->userIdsWithoutOtherPositionInDepartment($positionId, $oldDeptId, $oldDepartmentMemberUserIds);
        if ($uncoveredUserIds !== []) {
            throw new BusinessException(ErrorCode::VALIDATION_FAILED, 422, [
                'field' => 'deptId',
                'reason' => 'position_move_would_leave_department_without_position',
                'userIds' => $this->idList($uncoveredUserIds),
            ]);
        }
    }

    /**
     * @param list<int> $ids
     */
    private function idList(array $ids): string
    {
        return implode(',', array_values(array_unique(array_map('intval', $ids))));
    }

    /**
     * @return list<int>
     */
    private function roleIds(mixed $value): array
    {
        if (! is_array($value)) {
            return [];
        }

        $roleIds = array_values(array_unique(array_filter(array_map('intval', $value), static fn (int $id): bool => $id > 0)));
        $this->assertExistingIds($roleIds, $this->roles->existingIds($roleIds), 'roleIds', 'contains_missing_role');

        return $roleIds;
    }
}
