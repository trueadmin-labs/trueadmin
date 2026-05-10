<?php

declare(strict_types=1);

namespace App\Foundation\Metadata;

use App\Foundation\Http\Routing\AttributeRouteRegistrar;
use App\Foundation\Plugin\PluginRepository;
use Hyperf\Di\Annotation\AnnotationCollector;
use TrueAdmin\Kernel\Http\Attribute\Menu;
use TrueAdmin\Kernel\Http\Attribute\MenuButton;
use TrueAdmin\Kernel\Http\Attribute\OpenApi;
use TrueAdmin\Kernel\Http\Attribute\Permission;

final class InterfaceMetadataScanner
{
    private const MENU_TYPES = ['directory', 'menu', 'button', 'link'];

    private const MENU_STATUSES = ['enabled', 'disabled'];

    private const LINK_OPEN_MODES = ['blank', 'self', 'iframe'];

    /**
     * @var null|list<array<string, mixed>>
     */
    private ?array $resourceMenus = null;

    public function __construct(
        private readonly AttributeRouteRegistrar $routes,
        private readonly PluginRepository $plugins,
    )
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
        foreach ($this->resourceMenus() as $menu) {
            $this->appendMenu($menus, $menu);
        }

        foreach (AnnotationCollector::getClassesByAnnotation(Menu::class) as $class => $annotation) {
            if (! $annotation instanceof Menu) {
                continue;
            }

            $this->appendMenu($menus, [
                'class' => $class,
                'code' => $annotation->code,
                'title' => $annotation->title,
                'path' => $annotation->path,
                'parent' => $annotation->parent,
                'permission' => $annotation->permission,
                'icon' => $annotation->icon,
                'sort' => $annotation->sort,
                'type' => $annotation->type,
                'status' => $annotation->status,
            ]);
        }

        uasort($menus, static fn (array $a, array $b): int => [$a['sort'], $a['code']] <=> [$b['sort'], $b['code']]);

        return array_values($menus);
    }

    /**
     * @param array<string, array<string, mixed>> $menus
     * @param array<string, mixed> $menu
     */
    private function appendMenu(array &$menus, array $menu): void
    {
        $normalized = $this->normalizeMenu($menu);
        $code = $normalized['code'];
        if (isset($menus[$code])) {
            throw new \RuntimeException(sprintf('Duplicate menu code [%s] found while scanning interface metadata.', $code));
        }

        $menus[$code] = $normalized;
    }

    /**
     * @param array<string, mixed> $menu
     * @return array<string, mixed>
     */
    private function normalizeMenu(array $menu): array
    {
        $code = isset($menu['code']) ? trim((string) $menu['code']) : '';
        if ($code === '') {
            throw new \RuntimeException('Menu code is required while scanning interface metadata.');
        }

        if (preg_match('/^[A-Za-z][A-Za-z0-9_.:-]*$/', $code) !== 1) {
            throw new \RuntimeException(sprintf('Menu [%s] has an invalid code.', $code));
        }

        $type = isset($menu['type']) && (string) $menu['type'] !== '' ? (string) $menu['type'] : 'menu';
        if (! in_array($type, self::MENU_TYPES, true)) {
            throw new \RuntimeException(sprintf('Menu [%s] has an unsupported type [%s].', $code, $type));
        }

        $status = isset($menu['status']) && (string) $menu['status'] !== '' ? (string) $menu['status'] : 'enabled';
        if (! in_array($status, self::MENU_STATUSES, true)) {
            throw new \RuntimeException(sprintf('Menu [%s] has an unsupported status [%s].', $code, $status));
        }

        $path = isset($menu['path']) ? trim((string) $menu['path']) : '';
        $url = isset($menu['url']) ? trim((string) $menu['url']) : '';
        $openMode = (string) ($menu['openMode'] ?? '');
        $showLinkHeader = $this->normalizeBoolean($menu['showLinkHeader'] ?? false);

        if ($type === 'menu' && $path === '') {
            throw new \RuntimeException(sprintf('Menu [%s] with type [menu] must define a path.', $code));
        }

        if ($type === 'link') {
            if ($url === '') {
                throw new \RuntimeException(sprintf('Menu [%s] with type [link] must define a url.', $code));
            }
            $scheme = strtolower((string) parse_url($url, PHP_URL_SCHEME));
            if (! in_array($scheme, ['http', 'https'], true) || filter_var($url, FILTER_VALIDATE_URL) === false) {
                throw new \RuntimeException(sprintf('Menu [%s] has an invalid link url.', $code));
            }
            $openMode = $openMode !== '' ? $openMode : 'blank';
            if (! in_array($openMode, self::LINK_OPEN_MODES, true)) {
                throw new \RuntimeException(sprintf('Menu [%s] has an unsupported link open mode [%s].', $code, $openMode));
            }
        } else {
            $url = '';
            $openMode = '';
            $showLinkHeader = false;
        }

        return [
            'class' => isset($menu['class']) ? (string) $menu['class'] : '',
            'code' => $code,
            'title' => isset($menu['title']) && (string) $menu['title'] !== '' ? (string) $menu['title'] : $code,
            'path' => $path,
            'parent' => isset($menu['parent']) ? trim((string) $menu['parent']) : '',
            'permission' => isset($menu['permission']) ? (string) $menu['permission'] : '',
            'icon' => isset($menu['icon']) ? (string) $menu['icon'] : '',
            'sort' => isset($menu['sort']) ? (int) $menu['sort'] : 0,
            'type' => $type,
            'status' => $status,
            'url' => $url,
            'openMode' => $openMode,
            'showLinkHeader' => $showLinkHeader,
        ];
    }

    /**
     * @return list<array<string, mixed>>
     */
    private function resourceMenus(): array
    {
        if ($this->resourceMenus !== null) {
            return $this->resourceMenus;
        }

        $menus = [];
        foreach ($this->menuResourceFiles() as $file) {
            $items = require $file;
            if (! is_array($items)) {
                throw new \RuntimeException(sprintf('Menu resource file [%s] must return an array.', $file));
            }

            foreach ($items as $item) {
                if (! is_array($item)) {
                    throw new \RuntimeException(sprintf('Menu resource file [%s] contains an invalid menu item.', $file));
                }

                $menus[] = $item;
            }
        }

        return $this->resourceMenus = $menus;
    }

    private function normalizeBoolean(mixed $value): bool
    {
        return filter_var($value, FILTER_VALIDATE_BOOLEAN, FILTER_NULL_ON_FAILURE) ?? false;
    }

    /**
     * @return list<string>
     */
    private function menuResourceFiles(): array
    {
        $files = [
            ...(glob(BASE_PATH . '/app/Module/*/resources/menus.php') ?: []),
            ...$this->plugins->menuResourceFiles(),
        ];

        sort($files);

        return array_values(array_unique($files));
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

        foreach ($this->resourceMenus() as $menu) {
            $permission = isset($menu['permission']) ? (string) $menu['permission'] : '';
            if ($permission !== '') {
                $codes[$permission] = true;
            }
        }

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
