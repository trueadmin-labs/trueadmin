<?php

declare(strict_types=1);

namespace App\Foundation\DataPermission;

use Hyperf\Database\Model\Builder as ModelBuilder;
use Hyperf\Database\Query\Builder as QueryBuilder;
use TrueAdmin\Kernel\Context\Actor;
use TrueAdmin\Kernel\DataPermission\DataPolicyRule;
use TrueAdmin\Kernel\DataPermission\DataPolicyTarget;

interface DataPolicyStrategyInterface
{
    public function key(): string;

    /**
     * @return array<string, mixed>
     */
    public function metadata(): array;

    public function apply(ModelBuilder|QueryBuilder $query, Actor $actor, DataPolicyRule $rule, DataPolicyTarget $target): void;

    public function contains(DataPolicyRule $parent, DataPolicyRule $child): bool;
}
