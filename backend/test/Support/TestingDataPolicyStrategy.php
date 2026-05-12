<?php

declare(strict_types=1);

namespace HyperfTest\Support;

use TrueAdmin\Kernel\DataPermission\DataPolicyStrategyInterface;
use Hyperf\Database\Model\Builder as ModelBuilder;
use Hyperf\Database\Query\Builder as QueryBuilder;
use TrueAdmin\Kernel\Context\Actor;
use TrueAdmin\Kernel\DataPermission\DataPolicyRule;
use TrueAdmin\Kernel\DataPermission\DataPolicyTarget;

final class TestingDataPolicyStrategy implements DataPolicyStrategyInterface
{
    public function key(): string
    {
        return 'testing_data_policy';
    }

    /**
     * @return array<string, mixed>
     */
    public function metadata(): array
    {
        return [
            'key' => $this->key(),
            'label' => 'Testing Data Policy',
            'i18n' => 'testing.dataPolicy.strategy',
            'sort' => 9900,
            'scopes' => [
                ['key' => 'all', 'label' => 'All', 'i18n' => 'testing.dataPolicy.scope.all'],
            ],
        ];
    }

    public function apply(ModelBuilder|QueryBuilder $query, Actor $actor, DataPolicyRule $rule, DataPolicyTarget $target): void
    {
    }

    public function contains(DataPolicyRule $parent, DataPolicyRule $child): bool
    {
        return $parent->scope === 'all' || $parent->scope === $child->scope;
    }
}
