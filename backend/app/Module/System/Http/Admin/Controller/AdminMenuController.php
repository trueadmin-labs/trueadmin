<?php

declare(strict_types=1);

namespace App\Module\System\Http\Admin\Controller;

use App\Foundation\Http\Controller\AdminController;
use App\Foundation\Http\Middleware\PermissionMiddleware;
use App\Foundation\Http\Request\AdminQueryRequest;
use App\Foundation\Support\ApiResponse;
use App\Module\Auth\Http\Admin\Middleware\AdminAuthMiddleware;
use App\Module\System\Http\Admin\Request\SaveAdminMenuRequest;
use App\Module\System\Service\AdminMenuManagementService;
use TrueAdmin\Kernel\Http\Attribute\AdminController as AdminRouteController;
use TrueAdmin\Kernel\Http\Attribute\AdminDelete;
use TrueAdmin\Kernel\Http\Attribute\AdminGet;
use TrueAdmin\Kernel\Http\Attribute\AdminPost;
use TrueAdmin\Kernel\Http\Attribute\AdminPut;
use TrueAdmin\Kernel\Http\Attribute\Menu;
use TrueAdmin\Kernel\Http\Attribute\Permission;
use TrueAdmin\Kernel\OperationLog\Attribute\OperationLog;

#[Menu(code: 'system.menus', title: '菜单管理', path: '/system/menus', parent: 'system', permission: 'system:menu:list', component: './system/menus', sort: 40)]
#[AdminRouteController(path: '/api/admin/system/menus', middleware: [AdminAuthMiddleware::class, PermissionMiddleware::class])]
final class AdminMenuController extends AdminController
{
    public function __construct(private readonly AdminMenuManagementService $menus)
    {
    }

    #[AdminGet('')]
    #[Permission('system:menu:list', title: '菜单列表', group: '系统管理')]
    public function list(AdminQueryRequest $request): array
    {
        return ApiResponse::success($this->menus->list($request->adminQuery()));
    }

    #[AdminGet('{id}')]
    #[Permission('system:menu:detail', title: '菜单详情', group: '系统管理')]
    public function detail(int $id): array
    {
        return ApiResponse::success($this->menus->detail($id));
    }

    #[AdminPost('')]
    #[Permission('system:menu:create', title: '新增菜单', group: '系统管理')]
    #[OperationLog(module: 'system', action: 'admin.menu.create', remark: '新增菜单')]
    public function create(SaveAdminMenuRequest $request): array
    {
        return ApiResponse::success($this->menus->create($request->validated()));
    }

    #[AdminPut('{id}')]
    #[Permission('system:menu:update', title: '编辑菜单', group: '系统管理')]
    #[OperationLog(module: 'system', action: 'admin.menu.update', remark: '编辑菜单')]
    public function update(int $id, SaveAdminMenuRequest $request): array
    {
        return ApiResponse::success($this->menus->update($id, $request->validated()));
    }

    #[AdminDelete('{id}')]
    #[Permission('system:menu:delete', title: '删除菜单', group: '系统管理')]
    #[OperationLog(module: 'system', action: 'admin.menu.delete', remark: '删除菜单')]
    public function delete(int $id): array
    {
        $this->menus->delete($id);

        return ApiResponse::success(null);
    }
}
