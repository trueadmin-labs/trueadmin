<?php

declare(strict_types=1);

namespace App\Module\System\Http\Admin\Controller;

use App\Foundation\Http\Controller\AdminController;
use App\Foundation\Http\Middleware\PermissionMiddleware;
use App\Foundation\Support\ApiResponse;
use App\Module\Auth\Http\Admin\Middleware\AdminAuthMiddleware;
use App\Module\System\Http\Admin\Request\Notification\AdminNotificationQueryRequest;
use App\Module\System\Http\Admin\Request\Notification\SaveAdminNotificationBatchRequest;
use App\Module\System\Service\Notification\AdminNotificationBatchService;
use TrueAdmin\Kernel\Http\Attribute\AdminController as AdminRouteController;
use TrueAdmin\Kernel\Http\Attribute\AdminDelete;
use TrueAdmin\Kernel\Http\Attribute\AdminGet;
use TrueAdmin\Kernel\Http\Attribute\AdminPost;
use TrueAdmin\Kernel\Http\Attribute\AdminPut;
use TrueAdmin\Kernel\Http\Attribute\Menu;
use TrueAdmin\Kernel\Http\Attribute\Permission;
use TrueAdmin\Kernel\OperationLog\Attribute\OperationLog;

#[Menu(code: 'system.notificationManagement', title: '通知管理', path: '/system/notification-management', parent: 'system', permission: 'system:notification:list', component: './system/notification-management', sort: 80)]
#[AdminRouteController(path: '/api/admin/notification-batches', middleware: [AdminAuthMiddleware::class, PermissionMiddleware::class])]
final class AdminNotificationBatchController extends AdminController
{
    public function __construct(private readonly AdminNotificationBatchService $notifications)
    {
    }

    #[AdminGet('')]
    #[Permission('system:notification:list', title: '通知批次列表', group: '系统管理')]
    public function list(AdminNotificationQueryRequest $request): array
    {
        $result = $this->notifications->paginate($request->adminQuery())->toArray();
        $result['meta'] = $this->notifications->listMeta();

        return ApiResponse::success($result);
    }

    #[AdminGet('{id}')]
    #[Permission('system:notification:detail', title: '通知批次详情', group: '系统管理')]
    public function detail(int $id): array
    {
        return ApiResponse::success($this->notifications->detail($id));
    }

    #[AdminPost('announcements')]
    #[Permission('system:notification:create', title: '创建公告', group: '系统管理')]
    #[OperationLog(module: 'system', action: 'admin.notification.announcement.create', remark: '创建公告')]
    public function createAnnouncement(SaveAdminNotificationBatchRequest $request): array
    {
        return ApiResponse::success($this->notifications->createAnnouncement($request->validated()));
    }

    #[AdminPut('{id}')]
    #[Permission('system:notification:update', title: '编辑通知批次', group: '系统管理')]
    #[OperationLog(module: 'system', action: 'admin.notification.update', remark: '编辑通知批次')]
    public function update(int $id, SaveAdminNotificationBatchRequest $request): array
    {
        return ApiResponse::success($this->notifications->update($id, $request->validated()));
    }

    #[AdminDelete('{id}')]
    #[Permission('system:notification:delete', title: '删除通知草稿', group: '系统管理')]
    #[OperationLog(module: 'system', action: 'admin.notification.delete', remark: '删除通知草稿')]
    public function delete(int $id): array
    {
        $this->notifications->deleteDraft($id);

        return ApiResponse::success(null);
    }

    #[AdminPost('{id}/publish')]
    #[Permission('system:notification:publish', title: '发布通知批次', group: '系统管理')]
    #[OperationLog(module: 'system', action: 'admin.notification.publish', remark: '发布通知批次')]
    public function publish(int $id): array
    {
        return ApiResponse::success($this->notifications->publish($id));
    }

    #[AdminPost('{id}/cancel-scheduled')]
    #[Permission('system:notification:update', title: '取消定时发布', group: '系统管理')]
    #[OperationLog(module: 'system', action: 'admin.notification.cancel_scheduled', remark: '取消定时发布')]
    public function cancelScheduled(int $id): array
    {
        return ApiResponse::success($this->notifications->cancelScheduled($id));
    }

    #[AdminPost('{id}/offline')]
    #[Permission('system:notification:offline', title: '下线通知批次', group: '系统管理')]
    #[OperationLog(module: 'system', action: 'admin.notification.offline', remark: '下线通知批次')]
    public function offline(int $id): array
    {
        return ApiResponse::success($this->notifications->offline($id));
    }

    #[AdminGet('{id}/deliveries')]
    #[Permission('system:notification:delivery:list', title: '通知投递记录', group: '系统管理')]
    public function deliveries(int $id, AdminNotificationQueryRequest $request): array
    {
        return ApiResponse::success($this->notifications->paginateDeliveries($id, $request->adminQuery())->toArray());
    }

    #[AdminPost('{batchId}/deliveries/{deliveryId}/resend')]
    #[Permission('system:notification:delivery:resend', title: '重发通知投递', group: '系统管理')]
    #[OperationLog(module: 'system', action: 'admin.notification.delivery.resend', remark: '重发通知投递')]
    public function resendDelivery(int $batchId, int $deliveryId): array
    {
        return ApiResponse::success($this->notifications->resendDelivery($batchId, $deliveryId));
    }
}
