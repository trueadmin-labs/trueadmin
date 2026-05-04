<?php

declare(strict_types=1);

namespace App\Module\Product\Http\Admin\Vo;

use App\Module\Product\Model\Product;

final class ProductVo
{
    /**
     * @return array{id:int,name:string,status:string,ownerUserId:int,cover:?string}
     */
    public static function make(Product $product): array
    {
        return [
            'id' => $product->id,
            'name' => $product->name,
            'status' => $product->status,
            'ownerUserId' => $product->ownerUserId,
            'cover' => $product->cover,
        ];
    }
}
