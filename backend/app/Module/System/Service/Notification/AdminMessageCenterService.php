<?php

declare(strict_types=1);

namespace App\Module\System\Service\Notification;

use App\Foundation\Pagination\PageResult;
use App\Foundation\Query\AdminQuery;
use App\Foundation\Service\AbstractService;
use App\Module\System\Model\AdminAnnouncementRead;
use App\Module\System\Model\AdminNotificationBatch;
use App\Module\System\Model\AdminNotificationDelivery;
use App\Module\System\Repository\Notification\AdminAnnouncementReadRepository;
use App\Module\System\Repository\Notification\AdminNotificationBatchRepository;
use App\Module\System\Repository\AdminUserRepository;
use App\Module\System\Repository\Notification\AdminNotificationDeliveryRepository;
use Hyperf\DbConnection\Db;
use TrueAdmin\Kernel\Constant\ErrorCode;
use TrueAdmin\Kernel\Context\ActorContext;
use TrueAdmin\Kernel\Exception\BusinessException;

final class AdminMessageCenterService extends AbstractService
{
    public function __construct(
        private readonly AdminNotificationBatchRepository $batches,
        private readonly AdminNotificationDeliveryRepository $deliveries,
        private readonly AdminAnnouncementReadRepository $announcementReads,
        private readonly AdminUserRepository $users,
    ) {
    }

    public function paginate(AdminQuery $query): PageResult
    {
        $receiverId = $this->receiverId();
        $messages = [];
        $kind = (string) $query->param('kind', 'all');
        $aggregateQuery = $this->aggregationQuery($query);

        if ($kind === 'all' || $kind === 'notification') {
            $deliveryPage = $this->deliveries->paginateForReceiver($receiverId, $this->withoutKind($aggregateQuery));
            $messages = array_merge($messages, array_filter($deliveryPage->items));
        }

        if ($kind === 'all' || $kind === 'announcement') {
            foreach ($this->batches->visibleAnnouncementsForReceiver($receiverId, $this->roleIds(), $this->withoutKind($aggregateQuery)) as $batch) {
                $state = $this->announcementReads->findForReceiver((int) $batch->getAttribute('id'), $receiverId);
                if (! $this->matchesState($state, (string) $query->param('status', 'all'))) {
                    continue;
                }
                $messages[] = $this->batches->toAnnouncementMessageArray($batch, $state);
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

        $page = $query->page;
        $pageSize = $query->pageSize;
        $offset = ($page - 1) * $pageSize;

        return new PageResult(array_slice($messages, $offset, $pageSize), count($messages), $page, $pageSize);
    }

    public function unreadCount(): array
    {
        $receiverId = $this->receiverId();
        $notification = $this->deliveries->unreadCount($receiverId);
        $announcementUnread = 0;
        foreach ($this->batches->visibleAnnouncementsForReceiver($receiverId, $this->roleIds(), new AdminQuery(page: 1, pageSize: 1000)) as $batch) {
            $state = $this->announcementReads->findForReceiver((int) $batch->getAttribute('id'), $receiverId);
            if ($state === null || $state->getAttribute('read_at') === null) {
                if ($state === null || $state->getAttribute('archived_at') === null) {
                    ++$announcementUnread;
                }
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
            $delivery = $this->deliveries->findForReceiver($id, $receiverId);
            if ($delivery === null) {
                throw $this->notFound('admin_message', $id);
            }
            $this->markDeliveryRead($delivery);

            return $this->deliveries->toMessageArray($delivery->refresh());
        }

        $batch = $this->batches->findById($id);
        if ($batch === null || (string) $batch->getAttribute('kind') !== 'announcement') {
            throw $this->notFound('admin_message', $id);
        }
        $state = $this->announcementReads->ensureForReceiver($id, $receiverId);
        $this->markAnnouncementRead($state);

        return $this->batches->toAnnouncementMessageArray($batch, $state->refresh());
    }

    public function markRead(array $messages): void
    {
        $this->forEachMessage($messages, function (string $kind, int $id): void {
            if ($kind === 'notification') {
                $delivery = $this->deliveries->findForReceiver($id, $this->receiverId());
                if ($delivery !== null) {
                    $this->markDeliveryRead($delivery);
                }
                return;
            }
            $this->markAnnouncementRead($this->announcementReads->ensureForReceiver($id, $this->receiverId()));
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
        $messages = $this->paginate(new AdminQuery(page: 1, pageSize: 1000, params: ['kind' => $kind, 'status' => 'unread']));
        $this->markRead(array_map(static fn (array $message): array => [
            'kind' => (string) $message['kind'],
            'id' => (int) $message['id'],
        ], $messages->items));
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
        });
    }

    private function setArchived(string $kind, int $id, bool $archived): null
    {
        $receiverId = $this->receiverId();
        $archivedAt = $archived ? date('Y-m-d H:i:s') : null;
        if ($kind === 'notification') {
            $delivery = $this->deliveries->findForReceiver($id, $receiverId);
            if ($delivery !== null) {
                $this->deliveries->update($delivery, ['archived_at' => $archivedAt]);
            }
            return null;
        }

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
    }

    private function markAnnouncementRead(AdminAnnouncementRead $state): void
    {
        if ($state->getAttribute('read_at') !== null) {
            return;
        }
        $this->announcementReads->update($state, ['read_at' => date('Y-m-d H:i:s')]);
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

    private function aggregationQuery(AdminQuery $query): AdminQuery
    {
        return new AdminQuery(
            page: 1,
            pageSize: 1000,
            keyword: $query->keyword,
            filters: $query->filters,
            operators: $query->operators,
            params: $query->params,
            sort: $query->sort,
            order: $query->order,
        );
    }

    private function withoutKind(AdminQuery $query): AdminQuery
    {
        $params = $query->params;
        unset($params['kind']);

        return new AdminQuery(
            page: $query->page,
            pageSize: $query->pageSize,
            keyword: $query->keyword,
            filters: $query->filters,
            operators: $query->operators,
            params: $params,
            sort: $query->sort,
            order: $query->order,
        );
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
        $user = $this->users->findById($this->receiverId());
        if ($user === null) {
            return [];
        }

        return $this->users->roleIds($user);
    }
}
