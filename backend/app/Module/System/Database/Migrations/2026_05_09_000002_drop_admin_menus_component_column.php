<?php

declare(strict_types=1);

use Hyperf\Database\Migrations\Migration;
use Hyperf\Database\Schema\Blueprint;
use Hyperf\Database\Schema\Schema;

return new class extends Migration {
    public function up(): void
    {
        if (! Schema::hasColumn('admin_menus', 'component')) {
            return;
        }

        Schema::table('admin_menus', function (Blueprint $table): void {
            $table->dropColumn('component');
        });
    }

    public function down(): void
    {
        if (Schema::hasColumn('admin_menus', 'component')) {
            return;
        }

        Schema::table('admin_menus', function (Blueprint $table): void {
            $table->string('component', 255)->default('')->after('path');
        });
    }
};
