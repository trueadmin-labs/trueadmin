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

use App\Module\System\Event\AdminUserCreated;
use App\Module\System\Event\AdminUserDeleted;
use App\Module\System\Event\AdminUserUpdated;
use App\Module\System\Model\AdminUser;
use App\Module\System\Repository\AdminDepartmentRepository;
use App\Module\System\Repository\AdminPositionRepository;
use App\Module\System\Repository\AdminRoleRepository;
use App\Module\System\Repository\AdminUserRepository;
use Hyperf\DbConnection\Db;
use Psr\EventDispatcher\EventDispatcherInterface;
use TrueAdmin\Kernel\Constant\ErrorCode;
use TrueAdmin\Kernel\Crud\CrudQuery;
use TrueAdmin\Kernel\Database\AfterCommitCallbacks;
use TrueAdmin\Kernel\Exception\BusinessException;
use TrueAdmin\Kernel\Pagination\PageResult;
use TrueAdmin\Kernel\Service\AbstractService;
use TrueAdmin\Kernel\Support\Password;

final class AdminUserManagementService extends AbstractService
{
    public function __construct(
        private readonly AdminUserRepository $users,
        private readonly AdminRoleRepository $roles,
        private readonly AdminDepartmentRepository $departments,
        private readonly AdminPositionRepository $positions,
        private readonly EventDispatcherInterface $dispatcher,
        private readonly AfterCommitCallbacks $afterCommit,
    ) {
    }

    public function paginate(CrudQuery $query): PageResult
    {
        return $this->users->paginate($query);
    }

    public function detail(int $id): array
    {
        return $this->users->toArray($this->mustFindWithDataPolicy($id));
    }

    public function create(array $payload): array
    {
        return Db::transaction(function () use ($payload): array {
            $username = (string) $payload['username'];
            $this->assertUnique($this->users->existsUsername($username), 'username');

            $departmentIds = $this->departmentIds($this->departmentInput($payload));
            $this->users->assertDepartmentIdsAllowedByDataPolicy($departmentIds);
            $primaryDeptId = $this->primaryDeptId($payload['primaryDeptId'] ?? $payload['deptId'] ?? null, $departmentIds);
            $positionIds = $this->positionIds($payload['positionIds'] ?? []);
            $this->assertPositionCoverage($positionIds, $departmentIds);

            $user = $this->users->create([
                'username' => $username,
                'password' => Password::make((string) $payload['password']),
                'nickname' => (string) ($payload['nickname'] ?: $username),
                'status' => (string) $payload['status'],
                'primary_dept_id' => $primaryDeptId,
            ]);

            $this->users->syncRoles($user, $this->roleIds($payload['roleIds'] ?? []));
            $this->users->syncDepartments($user, $departmentIds, $primaryDeptId);
            $this->users->syncPositions($user, $positionIds);
            $user = $this->users->findById((int) $user->getAttribute('id')) ?? $user;
            $this->dispatchAfterCommit(new AdminUserCreated(
                userId: (int) $user->getAttribute('id'),
                user: $this->eventUser($user),
                roleIds: $this->users->roleIds($user),
                departmentIds: $this->users->departmentIds($user),
                primaryDepartmentId: $user->getAttribute('primary_dept_id') === null ? null : (int) $user->getAttribute('primary_dept_id'),
            ));

            return $this->detail((int) $user->getAttribute('id'));
        });
    }

