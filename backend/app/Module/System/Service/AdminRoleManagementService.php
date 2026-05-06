<?php

declare(strict_types=1);

namespace App\Module\System\Service;

use App\Foundation\Pagination\PageResult;
use App\Foundation\Query\AdminQuery;
use App\Foundation\Service\AbstractService;
use App\Foundation\Tree\TreeHelper;
use App\Module\System\Model\AdminRole;
use App\Module\System\Repository\AdminMenuRepository;
use App\Module\System\Repository\AdminRoleRepository;
use Hyperf\DbConnection\Db;
use TrueAdmin\Kernel\Constant\ErrorCode;
use TrueAdmin\Kernel\Exception\BusinessException;

final class AdminRoleManagementService extends AbstractService
{
    public function __construct(
        private readonly AdminRoleRepository $roles,
        private readonly AdminMenuRepository $menus,
        private readonly TreeHelper $tree,
    ) {
    }

    public function paginate(AdminQuery $query): PageResult
    {
        return $this->roles->paginate($query);
    }

    public function detail(int $id): array
    {
        $role = $this->mustFind($id);
        return [...$this->roles->toArray($role), 'menuIds' => $this->roles->menuIds($role)];
    }

    public function create(array $payload): array
    {
        return Db::transaction(function () use ($payload): array {
            $code = (string) $payload['code'];
            $this->assertUnique($this->roles->findByCode($code) !== null, 'code');
            $parent = $this->parentRole((int) ($payload['parentId'] ?? $payload['parent_id'] ?? 0));
            $menuIds = $this->menuIds($payload['menuIds'] ?? []);
            $this->assertWithinParentMenuScope($parent, $menuIds);

            $role = $this->roles->create([
                'parent_id' => $parent === null ? 0 : (int) $parent->getAttribute('id'),
                'code' => $code,
                'name' => (string) $payload['name'],
                'level' => $this->tree->level($parent),
                'path' => $this->tree->path($parent),
                'sort' => (int) ($payload['sort'] ?? 0),
                'status' => (string) ($payload['status'] ?? 'enabled'),
            ]);

            $this->roles->syncMenus($role, $menuIds);

            return $this->detail((int) $role->getAttribute('id'));
        });
    }

    public function update(int $id, array $payload): array
    {
        return Db::transaction(function () use ($id, $payload): array {
            $role = $this->mustFind($id);
            $code = (string) $payload['code'];
            $exists = $this->roles->findByCode($code);
            $this->assertUnique($exists !== null && (int) $exists->getAttribute('id') !== $id, 'code');
            $parentId = array_key_exists('parentId', $payload) || array_key_exists('parent_id', $payload)
                ? (int) ($payload['parentId'] ?? $payload['parent_id'])
                : (int) $role->getAttribute('parent_id');
            $parent = $this->parentRole($parentId, $id);
            $menuIds = array_key_exists('menuIds', $payload) ? $this->menuIds($payload['menuIds']) : $this->roles->menuIds($role);
            $this->assertWithinParentMenuScope($parent, $menuIds);

            $role = $this->roles->update($role, [
                'parent_id' => $parent === null ? 0 : (int) $parent->getAttribute('id'),
                'code' => $code,
                'name' => (string) $payload['name'],
                'level' => $this->tree->level($parent),
                'path' => $this->tree->path($parent),
                'sort' => (int) ($payload['sort'] ?? $role->getAttribute('sort')),
                'status' => (string) ($payload['status'] ?? $role->getAttribute('status')),
            ]);

            if (array_key_exists('menuIds', $payload)) {
                $this->roles->syncMenus($role, $menuIds);
            }

            return $this->detail((int) $role->getAttribute('id'));
        });
    }

    public function delete(int $id): void
    {
        Db::transaction(function () use ($id): void {
            $role = $this->mustFind($id);
            if ((string) $role->getAttribute('code') === 'super-admin') {
                throw new BusinessException(ErrorCode::VALIDATION_FAILED, 422, ['reason' => 'cannot_delete_builtin_role']);
            }
            if ($this->roles->childCount($id) > 0) {
                throw new BusinessException(ErrorCode::VALIDATION_FAILED, 422, ['reason' => 'cannot_delete_role_with_children']);
            }

            $this->roles->delete($role);
        });
    }

    public function authorizeMenus(int $id, array $menuIds): array
    {
        return Db::transaction(function () use ($id, $menuIds): array {
            $role = $this->mustFind($id);
            $menuIds = $this->menuIds($menuIds);
            $parent = $this->parentRole((int) $role->getAttribute('parent_id'));
            $this->assertWithinParentMenuScope($parent, $menuIds);
            $this->roles->syncMenus($role, $menuIds);

            return $this->detail($id);
        });
    }

    private function menuIds(mixed $value): array
    {
        $menuIds = is_array($value) ? array_values(array_unique(array_map('intval', $value))) : [];
        $this->assertExistingIds($menuIds, $this->menus->existingIds($menuIds), 'menuIds', 'contains_missing_menu');

        return $menuIds;
    }

    private function parentRole(int $parentId, ?int $currentRoleId = null): ?AdminRole
    {
        if ($parentId <= 0) {
            return null;
        }

        $parent = $this->roles->find($parentId);
        if ($parent === null) {
            throw new BusinessException(ErrorCode::VALIDATION_FAILED, 422, ['field' => 'parentId', 'reason' => 'missing_parent_role']);
        }
        if ($currentRoleId !== null) {
            if ($parentId === $currentRoleId || $this->tree->isDescendant($parent, $currentRoleId)) {
                throw new BusinessException(ErrorCode::VALIDATION_FAILED, 422, ['field' => 'parentId', 'reason' => 'cannot_move_role_to_self_or_descendant']);
            }
        }

        return $parent;
    }

    private function assertWithinParentMenuScope(?AdminRole $parent, array $menuIds): void
    {
        if ($parent === null || $menuIds === []) {
            return;
        }
        if ((string) $parent->getAttribute('code') === 'super-admin') {
            return;
        }

        $parentMenuIds = $this->roles->menuIds($parent);
        $overflow = array_values(array_diff($menuIds, $parentMenuIds));
        if ($overflow !== []) {
            throw new BusinessException(ErrorCode::VALIDATION_FAILED, 422, [
                'field' => 'menuIds',
                'reason' => 'exceeds_parent_role_permissions',
                'overflowMenuIds' => implode(',', $overflow),
            ]);
        }
    }

    private function mustFind(int $id): AdminRole
    {
        $role = $this->roles->find($id);
        if ($role === null) {
            throw $this->notFound('admin_role', $id);
        }

        return $role;
    }

}
