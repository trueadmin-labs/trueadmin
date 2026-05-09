<?php

declare(strict_types=1);

use Hyperf\Database\Migrations\Migration;
use Hyperf\Database\Schema\Blueprint;
use Hyperf\Database\Schema\Schema;
use Hyperf\DbConnection\Db;

return new class extends Migration {
    public function up(): void
    {
        if (! Schema::hasColumn('admin_menus', 'url')) {
            Schema::table('admin_menus', function (Blueprint $table): void {
                $table->string('url', 1024)->default('')->after('path');
            });
        }
        if (! Schema::hasColumn('admin_menus', 'open_mode')) {
            Schema::table('admin_menus', function (Blueprint $table): void {
                $table->string('open_mode', 32)->default('')->after('url');
            });
        }
        if (! Schema::hasColumn('admin_menus', 'source')) {
            Schema::table('admin_menus', function (Blueprint $table): void {
                $table->string('source', 32)->default('custom')->after('permission');
            });
        }

        Db::table('admin_menus')->update(['source' => 'code']);
    }

    public function down(): void
    {
        Schema::table('admin_menus', function (Blueprint $table): void {
            $table->dropColumn(['url', 'open_mode', 'source']);
        });
    }
};
