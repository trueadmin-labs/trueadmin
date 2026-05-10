<?php

declare(strict_types=1);

namespace App\Module\System\Http\Admin\Controller;

use App\Foundation\Http\Controller\AdminController;
use App\Foundation\Http\Middleware\PermissionMiddleware;
use App\Foundation\Support\ApiResponse;
use App\Foundation\Contract\AdminPermissionProviderInterface;
use App\Module\Auth\Http\Admin\Middleware\AdminAuthMiddleware;
use TrueAdmin\Kernel\Http\Attribute\AdminController as AdminRouteController;
use TrueAdmin\Kernel\Http\Attribute\AdminGet;
use TrueAdmin\Kernel\Http\Attribute\Menu;
use TrueAdmin\Kernel\Http\Attribute\Permission;

#[Menu(code: 'system.permissions', title: '权限点', path: '', parent: 'systemConfig', permission: 'system:permission:list', sort: 0, type: 'button')]
#[AdminRouteController(path: '/api/admin/system-config', middleware: [AdminAuthMiddleware::class, PermissionMiddleware::class])]
final class PermissionController extends AdminController
{
    public function __construct(private readonly AdminPermissionProviderInterface $permissions)
    {
    }

    #[AdminGet('menu-tree')]
    #[Permission('system:menu:list', title: '菜单树', group: '系统管理')]
    public function listMenuTree(): array
    {
        return ApiResponse::success($this->permissions->menuTree());
    }

    #[AdminGet('permissions')]
    #[Permission('system:permission:list', title: '权限点列表', group: '系统管理')]
    public function listPermissionCodes(): array
    {
        return ApiResponse::success($this->permissions->permissionCodes());
    }
}
