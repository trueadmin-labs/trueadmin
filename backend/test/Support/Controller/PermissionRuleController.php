<?php

declare(strict_types=1);

namespace HyperfTest\Support\Controller;

use App\Foundation\Support\ApiResponse;
use App\Module\Auth\Http\Admin\Middleware\AdminAuthMiddleware;
use App\Module\System\Http\Admin\Middleware\PermissionMiddleware;
use TrueAdmin\Kernel\Http\Attribute\AdminController;
use TrueAdmin\Kernel\Http\Attribute\AdminGet;
use TrueAdmin\Kernel\Http\Attribute\Permission;

#[AdminController(path: '/api/admin/testing/permission-rules', middleware: [AdminAuthMiddleware::class, PermissionMiddleware::class])]
final class PermissionRuleController
{
    #[AdminGet('any')]
    #[Permission(anyOf: ['testing:permission:any-a', 'testing:permission:any-b'], title: '测试任一权限')]
    public function any(): array
    {
        return ApiResponse::success(['mode' => 'anyOf']);
    }

    #[AdminGet('all')]
    #[Permission(allOf: ['testing:permission:all-a', 'testing:permission:all-b'], title: '测试全部权限')]
    public function all(): array
    {
        return ApiResponse::success(['mode' => 'allOf']);
    }

    #[Permission('testing:permission:any-a', title: '测试权限 A', group: '权限测试')]
    public function defineAnyA(): void
    {
    }

    #[Permission('testing:permission:any-b', title: '测试权限 B', group: '权限测试')]
    public function defineAnyB(): void
    {
    }

    #[Permission('testing:permission:all-a', title: '测试权限 All A', group: '权限测试')]
    public function defineAllA(): void
    {
    }

    #[Permission('testing:permission:all-b', title: '测试权限 All B', group: '权限测试')]
    public function defineAllB(): void
    {
    }
}
