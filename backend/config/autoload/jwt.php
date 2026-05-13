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
use function Hyperf\Support\env;

return [
    'secret' => env('JWT_SECRET', ''),
    'ttl' => (int) env('JWT_TTL', 7200),
    'issuer' => env('APP_NAME', 'TrueAdmin'),
];
