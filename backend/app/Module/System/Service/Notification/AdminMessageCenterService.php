<?php

declare(strict_types=1);

namespace App\Module\System\Service\Notification;

use TrueAdmin\Kernel\Pagination\PageResult;
use TrueAdmin\Kernel\Crud\CrudQuery;
use TrueAdmin\Kernel\Service\AbstractService;
use App\Module\System\Model\AdminAnnouncement;
use App\Module\System\Model\AdminAnnouncementRead;
use App\Module\System\Model\AdminNotificationDelivery;
use App\Module\System\Repository\AdminUserRepository;
use App\Module\System\Repository\Notification\AdminAnnouncementReadRepository;
use App\Module\System\Repository\Notification\AdminAnnouncementRepository;
use App\Module\System\Repository\Notification\AdminNotificationDeliveryRepository;
use Hyperf\DbConnection\Db;
use Psr\EventDispatcher\EventDispatcherInterface;
use TrueAdmin\Kernel\Constant\ErrorCode;
use TrueAdmin\Kernel\Context\ActorContext;
use TrueAdmin\Kernel\Exception\BusinessException;

final class AdminMessageCenterService extends AbstractService
{
    public function __construct(
        private readonly AdminNotificationDeliveryRepository $deliveries,
        private readonly AdminAnnouncementRepository $announcements,
        private readonly AdminAnnouncementReadRepository $announcementReads,
        private readonly AdminUserRepository $users,
        private readonly EventDispatcherInterface $dispatcher,
    ) {
    }

    public function paginate(CrudQuery $query): PageResult
    {
        $receiverId = $this->receiverId();
        $messages = [];
        $kind = (string) $query->param('kind', 'all');
        $candidateQuery = $this->candidateQuery($query);

        if ($kind === 'all' || $kind === 'notification') {
            $messages = array_merge($messages, $this->deliveries->listForReceiver($receiverId, $this->withoutKind($candidateQuery)));
        }

        if ($kind === 'all' || $kind === 'announcement') {
            foreach ($this->announcements->visibleForReceiver($receiverId, $this->roleIds(), $this->withoutKind($candidateQuery)) as $announcement) {
                $state = $this->announcementReads->findForReceiver((int) $announcement->getAttribute('id'), $receiverId);
                if (! $this->matchesState($state, (string) $query->param('status', 'all'))) {
                    continue;
                }
                $messages[] = $this->announcements->toMessageArray($announcement, $state);
            }
        }

        usort($messages, static function (array $left, array $right): int {
            $leftPinned = (bool) ($left['pinned'] ?? false);
            $rightPinned = (bool) ($right['pinned'] ?? false);
            if ($leftPinned !== $rightPinned) {
                return $leftPinned ? -1 : 1;
            }

            return strcmp((string) ($right['createdAt'] ?? ''), (string) ($left['createdAt'] ?? ''));
        });

        $offset = ($query->page - 1) * $query->pageSize;

        return new PageResult(array_slice($messages, $offset, $query->pageSize), count($messages), $query->page, $query->pageSize);
    }

    public function unreadCount(): array
    {
        $receiverId = $this->receiverId();
        $notification = $this->deliveries->unreadCount($receiverId);
        $announcementUnread = 0;
        foreach ($this->announcements->visibleForReceiver($receiverId, $this->roleIds(), new CrudQuery(page: 1, pageSize: 1000)) as $announcement) {
            $state = $this->announcementReads->findForReceiver((int) $announcement->getAttribute('id'), $receiverId);
            if (($state === null || $state->getAttribute('read_at') === null) && ($state === null || $state->getAttribute('archived_at') === null)) {
                ++$announcementUnread;
            }
        }

        return [
            'total' => (int) $notification['total'] + $announcementUnread,
            'notification' => (int) $notification['notification'],
            'announcement' => $announcementUnread,
        ];
    }

    public function detail(string $kind, int $id): array
    {
        $receiverId = $this->receiverId();
        if ($kind === 'notification') {
            $delivery = $this->deliveries->findMessageForReceiver($id, $receiverId);
            if ($delivery === null) {
                throw $this->notFound('admin_message', $id);
            }
            $this->markDeliveryRead($delivery);
            $delivery->refresh();

            return $this->deliveries->toMessageArray($delivery);
        }

        if ($kind !== 'announcement') {
            throw $this->notFound('admin_message', $id);
        }

        $announcement = $this->visibleAnnouncement($id, $receiverId);
        $state = $this->announcementReads->ensureForReceiver($id, $receiverId);
        $this->markAnnouncementRead($state);
        $state->refresh();

        return $this->announcements->toMessageArray($announcement, $state);
    }

    public function markRead(array $messages): void
    {
        $this->forEachMessage($messages, function (string $kind, int $id): void {
            if ($kind === 'notification') {
                $delivery = $this->deliveries->findMessageForReceiver($id, $this->receiverId());
                if ($delivery !== null) {
                    $this->markDeliveryRead($delivery);
                }
                return;
            }
            $receiverId = $this->receiverId();
            $this->visibleAnnouncement($id, $receiverId);
            $this->markAnnouncementRead($this->announcementReads->ensureForReceiver($id, $receiverId));
        });
    }

    public function archive(array $messages): void
    {
        $this->forEachMessage($messages, fn (string $kind, int $id): null => $this->setArchived($kind, $id, true));
    }

    public function restore(array $messages): void
    {
        $this->forEachMessage($messages, fn (string $kind, int $id): null => $this->setArchived($kind, $id, false));
    }

