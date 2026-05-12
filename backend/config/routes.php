<?php

declare(strict_types=1);
/**
 * This file is part of Hyperf.
 *
 * @link     https://www.hyperf.io
 * @document https://hyperf.wiki
 * @contact  group@hyperf.io
 * @license  https://github.com/hyperf/hyperf/blob/master/LICENSE
 */
use App\Foundation\Http\Controller\HealthController;
use TrueAdmin\Kernel\Http\Controller\OpenApiController;
use TrueAdmin\Kernel\Http\Routing\AttributeRouteRegistrar;
use Hyperf\Context\ApplicationContext;
use Hyperf\HttpServer\Router\Router;

Router::addRoute(['GET', 'POST', 'HEAD'], '/', HealthController::class . '@index');

ApplicationContext::getContainer()->get(AttributeRouteRegistrar::class)->register();

Router::addGroup('/api/v1/open', static function () {
    Router::get('/openapi.json', OpenApiController::class . '@document');
});

Router::get('/favicon.ico', function () {
    return '';
});

Router::get('/uploads/{path:.+}', function (string $path, Psr\Http\Message\ResponseInterface $response) {
    $root = realpath(BASE_PATH . '/public/uploads');
    $file = realpath(BASE_PATH . '/public/uploads/' . ltrim($path, '/'));
    if ($root === false || $file === false || ! str_starts_with($file, $root . DIRECTORY_SEPARATOR) || ! is_file($file)) {
        return $response->withStatus(404);
    }

    $mimeType = mime_content_type($file) ?: 'application/octet-stream';

    return $response
        ->withHeader('Content-Type', $mimeType)
        ->withBody(new Hyperf\HttpMessage\Stream\SwooleStream((string) file_get_contents($file)));
});
