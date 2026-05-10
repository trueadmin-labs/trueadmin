<?php

declare(strict_types=1);

namespace App\Module\System\Http\Admin\Controller;

use App\Foundation\Http\Controller\AdminController;
use App\Foundation\Http\Middleware\PermissionMiddleware;
use App\Foundation\Support\ApiResponse;
use App\Module\Auth\Http\Admin\Middleware\AdminAuthMiddleware;
use App\Module\System\Http\Admin\Request\Notification\AdminNotificationQueryRequest;
use App\Module\System\Http\Admin\Request\Notification\SaveAdminAnnouncementRequest;
use App\Module\System\Service\Notification\AdminAnnouncementService;
use TrueAdmin\Kernel\Http\Attribute\AdminController as AdminRouteController;
use TrueAdmin\Kernel\Http\Attribute\AdminDelete;
use TrueAdmin\Kernel\Http\Attribute\AdminGet;
use TrueAdmin\Kernel\Http\Attribute\AdminPost;
use TrueAdmin\Kernel\Http\Attribute\AdminPut;
use TrueAdmin\Kernel\Http\Attribute\Menu;
use TrueAdmin\Kernel\Http\Attribute\Permission;
use TrueAdmin\Kernel\OperationLog\Attribute\OperationLog;

#[Menu(code: 'system.announcementManagement', title: '公告管理', path: '/system/announcement-management', parent: 'messageManagement', permission: 'system:announcement:list', icon: 'NotificationOutlined', sort: 10)]
#[AdminRouteController(path: '/api/admin/announcements', middleware: [AdminAuthMiddleware::class, PermissionMiddleware::class])]
final class AdminAnnouncementController extends AdminController
{
    public function __construct(private readonly AdminAnnouncementService $announcements)
    {
    }

    #[AdminGet('')]
    #[Permission('system:announcement:list', title: '公告列表', group: '系统管理')]
    public function list(AdminNotificationQueryRequest $request): array
    {
        $page = $this->announcements->paginate($request->adminQuery())->toArray();

        return ApiResponse::success([...$page, 'meta' => $this->announcements->listMeta()]);
    }

    #[AdminGet('{id}')]
    #[Permission('system:announcement:detail', title: '公告详情', group: '系统管理')]
    public function detail(int $id): array
    {
        return ApiResponse::success($this->announcements->detail($id));
    }

    #[AdminPost('')]
    #[Permission('system:announcement:create', title: '创建公告', group: '系统管理')]
    #[OperationLog(module: 'system', action: 'admin.announcement.create', remark: '创建公告')]
    public function create(SaveAdminAnnouncementRequest $request): array
    {
        return ApiResponse::success($this->announcements->create($request->validated()));
    }

    #[AdminPut('{id}')]
    #[Permission('system:announcement:update', title: '编辑公告', group: '系统管理')]
    #[OperationLog(module: 'system', action: 'admin.announcement.update', remark: '编辑公告')]
    public function update(int $id, SaveAdminAnnouncementRequest $request): array
    {
        return ApiResponse::success($this->announcements->update($id, $request->validated()));
    }

    #[AdminDelete('{id}')]
    #[Permission('system:announcement:delete', title: '删除公告草稿', group: '系统管理')]
    #[OperationLog(module: 'system', action: 'admin.announcement.delete', remark: '删除公告草稿')]
    public function delete(int $id): array
    {
        $this->announcements->deleteDraft($id);

        return ApiResponse::success(null);
    }

    #[AdminPost('{id}/publish')]
    #[Permission('system:announcement:publish', title: '发布公告', group: '系统管理')]
    #[OperationLog(module: 'system', action: 'admin.announcement.publish', remark: '发布公告')]
    public function publish(int $id): array
    {
        return ApiResponse::success($this->announcements->publish($id));
    }

    #[AdminPost('{id}/cancel-scheduled')]
    #[Permission('system:announcement:update', title: '取消定时公告', group: '系统管理')]
    #[OperationLog(module: 'system', action: 'admin.announcement.cancel_scheduled', remark: '取消定时公告')]
    public function cancelScheduled(int $id): array
    {
        return ApiResponse::success($this->announcements->cancelScheduled($id));
    }

    #[AdminPost('{id}/offline')]
    #[Permission('system:announcement:offline', title: '下线公告', group: '系统管理')]
    #[OperationLog(module: 'system', action: 'admin.announcement.offline', remark: '下线公告')]
    public function offline(int $id): array
    {
        return ApiResponse::success($this->announcements->offline($id));
    }

    #[AdminPost('{id}/restore')]
    #[Permission('system:announcement:update', title: '恢复公告', group: '系统管理')]
    #[OperationLog(module: 'system', action: 'admin.announcement.restore', remark: '恢复公告')]
    public function restore(int $id): array
    {
        return ApiResponse::success($this->announcements->restore($id));
    }
}