    public function update(int $id, array $payload): array
    {
        return Db::transaction(function () use ($id, $payload): array {
            $user = $this->mustFindWithDataPolicy($id);
            $before = $this->eventUser($user);
            $username = (string) $payload['username'];
            $this->assertUnique($this->users->existsUsername($username, $id), 'username');

            $hasDepartmentPayload = array_key_exists('deptIds', $payload) || array_key_exists('primaryDeptId', $payload) || array_key_exists('deptId', $payload);
            $departmentIds = $hasDepartmentPayload ? $this->departmentIds($this->departmentInput($payload)) : $this->users->departmentIds($user);
            $this->users->assertDepartmentIdsAllowedByDataPolicy($departmentIds);
            $primaryDeptId = $hasDepartmentPayload
                ? $this->primaryDeptId($payload['primaryDeptId'] ?? $payload['deptId'] ?? null, $departmentIds)
                : ($user->getAttribute('primary_dept_id') === null ? null : (int) $user->getAttribute('primary_dept_id'));
            $positionIds = array_key_exists('positionIds', $payload)
                ? $this->positionIds($payload['positionIds'])
                : $this->users->positionIds($user);
            $this->assertPositionCoverage($positionIds, $departmentIds);

            $data = [
                'username' => $username,
                'nickname' => array_key_exists('nickname', $payload) && $payload['nickname'] !== ''
                    ? (string) $payload['nickname']
                    : (string) $user->getAttribute('nickname'),
                'status' => (string) ($payload['status'] ?? $user->getAttribute('status')),
                'primary_dept_id' => $primaryDeptId,
            ];

            $password = trim((string) ($payload['password'] ?? ''));
            if ($password !== '') {
                $data['password'] = Password::make($password);
            }

            $user = $this->users->update($user, $data);
            if (array_key_exists('roleIds', $payload)) {
                $this->users->syncRoles($user, $this->roleIds($payload['roleIds']));
            }
            if ($hasDepartmentPayload) {
                $this->users->syncDepartments($user, $departmentIds, $primaryDeptId);
            }
            if (array_key_exists('positionIds', $payload)) {
                $this->users->syncPositions($user, $positionIds);
            }
            $user = $this->users->findById((int) $user->getAttribute('id')) ?? $user;
            $this->dispatchAfterCommit(new AdminUserUpdated(
                userId: (int) $user->getAttribute('id'),
                user: $this->eventUser($user),
                before: $before,
                roleIds: $this->users->roleIds($user),
                departmentIds: $this->users->departmentIds($user),
                primaryDepartmentId: $user->getAttribute('primary_dept_id') === null ? null : (int) $user->getAttribute('primary_dept_id'),
            ));

            return $this->detail((int) $user->getAttribute('id'));
        });
    }

    public function delete(int $id): void
    {
        Db::transaction(function () use ($id): void {
            $user = $this->mustFindWithDataPolicy($id);
            if ((int) $user->getAttribute('id') === 1) {
                throw new BusinessException(ErrorCode::VALIDATION_FAILED, 422, ['reason' => 'cannot_delete_builtin_admin']);
            }

            $event = new AdminUserDeleted(
                userId: (int) $user->getAttribute('id'),
                user: $this->eventUser($user),
                roleIds: $this->users->roleIds($user),
                departmentIds: $this->users->departmentIds($user),
                primaryDepartmentId: $user->getAttribute('primary_dept_id') === null ? null : (int) $user->getAttribute('primary_dept_id'),
            );

            $this->users->delete($user);
            $this->dispatchAfterCommit($event);
        });
    }

    private function mustFind(int $id): AdminUser
    {
        $user = $this->users->findById($id);
        if ($user === null) {
            throw $this->notFound('admin_user', $id);
        }

        return $user;
    }

    private function mustFindWithDataPolicy(int $id): AdminUser
    {
        $user = $this->users->findByIdWithDataPolicy($id);
        if ($user === null) {
            throw $this->notFound('admin_user', $id);
        }

        return $user;
    }

    /**
     * @return list<int>
     */
    private function roleIds(mixed $value): array
    {
        if (! is_array($value)) {
            return [];
        }

        $roleIds = array_values(array_unique(array_map('intval', $value)));
        $this->assertExistingIds($roleIds, $this->roles->existingIds($roleIds), 'roleIds', 'contains_missing_role');

        return $roleIds;
    }

    /**
     * @return list<int>
     */
    private function positionIds(mixed $value): array
    {
        if (! is_array($value)) {
            return [];
        }

        $positionIds = array_values(array_unique(array_filter(array_map('intval', $value), static fn (int $id): bool => $id > 0)));
        $this->assertExistingIds($positionIds, $this->positions->existingIds($positionIds), 'positionIds', 'contains_missing_position');
        $this->positions->assertIdsAllowedByDataPolicy($positionIds);

        return $positionIds;
    }

