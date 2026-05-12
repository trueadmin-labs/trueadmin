<?php

declare(strict_types=1);

namespace App\Module\System\Repository\Notification;

use TrueAdmin\Kernel\Crud\CrudQuery;
use TrueAdmin\Kernel\Pagination\PageResult;
use App\Foundation\Repository\AbstractRepository;
use App\Module\System\Model\AdminAnnouncement;
use App\Module\System\Model\AdminAnnouncementRead;
use Hyperf\Database\Model\Builder;
use Hyperf\DbConnection\Db;

/**
 * @extends AbstractRepository<AdminAnnouncement>
 */
final class AdminAnnouncementRepository extends AbstractRepository
{
    protected ?string $modelClass = AdminAnnouncement::class;

    protected array $keywordFields = ['title', 'content', 'operator_name'];

    protected array $filterable = [
        'id' => ['eq', 'in'],
        'level' => ['eq', 'in'],
        'type' => ['eq', 'in'],
        'source' => ['eq', 'in'],
        'status' => ['eq', 'in'],
        'scope' => ['eq', 'in'],
        'created_at' => ['between', 'gte', 'lte'],
        'publish_at' => ['between', 'gte', 'lte'],
    ];

    protected array $sortable = ['id', 'created_at', 'updated_at', 'publish_at', 'expire_at'];

    protected array $defaultSort = ['pinned' => 'desc', 'id' => 'desc'];

    public function paginate(CrudQuery $adminQuery): PageResult
    {
        $query = AdminAnnouncement::query();
        $this->applyManagementDataPolicy($query);

        return $this->pageQuery(
            $query,
            $adminQuery,
            fn (AdminAnnouncement $announcement): array => $this->toArray($announcement),
        );
    }

    /**
     * @return list<AdminAnnouncement>
     */
    public function visibleForReceiver(int $adminId, array $roleIds, CrudQuery $adminQuery): array
    {
        $now = date('Y-m-d H:i:s');
        $query = $this->visibleQuery($now);

        $this->applyMessageFilters($query, $adminQuery);
        $this->applyKeyword($query, $this->messageSearchQuery($adminQuery));
        $this->applySort($query, $adminQuery);

        return $query->get()
            ->filter(fn (AdminAnnouncement $announcement): bool => $this->isVisibleToReceiver($announcement, $adminId, $roleIds))
            ->values()
            ->all();
    }

    public function findById(int $id): ?AdminAnnouncement
    {
        /** @var null|AdminAnnouncement $announcement */
        $announcement = $this->findModelById($id);

        return $announcement;
    }

    public function findByIdWithDataPolicy(int $id): ?AdminAnnouncement
    {
        $announcement = $this->findById($id);
        if ($announcement === null) {
            return null;
        }

        $query = AdminAnnouncement::query()->where('id', $id);
        $this->assertManagementDataPolicy($query);

        return $announcement;
    }

    public function findVisibleForReceiver(int $id, int $adminId, array $roleIds): ?AdminAnnouncement
    {
        $announcement = $this->visibleQuery(date('Y-m-d H:i:s'))->where('id', $id)->first();
        if (! $announcement instanceof AdminAnnouncement) {
            return null;
        }
        if (! $this->isVisibleToReceiver($announcement, $adminId, $roleIds)) {
            return null;
        }

        return $announcement;
    }

    public function create(array $data): AdminAnnouncement
    {
        /** @var AdminAnnouncement $announcement */
        $announcement = $this->createModel($data);

        return $announcement;
    }

    public function update(AdminAnnouncement $announcement, array $data): AdminAnnouncement
    {
        /** @var AdminAnnouncement $announcement */
        $announcement = $this->updateModel($announcement, $data);

        return $announcement;
    }

    public function delete(AdminAnnouncement $announcement): void
    {
        $id = (int) $announcement->getAttribute('id');
        Db::table('admin_announcement_reads')->where('announcement_id', $id)->delete();
        $this->deleteModel($announcement);
    }

    public function statusStats(): array
    {
        $query = AdminAnnouncement::query();
        $this->applyManagementDataPolicy($query);

        return $query
            ->select('status', Db::raw('count(*) as total'))
            ->groupBy('status')
            ->get()
            ->mapWithKeys(static fn ($row): array => [(string) $row->status => (int) $row->total])
            ->all();
    }

