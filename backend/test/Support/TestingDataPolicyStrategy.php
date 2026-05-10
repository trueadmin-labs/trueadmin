<?php

declare(strict_types=1);

namespace HyperfTest\Support;

use App\Foundation\DataPermission\DataPolicyStrategyInterface;
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

    public function apply(mixed $query, Actor $actor, DataPolicyRule $rule, DataPolicyTarget $target): void
    {
    }

    public function contains(DataPolicyRule $parent, DataPolicyRule $child): bool
    {
        return $parent->scope === 'all' || $parent->scope === $child->scope;
    }
}
