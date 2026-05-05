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
use App\Foundation\Database\Seeder\NamespacedSeed;
use App\Foundation\Contract\AdminPermissionProviderInterface;
use App\Foundation\Metadata\MetadataMenuRepositoryInterface;
use App\Module\System\Contract\AdminIdentityProviderInterface;
use App\Module\System\Repository\AdminMenuRepository;
use App\Module\System\Service\AdminIdentityService;
use App\Module\System\Service\AdminPermissionService;
use Hyperf\Contract\TranslatorLoaderInterface;
use Hyperf\Database\Seeders\Seed;

use function Hyperf\Support\env;

return [
    Seed::class => NamespacedSeed::class,
    TranslatorLoaderInterface::class => App\Foundation\I18n\ModuleTranslationLoaderFactory::class,
    AdminIdentityProviderInterface::class => env('APP_ENV') === 'testing'
        ? HyperfTest\Support\TestingAdminIdentityProvider::class
        : AdminIdentityService::class,
    AdminPermissionProviderInterface::class => env('APP_ENV') === 'testing'
        ? HyperfTest\Support\TestingAdminPermissionProvider::class
        : AdminPermissionService::class,
    MetadataMenuRepositoryInterface::class => AdminMenuRepository::class,
];
