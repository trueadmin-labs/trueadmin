<?php

declare(strict_types=1);
/**
 * This file is part of Hyperf.
 *
 * @link     https://www.hyperf.io
 * @document https://hyperf.wiki
 * @contact  group@hyperf.io
 * @license  https://github.com/hyperf/hyperf/blob/master/LICENSE
 */

namespace App\Module\System\Dto;

use TrueAdmin\Kernel\Context\Actor;

final readonly class FileUploadContext
{
    public function __construct(
        public string $scope,
        public string $ownerType,
        public string $ownerId,
        public ?int $ownerDeptId,
        public string $category,
        public string $visibility,
    ) {
    }


    public static function system(string $category, string $visibility = 'public'): self
    {
        return new self(
            scope: 'system',
            ownerType: 'system',
            ownerId: 'system',
            ownerDeptId: null,
            category: $category,
            visibility: $visibility,
        );
    }

    public static function fromActor(Actor $actor, string $category, string $visibility = 'public'): self
    {
        return new self(
            scope: $actor->type,
            ownerType: $actor->type . '_user',
            ownerId: (string) $actor->id,
            ownerDeptId: isset($actor->claims['operationDeptId']) ? (int) $actor->claims['operationDeptId'] : null,
            category: $category,
            visibility: $visibility,
        );
    }
}
