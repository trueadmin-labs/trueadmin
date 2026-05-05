<?php

declare(strict_types=1);

namespace App\Foundation\Metadata;

final class OpenApiDocumentBuilder
{
    public function __construct(private readonly InterfaceMetadataScanner $scanner)
    {
    }

    public function build(): array
    {
        $metadata = $this->scanner->scan();
        $permissions = $this->indexByAction($metadata['permissions'] ?? []);
        $openapi = $this->indexByAction($metadata['openapi'] ?? []);
        $paths = [];

        foreach ($metadata['routes'] ?? [] as $route) {
            $action = (string) $route['action'];
            $permission = $permissions[$action] ?? null;
            $spec = $openapi[$action] ?? null;
            $path = $this->normalizePath((string) $route['path']);

            foreach ($route['methods'] as $method) {
                $verb = strtolower((string) $method);
                if ($verb === 'head') {
                    continue;
                }

                $paths[$path][$verb] = $this->operation($route, $permission, $spec);
            }
        }

        ksort($paths);

        return [
            'openapi' => '3.1.0',
            'info' => [
                'title' => 'TrueAdmin API',
                'version' => '0.1.0',
                'description' => 'Generated from TrueAdmin controller attributes. Code annotations provide default interface metadata.',
            ],
            'servers' => [
                ['url' => '/'],
            ],
            'paths' => $paths,
            'components' => [
                'securitySchemes' => [
                    'bearerAuth' => [
                        'type' => 'http',
                        'scheme' => 'bearer',
                        'bearerFormat' => 'JWT',
                    ],
                ],
            ],
        ];
    }

    private function operation(array $route, ?array $permission, ?array $spec): array
    {
        $summary = (string) ($spec['summary'] ?? '');
        if ($summary === '') {
            $summary = (string) ($permission['title'] ?? $route['name'] ?? $route['action']);
        }

        $tags = $spec['tags'] ?? [];
        if ($tags === [] && isset($permission['group']) && $permission['group'] !== '') {
            $tags = [(string) $permission['group']];
        }

        $operation = [
            'operationId' => $this->operationId((string) $route['action'], (string) ($route['name'] ?? '')),
            'summary' => $summary,
            'description' => (string) ($spec['description'] ?? ''),
            'tags' => $tags,
            'responses' => [
                '200' => [
                    'description' => 'OK',
                ],
            ],
            'x-trueadmin' => [
                'action' => $route['action'],
                'permission' => $permission['code'] ?? null,
                'public' => (bool) ($permission['public'] ?? false),
            ],
        ];

        if (! (bool) ($permission['public'] ?? false) && str_starts_with((string) $route['path'], '/api/admin')) {
            $operation['security'] = $spec['security'] ?? [['bearerAuth' => []]];
        }

        if (($spec['deprecated'] ?? false) === true) {
            $operation['deprecated'] = true;
        }

        if (($spec['errorCodes'] ?? []) !== []) {
            $operation['x-error-codes'] = $spec['errorCodes'];
        }

        return $operation;
    }

    private function normalizePath(string $path): string
    {
        return preg_replace('#\{([^}/]+)\}#', '{$1}', $path) ?? $path;
    }

    private function operationId(string $action, string $name): string
    {
        $source = $name !== '' ? $name : str_replace('\\', '_', str_replace('@', '_', $action));
        $id = preg_replace('/[^A-Za-z0-9_]+/', '_', $source) ?? $source;

        return trim($id, '_');
    }

    private function indexByAction(array $items): array
    {
        $indexed = [];
        foreach ($items as $item) {
            $action = (string) ($item['action'] ?? '');
            if ($action !== '') {
                $indexed[$action] = $item;
            }
        }

        return $indexed;
    }
}
