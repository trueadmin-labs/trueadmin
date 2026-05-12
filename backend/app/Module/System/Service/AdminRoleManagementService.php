<?php

declare(strict_types=1);

namespace App\Module\System\Service;

use TrueAdmin\Kernel\Pagination\PageResult;
use TrueAdmin\Kernel\Crud\CrudQuery;
use App\Foundation\Service\AbstractService;
use App\Foundation\DataPermission\DataPolicyRegistry;
use App\Module\System\Model\AdminRole;
use App\Module\System\Repository\AdminDepartmentRepository;
use App\Module\System\Repository\AdminMenuRepository;
use App\Module\System\Repository\AdminRoleDataPolicyRepository;
use App\Module\System\Repository\AdminRoleRepository;
use Hyperf\DbConnection\Db;
use TrueAdmin\Kernel\Constant\ErrorCode;
use TrueAdmin\Kernel\Exception\BusinessException;

final class AdminRoleManagementService extends AbstractService
{
    public function __construct(
        private readonly AdminRoleRepository $roles,
        private readonly AdminMenuRepository $menus,
        private readonly AdminDepartmentRepository $departments,
        private readonly AdminRoleDataPolicyRepository $dataPolicies,
        private readonly DataPolicyRegistry $dataPolicyRegistry,
    ) {
    }

    public function paginate(CrudQuery $query): PageResult
    {
        return $this->roles->paginate($query);
    }

    public function options(): array
    {
        return $this->roles->options();
    }

    public function detail(int $id): array
    {
        $role = $this->mustFind($id);
        $this->assertMutableRole($role, 'cannot_read_builtin_role_detail');

        return [
            ...$this->roles->toArray($role),
            'menuIds' => $this->roles->menuIds($role),
            'dataPolicies' => $this->dataPolicies->policiesForRole($role),
        ];
    }

    public function create(array $payload): array
    {
        return Db::transaction(function () use ($payload): array {
            $code = (string) $payload['code'];
            $this->assertUnique($this->roles->findByCode($code) !== null, 'code');
            $menuIds = $this->menuIds($payload['menuIds'] ?? []);

            $role = $this->roles->create([
                'code' => $code,
                'name' => (string) $payload['name'],
                'sort' => (int) ($payload['sort'] ?? 0),
                'status' => (string) ($payload['status'] ?? 'enabled'),
            ]);

            $this->roles->syncMenus($role, $menuIds);
            $this->dataPolicies->syncRolePolicies($role, $this->policies($payload['dataPolicies'] ?? null));

            return $this->detail((int) $role->getAttribute('id'));
        });
    }

    public function update(int $id, array $payload): array
    {
        return Db::transaction(function () use ($id, $payload): array {
            $role = $this->mustFind($id);
            $this->assertMutableRole($role, 'cannot_update_builtin_role');

            $code = (string) $payload['code'];
            $exists = $this->roles->findByCode($code);
            $this->assertUnique($exists !== null && (int) $exists->getAttribute('id') !== $id, 'code');
            $menuIds = array_key_exists('menuIds', $payload) ? $this->menuIds($payload['menuIds']) : $this->roles->menuIds($role);

            $role = $this->roles->update($role, [
                'code' => $code,
                'name' => (string) $payload['name'],
                'sort' => (int) ($payload['sort'] ?? $role->getAttribute('sort')),
                'status' => (string) ($payload['status'] ?? $role->getAttribute('status')),
            ]);

            if (array_key_exists('menuIds', $payload)) {
                $this->roles->syncMenus($role, $menuIds);
            }
            if (array_key_exists('dataPolicies', $payload)) {
                $this->dataPolicies->syncRolePolicies($role, $this->policies($payload['dataPolicies']));
            }

            return $this->detail((int) $role->getAttribute('id'));
        });
    }

    public function delete(int $id): void
    {
        Db::transaction(function () use ($id): void {
            $role = $this->mustFind($id);
            $this->assertMutableRole($role, 'cannot_delete_builtin_role');

            $this->roles->delete($role);
        });
    }

    public function authorize(int $id, array $menuIds, array $dataPolicies): array
    {
        return Db::transaction(function () use ($id, $menuIds, $dataPolicies): array {
            $role = $this->mustFind($id);
            $this->assertMutableRole($role, 'cannot_authorize_builtin_role');

            $menuIds = $this->menuIds($menuIds);
            $this->roles->syncMenus($role, $menuIds);
            $this->dataPolicies->syncRolePolicies($role, $this->policies($dataPolicies));

            return $this->detail($id);
        });
    }


    private function policies(mixed $value): array
    {
        $policies = is_array($value) ? array_values($value) : [];

        foreach ($policies as $policy) {
            $this->dataPolicyRegistry->assertPolicyInput($policy);
            $scope = (string) ($policy['scope'] ?? '');
            if (in_array($scope, ['custom_departments', 'custom_departments_and_children'], true)) {
                $deptIds = $policy['config']['deptIds'] ?? [];
                if (! is_array($deptIds) || $deptIds === []) {
                    throw new BusinessException(ErrorCode::VALIDATION_FAILED, 422, ['field' => 'dataPolicies', 'reason' => 'custom_department_scope_requires_deptIds']);
                }
                $deptIds = array_values(array_unique(array_filter(array_map('intval', $deptIds), static fn (int $id): bool => $id > 0)));
                $this->assertExistingIds($deptIds, $this->departments->existingIds($deptIds), 'dataPolicies', 'contains_missing_department');
            }
        }
        $this->dataPolicyRegistry->assertUniquePolicies($policies);

        return $policies;
    }

    private function menuIds(mixed $value): array
    {
        $menuIds = is_array($value) ? array_values(array_unique(array_map('intval', $value))) : [];
        $this->assertExistingIds($menuIds, $this->menus->existingIds($menuIds), 'menuIds', 'contains_missing_menu');

        return $menuIds;
    }

    private function mustFind(int $id): AdminRole
    {
        $role = $this->roles->find($id);
        if ($role === null) {
            throw $this->notFound('admin_role', $id);
        }

        return $role;
    }

    private function assertMutableRole(AdminRole $role, string $reason): void
    {
        if ((string) $role->getAttribute('code') !== AdminRoleRepository::SUPER_ADMIN_CODE) {
            return;
        }

        throw new BusinessException(ErrorCode::VALIDATION_FAILED, 422, [
            'field' => 'role',
            'reason' => $reason,
        ]);
    }

}
