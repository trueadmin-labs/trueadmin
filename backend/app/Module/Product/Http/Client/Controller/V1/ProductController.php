<?php

declare(strict_types=1);

namespace App\Module\Product\Http\Client\Controller\V1;

use App\Foundation\Http\Controller\ClientController;
use App\Foundation\Support\ApiResponse;
use App\Module\Product\Http\Client\Vo\V1\ProductResource;
use App\Module\Product\Service\ClientProductQueryService;
use App\Module\User\Http\Client\Middleware\ClientActorMiddleware;
use TrueAdmin\Kernel\Context\ActorContext;
use TrueAdmin\Kernel\Http\Attribute\ClientController as ClientRouteController;
use TrueAdmin\Kernel\Http\Attribute\ClientGet;

#[ClientRouteController(path: '/api/v1/client/products', middleware: [ClientActorMiddleware::class])]
final class ProductController extends ClientController
{
    public function __construct(private readonly ClientProductQueryService $productQueryService)
    {
    }

    #[ClientGet('')]
    public function index(): array
    {
        $operator = ActorContext::requireOperator();

        return ApiResponse::success(array_map(
            static fn ($product): array => ProductResource::make($product),
            $this->productQueryService->listForClient((int) $operator->id)
        ));
    }
}
