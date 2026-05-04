<?php

declare(strict_types=1);

namespace App\Module\Product\Http\Admin\Controller;

use App\Foundation\Http\Controller\AdminController;
use App\Foundation\Support\ApiResponse;
use App\Module\Product\Http\Admin\Vo\ProductVo;
use App\Module\Product\Service\ProductQueryService;

final class ProductController extends AdminController
{
    public function __construct(private readonly ProductQueryService $productQueryService)
    {
    }

    public function index(): array
    {
        return ApiResponse::success(array_map(
            static fn ($product): array => ProductVo::make($product),
            $this->productQueryService->list()
        ));
    }
}
