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
    private const TYPE_DIRECTORY = 'directory';

    private const TYPE_LINK = 'link';

    private const SOURCE_CODE = 'code';

    private const SOURCE_CUSTOM = 'custom';

    private const CODE_PATTERN = '/^[A-Za-z][A-Za-z0-9_.:-]*$/';

    private const PERMISSION_PATTERN = '/^[A-Za-z][A-Za-z0-9_-]*(?::[A-Za-z0-9][A-Za-z0-9_-]*)+$/';

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
        $type = (string) ($payload['type'] ?? self::TYPE_DIRECTORY);
        if (! in_array($type, [self::TYPE_DIRECTORY, self::TYPE_LINK], true)) {
            throw new BusinessException(ErrorCode::VALIDATION_FAILED, 422, ['field' => 'type', 'reason' => 'custom_menu_only_supports_directory_or_link']);
        }

        $menu = $this->menus->create($this->data([...$payload, 'type' => $type], null, true));

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
        if ((string) $menu->getAttribute('source') === self::SOURCE_CODE) {
            throw new BusinessException(ErrorCode::VALIDATION_FAILED, 422, ['reason' => 'cannot_delete_code_menu']);
        }
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

    private function data(array $payload, ?AdminMenu $current = null, bool $creating = false): array
    {
        $parentId = (int) ($payload['parentId'] ?? $current?->getAttribute('parent_id') ?? 0);
        $this->assertParent($parentId, $current === null ? null : (int) $current->getAttribute('id'));

        $isCodeMenu = $current !== null && (string) $current->getAttribute('source') === self::SOURCE_CODE;
        $type = $isCodeMenu
            ? (string) $current->getAttribute('type')
            : (string) ($payload['type'] ?? $current?->getAttribute('type') ?? self::TYPE_DIRECTORY);
        if ($type === self::TYPE_LINK) {
            $this->assertUrl((string) ($payload['url'] ?? $current?->getAttribute('url') ?? ''));
        }
        if (! in_array($type, [self::TYPE_DIRECTORY, 'menu', 'button', self::TYPE_LINK], true)) {
            throw new BusinessException(ErrorCode::VALIDATION_FAILED, 422, ['field' => 'type', 'reason' => 'unsupported_menu_type']);
        }
        if (! $isCodeMenu && ! in_array($type, [self::TYPE_DIRECTORY, self::TYPE_LINK], true)) {
            throw new BusinessException(ErrorCode::VALIDATION_FAILED, 422, ['field' => 'type', 'reason' => 'custom_menu_only_supports_directory_or_link']);
        }

        $code = $isCodeMenu ? (string) $current->getAttribute('code') : (string) ($payload['code'] ?? $current?->getAttribute('code') ?? '');
        if ($creating && $code === '') {
            $code = $this->generateCustomCode($type);
        }
        if ($code !== '') {
            $this->assertCode($code);
            $exists = $this->menus->findByCode($code);
            $currentId = $current === null ? 0 : (int) $current->getAttribute('id');
            $this->assertUnique($exists !== null && (int) $exists->getAttribute('id') !== $currentId, 'code');
        }

        $permission = $isCodeMenu ? (string) $current->getAttribute('permission') : (string) ($payload['permission'] ?? $current?->getAttribute('permission') ?? '');
        if ($creating && $type === self::TYPE_LINK && $permission === '') {
            $permission = str_replace('custom:link:', 'custom:link:view:', $code);
        }
        if ($permission !== '') {
            $this->assertPermission($permission);
        }

        $openMode = $type === self::TYPE_LINK
            ? (string) ($payload['openMode'] ?? $current?->getAttribute('open_mode') ?? 'blank')
            : '';
        if ($type === self::TYPE_LINK && ! in_array($openMode, ['blank', 'self', 'iframe'], true)) {
            throw new BusinessException(ErrorCode::VALIDATION_FAILED, 422, ['field' => 'openMode', 'reason' => 'unsupported_open_mode']);
        }

        return [
            'parent_id' => $parentId,
            'code' => $code,
            'type' => $type,
            'name' => (string) $payload['name'],
            'path' => $isCodeMenu ? (string) $current->getAttribute('path') : '',
            'url' => $type === self::TYPE_LINK ? (string) ($payload['url'] ?? $current?->getAttribute('url') ?? '') : '',
            'open_mode' => $openMode,
            'show_link_header' => $type === self::TYPE_LINK ? (bool) ($payload['showLinkHeader'] ?? $current?->getAttribute('show_link_header') ?? false) : false,
            'icon' => (string) ($payload['icon'] ?? $current?->getAttribute('icon') ?? ''),
            'permission' => $permission,
            'source' => $isCodeMenu ? self::SOURCE_CODE : self::SOURCE_CUSTOM,
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

    private function assertUrl(string $url): void
    {
        if ($url === '') {
            throw new BusinessException(ErrorCode::VALIDATION_FAILED, 422, ['field' => 'url', 'reason' => 'required']);
        }

        $scheme = strtolower((string) parse_url($url, PHP_URL_SCHEME));
        if (! in_array($scheme, ['http', 'https'], true) || filter_var($url, FILTER_VALIDATE_URL) === false) {
            throw new BusinessException(ErrorCode::VALIDATION_FAILED, 422, ['field' => 'url', 'reason' => 'invalid_url']);
        }
    }

    private function assertCode(string $code): void
    {
        if (preg_match(self::CODE_PATTERN, $code) !== 1) {
            throw new BusinessException(ErrorCode::VALIDATION_FAILED, 422, ['field' => 'code', 'reason' => 'invalid_code']);
        }
    }

    private function assertPermission(string $permission): void
    {
        if (preg_match(self::PERMISSION_PATTERN, $permission) !== 1) {
            throw new BusinessException(ErrorCode::VALIDATION_FAILED, 422, ['field' => 'permission', 'reason' => 'invalid_permission']);
        }
    }

    private function generateCustomCode(string $type): string
    {
        do {
            $code = sprintf('custom:%s:%s', $type, bin2hex(random_bytes(4)));
        } while ($this->menus->findByCode($code) !== null);

        return $code;
    }
}
