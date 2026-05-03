<?php

declare(strict_types=1);

namespace App\Kernel\Support;

use App\Kernel\Constant\ErrorCode;

final class ApiResponse
{
    public static function success(mixed $data = null, string $message = 'success'): array
    {
        return [
            'code' => ErrorCode::SUCCESS,
            'message' => $message,
            'data' => $data,
        ];
    }

    public static function fail(int $code, string $message, mixed $data = null): array
    {
        return [
            'code' => $code,
            'message' => $message,
            'data' => $data,
        ];
    }
}
