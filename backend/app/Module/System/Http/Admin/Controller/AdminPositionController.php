<?php

declare(strict_types=1);
/**
 * This file is part of Hyperf.
 *
 * @link     https://www.hyperf.io
 * @document https://hyperf.wiki
 * @contact  group@hyperf.io
 * @license  https://github.com/hyperf/hyperf/blob/master/LICENSE
 */

namespace App\Module\System\Http\Admin\Controller;

use App\Module\Auth\Http\Admin\Middleware\AdminAuthMiddleware;
use App\Module\System\Http\Admin\Request\CreateAdminPositionRequest;
use App\Module\System\Http\Admin\Request\SaveAdminPositionMembersRequest;
use App\Module\System\Http\Admin\Request\UpdateAdminPositionRequest;
use App\Module\System\Service\AdminPositionManagementService;
use TrueAdmin\Kernel\Crud\CrudQueryRequest;
use TrueAdmin\Kernel\Http\ApiResponse;
use TrueAdmin\Kernel\Http\Attribute\AdminController as AdminRouteController;
use TrueAdmin\Kernel\Http\Attribute\AdminDelete;
use TrueAdmin\Kernel\Http\Attribute\AdminGet;
use TrueAdmin\Kernel\Http\Attribute\AdminPost;
use TrueAdmin\Kernel\Http\Attribute\AdminPut;
use TrueAdmin\Kernel\Http\Attribute\Permission;
use TrueAdmin\Kernel\Http\Controller\AdminController;
use TrueAdmin\Kernel\Http\Middleware\PermissionMiddleware;
use TrueAdmin\Kernel\OperationLog\Attribute\OperationLog;

#[AdminRouteController(path: '/api/admin/organization/positions', middleware: [AdminAuthMiddleware::class, PermissionMiddleware::class])]
final class AdminPositionController extends AdminController
{
    public function __construct(private readonly AdminPositionManagementService $positions)
    {
    }

    #[AdminGet('')]
    #[Permission('system:position:list', title: '岗位列表', group: '系统管理')]
    public function list(CrudQueryRequest $request): array
    {
        return ApiResponse::success($this->positions->paginate($request->crudQuery())->toArray());
    }

    #[AdminGet('options')]
    #[Permission('system:position:list', title: '岗位选项', group: '系统管理')]
    public function options(): array
    {
        $deptIds = $this->request->input('deptIds', null);
        if (is_string($deptIds)) {
            $deptIds = array_values(array_filter(array_map('intval', explode(',', $deptIds)), static fn (int $id): bool => $id > 0));
        }

        return ApiResponse::success($this->positions->options(is_array($deptIds) ? $deptIds : null));
    }

    #[AdminGet('{id}')]
    #[Permission('system:position:detail', title: '岗位详情', group: '系统管理')]
    public function detail(int $id): array
    {
        return ApiResponse::success($this->positions->detail($id));
    }

    #[AdminGet('{id}/member-ids')]
    #[Permission('system:position:detail', title: '岗位成员ID', group: '系统管理')]
    public function memberIds(int $id): array
    {
        return ApiResponse::success($this->positions->memberIds($id));
    }

    #[AdminPut('{id}/members')]
    #[Permission('system:position:update', title: '维护岗位成员', group: '系统管理')]
    #[OperationLog(module: 'system', action: 'admin.position.members.sync', remark: '维护岗位成员')]
    public function syncMembers(int $id, SaveAdminPositionMembersRequest $request): array
    {
        $validated = $request->validated();

        return ApiResponse::success($this->positions->syncMembers($id, $validated['userIds']));
    }

    #[AdminPost('')]
    #[Permission('system:position:create', title: '新增岗位', group: '系统管理')]
    #[OperationLog(module: 'system', action: 'admin.position.create', remark: '新增岗位')]
    public function create(CreateAdminPositionRequest $request): array
    {
        return ApiResponse::success($this->positions->create($request->validated()));
    }

    #[AdminPut('{id}')]
    #[Permission('system:position:update', title: '编辑岗位', group: '系统管理')]
    #[OperationLog(module: 'system', action: 'admin.position.update', remark: '编辑岗位')]
    public function update(int $id, UpdateAdminPositionRequest $request): array
    {
        return ApiResponse::success($this->positions->update($id, $request->validated()));
    }

    #[AdminDelete('{id}')]
    #[Permission('system:position:delete', title: '删除岗位', group: '系统管理')]
    #[OperationLog(module: 'system', action: 'admin.position.delete', remark: '删除岗位')]
    public function delete(int $id): array
    {
        $this->positions->delete($id);

        return ApiResponse::success(null);
    }
}
