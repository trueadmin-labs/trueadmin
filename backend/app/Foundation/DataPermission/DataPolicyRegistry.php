<?php

declare(strict_types=1);

namespace App\Foundation\DataPermission;

use Hyperf\Contract\ConfigInterface;
use Psr\Container\ContainerInterface;
use RuntimeException;
use TrueAdmin\Kernel\Constant\ErrorCode;
use TrueAdmin\Kernel\DataPermission\DataPolicyRule;
use TrueAdmin\Kernel\Exception\BusinessException;

final class DataPolicyRegistry
{
    /** @var null|array<string, array<string, mixed>> */
    private ?array $resources = null;

    /** @var null|array<string, array<string, mixed>> */
    private ?array $strategies = null;

    /** @var array<string, DataPolicyStrategyInterface> */
    private array $strategyInstances = [];

    public function __construct(
        private readonly ContainerInterface $container,
        private readonly ConfigInterface $config,
    ) {
    }

    /**
     * @return array{resources: list<array<string, mixed>>, strategies: list<array<string, mixed>>}
     */
    public function metadata(): array
    {
        return [
            'resources' => array_values($this->resources()),
            'strategies' => array_values($this->strategies()),
        ];
    }

    /**
     * @return list<DataPolicyRule>
     */
    public function allScopeRules(?int $roleId = null): array
    {
        $rules = [];
        foreach ($this->resources() as $resource) {
            foreach ($resource['actions'] as $action) {
                foreach ($resource['strategies'] as $strategy) {
                    $rules[] = new DataPolicyRule(
                        resource: $resource['key'],
                        action: $action['key'],
                        strategy: $strategy,
                        scope: 'all',
                        roleId: $roleId,
                    );
                }
            }
        }

        return $rules;
    }

    public function assertRegisteredAction(string $resource, string $action): void
    {
        $resources = $this->resources();
        if (! isset($resources[$resource])) {
            throw new RuntimeException(sprintf('Data policy resource [%s] is not registered.', $resource));
        }

        $actions = array_column($resources[$resource]['actions'], 'key');
        if (! in_array($action, $actions, true)) {
            throw new RuntimeException(sprintf('Data policy action [%s.%s] is not registered.', $resource, $action));
        }
    }

    /**
     * @param array<string, mixed> $policy
     */
    public function assertPolicyInput(array $policy): void
    {
        $resource = (string) ($policy['resource'] ?? '');
        $action = (string) ($policy['action'] ?? '');
        $strategy = (string) ($policy['strategy'] ?? '');
        $scope = (string) ($policy['scope'] ?? '');

        $resourceConfig = $this->resources()[$resource] ?? null;
        if ($resourceConfig === null) {
            $this->validationError('unsupported_data_policy_resource');
        }

        $actions = array_column($resourceConfig['actions'], 'key');
        if (! in_array($action, $actions, true)) {
            $this->validationError('unsupported_data_policy_action');
        }

        if (! in_array($strategy, $resourceConfig['strategies'], true)) {
            $this->validationError('unsupported_data_policy_strategy');
        }

        $strategyConfig = $this->strategies()[$strategy] ?? null;
        if ($strategyConfig === null) {
            $this->validationError('unsupported_data_policy_strategy');
        }

        $scopes = array_column($strategyConfig['scopes'], 'key');
        if (! in_array($scope, $scopes, true)) {
            $this->validationError('unsupported_data_policy_scope');
        }
    }

    /**
     * @param list<array<string, mixed>> $policies
     */
    public function assertUniquePolicies(array $policies): void
    {
        $seen = [];
        foreach ($policies as $policy) {
            $key = sprintf('%s:%s:%s', (string) ($policy['resource'] ?? ''), (string) ($policy['action'] ?? ''), (string) ($policy['strategy'] ?? ''));
            if (isset($seen[$key])) {
                $this->validationError('duplicate_data_policy');
            }
            $seen[$key] = true;
        }
    }

    public function assertRule(DataPolicyRule $rule, string $resource, string $action): void
    {
        if (! $rule->matches($resource, $action)) {
            throw new RuntimeException(sprintf('Data policy rule [%s.%s] does not match [%s.%s].', $rule->resource, $rule->action, $resource, $action));
        }

        $resourceConfig = $this->resources()[$rule->resource] ?? null;
        if ($resourceConfig === null) {
            throw new RuntimeException(sprintf('Data policy resource [%s] is not registered.', $rule->resource));
        }
        if (! in_array($rule->strategy, $resourceConfig['strategies'], true)) {
            throw new RuntimeException(sprintf('Data policy strategy [%s] is not allowed for resource [%s].', $rule->strategy, $rule->resource));
        }

        $strategy = $this->strategies()[$rule->strategy] ?? null;
        if ($strategy === null) {
            throw new RuntimeException(sprintf('Data policy strategy [%s] is not registered.', $rule->strategy));
        }
        if (! in_array($rule->scope, array_column($strategy['scopes'], 'key'), true)) {
            throw new RuntimeException(sprintf('Data policy scope [%s] is not registered for strategy [%s].', $rule->scope, $rule->strategy));
        }
    }

