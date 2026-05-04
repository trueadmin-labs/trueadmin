<?php

declare(strict_types=1);

namespace App\Module\Product\Repository;

use App\Module\Product\Model\Product;
use TrueAdmin\Kernel\DataPermission\Context as DataPermissionContext;
use TrueAdmin\Kernel\DataPermission\ScopeType;
use TrueAdmin\Kernel\Context\ActorContext;

final class ProductRepository
{
    /**
     * This in-memory example will be replaced by database models after migrations land.
     *
     * @return list<Product>
     */
    public function listForExample(): array
    {
        return $this->applyDataScope([
            new Product(1, 'TrueAdmin Starter License', 'published', 10001, null),
            new Product(2, 'Draft Internal Product', 'draft', 10002, null),
        ]);
    }

    public function findForExample(int $id): ?Product
    {
        foreach ($this->listForExample() as $product) {
            if ($product->id === $id) {
                return $product;
            }
        }

        return null;
    }

    /**
     * @param list<Product> $products
     * @return list<Product>
     */
    private function applyDataScope(array $products): array
    {
        $scope = DataPermissionContext::get();
        if ($scope === null || ($scope['scopeType'] ?? null) === ScopeType::ALL->value) {
            return $products;
        }

        $operator = ActorContext::operator();
        if ($operator === null || $operator->type !== 'admin') {
            return [];
        }

        if (in_array('*', $operator->claims['permissions'] ?? [], true)) {
            return $products;
        }

        return match ($scope['scopeType'] ?? null) {
            ScopeType::SELF->value,
            ScopeType::CREATED_BY->value,
            ScopeType::DEPARTMENT_CREATED_BY->value => array_values(array_filter(
                $products,
                static fn (Product $product): bool => $product->ownerUserId === (int) $operator->id
            )),
            default => $products,
        };
    }
}
