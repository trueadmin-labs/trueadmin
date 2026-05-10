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
use Hyperf\Filesystem\Adapter\AliyunOssAdapterFactory;
use Hyperf\Filesystem\Adapter\LocalAdapterFactory;

use function Hyperf\Support\env;

$disk = (string) env('FILE_DISK', 'local');

return [
    'default' => $disk,
    'max_size' => (int) env('FILE_MAX_SIZE', 20 * 1024 * 1024),
    'remote' => [
        'connect_timeout' => (float) env('FILE_REMOTE_CONNECT_TIMEOUT', 3),
        'timeout' => (float) env('FILE_REMOTE_TIMEOUT', 15),
        'max_redirects' => (int) env('FILE_REMOTE_MAX_REDIRECTS', 3),
    ],
    'storage' => [
        'local' => [
            'driver' => LocalAdapterFactory::class,
            'root' => BASE_PATH . '/public/uploads',
            'public_url' => (string) env('FILE_LOCAL_PUBLIC_URL', '/uploads'),
        ],
        'oss' => [
            'driver' => AliyunOssAdapterFactory::class,
            'accessId' => env('OSS_ACCESS_ID') ?: env('OSS_ACCESS_KEY_ID'),
            'accessSecret' => env('OSS_ACCESS_SECRET') ?: env('OSS_ACCESS_KEY_SECRET'),
            'bucket' => env('OSS_BUCKET'),
            'endpoint' => env('OSS_ENDPOINT'),
            'public_url' => env('OSS_PUBLIC_URL'),
            'timeout' => (int) env('OSS_UPLOAD_EXPIRES', 900),
            'use_ssl' => (bool) env('OSS_USE_SSL', true),
            'isCName' => (bool) env('OSS_IS_CNAME', false),
        ],
    ],
];
