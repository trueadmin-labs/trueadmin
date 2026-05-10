<?php

declare(strict_types=1);

namespace App\Module\System\Service;

use App\Foundation\Pagination\PageResult;
use App\Foundation\Query\AdminQuery;
use App\Foundation\Service\AbstractService;
use App\Foundation\Database\AfterCommitCallbacks;
use App\Foundation\Support\Password;
use App\Module\System\Event\AdminUserCreated;
use App\Module\System\Event\AdminUserDeleted;
use App\Module\System\Event\AdminUserUpdated;
use App\Module\System\Model\AdminUser;
use App\Module\System\Repository\AdminDepartmentRepository;
use App\Module\System\Repository\AdminRoleRepository;
use App\Module\System\Repository\AdminUserRepository;
use Hyperf\DbConnection\Db;
use Psr\EventDispatcher\EventDispatcherInterface;
use TrueAdmin\Kernel\Constant\ErrorCode;
use TrueAdmin\Kernel\Exception\BusinessException;

final class AdminUserManagementService extends AbstractService
{
    public function __construct(
        private readonly AdminUserRepository $users,
        private readonly AdminRoleRepository $roles,
        private readonly AdminDepartmentRepository $departments,
        private readonly EventDispatcherInterface $dispatcher,
        private readonly AfterCommitCallbacks $afterCommit,
    ) {
    }

    public function paginate(AdminQuery $query): PageResult
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
            $primaryDeptId = $this->primaryDeptId($payload['primaryDeptId'] ?? $payload['deptId'] ?? null, $departmentIds);

            $user = $this->users->create([
                'username' => $username,
                'password' => Password::make((string) $payload['password']),
                'nickname' => (string) ($payload['nickname'] ?: $username),
                'status' => (string) $payload['status'],
                'primary_dept_id' => $primaryDeptId,
            ]);

            $this->users->syncRoles($user, $this->roleIds($payload['roleIds'] ?? []));
            $this->users->syncDepartments($user, $departmentIds, $primaryDeptId);
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
            $primaryDeptId = $hasDepartmentPayload
                ? $this->primaryDeptId($payload['primaryDeptId'] ?? $payload['deptId'] ?? null, $departmentIds)
                : ($user->getAttribute('primary_dept_id') === null ? null : (int) $user->getAttribute('primary_dept_id'));

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
            'status' => (string) $user->getAttribute('status'),
            'primaryDeptId' => $user->getAttribute('primary_dept_id') === null ? null : (int) $user->getAttribute('primary_dept_id'),
            'createdAt' => (string) $user->getAttribute('created_at'),
            'updatedAt' => (string) $user->getAttribute('updated_at'),
        ];
    }
}
