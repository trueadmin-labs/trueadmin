<?php

declare(strict_types=1);

namespace App\Module\System\Http\Admin\Controller;

use App\Foundation\Http\Controller\AdminController;
use App\Foundation\Http\Middleware\PermissionMiddleware;
use App\Foundation\Http\Request\AdminQueryRequest;
use App\Foundation\Support\ApiResponse;
use App\Module\Auth\Http\Admin\Middleware\AdminAuthMiddleware;
use App\Module\System\Http\Admin\Request\CreateAdminUserRequest;
use App\Module\System\Http\Admin\Request\UpdateAdminUserRequest;
use App\Module\System\Service\AdminUserManagementService;
use TrueAdmin\Kernel\Http\Attribute\AdminController as AdminRouteController;
use TrueAdmin\Kernel\Http\Attribute\AdminDelete;
use TrueAdmin\Kernel\Http\Attribute\AdminGet;
use TrueAdmin\Kernel\Http\Attribute\AdminPost;
use TrueAdmin\Kernel\Http\Attribute\AdminPut;
use TrueAdmin\Kernel\Http\Attribute\Menu;
use TrueAdmin\Kernel\Http\Attribute\Permission;
use TrueAdmin\Kernel\OperationLog\Attribute\OperationLog;

#[Menu(code: 'system.users', title: '用户管理', path: '/system/users', parent: 'system', permission: 'system:user:list', component: './system/users', sort: 20)]
#[AdminRouteController(path: '/api/admin/system/users', middleware: [AdminAuthMiddleware::class, PermissionMiddleware::class])]
final class AdminUserController extends AdminController
{
    public function __construct(private readonly AdminUserManagementService $users)
    {
    }

    #[AdminGet('')]
    #[Permission('system:user:list', title: '管理员用户列表', group: '系统管理')]
    public function list(AdminQueryRequest $request): array
    {
        return ApiResponse::success($this->users->paginate($request->adminQuery())->toArray());
    }

    #[AdminGet('{id}')]
    #[Permission('system:user:detail', title: '管理员用户详情', group: '系统管理')]
    public function detail(int $id): array
    {
        return ApiResponse::success($this->users->detail($id));
    }

    #[AdminPost('')]
    #[Permission('system:user:create', title: '新增管理员用户', group: '系统管理')]
    #[OperationLog(module: 'system', action: 'admin.user.create', remark: '新增管理员用户')]
    public function create(CreateAdminUserRequest $request): array
    {
        return ApiResponse::success($this->users->create($request->validated()));
    }

    #[AdminPut('{id}')]
    #[Permission('system:user:update', title: '编辑管理员用户', group: '系统管理')]
    #[OperationLog(module: 'system', action: 'admin.user.update', remark: '编辑管理员用户')]
    public function update(int $id, UpdateAdminUserRequest $request): array
    {
        return ApiResponse::success($this->users->update($id, $request->validated()));
    }

    #[AdminDelete('{id}')]
    #[Permission('system:user:delete', title: '删除管理员用户', group: '系统管理')]
    #[OperationLog(module: 'system', action: 'admin.user.delete', remark: '删除管理员用户')]
    public function delete(int $id): array
    {
        $this->users->delete($id);

        return ApiResponse::success(null);
    }

    #[AdminGet('role-options')]
    #[Permission('system:role:list', title: '角色选项', group: '系统管理')]
    public function listRoleOptions(): array
    {
        return ApiResponse::success($this->users->roleOptions());
    }
}
