<?php

declare(strict_types=1);

namespace App\Module\Product\Service;

use App\Module\Product\Library\DataPermission\ClientProductPolicy;
use App\Module\Product\Model\Product;
use App\Module\Product\Repository\ProductRepository;

final class ClientProductQueryService
{
    public function __construct(
        private readonly ProductRepository $productRepository,
        private readonly ClientProductPolicy $productPolicy,
    ) {
    }

    /**
     * @return list<Product>
     */
    public function listForClient(int $clientUserId): array
    {
        $visibleProducts = array_filter(
            $this->productRepository->listForExample(),
            fn ($product): bool => $this->productPolicy->canView($clientUserId, $product)
        );

        return array_values($visibleProducts);
    }
}
