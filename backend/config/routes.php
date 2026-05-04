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
use App\Foundation\Http\Routing\ModuleRouteRegistrar;
use App\Foundation\Http\Controller\HealthController;
use App\Foundation\Http\Controller\OpenApiController;
use Hyperf\Context\ApplicationContext;
use Hyperf\HttpServer\Router\Router;

Router::addRoute(['GET', 'POST', 'HEAD'], '/', HealthController::class . '@index');

ApplicationContext::getContainer()->get(ModuleRouteRegistrar::class)->register();

Router::addGroup('/api/v1/open', static function () {
    Router::get('/openapi.json', OpenApiController::class . '@document');
});

Router::get('/favicon.ico', function () {
    return '';
});
