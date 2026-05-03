<?php

declare(strict_types=1);

namespace App\Exception;

use RuntimeException;
use Throwable;

class BusinessException extends RuntimeException
{
    public function __construct(
        private readonly int $businessCode,
        string $message,
        int $code = 0,
        ?Throwable $previous = null
    ) {
        parent::__construct($message, $code, $previous);
    }

    public function businessCode(): int
    {
        return $this->businessCode;
    }
}

