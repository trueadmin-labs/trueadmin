<?php

declare(strict_types=1);

use Hyperf\Database\Migrations\Migration;
use Hyperf\Database\Schema\Blueprint;
use Hyperf\Database\Schema\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('admin_notification_batches', function (Blueprint $table): void {
            $table->bigIncrements('id');
            $table->string('kind', 32)->default('notification');
            $table->string('level', 32)->default('info');
            $table->string('type', 64)->default('system');
            $table->string('source', 64)->default('system');
            $table->string('title', 255);
            $table->text('content')->nullable();
            $table->json('payload')->nullable();
            $table->json('attachments')->nullable();
            $table->string('target_url', 512)->nullable();
            $table->string('target_type', 32)->default('all');
            $table->json('target_role_ids')->nullable();
            $table->json('target_user_ids')->nullable();
            $table->boolean('pinned')->default(false);
            $table->string('status', 32)->default('draft');
            $table->timestamp('scheduled_at')->nullable();
            $table->timestamp('published_at')->nullable();
            $table->timestamp('offline_at')->nullable();
            $table->unsignedBigInteger('operator_id')->nullable();
            $table->string('operator_name', 64)->default('');
            $table->datetimes();

            $table->index(['status', 'scheduled_at']);
            $table->index(['kind', 'status']);
            $table->index(['source', 'type']);
        });

        Schema::create('admin_notification_deliveries', function (Blueprint $table): void {
            $table->bigIncrements('id');
            $table->unsignedBigInteger('batch_id');
            $table->unsignedBigInteger('receiver_id');
            $table->string('receiver_name', 64)->default('');
            $table->string('status', 32)->default('pending');
            $table->timestamp('sent_at')->nullable();
            $table->timestamp('read_at')->nullable();
            $table->timestamp('archived_at')->nullable();
            $table->string('failed_reason', 255)->nullable();
            $table->integer('retry_count')->default(0);
            $table->datetimes();

            $table->unique(['batch_id', 'receiver_id']);
            $table->index(['receiver_id', 'archived_at']);
            $table->index(['receiver_id', 'read_at']);
            $table->index(['batch_id', 'status']);
        });

        Schema::create('admin_announcement_reads', function (Blueprint $table): void {
            $table->bigIncrements('id');
            $table->unsignedBigInteger('batch_id');
            $table->unsignedBigInteger('receiver_id');
            $table->timestamp('read_at')->nullable();
            $table->timestamp('archived_at')->nullable();
            $table->datetimes();

            $table->unique(['batch_id', 'receiver_id']);
            $table->index(['receiver_id', 'archived_at']);
            $table->index(['receiver_id', 'read_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('admin_announcement_reads');
        Schema::dropIfExists('admin_notification_deliveries');
        Schema::dropIfExists('admin_notification_batches');
    }
};
