<?php

declare(strict_types=1);

namespace App\Module\System\Service;

use App\Foundation\Pagination\PageResult;
use App\Foundation\Support\Password;
use App\Module\System\Model\AdminUser;
use App\Module\System\Repository\AdminRoleRepository;
use App\Module\System\Repository\AdminUserRepository;
use TrueAdmin\Kernel\Constant\ErrorCode;
use TrueAdmin\Kernel\Exception\BusinessException;

final class AdminUserManagementService
{
    public function __construct(
        private readonly AdminUserRepository $users,
        private readonly AdminRoleRepository $roles,
    ) {
    }

    public function paginate(int $page, int $pageSize, string $keyword = '', string $status = ''): PageResult
    {
        return $this->users->paginate($page, $pageSize, $keyword, $status);
    }

    public function detail(int $id): array
    {
        return $this->users->toArray($this->mustFind($id));
    }

    public function create(array $payload): array
    {
        $username = $this->requiredString($payload, 'username');
        $password = $this->requiredString($payload, 'password');
        if ($this->users->existsUsername($username)) {
            throw new BusinessException(ErrorCode::VALIDATION_FAILED, 422, ['field' => 'username', 'reason' => 'duplicated']);
        }

        $user = $this->users->create([
            'username' => $username,
            'password' => Password::make($password),
            'nickname' => $this->optionalString($payload, 'nickname', $username),
            'status' => $this->status($payload['status'] ?? 'enabled'),
            'dept_id' => $this->optionalInt($payload, 'deptId'),
        ]);

        $this->users->syncRoles($user, $this->roleIds($payload['roleIds'] ?? []));

        return $this->detail((int) $user->getAttribute('id'));
    }

    public function update(int $id, array $payload): array
    {
        $user = $this->mustFind($id);
        $username = $this->requiredString($payload, 'username');
        if ($this->users->existsUsername($username, $id)) {
            throw new BusinessException(ErrorCode::VALIDATION_FAILED, 422, ['field' => 'username', 'reason' => 'duplicated']);
        }

        $data = [
            'username' => $username,
            'nickname' => $this->optionalString($payload, 'nickname', $username),
            'status' => $this->status($payload['status'] ?? $user->getAttribute('status')),
            'dept_id' => $this->optionalInt($payload, 'deptId'),
        ];

        $password = trim((string) ($payload['password'] ?? ''));
        if ($password !== '') {
            $data['password'] = Password::make($password);
        }

        $user = $this->users->update($user, $data);
        if (array_key_exists('roleIds', $payload)) {
            $this->users->syncRoles($user, $this->roleIds($payload['roleIds']));
        }

        return $this->detail((int) $user->getAttribute('id'));
    }

    public function delete(int $id): void
    {
        $user = $this->mustFind($id);
        if ((int) $user->getAttribute('id') === 1) {
            throw new BusinessException(ErrorCode::VALIDATION_FAILED, 422, ['reason' => 'cannot_delete_builtin_admin']);
        }

        $this->users->delete($user);
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
            throw new BusinessException(ErrorCode::NOT_FOUND, 404, ['resource' => 'admin_user', 'id' => $id]);
        }

        return $user;
    }

    private function requiredString(array $payload, string $key): string
    {
        $value = trim((string) ($payload[$key] ?? ''));
        if ($value === '') {
            throw new BusinessException(ErrorCode::VALIDATION_FAILED, 422, ['field' => $key, 'reason' => 'required']);
        }

        return $value;
    }

    private function optionalString(array $payload, string $key, string $default = ''): string
    {
        $value = trim((string) ($payload[$key] ?? ''));

        return $value === '' ? $default : $value;
    }

    private function optionalInt(array $payload, string $key): ?int
    {
        if (! array_key_exists($key, $payload) || $payload[$key] === null || $payload[$key] === '') {
            return null;
        }

        return (int) $payload[$key];
    }

    private function status(mixed $status): string
    {
        $status = (string) $status;
        if (! in_array($status, ['enabled', 'disabled'], true)) {
            throw new BusinessException(ErrorCode::VALIDATION_FAILED, 422, ['field' => 'status', 'reason' => 'invalid']);
        }

        return $status;
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
        $existingIds = $this->roles->existingIds($roleIds);
        sort($roleIds);
        sort($existingIds);
        if ($roleIds !== $existingIds) {
            throw new BusinessException(ErrorCode::VALIDATION_FAILED, 422, ['field' => 'roleIds', 'reason' => 'contains_missing_role']);
        }

        return $roleIds;
    }
}
