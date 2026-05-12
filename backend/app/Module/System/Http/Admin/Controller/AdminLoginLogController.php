<?php

declare(strict_types=1);

namespace App\Module\System\Http\Admin\Controller;

use App\Module\Auth\Http\Admin\Middleware\AdminAuthMiddleware;
use App\Module\System\Service\AdminLoginLogService;
use TrueAdmin\Kernel\Crud\CrudQueryRequest;
use TrueAdmin\Kernel\Http\ApiResponse;
use TrueAdmin\Kernel\Http\Attribute\AdminController as AdminRouteController;
use TrueAdmin\Kernel\Http\Attribute\AdminGet;
use TrueAdmin\Kernel\Http\Attribute\Permission;
use TrueAdmin\Kernel\Http\Controller\AdminController;
use TrueAdmin\Kernel\Http\Middleware\PermissionMiddleware;

#[AdminRouteController(path: '/api/admin/system-config/login-logs', middleware: [AdminAuthMiddleware::class, PermissionMiddleware::class])]
final class AdminLoginLogController extends AdminController
{
    public function __construct(private readonly AdminLoginLogService $logs)
    {
    }

    #[AdminGet('')]
    #[Permission('system:login-log:list', title: '登录日志列表', group: '系统管理')]
    public function list(CrudQueryRequest $request): array
    {
        return ApiResponse::success($this->logs->paginate($request->crudQuery())->toArray());
    }

    #[AdminGet('{id}')]
    #[Permission('system:login-log:detail', title: '登录日志详情', group: '系统管理')]
    public function detail(int $id): array
    {
        return ApiResponse::success($this->logs->detail($id));
    }
}
