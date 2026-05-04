<?php

declare(strict_types=1);

namespace App\Module\Product\Library\DataPermission;

use App\Module\Product\Model\Product;

final class ClientProductPolicy
{
    public function canView(int $clientUserId, Product $product): bool
    {
        return $product->isPublished() || $product->ownerUserId === $clientUserId;
    }
}
