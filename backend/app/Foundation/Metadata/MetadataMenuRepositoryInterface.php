<?php

declare(strict_types=1);

namespace App\Foundation\Metadata;

interface MetadataMenuRepositoryInterface
{
    /**
     * @param array<string, mixed> $menu
     */
    public function upsertMenu(array $menu, int $parentId, string $syncedAt): int;
}
