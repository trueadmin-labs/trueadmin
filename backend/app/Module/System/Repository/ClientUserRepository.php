<?php

declare(strict_types=1);

namespace App\Module\System\Repository;

use App\Foundation\Pagination\PageResult;
use App\Foundation\Query\AdminQuery;
use App\Foundation\Repository\AbstractRepository;
use App\Module\System\Model\ClientUser;

final class ClientUserRepository extends AbstractRepository
{
    protected ?string $modelClass = ClientUser::class;

    protected array $keywordFields = ['username', 'phone', 'email', 'nickname'];

    protected array $filterable = [
        'id' => ['=', 'in'],
        'username' => ['=', 'like'],
        'phone' => ['=', 'like'],
        'email' => ['=', 'like'],
        'nickname' => ['=', 'like'],
        'status' => ['=', 'in'],
        'register_channel' => ['=', 'in'],
        'created_at' => ['between', '>=', '<='],
        'last_login_at' => ['between', '>=', '<='],
    ];

    protected array $sortable = ['id', 'username', 'phone', 'email', 'status', 'created_at', 'updated_at', 'last_login_at'];

    protected array $defaultSort = ['id' => 'desc'];

    public function paginate(AdminQuery $adminQuery): PageResult
    {
        return $this->pageQuery(
            ClientUser::query(),
            $adminQuery,
            fn (ClientUser $user): array => $this->toArray($user),
        );
    }

    public function findById(int $id): ?ClientUser
    {
        /** @var null|ClientUser $user */
        $user = $this->findModelById($id);

        return $user;
    }

    public function existsUsername(string $username, ?int $exceptId = null): bool
    {
        if ($username === '') {
            return false;
        }

        return ClientUser::query()
            ->where('username', $username)
            ->when($exceptId !== null, static function ($query) use ($exceptId): void {
                $query->where('id', '<>', $exceptId);
            })
            ->exists();
    }

    public function existsPhone(string $phone, ?int $exceptId = null): bool
    {
        if ($phone === '') {
            return false;
        }

        return ClientUser::query()
            ->where('phone', $phone)
            ->when($exceptId !== null, static function ($query) use ($exceptId): void {
                $query->where('id', '<>', $exceptId);
            })
            ->exists();
    }

    public function existsEmail(string $email, ?int $exceptId = null): bool
    {
        if ($email === '') {
            return false;
        }

        return ClientUser::query()
            ->where('email', $email)
            ->when($exceptId !== null, static function ($query) use ($exceptId): void {
                $query->where('id', '<>', $exceptId);
            })
            ->exists();
    }

    public function create(array $data): ClientUser
    {
        /** @var ClientUser $user */
        $user = $this->createModel($data);

        return $user;
    }

    public function update(ClientUser $user, array $data): ClientUser
    {
        /** @var ClientUser $user */
        $user = $this->updateModel($user, $data);

        return $user;
    }

    public function delete(ClientUser $user): void
    {
        $this->deleteModel($user);
    }

    public function toArray(ClientUser $user): array
    {
        return [
            'id' => (int) $user->getAttribute('id'),
            'username' => $user->getAttribute('username') === null ? '' : (string) $user->getAttribute('username'),
            'phone' => $user->getAttribute('phone') === null ? '' : (string) $user->getAttribute('phone'),
            'email' => $user->getAttribute('email') === null ? '' : (string) $user->getAttribute('email'),
            'nickname' => (string) $user->getAttribute('nickname'),
            'avatar' => (string) $user->getAttribute('avatar'),
            'status' => (string) $user->getAttribute('status'),
            'registerChannel' => (string) $user->getAttribute('register_channel'),
            'lastLoginAt' => $user->getAttribute('last_login_at') === null ? null : (string) $user->getAttribute('last_login_at'),
            'createdAt' => (string) $user->getAttribute('created_at'),
            'updatedAt' => (string) $user->getAttribute('updated_at'),
        ];
    }
}
