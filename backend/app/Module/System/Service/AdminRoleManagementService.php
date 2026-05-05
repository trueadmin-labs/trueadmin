<?php

declare(strict_types=1);

namespace App\Module\System\Service;

use App\Foundation\Pagination\PageResult;
use App\Module\System\Model\AdminRole;
use App\Module\System\Repository\AdminMenuRepository;
use App\Module\System\Repository\AdminRoleRepository;
use TrueAdmin\Kernel\Constant\ErrorCode;
use TrueAdmin\Kernel\Exception\BusinessException;

final class AdminRoleManagementService
{
    public function __construct(
        private readonly AdminRoleRepository $roles,
        private readonly AdminMenuRepository $menus,
    ) {
    }

    public function paginate(int $page, int $pageSize, string $keyword = '', string $status = ''): PageResult
    {
        return $this->roles->paginate($page, $pageSize, $keyword, $status);
    }

    public function detail(int $id): array
    {
        $role = $this->mustFind($id);
        return [...$this->roles->toArray($role), 'menuIds' => $this->roles->menuIds($role)];
    }

    public function create(array $payload): array
    {
        $code = $this->requiredString($payload, 'code');
        if ($this->roles->findByCode($code) !== null) {
            throw new BusinessException(ErrorCode::VALIDATION_FAILED, 422, ['field' => 'code', 'reason' => 'duplicated']);
        }

        $role = $this->roles->create([
            'code' => $code,
            'name' => $this->requiredString($payload, 'name'),
            'status' => $this->status($payload['status'] ?? 'enabled'),
        ]);

        $this->syncMenus($role, $payload['menuIds'] ?? []);

        return $this->detail((int) $role->getAttribute('id'));
    }

    public function update(int $id, array $payload): array
    {
        $role = $this->mustFind($id);
        $code = $this->requiredString($payload, 'code');
        $exists = $this->roles->findByCode($code);
        if ($exists !== null && (int) $exists->getAttribute('id') !== $id) {
            throw new BusinessException(ErrorCode::VALIDATION_FAILED, 422, ['field' => 'code', 'reason' => 'duplicated']);
        }

        $role = $this->roles->update($role, [
            'code' => $code,
            'name' => $this->requiredString($payload, 'name'),
            'status' => $this->status($payload['status'] ?? $role->getAttribute('status')),
        ]);

        if (array_key_exists('menuIds', $payload)) {
            $this->syncMenus($role, $payload['menuIds']);
        }

        return $this->detail((int) $role->getAttribute('id'));
    }

    public function delete(int $id): void
    {
        $role = $this->mustFind($id);
        if ((string) $role->getAttribute('code') === 'super-admin') {
            throw new BusinessException(ErrorCode::VALIDATION_FAILED, 422, ['reason' => 'cannot_delete_builtin_role']);
        }

        $this->roles->delete($role);
    }

    public function authorizeMenus(int $id, array $menuIds): array
    {
        $role = $this->mustFind($id);
        $this->syncMenus($role, $menuIds);

        return $this->detail($id);
    }

    private function syncMenus(AdminRole $role, mixed $value): void
    {
        $menuIds = is_array($value) ? array_values(array_unique(array_map('intval', $value))) : [];
        $existingIds = $this->menus->existingIds($menuIds);
        sort($menuIds);
        sort($existingIds);
        if ($menuIds !== $existingIds) {
            throw new BusinessException(ErrorCode::VALIDATION_FAILED, 422, ['field' => 'menuIds', 'reason' => 'contains_missing_menu']);
        }

        $this->roles->syncMenus($role, $menuIds);
    }

    private function mustFind(int $id): AdminRole
    {
        $role = $this->roles->find($id);
        if ($role === null) {
            throw new BusinessException(ErrorCode::NOT_FOUND, 404, ['resource' => 'admin_role', 'id' => $id]);
        }

        return $role;
    }

    private function requiredString(array $payload, string $key): string
    {
        $value = trim((string) ($payload[$key] ?? ''));
        if ($value === '') {
            throw new BusinessException(ErrorCode::VALIDATION_FAILED, 422, ['field' => $key, 'reason' => 'required']);
        }

        return $value;
    }

    private function status(mixed $status): string
    {
        $status = (string) $status;
        if (! in_array($status, ['enabled', 'disabled'], true)) {
            throw new BusinessException(ErrorCode::VALIDATION_FAILED, 422, ['field' => 'status', 'reason' => 'invalid']);
        }

        return $status;
    }
}
