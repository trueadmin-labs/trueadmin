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
return [
    App\Foundation\Database\Command\TrueAdminMigrationPathsCommand::class,
    App\Foundation\Http\Command\TrueAdminRoutesCommand::class,
    App\Foundation\Metadata\Command\TrueAdminMetadataCommand::class,
    App\Foundation\Metadata\Command\TrueAdminMetadataSyncCommand::class,
    App\Foundation\Metadata\Command\TrueAdminOpenApiCommand::class,
];
