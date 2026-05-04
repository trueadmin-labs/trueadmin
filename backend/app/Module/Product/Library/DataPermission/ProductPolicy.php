<?php

declare(strict_types=1);

namespace App\Module\Product\Library\DataPermission;

use App\Module\Auth\Http\Admin\Vo\AuthUser;
use App\Module\Product\Model\Product;

final class ProductPolicy
{
    public function canView(AuthUser $adminUser, Product $product): bool
    {
        return in_array('product:view', $adminUser->permissions, true)
            || in_array('*', $adminUser->permissions, true);
    }
}
