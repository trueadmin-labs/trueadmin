<?php

declare(strict_types=1);

namespace HyperfTest\Cases;

use App\Foundation\Crud\CrudFilterCondition;
use App\Foundation\Crud\CrudOperator;
use App\Foundation\Crud\CrudSortRule;
use App\Foundation\Http\Request\CrudQueryRequest;
use App\Foundation\Repository\AbstractRepository;
use Hyperf\Context\ApplicationContext;
use Hyperf\Testing\TestCase;
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
                $this->assertFilterable($field, $operator);
            }
        };

        $repository->assertFilter('status', CrudOperator::Like);

        $this->expectException(BusinessException::class);
        $repository->assertFilter('password', CrudOperator::Eq);
    }

    public function testRepositoryQuerySchemaCanBeProvidedByMethods(): void
    {
        $repository = new class () extends AbstractRepository {
            public function assertFilter(string $field, CrudOperator $operator): void
            {
                $this->assertFilterable($field, $operator);
            }

            public function sortColumnFor(CrudSortRule $sort): string
            {
                return $this->assertSortable($sort);
            }

            protected function filterable(): array
            {
                return [
                    'status' => true,
                    'username' => ['like'],
                ];
            }

            protected function defaultFilterOps(): array|string
            {
                return ['eq', 'in'];
            }

            protected function sortable(): array
            {
                return ['created_at'];
            }

            protected function sortColumns(): array
            {
                return [
                    'created_at' => 'admin_users.created_at',
                ];
            }
        };

        $repository->assertFilter('status', CrudOperator::Eq);
        $repository->assertFilter('username', CrudOperator::Like);
        $this->assertSame('admin_users.created_at', $repository->sortColumnFor(CrudSortRule::desc('created_at')));

        $this->expectException(BusinessException::class);
        $repository->assertFilter('status', CrudOperator::Like);
    }

    public function testCrudQueryRequestProtocolHooksCanBeCustomized(): void
    {
        $request = new class (ApplicationContext::getContainer()) extends CrudQueryRequest {
            /**
             * @var list<string>
             */
            protected const ROOT_KEYS = ['page', 'pageSize', 'keyword', 'filters', 'sorts', 'params', 'view'];

            public function exposedRootKeys(): array
            {
                return $this->rootKeys();
            }

            public function exposedNormalize(array $data): array
            {
                return $this->normalize($data);
            }

            protected function fieldPattern(): string
            {
                return '/^[A-Za-z0-9_.:-]+$/';
            }
        };

        $normalized = $request->exposedNormalize([
            'filters' => [
                ['field' => 'plugin:status', 'op' => 'eq', 'value' => 'enabled'],
            ],
            'sorts' => [
                ['field' => 'plugin:created_at', 'order' => 'desc', 'nulls' => 'last'],
            ],
        ]);

        $this->assertContains('view', $request->exposedRootKeys());
        $this->assertInstanceOf(CrudFilterCondition::class, $normalized['filters'][0]);
        $this->assertSame('plugin:status', $normalized['filters'][0]->field);
        $this->assertSame('plugin:created_at', $normalized['sorts'][0]->field);
        $this->assertSame('last', $normalized['sorts'][0]->nulls);
    }
}
