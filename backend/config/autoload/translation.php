<?php

declare(strict_types=1);

use function Hyperf\Support\env;

return [
    'locale' => env('APP_LOCALE', 'zh_CN'),
    'fallback_locale' => env('APP_FALLBACK_LOCALE', 'en'),
    'supported_locales' => ['zh_CN', 'en'],
    'locale_aliases' => [
        'zh' => 'zh_CN',
        'en' => 'en',
    ],
    'paths' => [
        ...glob(BASE_PATH . '/app/Module/*/resources/lang') ?: [],
        BASE_PATH . '/resources/lang',
    ],
];
