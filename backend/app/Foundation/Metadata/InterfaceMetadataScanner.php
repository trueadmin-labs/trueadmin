<?php

declare(strict_types=1);

namespace App\Foundation\Metadata;

use App\Foundation\Http\Routing\AttributeRouteRegistrar;
use Hyperf\Di\Annotation\AnnotationCollector;
use TrueAdmin\Kernel\Http\Attribute\Menu;
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
            'menus' => $this->menus(),
            'permissions' => $this->permissions(),
            'permissionRules' => $this->permissionRules(),
            'menuButtons' => $this->menuButtons(),
            'openapi' => $this->openapi(),
        ];
    }

    private function menus(): array
    {
        $menus = [];
        foreach (AnnotationCollector::getClassesByAnnotation(Menu::class) as $class => $annotation) {
            if (! $annotation instanceof Menu) {
                continue;
            }

            $menus[$annotation->code] = [
                'class' => $class,
                'code' => $annotation->code,
                'title' => $annotation->title,
                'path' => $annotation->path,
                'parent' => $annotation->parent,
                'permission' => $annotation->permission,
                'icon' => $annotation->icon,
                'sort' => $annotation->sort,
                'type' => $annotation->type,
            ];
        }

        uasort($menus, static fn (array $a, array $b): int => [$a['sort'], $a['code']] <=> [$b['sort'], $b['code']]);

        return array_values($menus);
    }

    private function permissions(): array
    {
        $permissions = [];
        $routes = $this->routeIndex();
        $definedCodes = $this->definedPermissionCodes();

        foreach ($this->permissionItems() as $item) {
            $annotation = $item['annotation'];
            if (! $annotation instanceof Permission) {
                continue;
            }

            foreach ($annotation->codes() as $code) {
                if (! isset($definedCodes[$code])) {
                    throw new \RuntimeException(sprintf('Permission [%s] is referenced by a rule but is not defined as an atomic permission.', $code));
                }
            }

            if ($annotation->mode() !== 'single') {
                continue;
            }

            $class = (string) $item['class'];
            $method = isset($item['method']) ? (string) $item['method'] : null;
            $action = $method === null ? null : $class . '@' . $method;
            $menu = AnnotationCollector::getClassAnnotation($class, Menu::class);

            $permissions[$annotation->code] ??= [
                'class' => $class,
                'method' => $method,
                'action' => $action,
                'route' => $action === null ? null : ($routes[$action] ?? null),
                'menu' => $menu instanceof Menu ? $menu->code : '',
                'code' => $annotation->code,
                'title' => $annotation->title,
                'group' => $annotation->group,
                'public' => $annotation->public,
            ];
        }

        return array_values($permissions);
    }

    private function permissionRules(): array
    {
        $rules = [];
        $routes = $this->routeIndex();

        foreach ($this->permissionItems() as $item) {
            $annotation = $item['annotation'];
            if (! $annotation instanceof Permission) {
                continue;
            }

            $class = (string) $item['class'];
            $method = isset($item['method']) ? (string) $item['method'] : null;
            $action = $method === null ? null : $class . '@' . $method;
            $menu = AnnotationCollector::getClassAnnotation($class, Menu::class);

            $rules[] = [
                'class' => $class,
                'method' => $method,
                'action' => $action,
                'route' => $action === null ? null : ($routes[$action] ?? null),
                'menu' => $menu instanceof Menu ? $menu->code : '',
                'code' => $annotation->mode() === 'single' ? $annotation->code : null,
                'mode' => $annotation->mode(),
                'codes' => $annotation->codes(),
                'title' => $annotation->title,
                'group' => $annotation->group,
                'public' => $annotation->public,
            ];
        }

        return $rules;
    }

    private function definedPermissionCodes(): array
    {
        $codes = [];

        foreach (AnnotationCollector::getClassesByAnnotation(Menu::class) as $annotation) {
            if ($annotation instanceof Menu && $annotation->permission !== '') {
                $codes[$annotation->permission] = true;
            }
        }

        foreach (AnnotationCollector::getMethodsByAnnotation(MenuButton::class) as $item) {
            $annotation = $item['annotation'];
            if (! $annotation instanceof MenuButton) {
                continue;
            }

            $code = $annotation->permission !== '' ? $annotation->permission : $annotation->code;
            if ($code !== '') {
                $codes[$code] = true;
            }
        }

        foreach ($this->permissionItems() as $item) {
            $annotation = $item['annotation'];
            if ($annotation instanceof Permission && $annotation->mode() === 'single') {
                $codes[$annotation->code] = true;
            }
        }

        return $codes;
    }

    private function permissionItems(): array
    {
        return [
            ...array_map(
                static fn (string $class, Permission $annotation): array => ['class' => $class, 'annotation' => $annotation],
                array_keys(AnnotationCollector::getClassesByAnnotation(Permission::class)),
                array_values(AnnotationCollector::getClassesByAnnotation(Permission::class)),
            ),
            ...AnnotationCollector::getMethodsByAnnotation(Permission::class),
        ];
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
                'action' => isset($item['method']) ? $item['class'] . '@' . $item['method'] : null,
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

    private function routeIndex(): array
    {
        $routes = [];
        foreach ($this->routes->routes() as $route) {
            $routes[$route['action']] = $route;
        }

        return $routes;
    }
}
