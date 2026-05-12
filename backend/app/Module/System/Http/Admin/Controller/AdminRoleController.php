<?php

declare(strict_types=1);

namespace App\Module\System\Http\Admin\Controller;

use App\Foundation\Http\Controller\AdminController;
use App\Foundation\Http\Middleware\PermissionMiddleware;
use TrueAdmin\Kernel\Crud\CrudQueryRequest;
use TrueAdmin\Kernel\Http\ApiResponse;
use App\Module\Auth\Http\Admin\Middleware\AdminAuthMiddleware;
use App\Module\System\Http\Admin\Request\AuthorizeAdminRoleRequest;
use App\Module\System\Http\Admin\Request\SaveAdminRoleRequest;
use App\Module\System\Service\AdminRoleManagementService;
use TrueAdmin\Kernel\Http\Attribute\AdminController as AdminRouteController;
use TrueAdmin\Kernel\Http\Attribute\AdminDelete;
use TrueAdmin\Kernel\Http\Attribute\AdminGet;
use TrueAdmin\Kernel\Http\Attribute\AdminPost;
use TrueAdmin\Kernel\Http\Attribute\AdminPut;
use TrueAdmin\Kernel\Http\Attribute\Permission;
use TrueAdmin\Kernel\OperationLog\Attribute\OperationLog;

#[AdminRouteController(path: '/api/admin/organization/roles', middleware: [AdminAuthMiddleware::class, PermissionMiddleware::class])]
final class AdminRoleController extends AdminController
{
    public function __construct(private readonly AdminRoleManagementService $roles)
    {
    }

    #[AdminGet('')]
    #[Permission('system:role:list', title: '角色列表', group: '系统管理')]
    public function list(CrudQueryRequest $request): array
    {
        return ApiResponse::success($this->roles->paginate($request->crudQuery())->toArray());
    }

    #[AdminGet('options')]
    #[Permission('system:role:list', title: '角色选项', group: '系统管理')]
    public function options(): array
    {
        return ApiResponse::success($this->roles->options());
    }

    #[AdminGet('{id}')]
    #[Permission('system:role:detail', title: '角色详情', group: '系统管理')]
    public function detail(int $id): array
    {
        return ApiResponse::success($this->roles->detail($id));
    }

    #[AdminPost('')]
    #[Permission('system:role:create', title: '新增角色', group: '系统管理')]
    #[OperationLog(module: 'system', action: 'admin.role.create', remark: '新增角色')]
    public function create(SaveAdminRoleRequest $request): array
    {
        return ApiResponse::success($this->roles->create($request->validated()));
    }

    #[AdminPut('{id}')]
    #[Permission('system:role:update', title: '编辑角色', group: '系统管理')]
    #[OperationLog(module: 'system', action: 'admin.role.update', remark: '编辑角色')]
    public function update(int $id, SaveAdminRoleRequest $request): array
    {
        return ApiResponse::success($this->roles->update($id, $request->validated()));
    }

    #[AdminDelete('{id}')]
    #[Permission('system:role:delete', title: '删除角色', group: '系统管理')]
    #[OperationLog(module: 'system', action: 'admin.role.delete', remark: '删除角色')]
    public function delete(int $id): array
    {
        $this->roles->delete($id);

        return ApiResponse::success(null);
    }

    #[AdminPost('{id}/authorize')]
    #[Permission('system:role:authorize', title: '角色授权', group: '系统管理')]
    #[OperationLog(module: 'system', action: 'admin.role.authorize', remark: '角色授权')]
    public function authorize(int $id, AuthorizeAdminRoleRequest $request): array
    {
        $validated = $request->validated();

        return ApiResponse::success($this->roles->authorize($id, $validated['menuIds'], $validated['dataPolicies'] ?? []));
    }
}
