<?php

declare(strict_types=1);

namespace App\Module\System\Http\Admin\Controller;

use App\Foundation\Http\Controller\AdminController;
use App\Foundation\Http\Middleware\PermissionMiddleware;
use App\Foundation\Http\Request\AdminQueryRequest;
use App\Foundation\Support\ApiResponse;
use App\Module\Auth\Http\Admin\Middleware\AdminAuthMiddleware;
use App\Module\System\Http\Admin\Request\CreateClientUserRequest;
use App\Module\System\Http\Admin\Request\UpdateClientUserRequest;
use App\Module\System\Service\ClientUserManagementService;
use TrueAdmin\Kernel\Http\Attribute\AdminController as AdminRouteController;
use TrueAdmin\Kernel\Http\Attribute\AdminDelete;
use TrueAdmin\Kernel\Http\Attribute\AdminGet;
use TrueAdmin\Kernel\Http\Attribute\AdminPost;
use TrueAdmin\Kernel\Http\Attribute\AdminPut;
use TrueAdmin\Kernel\Http\Attribute\Menu;
use TrueAdmin\Kernel\Http\Attribute\Permission;
use TrueAdmin\Kernel\OperationLog\Attribute\OperationLog;

#[Menu(code: 'system.client-users', title: '用户端账号', path: '/system/client-users', parent: 'system', permission: 'system:client-user:list', icon: 'UserOutlined', sort: 25)]
#[AdminRouteController(path: '/api/admin/system/client-users', middleware: [AdminAuthMiddleware::class, PermissionMiddleware::class])]
final class ClientUserController extends AdminController
{
    public function __construct(private readonly ClientUserManagementService $users)
    {
    }

    #[AdminGet('')]
    #[Permission('system:client-user:list', title: '用户端账号列表', group: '系统管理')]
    public function list(AdminQueryRequest $request): array
    {
        return ApiResponse::success($this->users->paginate($request->adminQuery())->toArray());
    }

    #[AdminGet('{id}')]
    #[Permission('system:client-user:detail', title: '用户端账号详情', group: '系统管理')]
    public function detail(int $id): array
    {
        return ApiResponse::success($this->users->detail($id));
    }

    #[AdminPost('')]
    #[Permission('system:client-user:create', title: '新增用户端账号', group: '系统管理')]
    #[OperationLog(module: 'system', action: 'client.user.create', remark: '新增用户端账号')]
    public function create(CreateClientUserRequest $request): array
    {
        return ApiResponse::success($this->users->create($request->validated()));
    }

    #[AdminPut('{id}')]
    #[Permission('system:client-user:update', title: '编辑用户端账号', group: '系统管理')]
    #[OperationLog(module: 'system', action: 'client.user.update', remark: '编辑用户端账号')]
    public function update(int $id, UpdateClientUserRequest $request): array
    {
        return ApiResponse::success($this->users->update($id, $request->validated()));
    }

    #[AdminDelete('{id}')]
    #[Permission('system:client-user:delete', title: '删除用户端账号', group: '系统管理')]
    #[OperationLog(module: 'system', action: 'client.user.delete', remark: '删除用户端账号')]
    public function delete(int $id): array
    {
        $this->users->delete($id);

        return ApiResponse::success(null);
    }

    #[AdminPut('{id}/enable')]
    #[Permission('system:client-user:status', title: '启用用户端账号', group: '系统管理')]
    #[OperationLog(module: 'system', action: 'client.user.enable', remark: '启用用户端账号')]
    public function enable(int $id): array
    {
        return ApiResponse::success($this->users->enable($id));
    }

    #[AdminPut('{id}/disable')]
    #[Permission('system:client-user:status', title: '禁用用户端账号', group: '系统管理')]
    #[OperationLog(module: 'system', action: 'client.user.disable', remark: '禁用用户端账号')]
    public function disable(int $id): array
    {
        return ApiResponse::success($this->users->disable($id));
    }
}
