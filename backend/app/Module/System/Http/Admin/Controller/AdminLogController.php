<?php

declare(strict_types=1);

namespace App\Module\System\Http\Admin\Controller;

use App\Foundation\Http\Controller\AdminController;
use App\Foundation\Http\Middleware\PermissionMiddleware;
use App\Foundation\Http\Request\AdminQueryRequest;
use App\Foundation\Support\ApiResponse;
use App\Module\Auth\Http\Admin\Middleware\AdminAuthMiddleware;
use App\Module\System\Service\AdminLogService;
use TrueAdmin\Kernel\Http\Attribute\AdminController as AdminRouteController;
use TrueAdmin\Kernel\Http\Attribute\AdminGet;
use TrueAdmin\Kernel\Http\Attribute\Permission;

#[AdminRouteController(path: '/api/admin/system-config', middleware: [AdminAuthMiddleware::class, PermissionMiddleware::class])]
final class AdminLogController extends AdminController
{
    public function __construct(private readonly AdminLogService $logs)
    {
    }

    #[AdminGet('login-logs')]
    #[Permission('system:login-log:list', title: '登录日志列表', group: '系统管理')]
    public function loginLogs(AdminQueryRequest $request): array
    {
        return ApiResponse::success($this->logs->loginLogs($request->adminQuery())->toArray());
    }

    #[AdminGet('operation-logs')]
    #[Permission('system:operation-log:list', title: '操作日志列表', group: '系统管理')]
    public function operationLogs(AdminQueryRequest $request): array
    {
        return ApiResponse::success($this->logs->operationLogs($request->adminQuery())->toArray());
    }
}