    /** @return list<AdminAnnouncement> */
    public function scheduledDue(string $now): array
    {
        return AdminAnnouncement::query()
            ->where('status', 'scheduled')
            ->where('publish_at', '<=', $now)
            ->get()
            ->all();
    }

    /** @return list<AdminAnnouncement> */
    public function expiredDue(string $now): array
    {
        return AdminAnnouncement::query()
            ->where('status', 'active')
            ->whereNotNull('expire_at')
            ->where('expire_at', '<=', $now)
            ->get()
            ->all();
    }

    public function toMessageArray(AdminAnnouncement $announcement, ?AdminAnnouncementRead $state = null): array
    {
        return [
            'id' => (int) $announcement->getAttribute('id'),
            'kind' => 'announcement',
            'title' => (string) $announcement->getAttribute('title'),
            'content' => $announcement->getAttribute('content'),
            'level' => (string) $announcement->getAttribute('level'),
            'type' => (string) $announcement->getAttribute('type'),
            'source' => (string) $announcement->getAttribute('source'),
            'targetUrl' => $announcement->getAttribute('target_url'),
            'payload' => $announcement->getAttribute('payload') ?? [],
            'attachments' => $announcement->getAttribute('attachments') ?? [],
            'readAt' => $state?->read_at === null ? null : (string) $state?->read_at,
            'archivedAt' => $state?->archived_at === null ? null : (string) $state?->archived_at,
            'pinned' => (bool) $announcement->getAttribute('pinned'),
            'createdAt' => $this->formatDate($announcement->getAttribute('publish_at') ?? $announcement->getAttribute('created_at')),
        ];
    }

    public function toArray(AdminAnnouncement $announcement): array
    {
        return [
            'id' => (int) $announcement->getAttribute('id'),
            'title' => (string) $announcement->getAttribute('title'),
            'content' => $announcement->getAttribute('content'),
            'kind' => 'announcement',
            'level' => (string) $announcement->getAttribute('level'),
            'type' => (string) $announcement->getAttribute('type'),
            'source' => (string) $announcement->getAttribute('source'),
            'status' => (string) $announcement->getAttribute('status'),
            'targetType' => (string) $announcement->getAttribute('scope') === 'roles' ? 'role' : 'all',
            'targetSummary' => $this->targetSummary($announcement),
            'targetRoleIds' => $this->intList($announcement->getAttribute('role_ids')),
            'targetUrl' => $announcement->getAttribute('target_url'),
            'payload' => $announcement->getAttribute('payload') ?? [],
            'attachments' => $announcement->getAttribute('attachments') ?? [],
            'pinned' => (bool) $announcement->getAttribute('pinned'),
            'scheduledAt' => (string) $announcement->getAttribute('status') === 'scheduled' ? $this->formatDate($announcement->getAttribute('publish_at')) : null,
            'publishedAt' => in_array((string) $announcement->getAttribute('status'), ['active', 'expired', 'offline'], true)
                ? $this->formatDate($announcement->getAttribute('publish_at'))
                : null,
            'expireAt' => $this->formatDate($announcement->getAttribute('expire_at')),
            'offlineAt' => (string) $announcement->getAttribute('status') === 'offline' ? $this->formatDate($announcement->getAttribute('updated_at')) : null,
            'deliveryTotal' => $this->targetCount($announcement),
            'sentTotal' => $this->targetCount($announcement),
            'failedTotal' => 0,
            'readTotal' => (int) Db::table('admin_announcement_reads')->where('announcement_id', (int) $announcement->getAttribute('id'))->whereNotNull('read_at')->count(),
            'operatorId' => $announcement->getAttribute('operator_id') === null ? null : (int) $announcement->getAttribute('operator_id'),
            'operatorName' => (string) $announcement->getAttribute('operator_name'),
            'createdAt' => $this->formatDate($announcement->getAttribute('created_at')),
            'updatedAt' => $this->formatDate($announcement->getAttribute('updated_at')),
        ];
    }

    private function applyManagementDataPolicy(Builder $query): void
    {
        $this->applyDataPolicy($query, 'admin_announcement', [
            'deptColumn' => 'operator_dept_id',
            'createdByColumn' => 'operator_id',
        ]);
    }

