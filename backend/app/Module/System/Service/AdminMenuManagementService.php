<?php

declare(strict_types=1);

namespace App\Module\System\Service;

use App\Foundation\Query\AdminQuery;
use App\Foundation\Service\AbstractService;
use App\Module\System\Model\AdminMenu;
use App\Module\System\Repository\AdminMenuRepository;
use TrueAdmin\Kernel\Constant\ErrorCode;
use TrueAdmin\Kernel\Exception\BusinessException;

final class AdminMenuManagementService extends AbstractService
{
    public function __construct(private readonly AdminMenuRepository $menus)
    {
    }

    public function list(AdminQuery $query): array
    {
        return $this->menus->all($query);
    }

    public function tree(AdminQuery $query): array
    {
        return $this->menus->managementTree($query);
    }

    public function detail(int $id): array
    {
        return $this->menus->toArray($this->mustFind($id));
    }

    public function create(array $payload): array
    {
        $menu = $this->menus->create($this->data($payload));

        return $this->detail((int) $menu->getAttribute('id'));
    }

    public function update(int $id, array $payload): array
    {
        $current = $this->mustFind($id);
        $menu = $this->menus->update($current, $this->data($payload, $current));

        return $this->detail((int) $menu->getAttribute('id'));
    }

    public function delete(int $id): void
    {
        $menu = $this->mustFind($id);
        if ($this->menus->childCount($id) > 0) {
            throw new BusinessException(ErrorCode::VALIDATION_FAILED, 422, ['reason' => 'cannot_delete_menu_with_children']);
        }

        $this->menus->delete($menu);
    }

    private function mustFind(int $id): AdminMenu
    {
        $menu = $this->menus->find($id);
        if ($menu === null) {
            throw $this->notFound('admin_menu', $id);
        }

        return $menu;
    }

    private function data(array $payload, ?AdminMenu $current = null): array
    {
        $parentId = (int) ($payload['parentId'] ?? $payload['parent_id'] ?? $current?->getAttribute('parent_id') ?? 0);
        $this->assertParent($parentId, $current === null ? null : (int) $current->getAttribute('id'));

        $code = (string) ($payload['code'] ?? $current?->getAttribute('code') ?? '');
        if ($code !== '') {
            $exists = $this->menus->findByCode($code);
            $currentId = $current === null ? 0 : (int) $current->getAttribute('id');
            $this->assertUnique($exists !== null && (int) $exists->getAttribute('id') !== $currentId, 'code');
        }

        return [
            'parent_id' => $parentId,
            'code' => $code,
            'type' => (string) ($payload['type'] ?? $current?->getAttribute('type') ?? 'menu'),
            'name' => (string) $payload['name'],
            'path' => (string) ($payload['path'] ?? $current?->getAttribute('path') ?? ''),
            'icon' => (string) ($payload['icon'] ?? $current?->getAttribute('icon') ?? ''),
            'permission' => (string) ($payload['permission'] ?? $current?->getAttribute('permission') ?? ''),
            'sort' => (int) ($payload['sort'] ?? $current?->getAttribute('sort') ?? 0),
            'status' => (string) ($payload['status'] ?? $current?->getAttribute('status') ?? 'enabled'),
        ];
    }

    private function assertParent(int $parentId, ?int $currentMenuId = null): void
    {
        if ($parentId <= 0) {
            return;
        }

        if ($this->menus->find($parentId) === null) {
            throw new BusinessException(ErrorCode::VALIDATION_FAILED, 422, ['field' => 'parentId', 'reason' => 'missing_parent_menu']);
        }
        if ($currentMenuId !== null && ($parentId === $currentMenuId || $this->menus->hasAncestor($parentId, $currentMenuId))) {
            throw new BusinessException(ErrorCode::VALIDATION_FAILED, 422, ['field' => 'parentId', 'reason' => 'cannot_move_menu_to_self_or_descendant']);
        }
    }
}
