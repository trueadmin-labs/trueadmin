<?php

declare(strict_types=1);

namespace App\Module\System\Http\Admin\Controller;

use App\Foundation\Http\Controller\AdminController;
use App\Foundation\Support\ApiResponse;
use App\Module\Auth\Http\Admin\Middleware\AdminAuthMiddleware;
use App\Module\System\Http\Admin\Middleware\PermissionMiddleware;
use App\Module\System\Service\AdminRoleManagementService;
use TrueAdmin\Kernel\Http\Attribute\AdminController as AdminRouteController;
use TrueAdmin\Kernel\Http\Attribute\AdminDelete;
use TrueAdmin\Kernel\Http\Attribute\AdminGet;
use TrueAdmin\Kernel\Http\Attribute\AdminPost;
use TrueAdmin\Kernel\Http\Attribute\AdminPut;
use TrueAdmin\Kernel\Http\Attribute\Menu;
use TrueAdmin\Kernel\Http\Attribute\Permission;
use TrueAdmin\Kernel\OperationLog\Attribute\OperationLog;

#[Menu(code: 'system.roles', title: '角色管理', path: '/system/roles', parent: 'system', permission: 'system:role:list', component: './system/roles', sort: 30)]
#[AdminRouteController(prefix: 'system/roles', middleware: [AdminAuthMiddleware::class, PermissionMiddleware::class])]
final class AdminRoleController extends AdminController
{
    public function __construct(private readonly AdminRoleManagementService $roles)
    {
    }

    #[AdminGet('')]
    #[Permission('system:role:list', title: '角色列表', group: '系统管理')]
    public function index(): array
    {
        return ApiResponse::success($this->roles->paginate(
            max(1, (int) $this->request->input('page', 1)),
            min(100, max(1, (int) $this->request->input('pageSize', 20))),
            trim((string) $this->request->input('keyword', '')),
            trim((string) $this->request->input('status', '')),
        )->toArray());
    }

    #[AdminGet('{id}')]
    #[Permission('system:role:detail', title: '角色详情', group: '系统管理')]
    public function show(int $id): array
    {
        return ApiResponse::success($this->roles->detail($id));
    }

    #[AdminPost('')]
    #[Permission('system:role:create', title: '新增角色', group: '系统管理')]
    #[OperationLog(module: 'system', action: 'admin_role_create', remark: '新增角色')]
    public function store(): array
    {
        return ApiResponse::success($this->roles->create($this->request->all()));
    }

    #[AdminPut('{id}')]
    #[Permission('system:role:update', title: '编辑角色', group: '系统管理')]
    #[OperationLog(module: 'system', action: 'admin_role_update', remark: '编辑角色')]
    public function update(int $id): array
    {
        return ApiResponse::success($this->roles->update($id, $this->request->all()));
    }

    #[AdminDelete('{id}')]
    #[Permission('system:role:delete', title: '删除角色', group: '系统管理')]
    #[OperationLog(module: 'system', action: 'admin_role_delete', remark: '删除角色')]
    public function destroy(int $id): array
    {
        $this->roles->delete($id);

        return ApiResponse::success(null);
    }

    #[AdminPost('{id}/menus')]
    #[Permission('system:role:authorize', title: '角色菜单授权', group: '系统管理')]
    #[OperationLog(module: 'system', action: 'admin_role_authorize', remark: '角色菜单授权')]
    public function authorizeMenus(int $id): array
    {
        return ApiResponse::success($this->roles->authorizeMenus($id, $this->request->input('menuIds', [])));
    }
}
