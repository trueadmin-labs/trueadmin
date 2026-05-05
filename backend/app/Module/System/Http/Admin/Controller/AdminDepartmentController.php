<?php

declare(strict_types=1);

namespace App\Module\System\Http\Admin\Controller;

use App\Foundation\Http\Controller\AdminController;
use App\Foundation\Http\Middleware\PermissionMiddleware;
use App\Foundation\Http\Request\AdminQueryRequest;
use App\Foundation\Support\ApiResponse;
use App\Module\Auth\Http\Admin\Middleware\AdminAuthMiddleware;
use App\Module\System\Http\Admin\Request\SaveAdminDepartmentRequest;
use App\Module\System\Service\AdminDepartmentManagementService;
use TrueAdmin\Kernel\Http\Attribute\AdminController as AdminRouteController;
use TrueAdmin\Kernel\Http\Attribute\AdminDelete;
use TrueAdmin\Kernel\Http\Attribute\AdminGet;
use TrueAdmin\Kernel\Http\Attribute\AdminPost;
use TrueAdmin\Kernel\Http\Attribute\AdminPut;
use TrueAdmin\Kernel\Http\Attribute\Menu;
use TrueAdmin\Kernel\Http\Attribute\Permission;
use TrueAdmin\Kernel\OperationLog\Attribute\OperationLog;

#[Menu(code: 'system.departments', title: '部门管理', path: '/system/departments', parent: 'system', permission: 'system:department:list', component: './system/departments', sort: 15)]
#[AdminRouteController(path: '/api/admin/system/departments', middleware: [AdminAuthMiddleware::class, PermissionMiddleware::class])]
final class AdminDepartmentController extends AdminController
{
    public function __construct(private readonly AdminDepartmentManagementService $departments)
    {
    }

    #[AdminGet('')]
    #[Permission('system:department:list', title: '部门列表', group: '系统管理')]
    public function list(AdminQueryRequest $request): array
    {
        return ApiResponse::success($this->departments->tree($request->adminQuery()));
    }

    #[AdminGet('{id}')]
    #[Permission('system:department:detail', title: '部门详情', group: '系统管理')]
    public function detail(int $id): array
    {
        return ApiResponse::success($this->departments->detail($id));
    }

    #[AdminPost('')]
    #[Permission('system:department:create', title: '新增部门', group: '系统管理')]
    #[OperationLog(module: 'system', action: 'admin.department.create', remark: '新增部门')]
    public function create(SaveAdminDepartmentRequest $request): array
    {
        return ApiResponse::success($this->departments->create($request->validated()));
    }

    #[AdminPut('{id}')]
    #[Permission('system:department:update', title: '编辑部门', group: '系统管理')]
    #[OperationLog(module: 'system', action: 'admin.department.update', remark: '编辑部门')]
    public function update(int $id, SaveAdminDepartmentRequest $request): array
    {
        return ApiResponse::success($this->departments->update($id, $request->validated()));
    }

    #[AdminDelete('{id}')]
    #[Permission('system:department:delete', title: '删除部门', group: '系统管理')]
    #[OperationLog(module: 'system', action: 'admin.department.delete', remark: '删除部门')]
    public function delete(int $id): array
    {
        $this->departments->delete($id);

        return ApiResponse::success(null);
    }
}