    private function departmentInput(array $payload): mixed
    {
        if (array_key_exists('deptIds', $payload)) {
            return $payload['deptIds'];
        }
        if (array_key_exists('deptId', $payload) && $payload['deptId'] !== null && $payload['deptId'] !== '') {
            return [(int) $payload['deptId']];
        }

        return [];
    }

    /**
     * @return list<int>
     */
    private function departmentIds(mixed $value): array
    {
        if (! is_array($value)) {
            return [];
        }

        $departmentIds = array_values(array_unique(array_filter(array_map('intval', $value), static fn (int $id): bool => $id > 0)));
        $this->assertExistingIds($departmentIds, $this->departments->existingIds($departmentIds), 'deptIds', 'contains_missing_department');

        return $departmentIds;
    }

    /**
     * @param list<int> $positionIds
     * @param list<int> $departmentIds
     */
    private function assertPositionCoverage(array $positionIds, array $departmentIds): void
    {
        if ($departmentIds === []) {
            throw new BusinessException(ErrorCode::VALIDATION_FAILED, 422, ['field' => 'deptIds', 'reason' => 'user_requires_department']);
        }
        if ($positionIds === []) {
            throw new BusinessException(ErrorCode::VALIDATION_FAILED, 422, ['field' => 'positionIds', 'reason' => 'user_requires_position']);
        }

        $positionDeptIds = $this->positions->deptIdsByPositionIds($positionIds);
        $assignedDeptIds = array_values(array_unique(array_values($positionDeptIds)));
        $extraDeptIds = array_values(array_diff($assignedDeptIds, $departmentIds));
        if ($extraDeptIds !== []) {
            throw new BusinessException(ErrorCode::VALIDATION_FAILED, 422, [
                'field' => 'positionIds',
                'reason' => 'position_must_belong_to_user_departments',
                'deptIds' => $this->idList($extraDeptIds),
            ]);
        }

        $uncoveredDeptIds = array_values(array_diff($departmentIds, $assignedDeptIds));
        if ($uncoveredDeptIds !== []) {
            throw new BusinessException(ErrorCode::VALIDATION_FAILED, 422, [
                'field' => 'positionIds',
                'reason' => 'each_department_requires_position',
                'deptIds' => $this->idList($uncoveredDeptIds),
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

    private function primaryDeptId(mixed $value, array $departmentIds): ?int
    {
        if ($value === null || $value === '') {
            return $departmentIds[0] ?? null;
        }

        $primaryDeptId = (int) $value;
        if ($primaryDeptId <= 0) {
            return null;
        }
        if (! in_array($primaryDeptId, $departmentIds, true)) {
            throw new BusinessException(ErrorCode::VALIDATION_FAILED, 422, ['field' => 'primaryDeptId', 'reason' => 'must_be_in_deptIds']);
        }

        return $primaryDeptId;
    }

    private function dispatchAfterCommit(object $event): void
    {
        $this->afterCommit->run(fn () => $this->dispatcher->dispatch($event));
    }

    /** @return array<string, mixed> */
    private function eventUser(AdminUser $user): array
    {
        return [
            'id' => (int) $user->getAttribute('id'),
            'username' => (string) $user->getAttribute('username'),
            'nickname' => (string) $user->getAttribute('nickname'),
            'avatar' => (string) $user->getAttribute('avatar'),
            'preferences' => is_array($user->getAttribute('preferences')) ? $user->getAttribute('preferences') : [],
            'status' => (string) $user->getAttribute('status'),
            'primaryDeptId' => $user->getAttribute('primary_dept_id') === null ? null : (int) $user->getAttribute('primary_dept_id'),
            'createdAt' => (string) $user->getAttribute('created_at'),
            'updatedAt' => (string) $user->getAttribute('updated_at'),
        ];
    }
}