    private function assertManagementDataPolicy(Builder $query): void
    {
        $this->assertDataPolicyAllows($query, 'admin_announcement', [
            'deptColumn' => 'operator_dept_id',
            'createdByColumn' => 'operator_id',
        ]);
    }

    protected function applyParams(Builder $query, CrudQuery $adminQuery): void
    {
        foreach (['level', 'type', 'source', 'status'] as $field) {
            if ($adminQuery->hasParam($field)) {
                $query->where($field, $adminQuery->param($field));
            }
        }
        if ($adminQuery->hasParam('targetType')) {
            $scope = $adminQuery->param('targetType') === 'role' ? 'roles' : 'all';
            $query->where('scope', $scope);
        }
        if ($adminQuery->hasParam('startAt')) {
            $query->where('publish_at', '>=', $adminQuery->param('startAt'));
        }
        if ($adminQuery->hasParam('endAt')) {
            $query->where('publish_at', '<=', $adminQuery->param('endAt'));
        }
    }

    private function applyMessageFilters(Builder $query, CrudQuery $adminQuery): void
    {
        foreach (['level', 'type', 'source'] as $field) {
            if ($adminQuery->hasParam($field)) {
                $query->where($field, $adminQuery->param($field));
            }
        }
        if ($adminQuery->hasParam('startAt')) {
            $query->where('publish_at', '>=', $adminQuery->param('startAt'));
        }
        if ($adminQuery->hasParam('endAt')) {
            $query->where('publish_at', '<=', $adminQuery->param('endAt'));
        }
    }

    private function visibleQuery(string $now): Builder
    {
        return AdminAnnouncement::query()
            ->where('status', 'active')
            ->where('publish_at', '<=', $now)
            ->where(static function (Builder $query) use ($now): void {
                $query->whereNull('expire_at')->orWhere('expire_at', '>', $now);
            });
    }

    private function isVisibleToReceiver(AdminAnnouncement $announcement, int $adminId, array $roleIds): bool
    {
        $scope = (string) $announcement->getAttribute('scope');
        if ($scope === 'all') {
            return true;
        }
        if ($scope === 'roles') {
            return array_intersect($this->intList($announcement->getAttribute('role_ids')), $roleIds) !== [];
        }

        return false;
    }

    private function messageSearchQuery(CrudQuery $adminQuery): CrudQuery
    {
        return new CrudQuery(
            page: $adminQuery->page,
            pageSize: $adminQuery->pageSize,
            keyword: $adminQuery->keyword,
            filters: [],
            sorts: $adminQuery->sorts,
            params: [],
        );
    }

    private function targetSummary(AdminAnnouncement $announcement): string
    {
        if ((string) $announcement->getAttribute('scope') !== 'roles') {
            return '全员';
        }

        $names = $this->roleNames($this->intList($announcement->getAttribute('role_ids')));

        return $names === [] ? '指定角色' : implode('、', $names);
    }

    private function targetCount(AdminAnnouncement $announcement): int
    {
        if ((string) $announcement->getAttribute('scope') !== 'roles') {
            return (int) Db::table('admin_users')
                ->where('status', 'enabled')
                ->whereNull('deleted_at')
                ->count();
        }

        $roleIds = $this->intList($announcement->getAttribute('role_ids'));
        if ($roleIds === []) {
            return 0;
        }

        return (int) Db::table('admin_users')
            ->join('admin_role_user', 'admin_role_user.user_id', '=', 'admin_users.id')
            ->where('admin_users.status', 'enabled')
            ->whereNull('admin_users.deleted_at')
            ->whereIn('admin_role_user.role_id', $roleIds)
            ->distinct('admin_users.id')
            ->count('admin_users.id');
    }

    private function roleNames(array $roleIds): array
    {
        if ($roleIds === []) {
            return [];
        }

        return Db::table('admin_roles')
            ->whereIn('id', $roleIds)
            ->orderBy('sort')
            ->orderBy('id')
            ->pluck('name')
            ->map(static fn (mixed $name): string => (string) $name)
            ->values()
            ->all();
    }

    private function formatDate(mixed $value): ?string
    {
        return $value === null ? null : (string) $value;
    }

    private function intList(mixed $value): array
    {
        if (! is_array($value)) {
            return [];
        }

        return array_values(array_unique(array_filter(array_map('intval', $value), static fn (int $id): bool => $id > 0)));
    }
}
