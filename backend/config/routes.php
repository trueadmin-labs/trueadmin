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
use Hyperf\HttpServer\Router\Router;

Router::addRoute(['GET', 'POST', 'HEAD'], '/', 'App\Kernel\Http\Controller\HealthController@index');

Router::addGroup('/api/v1/admin', static function () {
    Router::post('/auth/login', 'App\Module\Auth\Controller\AuthController@login');
    Router::post('/auth/logout', 'App\Module\Auth\Controller\AuthController@logout', ['middleware' => [App\Kernel\Http\Middleware\AuthMiddleware::class]]);
    Router::get('/auth/me', 'App\Module\Auth\Controller\AuthController@me', ['middleware' => [App\Kernel\Http\Middleware\AuthMiddleware::class]]);
});

Router::addGroup('/api/v1/client', static function () {
    // Reserved for future user-facing applications.
});

Router::addGroup('/api/v1/open', static function () {
    Router::get('/openapi.json', 'App\Kernel\Http\Controller\OpenApiController@document');
});

Router::get('/favicon.ico', function () {
    return '';
});
