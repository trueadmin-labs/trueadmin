<?php

declare(strict_types=1);

namespace App\Module\System\Http\Admin\Controller;

use App\Foundation\Http\Controller\AdminController;
use App\Foundation\Support\ApiResponse;
use App\Module\Auth\Http\Admin\Middleware\AdminAuthMiddleware;
use App\Module\System\Http\Admin\Middleware\PermissionMiddleware;
use App\Module\System\Service\AdminUserManagementService;
use TrueAdmin\Kernel\Http\Attribute\AdminController as AdminRouteController;
use TrueAdmin\Kernel\Http\Attribute\AdminDelete;
use TrueAdmin\Kernel\Http\Attribute\AdminGet;
use TrueAdmin\Kernel\Http\Attribute\AdminPost;
use TrueAdmin\Kernel\Http\Attribute\AdminPut;
use TrueAdmin\Kernel\Http\Attribute\Permission;
use TrueAdmin\Kernel\OperationLog\Attribute\OperationLog;

#[AdminRouteController(prefix: 'system/users', middleware: [AdminAuthMiddleware::class, PermissionMiddleware::class])]
final class AdminUserController extends AdminController
{
    public function __construct(private readonly AdminUserManagementService $users)
    {
    }

    #[AdminGet('')]
    #[Permission('system:user:list', title: '管理员用户列表', group: '系统管理')]
    public function index(): array
    {
        return ApiResponse::success($this->users->paginate(
            max(1, (int) $this->request->input('page', 1)),
            min(100, max(1, (int) $this->request->input('pageSize', 20))),
            trim((string) $this->request->input('keyword', '')),
            trim((string) $this->request->input('status', '')),
        )->toArray());
    }

    #[AdminGet('{id}')]
    #[Permission('system:user:detail', title: '管理员用户详情', group: '系统管理')]
    public function show(int $id): array
    {
        return ApiResponse::success($this->users->detail($id));
    }

    #[AdminPost('')]
    #[Permission('system:user:create', title: '新增管理员用户', group: '系统管理')]
    #[OperationLog(module: 'system', action: 'admin_user_create', remark: '新增管理员用户')]
    public function store(): array
    {
        return ApiResponse::success($this->users->create($this->request->all()));
    }

    #[AdminPut('{id}')]
    #[Permission('system:user:update', title: '编辑管理员用户', group: '系统管理')]
    #[OperationLog(module: 'system', action: 'admin_user_update', remark: '编辑管理员用户')]
    public function update(int $id): array
    {
        return ApiResponse::success($this->users->update($id, $this->request->all()));
    }

    #[AdminDelete('{id}')]
    #[Permission('system:user:delete', title: '删除管理员用户', group: '系统管理')]
    #[OperationLog(module: 'system', action: 'admin_user_delete', remark: '删除管理员用户')]
    public function destroy(int $id): array
    {
        $this->users->delete($id);

        return ApiResponse::success(null);
    }

    #[AdminGet('role-options')]
    #[Permission('system:role:list', title: '角色选项', group: '系统管理')]
    public function roleOptions(): array
    {
        return ApiResponse::success($this->users->roleOptions());
    }
}
