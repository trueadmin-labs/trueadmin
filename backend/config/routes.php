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

Router::addRoute(['GET', 'POST', 'HEAD'], '/', 'App\Controller\IndexController@index');

Router::addGroup('/api/v1/admin', static function () {
    Router::post('/auth/login', 'App\Controller\Auth\AuthController@login');
    Router::post('/auth/logout', 'App\Controller\Auth\AuthController@logout', ['middleware' => [App\Middleware\AuthMiddleware::class]]);
    Router::get('/auth/me', 'App\Controller\Auth\AuthController@me', ['middleware' => [App\Middleware\AuthMiddleware::class]]);
});

Router::addGroup('/api/v1/client', static function () {
    // Reserved for future user-facing applications.
});

Router::addGroup('/api/v1/open', static function () {
    Router::get('/openapi.json', 'App\Controller\OpenApi\OpenApiController@document');
});

Router::get('/favicon.ico', function () {
    return '';
});