    public function readAll(string $kind): void
    {
        $messages = $this->paginate(new CrudQuery(page: 1, pageSize: 1000, params: ['kind' => $kind, 'status' => 'unread']));
        $this->markRead(array_map(static fn (array $message): array => [
            'kind' => (string) $message['kind'],
            'id' => (int) $message['id'],
        ], $messages->items));
    }

    public function changeVersion(): string
    {
        $receiverId = $this->receiverId();
        $deliveryVersion = $this->timestamp(Db::table('admin_notification_deliveries')
            ->where('receiver_id', $receiverId)
            ->max('updated_at'));
        $deliveryCount = (int) Db::table('admin_notification_deliveries')
            ->where('receiver_id', $receiverId)
            ->count();
        $announcementVersion = $this->timestamp(Db::table('admin_announcements')
            ->whereIn('status', ['active', 'scheduled', 'expired', 'offline'])
            ->max('updated_at'));
        $announcementCount = (int) Db::table('admin_announcements')
            ->whereIn('status', ['active', 'scheduled', 'expired', 'offline'])
            ->count();
        $readVersion = $this->timestamp(Db::table('admin_announcement_reads')
            ->where('admin_id', $receiverId)
            ->max('updated_at'));
        $readCount = (int) Db::table('admin_announcement_reads')
            ->where('admin_id', $receiverId)
            ->count();

        return implode(':', [$deliveryVersion, $deliveryCount, $announcementVersion, $announcementCount, $readVersion, $readCount]);
    }

    private function timestamp(mixed $value): int
    {
        if ($value === null || $value === '') {
            return 0;
        }

        $timestamp = strtotime((string) $value);

        return $timestamp === false ? 0 : $timestamp;
    }

    private function forEachMessage(array $messages, callable $callback): void
    {
        Db::transaction(function () use ($messages, $callback): void {
            foreach ($messages as $message) {
                $kind = (string) ($message['kind'] ?? '');
                $id = (int) ($message['id'] ?? 0);
                if (! in_array($kind, ['notification', 'announcement'], true) || $id <= 0) {
                    continue;
                }
                $callback($kind, $id);
            }
            $this->dispatcher->dispatch(new AdminMessageChangedEvent('message_state_changed'));
        });
    }

    private function setArchived(string $kind, int $id, bool $archived): null
    {
        $receiverId = $this->receiverId();
        $archivedAt = $archived ? date('Y-m-d H:i:s') : null;
        if ($kind === 'notification') {
            $delivery = $this->deliveries->findMessageForReceiver($id, $receiverId);
            if ($delivery !== null) {
                $this->deliveries->update($delivery, ['archived_at' => $archivedAt]);
            }
            return null;
        }

        $this->visibleAnnouncement($id, $receiverId);
        $state = $this->announcementReads->ensureForReceiver($id, $receiverId);
        $this->announcementReads->update($state, ['archived_at' => $archivedAt]);

        return null;
    }

    private function markDeliveryRead(AdminNotificationDelivery $delivery): void
    {
        if ($delivery->getAttribute('read_at') !== null) {
            return;
        }
        $this->deliveries->update($delivery, ['read_at' => date('Y-m-d H:i:s')]);
        $this->dispatcher->dispatch(new AdminMessageChangedEvent('message_read'));
    }

    private function markAnnouncementRead(AdminAnnouncementRead $state): void
    {
        if ($state->getAttribute('read_at') !== null) {
            return;
        }
        $this->announcementReads->update($state, ['read_at' => date('Y-m-d H:i:s')]);
        $this->dispatcher->dispatch(new AdminMessageChangedEvent('message_read'));
    }

    private function matchesState(?AdminAnnouncementRead $state, string $status): bool
    {
        if ($status === 'archived') {
            return $state !== null && $state->getAttribute('archived_at') !== null;
        }
        if ($state !== null && $state->getAttribute('archived_at') !== null) {
            return false;
        }
        if ($status === 'read') {
            return $state !== null && $state->getAttribute('read_at') !== null;
        }
        if ($status === 'unread') {
            return $state === null || $state->getAttribute('read_at') === null;
        }

        return true;
    }

    private function candidateQuery(CrudQuery $query): CrudQuery
    {
        $candidateSize = max($query->page * $query->pageSize, $query->pageSize);

        return new CrudQuery(
            page: 1,
            pageSize: $candidateSize,
            keyword: $query->keyword,
            filters: $query->filters,
            sorts: $query->sorts,
            params: $query->params,
        );
    }

    private function withoutKind(CrudQuery $query): CrudQuery
    {
        $params = $query->params;
        unset($params['kind']);

        return new CrudQuery(
            page: $query->page,
            pageSize: $query->pageSize,
            keyword: $query->keyword,
            filters: $query->filters,
            sorts: $query->sorts,
            params: $params,
        );
    }


    private function visibleAnnouncement(int $id, int $receiverId): AdminAnnouncement
    {
        $announcement = $this->announcements->findVisibleForReceiver($id, $receiverId, $this->roleIdsForReceiver($receiverId));
        if ($announcement === null) {
            throw $this->notFound('admin_message', $id);
        }

        return $announcement;
    }

    private function roleIdsForReceiver(int $receiverId): array
    {
        $user = $this->users->findById($receiverId);
        if ($user === null) {
            return [];
        }

        return $this->users->roleIds($user);
    }

    private function receiverId(): int
    {
        $actor = ActorContext::principal();
        if ($actor === null || $actor->type !== 'admin') {
            throw new BusinessException(ErrorCode::UNAUTHORIZED, 401, ['reason' => 'admin_actor_required']);
        }

        return (int) $actor->id;
    }

    private function roleIds(): array
    {
        return $this->roleIdsForReceiver($this->receiverId());
    }
}