    public function strategy(string $key): DataPolicyStrategyInterface
    {
        if ($this->strategyInstances === []) {
            $this->loadStrategies();
        }

        if (! isset($this->strategyInstances[$key])) {
            throw new RuntimeException(sprintf('Data policy strategy [%s] is not registered.', $key));
        }

        return $this->strategyInstances[$key];
    }

    /**
     * @return array<string, array<string, mixed>>
     */
    public function resources(): array
    {
        if ($this->resources !== null) {
            return $this->resources;
        }

        $resources = [];
        foreach ((array) $this->config->get('data_policy.resources', []) as $resource) {
            if (! is_array($resource)) {
                continue;
            }
            $key = trim((string) ($resource['key'] ?? ''));
            if ($key === '') {
                throw new RuntimeException('Data policy resource key cannot be empty.');
            }
            if (isset($resources[$key])) {
                throw new RuntimeException(sprintf('Duplicate data policy resource [%s].', $key));
            }

            $actions = $this->normalizeActions($resource['actions'] ?? []);
            $strategies = array_values(array_unique(array_filter(array_map('strval', (array) ($resource['strategies'] ?? [])))));
            if ($actions === [] || $strategies === []) {
                throw new RuntimeException(sprintf('Data policy resource [%s] must define actions and strategies.', $key));
            }
            foreach ($strategies as $strategy) {
                if (! isset($this->strategies()[$strategy])) {
                    throw new RuntimeException(sprintf('Data policy resource [%s] references unregistered strategy [%s].', $key, $strategy));
                }
            }

            $resources[$key] = [
                'key' => $key,
                'label' => (string) ($resource['label'] ?? $key),
                'i18n' => (string) ($resource['i18n'] ?? ''),
                'actions' => $actions,
                'strategies' => $strategies,
                'sort' => (int) ($resource['sort'] ?? 0),
            ];
        }

        uasort($resources, static fn (array $a, array $b): int => [$a['sort'], $a['key']] <=> [$b['sort'], $b['key']]);

        return $this->resources = $resources;
    }

    /**
     * @return array<string, array<string, mixed>>
     */
    public function strategies(): array
    {
        if ($this->strategies !== null) {
            return $this->strategies;
        }

        $this->loadStrategies();
        $strategies = array_map(
            static fn (DataPolicyStrategyInterface $strategy): array => $strategy->metadata(),
            $this->strategyInstances,
        );

        return $this->strategies = $strategies;
    }

    private function loadStrategies(): void
    {
        if ($this->strategyInstances !== []) {
            return;
        }

        foreach ((array) $this->config->get('data_policy.strategies', []) as $strategyClass) {
            $strategy = $this->container->get($strategyClass);
            if (! $strategy instanceof DataPolicyStrategyInterface) {
                throw new RuntimeException(sprintf('Data policy strategy [%s] must implement %s.', (string) $strategyClass, DataPolicyStrategyInterface::class));
            }
            $metadata = $strategy->metadata();
            $key = (string) ($metadata['key'] ?? $strategy->key());
            if ($key !== $strategy->key()) {
                throw new RuntimeException(sprintf('Data policy strategy metadata key [%s] must equal strategy key [%s].', $key, $strategy->key()));
            }
            if (isset($this->strategyInstances[$key])) {
                throw new RuntimeException(sprintf('Duplicate data policy strategy [%s].', $key));
            }
            $this->strategyInstances[$key] = $strategy;
        }
    }

    /**
     * @param mixed $actions
     * @return list<array<string, mixed>>
     */
    private function normalizeActions(mixed $actions): array
    {
        $items = [];
        foreach ((array) $actions as $action) {
            if (is_string($action)) {
                $key = trim($action);
                $items[] = ['key' => $key, 'label' => $key, 'i18n' => ''];
                continue;
            }
            if (! is_array($action)) {
                continue;
            }
            $key = trim((string) ($action['key'] ?? ''));
            if ($key === '') {
                continue;
            }
            $items[] = [
                'key' => $key,
                'label' => (string) ($action['label'] ?? $key),
                'i18n' => (string) ($action['i18n'] ?? ''),
                'sort' => (int) ($action['sort'] ?? count($items)),
            ];
        }

        $seen = [];
        foreach ($items as $item) {
            if (isset($seen[$item['key']])) {
                throw new RuntimeException(sprintf('Duplicate data policy action [%s].', $item['key']));
            }
            $seen[$item['key']] = true;
        }

        usort($items, static fn (array $a, array $b): int => [$a['sort'] ?? 0, $a['key']] <=> [$b['sort'] ?? 0, $b['key']]);

        return $items;
    }

    private function validationError(string $reason): never
    {
        throw new BusinessException(ErrorCode::VALIDATION_FAILED, 422, [
            'field' => 'dataPolicies',
            'reason' => $reason,
        ]);
    }
}
