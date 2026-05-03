<?php

declare(strict_types=1);

use function Hyperf\Support\env;

return [
    'secret' => env('JWT_SECRET', 'change-me'),
    'ttl' => (int) env('JWT_TTL', 7200),
    'issuer' => env('APP_NAME', 'TrueAdmin'),
];
