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
use App\Module\System\Contract\AdminIdentityProviderInterface;
use App\Module\System\Contract\AdminPermissionProviderInterface;
use Hyperf\Contract\TranslatorLoaderInterface;
use App\Module\System\Service\AdminIdentityService;
use App\Module\System\Service\AdminPermissionService;

use function Hyperf\Support\env;

return [
    TranslatorLoaderInterface::class => App\Foundation\I18n\ModuleTranslationLoaderFactory::class,
    AdminIdentityProviderInterface::class => env('APP_ENV') === 'testing'
        ? HyperfTest\Support\TestingAdminIdentityProvider::class
        : AdminIdentityService::class,
    AdminPermissionProviderInterface::class => env('APP_ENV') === 'testing'
        ? HyperfTest\Support\TestingAdminPermissionProvider::class
        : AdminPermissionService::class,
];
