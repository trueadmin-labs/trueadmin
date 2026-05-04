<?php

declare(strict_types=1);

namespace App\Module\Product\Http\Client\Vo\V1;

use App\Module\Product\Model\Product;

final class ProductResource
{
    /**
     * @return array{id:int,name:string,cover:?string}
     */
    public static function make(Product $product): array
    {
        return [
            'id' => $product->id,
            'name' => $product->name,
            'cover' => $product->cover,
        ];
    }
}
