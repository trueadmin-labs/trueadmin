<?php

declare(strict_types=1);

use App\Module\User\Http\Client\Controller\V1\ProfileController;
use App\Module\User\Http\Client\Middleware\ClientActorMiddleware;
use Hyperf\HttpServer\Router\Router;

Router::addGroup('/api/v1/client', static function (): void {
    Router::get('/profile', ProfileController::class . '@show', [
        'middleware' => [ClientActorMiddleware::class],
    ]);
});
