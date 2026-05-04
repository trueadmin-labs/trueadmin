<?php

declare(strict_types=1);

use App\Module\Auth\Http\Admin\Controller\PassportController;
use App\Module\Auth\Http\Admin\Middleware\AdminAuthMiddleware;
use Hyperf\HttpServer\Router\Router;

Router::addGroup('/api/v1/admin', static function (): void {
    Router::post('/auth/login', PassportController::class . '@login');
    Router::post('/auth/logout', PassportController::class . '@logout', [
        'middleware' => [AdminAuthMiddleware::class],
    ]);
    Router::get('/auth/me', PassportController::class . '@me', [
        'middleware' => [AdminAuthMiddleware::class],
    ]);
});
