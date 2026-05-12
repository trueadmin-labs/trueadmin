<?php

declare(strict_types=1);

namespace HyperfTest\Cases;

use App\Foundation\Crud\CrudOperator;
use App\Foundation\Repository\AbstractRepository;
use Hyperf\Testing\TestCase;
use ReflectionMethod;
use TrueAdmin\Kernel\Exception\BusinessException;

/**
 * @internal
 * @coversNothing
 */
final class CrudRepositoryFilterSchemaTest extends TestCase
{
    public function testFilterSchemaSupportsDefaultWildcardAndExplicitDisable(): void
    {
        $repository = new class () extends AbstractRepository {
            protected array $filterable = [
                'status' => true,
                'password' => false,
            ];

            protected array|string $defaultFilterOps = '*';

            public function assertFilter(string $field, CrudOperator $operator): void
            {
                $method = new ReflectionMethod(AbstractRepository::class, 'assertFilterable');
                $method->invoke($this, $field, $operator);
            }
        };

        $repository->assertFilter('status', CrudOperator::Like);

        $this->expectException(BusinessException::class);
        $repository->assertFilter('password', CrudOperator::Eq);
    }
}
