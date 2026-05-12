<?php

declare(strict_types=1);

namespace App\Module\System\Http\Admin\Controller;

use App\Foundation\Http\Controller\AdminController;
use App\Foundation\Http\Middleware\PermissionMiddleware;
use App\Foundation\Support\ApiResponse;
use App\Module\Auth\Http\Admin\Middleware\AdminAuthMiddleware;
use App\Module\System\Http\Admin\Request\Notification\AdminNotificationQueryRequest;
use App\Module\System\Service\Notification\AdminNotificationBatchService;
use TrueAdmin\Kernel\Http\Attribute\AdminController as AdminRouteController;
use TrueAdmin\Kernel\Http\Attribute\AdminGet;
use TrueAdmin\Kernel\Http\Attribute\AdminPost;
use TrueAdmin\Kernel\Http\Attribute\Permission;
use TrueAdmin\Kernel\OperationLog\Attribute\OperationLog;

#[AdminRouteController(path: '/api/admin/message-management/notifications', middleware: [AdminAuthMiddleware::class, PermissionMiddleware::class])]
final class AdminNotificationController extends AdminController
{
    public function __construct(private readonly AdminNotificationBatchService $notifications)
    {
    }

    #[AdminGet('')]
    #[Permission('system:notification:list', title: '通知列表', group: '系统管理')]
    public function list(AdminNotificationQueryRequest $request): array
    {
        $page = $this->notifications->paginate($request->crudQuery())->toArray();

        return ApiResponse::success([...$page, 'meta' => $this->notifications->listMeta()]);
    }

    #[AdminGet('{id}')]
    #[Permission('system:notification:detail', title: '通知详情', group: '系统管理')]
    public function detail(int $id): array
    {
        return ApiResponse::success($this->notifications->detail($id));
    }

    #[AdminPost('{id}/resend')]
    #[Permission('system:notification:delivery:resend', title: '重发通知', group: '系统管理')]
    #[OperationLog(module: 'system', action: 'admin.notification.resend', remark: '重发通知')]
    public function resend(int $id): array
    {
        return ApiResponse::success($this->notifications->resendFailedDeliveries($id));
    }

    #[AdminGet('{id}/deliveries')]
    #[Permission('system:notification:delivery:list', title: '通知投递记录', group: '系统管理')]
    public function deliveries(int $id, AdminNotificationQueryRequest $request): array
    {
        return ApiResponse::success($this->notifications->paginateDeliveries($id, $request->crudQuery())->toArray());
    }

}
