<?php

declare(strict_types=1);

namespace App\Module\System\Repository\Notification;

use App\Foundation\Repository\AbstractRepository;
use App\Module\System\Model\AdminAnnouncementRead;

final class AdminAnnouncementReadRepository extends AbstractRepository
{
    protected ?string $modelClass = AdminAnnouncementRead::class;

    public function findForReceiver(int $announcementId, int $adminId): ?AdminAnnouncementRead
    {
        return AdminAnnouncementRead::query()
            ->where('announcement_id', $announcementId)
            ->where('admin_id', $adminId)
            ->first();
    }

    public function ensureForReceiver(int $announcementId, int $adminId): AdminAnnouncementRead
    {
        $read = $this->findForReceiver($announcementId, $adminId);
        if ($read !== null) {
            return $read;
        }

        /** @var AdminAnnouncementRead $read */
        $read = $this->createModel([
            'announcement_id' => $announcementId,
            'admin_id' => $adminId,
        ]);

        return $read;
    }

    public function update(AdminAnnouncementRead $read, array $data): AdminAnnouncementRead
    {
        /** @var AdminAnnouncementRead $read */
        $read = $this->updateModel($read, $data);

        return $read;
    }
}
