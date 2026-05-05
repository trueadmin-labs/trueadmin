<?php

declare(strict_types=1);

namespace App\Module\System\Service;

use App\Module\System\Model\AdminMenu;
use App\Module\System\Repository\AdminMenuRepository;
use TrueAdmin\Kernel\Constant\ErrorCode;
use TrueAdmin\Kernel\Exception\BusinessException;

final class AdminMenuManagementService
{
    public function __construct(private readonly AdminMenuRepository $menus)
    {
    }

    public function list(string $keyword = '', string $status = ''): array
    {
        return $this->menus->all($keyword, $status);
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
        $menu = $this->menus->update($this->mustFind($id), $this->data($payload));

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
            throw new BusinessException(ErrorCode::NOT_FOUND, 404, ['resource' => 'admin_menu', 'id' => $id]);
        }

        return $menu;
    }

    private function data(array $payload): array
    {
        $name = trim((string) ($payload['name'] ?? ''));
        if ($name === '') {
            throw new BusinessException(ErrorCode::VALIDATION_FAILED, 422, ['field' => 'name', 'reason' => 'required']);
        }

        $type = (string) ($payload['type'] ?? 'menu');
        if (! in_array($type, ['directory', 'menu', 'button'], true)) {
            throw new BusinessException(ErrorCode::VALIDATION_FAILED, 422, ['field' => 'type', 'reason' => 'invalid']);
        }

        $status = (string) ($payload['status'] ?? 'enabled');
        if (! in_array($status, ['enabled', 'disabled'], true)) {
            throw new BusinessException(ErrorCode::VALIDATION_FAILED, 422, ['field' => 'status', 'reason' => 'invalid']);
        }

        return [
            'parent_id' => (int) ($payload['parentId'] ?? $payload['parent_id'] ?? 0),
            'type' => $type,
            'name' => $name,
            'path' => trim((string) ($payload['path'] ?? '')),
            'permission' => trim((string) ($payload['permission'] ?? '')),
            'sort' => (int) ($payload['sort'] ?? 0),
            'status' => $status,
        ];
    }
}
