<?php

declare(strict_types=1);

namespace App\Module\System\Service;

use App\Foundation\Pagination\PageResult;
use App\Foundation\Query\AdminQuery;
use App\Foundation\Service\AbstractService;
use App\Foundation\Support\Password;
use App\Module\System\Model\AdminUser;
use App\Module\System\Repository\AdminDepartmentRepository;
use App\Module\System\Repository\AdminRoleRepository;
use App\Module\System\Repository\AdminUserRepository;
use Hyperf\DbConnection\Db;
use TrueAdmin\Kernel\Constant\ErrorCode;
use TrueAdmin\Kernel\Exception\BusinessException;

final class AdminUserManagementService extends AbstractService
{
    public function __construct(
        private readonly AdminUserRepository $users,
        private readonly AdminRoleRepository $roles,
        private readonly AdminDepartmentRepository $departments,
    ) {
    }

    public function paginate(AdminQuery $query): PageResult
    {
        return $this->users->paginate($query);
    }

    public function detail(int $id): array
    {
        return $this->users->toArray($this->mustFind($id));
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

            return $this->detail((int) $user->getAttribute('id'));
        });
    }

    public function update(int $id, array $payload): array
    {
        return Db::transaction(function () use ($id, $payload): array {
            $user = $this->mustFind($id);
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

            return $this->detail((int) $user->getAttribute('id'));
        });
    }

    public function delete(int $id): void
    {
        Db::transaction(function () use ($id): void {
            $user = $this->mustFind($id);
            if ((int) $user->getAttribute('id') === 1) {
                throw new BusinessException(ErrorCode::VALIDATION_FAILED, 422, ['reason' => 'cannot_delete_builtin_admin']);
            }

            $this->users->delete($user);
        });
    }

    /**
     * @return list<array{id:int,code:string,name:string,status:string}>
     */
    public function roleOptions(): array
    {
        return $this->roles->options();
    }

    private function mustFind(int $id): AdminUser
    {
        $user = $this->users->findById($id);
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
}
