<?php

declare(strict_types=1);

namespace App\Module\Product\Service;

use App\Module\Product\Model\Product;
use App\Module\Product\Repository\ProductRepository;
use TrueAdmin\Kernel\DataPermission\Attribute\DataScope;
use TrueAdmin\Kernel\DataPermission\ScopeType;

final class ProductQueryService
{
    public function __construct(private readonly ProductRepository $productRepository)
    {
    }

    /**
     * @return list<Product>
     */
    #[DataScope(onlyTables: ['products'], scopeType: ScopeType::DEPARTMENT_CREATED_BY)]
    public function list(): array
    {
        return $this->productRepository->listForExample();
    }
}
