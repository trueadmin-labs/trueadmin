<?php

declare(strict_types=1);

namespace App\Module\User\Http\Client\Controller\V1;

use App\Foundation\Http\Controller\ClientController;
use App\Foundation\Support\ApiResponse;
use App\Module\User\Http\Client\Middleware\ClientActorMiddleware;
use App\Module\User\Service\ProfileService;
use TrueAdmin\Kernel\Http\Attribute\ClientController as ClientRouteController;
use TrueAdmin\Kernel\Http\Attribute\ClientGet;

#[ClientRouteController(path: '/api/v1/client/profile', middleware: [ClientActorMiddleware::class])]
final class ProfileController extends ClientController
{
    public function __construct(private readonly ProfileService $profileService)
    {
    }

    #[ClientGet('')]
    public function show(): array
    {
        return ApiResponse::success($this->profileService->currentProfile());
    }
}
