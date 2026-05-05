<?php

declare(strict_types=1);

namespace App\Module\Product\Http\Admin\Controller;

use App\Foundation\Http\Controller\AdminController;
use App\Foundation\Support\ApiResponse;
use App\Module\Auth\Http\Admin\Middleware\AdminAuthMiddleware;
use App\Module\Product\Http\Admin\Vo\ProductVo;
use App\Module\Product\Service\ProductQueryService;
use App\Module\System\Http\Admin\Middleware\PermissionMiddleware;
use TrueAdmin\Kernel\Http\Attribute\AdminController as AdminRouteController;
use TrueAdmin\Kernel\Http\Attribute\AdminGet;
use TrueAdmin\Kernel\Http\Attribute\Menu;
use TrueAdmin\Kernel\Http\Attribute\Permission;
use TrueAdmin\Kernel\OperationLog\Attribute\OperationLog;

#[Menu(code: 'products', title: '商品管理', path: '/products', permission: 'product:list', icon: 'appstore', component: './products', sort: 50)]
#[AdminRouteController(path: '/api/admin/products', middleware: [AdminAuthMiddleware::class, PermissionMiddleware::class])]
final class ProductController extends AdminController
{
    public function __construct(private readonly ProductQueryService $productQueryService)
    {
    }

    #[AdminGet('')]
    #[Permission('product:list', title: '商品列表', group: '商品管理')]
    #[OperationLog(module: 'product', action: 'list', remark: '查询商品列表')]
    public function index(): array
    {
        return ApiResponse::success(array_map(
            static fn ($product): array => ProductVo::make($product),
            $this->productQueryService->list()
        ));
    }
}
