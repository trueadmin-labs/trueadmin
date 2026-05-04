<?php

declare(strict_types=1);

namespace App\Module\Product\Model;

final class Product
{
    public function __construct(
        public readonly int $id,
        public readonly string $name,
        public readonly string $status,
        public readonly int $ownerUserId,
        public readonly ?string $cover = null,
    ) {
    }

    public function isPublished(): bool
    {
        return $this->status === 'published';
    }
}
