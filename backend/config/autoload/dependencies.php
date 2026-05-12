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
use TrueAdmin\Kernel\Database\Seeder\NamespacedSeed;
use TrueAdmin\Kernel\Http\PermissionProviderInterface;
use TrueAdmin\Kernel\DataPermission\DataPolicyProviderInterface;
use TrueAdmin\Kernel\Metadata\MetadataMenuRepositoryInterface;
use App\Foundation\DataPermission\Organization\OrganizationScopeProviderInterface;
use App\Module\System\Contract\AdminIdentityProviderInterface;
use App\Module\System\Repository\AdminMenuRepository;
use App\Module\System\Service\DataPermission\AdminRoleDataPolicyProvider;
use App\Module\System\Service\DataPermission\SystemOrganizationScopeProvider;
use App\Module\System\Service\AdminIdentityService;
use App\Module\System\Service\AdminPermissionService;
use Hyperf\Contract\TranslatorLoaderInterface;
use Hyperf\Database\Seeders\Seed;

use function Hyperf\Support\env;

return [
    Seed::class => NamespacedSeed::class,
    TranslatorLoaderInterface::class => TrueAdmin\Kernel\I18n\ModuleTranslationLoaderFactory::class,
    AdminIdentityProviderInterface::class => env('APP_ENV') === 'testing'
        ? HyperfTest\Support\TestingAdminIdentityProvider::class
        : AdminIdentityService::class,
    PermissionProviderInterface::class => env('APP_ENV') === 'testing'
        ? HyperfTest\Support\TestingAdminPermissionProvider::class
        : AdminPermissionService::class,
    DataPolicyProviderInterface::class => AdminRoleDataPolicyProvider::class,
    OrganizationScopeProviderInterface::class => SystemOrganizationScopeProvider::class,
    MetadataMenuRepositoryInterface::class => AdminMenuRepository::class,
];
