<?php

declare(strict_types=1);

namespace App\Module\System\Http\Admin\Controller;

use App\Foundation\Http\Controller\AdminController;
use App\Foundation\Http\Middleware\PermissionMiddleware;
use App\Foundation\Support\ApiResponse;
use App\Module\Auth\Http\Admin\Middleware\AdminAuthMiddleware;
use App\Module\System\Http\Admin\Request\Notification\AdminMessageActionRequest;
use App\Module\System\Http\Admin\Request\Notification\AdminMessageReadAllRequest;
use App\Module\System\Http\Admin\Request\Notification\AdminNotificationQueryRequest;
use App\Module\System\Service\Notification\AdminMessageCenterService;
use TrueAdmin\Kernel\Http\Attribute\AdminController as AdminRouteController;
use TrueAdmin\Kernel\Http\Attribute\AdminGet;
use TrueAdmin\Kernel\Http\Attribute\AdminPost;
use TrueAdmin\Kernel\Http\Attribute\Menu;
use TrueAdmin\Kernel\Http\Attribute\Permission;

#[Menu(code: 'system.messages', title: '消息中心', path: '/system/messages', parent: 'system', permission: 'system:message:list', component: './system/messages', sort: 70)]
#[AdminRouteController(path: '/api/admin/messages', middleware: [AdminAuthMiddleware::class, PermissionMiddleware::class])]
final class AdminMessageController extends AdminController
{
    public function __construct(private readonly AdminMessageCenterService $messages)
    {
    }

    #[AdminGet('')]
    #[Permission('system:message:list', title: '消息中心列表', group: '系统管理')]
    public function list(AdminNotificationQueryRequest $request): array
    {
        return ApiResponse::success($this->messages->paginate($request->adminQuery())->toArray());
    }

    #[AdminGet('unread-count')]
    #[Permission('system:message:list', title: '消息未读数量', group: '系统管理')]
    public function unreadCount(): array
    {
        return ApiResponse::success($this->messages->unreadCount());
    }

    #[AdminGet('{kind}/{id}')]
    #[Permission('system:message:detail', title: '消息详情', group: '系统管理')]
    public function detail(string $kind, int $id): array
    {
        return ApiResponse::success($this->messages->detail($kind, $id));
    }

    #[AdminPost('read')]
    #[Permission('system:message:update', title: '标记消息已读', group: '系统管理')]
    public function markRead(AdminMessageActionRequest $request): array
    {
        $this->messages->markRead($request->validated()['messages']);

        return ApiResponse::success(null);
    }

    #[AdminPost('archive')]
    #[Permission('system:message:update', title: '归档消息', group: '系统管理')]
    public function archive(AdminMessageActionRequest $request): array
    {
        $this->messages->archive($request->validated()['messages']);

        return ApiResponse::success(null);
    }

    #[AdminPost('restore')]
    #[Permission('system:message:update', title: '恢复归档消息', group: '系统管理')]
    public function restore(AdminMessageActionRequest $request): array
    {
        $this->messages->restore($request->validated()['messages']);

        return ApiResponse::success(null);
    }

    #[AdminPost('read-all')]
    #[Permission('system:message:update', title: '全部标记已读', group: '系统管理')]
    public function readAll(AdminMessageReadAllRequest $request): array
    {
        $this->messages->readAll($request->validated()['kind']);

        return ApiResponse::success(null);
    }
}
