<?php

declare(strict_types=1);

namespace TrueAdmin\Kernel\DataPermission;

final readonly class DataPolicyRule
{
    /**
     * @param array<string, mixed> $config
     */
    public function __construct(
        public string $resource,
        public string $action,
        public string $strategy,
        public string $scope,
        public string $effect = 'allow',
        public array $config = [],
        public ?int $roleId = null,
        public int $sort = 0,
    ) {
    }

    public function matches(string $resource, string $action): bool
    {
        return $this->resource === $resource && $this->action === $action;
    }

    public function isAllow(): bool
    {
        return $this->effect === 'allow';
    }

    public function isDeny(): bool
    {
        return $this->effect === 'deny';
    }

    public function isAllScope(): bool
    {
        return $this->scope === 'all';
    }
}
