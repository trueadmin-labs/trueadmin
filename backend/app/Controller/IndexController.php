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

namespace App\Controller;

use App\Support\ApiResponse;

class IndexController extends AbstractController
{
    public function index()
    {
        return ApiResponse::success([
            'name' => 'TrueAdmin Backend',
            'status' => 'ok',
        ]);
    }
}
