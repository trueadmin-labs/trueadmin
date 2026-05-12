<?php

declare(strict_types=1);

namespace App\Module\System\Http\Admin\Controller;

use TrueAdmin\Kernel\Http\Controller\AdminController;
use App\Foundation\Http\Middleware\PermissionMiddleware;
use TrueAdmin\Kernel\Http\ApiResponse;
use App\Foundation\Contract\AdminPermissionProviderInterface;
use TrueAdmin\Kernel\DataPermission\DataPolicyRegistry;
use App\Module\Auth\Http\Admin\Middleware\AdminAuthMiddleware;
use TrueAdmin\Kernel\Http\Attribute\AdminController as AdminRouteController;
use TrueAdmin\Kernel\Http\Attribute\AdminGet;
use TrueAdmin\Kernel\Http\Attribute\Permission;

#[AdminRouteController(path: '/api/admin/system-config', middleware: [AdminAuthMiddleware::class, PermissionMiddleware::class])]
final class PermissionController extends AdminController
{
    public function __construct(
        private readonly AdminPermissionProviderInterface $permissions,
        private readonly DataPolicyRegistry $dataPolicyRegistry,
    ) {
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

    #[AdminGet('data-policies/metadata')]
    #[Permission('system:role:authorize', title: '数据权限元数据', group: '系统管理')]
    public function dataPolicyMetadata(): array
    {
        return ApiResponse::success($this->dataPolicyRegistry->metadata());
    }
}
