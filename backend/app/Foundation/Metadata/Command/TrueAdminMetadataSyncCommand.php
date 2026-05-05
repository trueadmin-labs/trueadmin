<?php

declare(strict_types=1);

namespace App\Foundation\Metadata\Command;

use App\Foundation\Metadata\MetadataSynchronizer;
use Hyperf\Command\Command;

final class TrueAdminMetadataSyncCommand extends Command
{
    public function __construct(private readonly MetadataSynchronizer $sync)
    {
        parent::__construct('trueadmin:metadata-sync');
        $this->setDescription('Sync TrueAdmin interface metadata to database');
    }

    public function handle(): int
    {
        $synced = $this->sync->sync();
        $this->info(sprintf(
            'Metadata synced: menus=%d, permissions=%d, buttons=%d',
            $synced['menus'],
            $synced['permissions'],
            $synced['buttons'],
        ));

        return self::SUCCESS;
    }
}
