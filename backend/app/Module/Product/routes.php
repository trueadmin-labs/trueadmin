<?php

declare(strict_types=1);

use App\Module\Auth\Http\Admin\Middleware\AdminAuthMiddleware;
use App\Module\Product\Http\Admin\Controller\ProductController as AdminProductController;
use App\Module\Product\Http\Client\Controller\V1\ProductController as ClientProductController;
use App\Module\User\Http\Client\Middleware\ClientActorMiddleware;
use Hyperf\HttpServer\Router\Router;

Router::addGroup('/api/v1/admin', static function (): void {
    Router::get('/products', AdminProductController::class . '@index', [
        'middleware' => [AdminAuthMiddleware::class],
    ]);
});

Router::addGroup('/api/v1/client', static function (): void {
    Router::get('/products', ClientProductController::class . '@index', [
        'middleware' => [ClientActorMiddleware::class],
    ]);
});
