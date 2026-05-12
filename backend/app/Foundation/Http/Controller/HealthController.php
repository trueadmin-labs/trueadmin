<?php

declare(strict_types=1);

namespace App\Foundation\Http\Controller;

use TrueAdmin\Kernel\Http\ApiResponse;

final class HealthController extends Controller
{
    public function index(): array
    {
        return ApiResponse::success([
            'name' => 'TrueAdmin Backend',
            'status' => 'ok',
        ]);
    }
}
