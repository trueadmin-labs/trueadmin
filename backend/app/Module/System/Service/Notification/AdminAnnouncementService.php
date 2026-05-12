<?php

declare(strict_types=1);

namespace App\Module\System\Service\Notification;

use TrueAdmin\Kernel\Pagination\PageResult;
use TrueAdmin\Kernel\Crud\CrudQuery;
use App\Foundation\Service\AbstractService;
use App\Module\System\Model\AdminAnnouncement;
use App\Module\System\Repository\Notification\AdminAnnouncementRepository;
use Hyperf\DbConnection\Db;
use Psr\EventDispatcher\EventDispatcherInterface;
use TrueAdmin\Kernel\Constant\ErrorCode;
use TrueAdmin\Kernel\Context\ActorContext;
use TrueAdmin\Kernel\Exception\BusinessException;

final class AdminAnnouncementService extends AbstractService
{
    public function __construct(
        private readonly AdminAnnouncementRepository $announcements,
        private readonly EventDispatcherInterface $dispatcher,
    ) {
    }

    public function paginate(CrudQuery $query): PageResult
    {
        return $this->announcements->paginate($query);
    }

    public function listMeta(): array
    {
        return ['statusStats' => $this->announcements->statusStats()];
    }

    public function detail(int $id): array
    {
        return $this->announcements->toArray($this->mustFind($id));
    }

    public function create(array $payload): array
    {
        return Db::transaction(function () use ($payload): array {
            $actor = ActorContext::operator();
            $publishMode = (string) ($payload['publishMode'] ?? 'publish');
            $publishAt = $payload['scheduledAt'] ?? null;
            $status = 'draft';

            if ($publishMode === 'publish') {
                $status = $publishAt === null ? 'active' : 'scheduled';
                $publishAt ??= date('Y-m-d H:i:s');
                $this->assertPayloadCanPublish($payload, $publishAt);
            } else {
                $this->assertDraftPayload($payload, 'draft', $publishAt);
            }

            $announcement = $this->announcements->create($this->data($payload, [
                'status' => $status,
                'publish_at' => $publishAt,
                'operator_type' => $actor === null ? 'system' : 'admin',
                'operator_id' => $actor === null ? null : (int) $actor->id,
                'operator_dept_id' => $actor === null ? null : ($actor->claims['operationDeptId'] ?? $actor->claims['primaryDeptId'] ?? null),
                'operator_name' => $actor?->name ?? '',
            ]));

            if ($status === 'active') {
                $this->dispatcher->dispatch(new AdminMessageChangedEvent('announcement_published'));
            }

            return $this->announcements->toArray($announcement);
        });
    }

    public function update(int $id, array $payload): array
    {
        return Db::transaction(function () use ($id, $payload): array {
            $announcement = $this->mustFind($id);
            $status = (string) $announcement->getAttribute('status');
            if (in_array($status, ['draft', 'scheduled'], true)) {
                $publishAt = $payload['scheduledAt'] ?? null;
                $nextStatus = $publishAt === null ? 'draft' : 'scheduled';
                $this->assertDraftPayload($payload, $nextStatus, $publishAt);
                $announcement = $this->announcements->update($announcement, $this->data($payload, [
                    'status' => $nextStatus,
                    'publish_at' => $publishAt,
                ]));

                return $this->announcements->toArray($announcement);
            }

            if (in_array($status, ['active', 'expired'], true)) {
                $announcement = $this->announcements->update($announcement, $this->publishedUpdateData($announcement, $payload));
                $this->dispatcher->dispatch(new AdminMessageChangedEvent('announcement_updated'));

                return $this->announcements->toArray($announcement);
            }

            throw new BusinessException(ErrorCode::VALIDATION_FAILED, 422, ['reason' => 'announcement_status_can_not_be_updated']);
        });
    }

    public function deleteDraft(int $id): void
    {
        Db::transaction(function () use ($id): void {
            $announcement = $this->mustFind($id);
            if ((string) $announcement->getAttribute('status') !== 'draft') {
                throw new BusinessException(ErrorCode::VALIDATION_FAILED, 422, ['reason' => 'only_draft_can_be_deleted']);
            }

            $this->announcements->delete($announcement);
        });
    }

