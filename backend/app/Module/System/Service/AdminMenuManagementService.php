<?php

declare(strict_types=1);

namespace App\Module\System\Service;

use App\Foundation\Query\AdminQuery;
use App\Foundation\Service\AbstractService;
use App\Module\System\Model\AdminMenu;
use App\Module\System\Repository\AdminMenuRepository;

final class AdminMenuManagementService extends AbstractService
{
    public function __construct(private readonly AdminMenuRepository $menus)
    {
    }

    public function list(AdminQuery $query): array
    {
        return $this->menus->all($query);
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
        $this->menus->delete($this->mustFind($id));
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
        return [
            'parent_id' => (int) ($payload['parentId'] ?? $payload['parent_id'] ?? $current?->getAttribute('parent_id') ?? 0),
            'code' => (string) ($payload['code'] ?? $current?->getAttribute('code') ?? ''),
            'type' => (string) ($payload['type'] ?? $current?->getAttribute('type') ?? 'menu'),
            'name' => (string) $payload['name'],
            'path' => (string) ($payload['path'] ?? $current?->getAttribute('path') ?? ''),
            'component' => (string) ($payload['component'] ?? $current?->getAttribute('component') ?? ''),
            'icon' => (string) ($payload['icon'] ?? $current?->getAttribute('icon') ?? ''),
            'permission' => (string) ($payload['permission'] ?? $current?->getAttribute('permission') ?? ''),
            'sort' => (int) ($payload['sort'] ?? $current?->getAttribute('sort') ?? 0),
            'status' => (string) ($payload['status'] ?? $current?->getAttribute('status') ?? 'enabled'),
        ];
    }
}
