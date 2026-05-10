<?php

declare(strict_types=1);

namespace App\Foundation\Contract;

use TrueAdmin\Kernel\Context\Actor;

interface DataPolicyProviderInterface
{
    /**
     * @return list<\TrueAdmin\Kernel\DataPermission\DataPolicyRule>
     */
    public function policiesFor(Actor $actor, string $resource, string $action): array;
}