    public function publish(int $id): array
    {
        return Db::transaction(function () use ($id): array {
            $announcement = $this->mustFind($id);
            if (! in_array((string) $announcement->getAttribute('status'), ['draft', 'scheduled'], true)) {
                throw new BusinessException(ErrorCode::VALIDATION_FAILED, 422, ['reason' => 'only_draft_or_scheduled_can_be_published']);
            }

            $publishAt = date('Y-m-d H:i:s');
            $this->assertStoredAnnouncementCanPublish($announcement, $publishAt);
            $announcement = $this->announcements->update($announcement, [
                'status' => 'active',
                'publish_at' => $publishAt,
            ]);
            $this->dispatcher->dispatch(new AdminMessageChangedEvent('announcement_published'));

            return $this->announcements->toArray($announcement);
        });
    }

    public function cancelScheduled(int $id): array
    {
        return Db::transaction(function () use ($id): array {
            $announcement = $this->mustFind($id);
            if ((string) $announcement->getAttribute('status') !== 'scheduled') {
                throw new BusinessException(ErrorCode::VALIDATION_FAILED, 422, ['reason' => 'only_scheduled_can_be_canceled']);
            }

            $announcement = $this->announcements->update($announcement, [
                'status' => 'draft',
                'publish_at' => null,
            ]);

            return $this->announcements->toArray($announcement);
        });
    }

    public function offline(int $id): array
    {
        return Db::transaction(function () use ($id): array {
            $announcement = $this->mustFind($id);
            if (! in_array((string) $announcement->getAttribute('status'), ['active', 'scheduled'], true)) {
                throw new BusinessException(ErrorCode::VALIDATION_FAILED, 422, ['reason' => 'only_active_or_scheduled_can_be_offline']);
            }

            $announcement = $this->announcements->update($announcement, ['status' => 'offline']);
            $this->dispatcher->dispatch(new AdminMessageChangedEvent('announcement_offline'));

            return $this->announcements->toArray($announcement);
        });
    }

    public function restore(int $id): array
    {
        return Db::transaction(function () use ($id): array {
            $announcement = $this->mustFind($id);
            if (! in_array((string) $announcement->getAttribute('status'), ['offline', 'expired'], true)) {
                throw new BusinessException(ErrorCode::VALIDATION_FAILED, 422, ['reason' => 'only_offline_or_expired_can_be_restored']);
            }

            $expireAt = $this->formatNullableDate($announcement->getAttribute('expire_at'));
            if ($expireAt !== null && strtotime($expireAt) !== false && strtotime($expireAt) <= time()) {
                $expireAt = null;
            }

            $announcement = $this->announcements->update($announcement, [
                'status' => 'active',
                'publish_at' => $this->formatNullableDate($announcement->getAttribute('publish_at')) ?? date('Y-m-d H:i:s'),
                'expire_at' => $expireAt,
            ]);
            $this->dispatcher->dispatch(new AdminMessageChangedEvent('announcement_restored'));

            return $this->announcements->toArray($announcement);
        });
    }

    public function runSchedule(): array
    {
        $now = date('Y-m-d H:i:s');
        $published = 0;
        $expired = 0;

        foreach ($this->announcements->scheduledDue($now) as $announcement) {
            $this->announcements->update($announcement, ['status' => 'active']);
            ++$published;
        }
        foreach ($this->announcements->expiredDue($now) as $announcement) {
            $this->announcements->update($announcement, ['status' => 'expired']);
            ++$expired;
        }
        if ($published > 0 || $expired > 0) {
            $this->dispatcher->dispatch(new AdminMessageChangedEvent('announcement_schedule_changed'));
        }

        return ['published' => $published, 'expired' => $expired];
    }


