<?php

declare(strict_types=1);

namespace App\Foundation\Metadata;

use App\Foundation\Http\Routing\AttributeRouteRegistrar;
use Hyperf\Di\Annotation\AnnotationCollector;
use TrueAdmin\Kernel\Http\Attribute\MenuButton;
use TrueAdmin\Kernel\Http\Attribute\OpenApi;
use TrueAdmin\Kernel\Http\Attribute\Permission;

final class InterfaceMetadataScanner
{
    public function __construct(private readonly AttributeRouteRegistrar $routes)
    {
    }

    public function scan(): array
    {
        return [
            'routes' => $this->routes->routes(),
            'permissions' => $this->permissions(),
            'menuButtons' => $this->menuButtons(),
            'openapi' => $this->openapi(),
        ];
    }

    private function permissions(): array
    {
        return array_values(array_map(
            static fn (array $item): array => [
                'class' => $item['class'],
                'method' => $item['method'] ?? null,
                'code' => $item['annotation']->code,
                'title' => $item['annotation']->title,
                'group' => $item['annotation']->group,
                'public' => $item['annotation']->public,
            ],
            [
                ...array_map(
                    static fn (string $class, Permission $annotation): array => ['class' => $class, 'annotation' => $annotation],
                    array_keys(AnnotationCollector::getClassesByAnnotation(Permission::class)),
                    array_values(AnnotationCollector::getClassesByAnnotation(Permission::class)),
                ),
                ...AnnotationCollector::getMethodsByAnnotation(Permission::class),
            ],
        ));
    }

    private function menuButtons(): array
    {
        return array_values(array_map(
            static fn (array $item): array => [
                'class' => $item['class'],
                'method' => $item['method'],
                'code' => $item['annotation']->code,
                'title' => $item['annotation']->title,
                'parent' => $item['annotation']->parent,
                'permission' => $item['annotation']->permission,
                'sort' => $item['annotation']->sort,
            ],
            AnnotationCollector::getMethodsByAnnotation(MenuButton::class),
        ));
    }

    private function openapi(): array
    {
        return array_values(array_map(
            static fn (array $item): array => [
                'class' => $item['class'],
                'method' => $item['method'] ?? null,
                'summary' => $item['annotation']->summary,
                'description' => $item['annotation']->description,
                'request' => $item['annotation']->request,
                'response' => $item['annotation']->response,
                'tags' => $item['annotation']->tags,
                'security' => $item['annotation']->security,
                'errorCodes' => $item['annotation']->errorCodes,
                'deprecated' => $item['annotation']->deprecated,
            ],
            [
                ...array_map(
                    static fn (string $class, OpenApi $annotation): array => ['class' => $class, 'annotation' => $annotation],
                    array_keys(AnnotationCollector::getClassesByAnnotation(OpenApi::class)),
                    array_values(AnnotationCollector::getClassesByAnnotation(OpenApi::class)),
                ),
                ...AnnotationCollector::getMethodsByAnnotation(OpenApi::class),
            ],
        ));
    }
}
