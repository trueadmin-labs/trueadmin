<?php

declare(strict_types=1);

namespace App\Module\System\Http\Admin\Controller;

use App\Foundation\Http\Controller\AdminController;
use App\Foundation\Support\ApiResponse;
use App\Module\Auth\Http\Admin\Middleware\AdminAuthMiddleware;
use App\Module\System\Contract\AdminPermissionProviderInterface;
use App\Module\System\Http\Admin\Middleware\PermissionMiddleware;
use TrueAdmin\Kernel\Http\Attribute\AdminController as AdminRouteController;
use TrueAdmin\Kernel\Http\Attribute\AdminGet;
use TrueAdmin\Kernel\Http\Attribute\Permission;

#[AdminRouteController(prefix: 'system', middleware: [AdminAuthMiddleware::class, PermissionMiddleware::class])]
final class PermissionController extends AdminController
{
    public function __construct(private readonly AdminPermissionProviderInterface $permissions)
    {
    }

    #[AdminGet('menu-tree')]
    #[Permission('system:menu:list', title: '菜单树', group: '系统管理')]
    public function menus(): array
    {
        return ApiResponse::success($this->permissions->menuTree());
    }

    #[AdminGet('permissions')]
    #[Permission('system:permission:list', title: '权限点列表', group: '系统管理')]
    public function permissions(): array
    {
        return ApiResponse::success($this->permissions->permissionCodes());
    }
}