    private function assertDraftPayload(array $payload, string $status, ?string $publishAt): void
    {
        if ($status === 'scheduled' || $status === 'active') {
            $this->assertPayloadCanPublish($payload, $publishAt);
            return;
        }

        $this->assertTargetScope($payload);
        $this->assertExpireAtAfterPublishAt($payload['expireAt'] ?? null, $publishAt);
    }

    private function assertPayloadCanPublish(array $payload, ?string $publishAt): void
    {
        $this->assertTargetScope($payload);
        if ($publishAt === null) {
            throw new BusinessException(ErrorCode::VALIDATION_FAILED, 422, ['reason' => 'publish_at_required']);
        }
        $this->assertExpireAtAfterPublishAt($payload['expireAt'] ?? null, $publishAt);
    }

    private function assertStoredAnnouncementCanPublish(AdminAnnouncement $announcement, string $publishAt): void
    {
        $scope = (string) $announcement->getAttribute('scope');
        if ($scope === 'roles' && $this->intList($announcement->getAttribute('role_ids')) === []) {
            throw new BusinessException(ErrorCode::VALIDATION_FAILED, 422, ['reason' => 'role_scope_requires_roles']);
        }
        $this->assertExpireAtAfterPublishAt($this->formatNullableDate($announcement->getAttribute('expire_at')), $publishAt);
    }

    private function assertTargetScope(array $payload): void
    {
        if ((string) ($payload['targetType'] ?? 'all') !== 'role') {
            return;
        }
        if ($this->intList($payload['targetRoleIds'] ?? []) === []) {
            throw new BusinessException(ErrorCode::VALIDATION_FAILED, 422, ['reason' => 'role_scope_requires_roles']);
        }
    }

    private function assertExpireAtAfterPublishAt(?string $expireAt, ?string $publishAt): void
    {
        if ($expireAt === null || $publishAt === null) {
            return;
        }
        $expireTime = strtotime($expireAt);
        $publishTime = strtotime($publishAt);
        if ($expireTime === false || $publishTime === false || $expireTime <= $publishTime) {
            throw new BusinessException(ErrorCode::VALIDATION_FAILED, 422, ['reason' => 'expire_at_must_be_after_publish_at']);
        }
    }

    private function publishedUpdateData(AdminAnnouncement $announcement, array $payload): array
    {
        $publishAt = $this->formatNullableDate($announcement->getAttribute('publish_at'));
        $this->assertExpireAtAfterPublishAt($payload['expireAt'] ?? null, $publishAt);

        return [
            'pinned' => (bool) ($payload['pinned'] ?? false),
            'expire_at' => $payload['expireAt'] ?? null,
        ];
    }

    private function intList(mixed $value): array
    {
        if (! is_array($value)) {
            return [];
        }

        return array_values(array_unique(array_filter(array_map('intval', $value), static fn (int $id): bool => $id > 0)));
    }

    private function formatNullableDate(mixed $value): ?string
    {
        return $value === null ? null : (string) $value;
    }

    /** @param array<string, mixed> $payload */
    private function data(array $payload, array $extra = []): array
    {
        $targetType = (string) ($payload['targetType'] ?? 'all');

        return [
            'title' => (string) $payload['title'],
            'content' => $payload['content'] ?? null,
            'level' => (string) ($payload['level'] ?? 'info'),
            'type' => 'announcement',
            'source' => (string) ($payload['source'] ?? 'system'),
            'scope' => $targetType === 'role' ? 'roles' : 'all',
            'role_ids' => $targetType === 'role' ? ($payload['targetRoleIds'] ?? []) : [],
            'payload' => $payload['payload'] ?? [],
            'attachments' => $payload['attachments'] ?? [],
            'target_url' => $payload['targetUrl'] ?? null,
            'pinned' => (bool) ($payload['pinned'] ?? false),
            'expire_at' => $payload['expireAt'] ?? null,
            ...$extra,
        ];
    }

    private function mustFind(int $id): AdminAnnouncement
    {
        $announcement = $this->announcements->findByIdWithDataPolicy($id);
        if ($announcement === null) {
            throw $this->notFound('admin_announcement', $id);
        }

        return $announcement;
    }
}
