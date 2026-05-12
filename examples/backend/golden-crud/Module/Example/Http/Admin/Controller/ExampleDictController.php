<?php

declare(strict_types=1);

namespace App\Module\Example\Http\Admin\Controller;

use App\Module\Auth\Http\Admin\Middleware\AdminAuthMiddleware;
use App\Module\Example\Http\Admin\Request\SaveExampleDictRequest;
use App\Module\Example\Service\ExampleDictManagementService;
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

#[AdminRouteController(path: '/api/admin/example/dicts', middleware: [AdminAuthMiddleware::class, PermissionMiddleware::class])]
final class ExampleDictController extends AdminController
{
    public function __construct(private readonly ExampleDictManagementService $dicts)
    {
    }

    #[AdminGet('')]
    #[Permission('example:dict:list', title: '示例字典列表', group: '示例模块')]
    public function list(CrudQueryRequest $request): array
    {
        return ApiResponse::success($this->dicts->paginate($request->crudQuery())->toArray());
    }

    #[AdminGet('{id}')]
    #[Permission('example:dict:detail', title: '示例字典详情', group: '示例模块')]
    public function detail(int $id): array
    {
        return ApiResponse::success($this->dicts->detail($id));
    }

    #[AdminPost('')]
    #[Permission('example:dict:create', title: '新增示例字典', group: '示例模块')]
    #[OperationLog(module: 'example', action: 'admin.example.dict.create', remark: '新增示例字典')]
    public function create(SaveExampleDictRequest $request): array
    {
        return ApiResponse::success($this->dicts->create($request->validated()));
    }

    #[AdminPut('{id}')]
    #[Permission('example:dict:update', title: '编辑示例字典', group: '示例模块')]
    #[OperationLog(module: 'example', action: 'admin.example.dict.update', remark: '编辑示例字典')]
    public function update(int $id, SaveExampleDictRequest $request): array
    {
        return ApiResponse::success($this->dicts->update($id, $request->validated()));
    }

    #[AdminDelete('{id}')]
    #[Permission('example:dict:delete', title: '删除示例字典', group: '示例模块')]
    #[OperationLog(module: 'example', action: 'admin.example.dict.delete', remark: '删除示例字典')]
    public function delete(int $id): array
    {
        $this->dicts->delete($id);

        return ApiResponse::success(null);
    }
}
