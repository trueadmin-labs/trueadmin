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

$driver = env('DB_DRIVER', 'pgsql');

return [
    'default' => [
        'driver' => $driver,
        'host' => env('DB_HOST', '127.0.0.1'),
        'database' => env('DB_DATABASE', 'trueadmin'),
        'port' => env('DB_PORT', 15432),
        'username' => env('DB_USERNAME', 'trueadmin'),
        'password' => env('DB_PASSWORD', ''),
        'charset' => env('DB_CHARSET', $driver === 'pgsql' ? 'utf8' : 'utf8mb4'),
        'collation' => env('DB_COLLATION', $driver === 'pgsql' ? '' : 'utf8mb4_unicode_ci'),
        'prefix' => env('DB_PREFIX', ''),
        'pool' => [
            'min_connections' => 1,
            'max_connections' => 10,
            'connect_timeout' => 10.0,
            'wait_timeout' => 3.0,
            'heartbeat' => -1,
            'max_idle_time' => (float) env('DB_MAX_IDLE_TIME', 60),
        ],
        'commands' => [
            'gen:model' => [
                'path' => 'app/Module/System/Model',
                'force_casts' => true,
                'inheritance' => 'App\\Foundation\\Database\\Model',
            ],
        ],
    ],
];
